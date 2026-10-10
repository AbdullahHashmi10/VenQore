<?php

namespace App\Services\Sales;

use App\Exceptions\MoneyException;
use App\Support\Money;

/**
 * Explicit payment allocation for a sale (contract v2). Pure: no database.
 *
 * Separates what the plan requires to stay separate:
 *   money applied to the invoice · cash change returned · customer advance kept
 *   · receivable owed · what was physically tendered.
 *
 * Identities (all integer minor units), asserted before returning:
 *   invoice  = applied + receivable
 *   tendered = applied + change + advance
 *   Σ line amounts (money methods) = applied + advance
 *
 * It never invents a payment and never overwrites an amount to agree with the
 * bill: an impossible combination is refused with a MoneyException code the
 * controller turns into a 422.
 */
final class PaymentAllocation
{
    /** Methods that are a promise to pay, not money received. */
    public const RECEIVABLE_METHODS = ['credit'];

    /**
     * @param array{
     *   invoice:int, payments:?array, payment_method:?string, amount_paid:mixed,
     *   tendered_amount:mixed, cash_tendered?:mixed, add_to_ledger:bool, has_customer:bool,
     *   walk_in_must_pay:bool, strict:bool
     * } $a
     */
    public static function allocate(array $a): array
    {
        $invoice = (int) $a['invoice'];
        $strict = (bool) ($a['strict'] ?? true);
        $hasCustomer = (bool) ($a['has_customer'] ?? false);
        $keepAdvance = !empty($a['add_to_ledger']) && $hasCustomer;

        $lines = [];
        $payments = $a['payments'] ?? null;
        if (is_array($payments) && count($payments) > 0) {
            foreach (array_values($payments) as $i => $p) {
                if (!is_array($p)) {
                    throw new MoneyException('payment ' . ($i + 1) . ' is malformed', 'invalid_payment');
                }
                $amount = Money::parseMinor($p['amount'] ?? 0, 'payment ' . ($i + 1) . ' amount', $strict);
                if ($amount < 0) {
                    throw new MoneyException('payment ' . ($i + 1) . ' cannot be negative', 'negative_amount');
                }
                if ($amount === 0) {
                    continue;
                }
                $method = strtolower(trim((string) ($p['method'] ?? 'cash'))) ?: 'cash';
                $lines[] = [
                    'index' => $i,
                    'method' => $method,
                    'amount' => $amount,
                    'account_id' => $p['account_id'] ?? null,
                    'bank_account_id' => $p['bank_account_id'] ?? $p['account_id'] ?? null,
                    'reference' => $p['reference'] ?? null,
                ];
            }
        } else {
            $method = strtolower((string) ($a['payment_method'] ?? 'cash')) ?: 'cash';
            $hasAmount = $a['amount_paid'] !== null && $a['amount_paid'] !== '';
            $amount = $hasAmount
                ? Money::parseMinor($a['amount_paid'], 'amount paid', $strict)
                : ($method === 'cash' ? $invoice : 0);
            if ($amount < 0) {
                throw new MoneyException('amount paid cannot be negative', 'negative_amount');
            }
            if ($method === 'credit') {
                $amount = 0; // "on credit" means nothing was paid now
            }
            if ($amount > 0) {
                $lines[] = ['index' => 0, 'method' => $method, 'amount' => $amount, 'account_id' => null, 'bank_account_id' => null, 'reference' => null, 'single' => true];
            }
        }

        $isMoney = fn ($l) => !in_array($l['method'], self::RECEIVABLE_METHODS, true);
        $money = array_sum(array_map(fn ($l) => $isMoney($l) ? $l['amount'] : 0, $lines));
        $declaredCredit = array_sum(array_map(fn ($l) => $isMoney($l) ? 0 : $l['amount'], $lines));

        $change = 0;
        $advance = 0;
        if ($money > $invoice) {
            $excess = $money - $invoice;
            if ($keepAdvance) {
                $advance = $excess;
            } else {
                $cash = array_sum(array_map(fn ($l) => $l['method'] === 'cash' ? $l['amount'] : 0, $lines));
                if ($excess > $cash) {
                    throw new MoneyException(
                        'A card or bank payment cannot be more than the bill unless the extra is kept as the customer\'s advance.',
                        'overpayment_not_cash'
                    );
                }
                $change = $excess;
                // Change comes out of cash lines, largest first — the result does
                // not depend on the order the lines were listed in.
                $cashIdx = array_keys(array_filter($lines, fn ($l) => $l['method'] === 'cash'));
                usort($cashIdx, function ($x, $y) use ($lines) {
                    return [$lines[$y]['amount'], (string) $lines[$x]['account_id'], (string) $lines[$x]['reference'], $x]
                        <=> [$lines[$x]['amount'], (string) $lines[$y]['account_id'], (string) $lines[$y]['reference'], $y];
                });
                $left = $change;
                foreach ($cashIdx as $k) {
                    $take = min($left, $lines[$k]['amount']);
                    $lines[$k]['amount'] -= $take;
                    $left -= $take;
                    if ($left === 0) {
                        break;
                    }
                }
                $lines = array_values(array_filter($lines, fn ($l) => $l['amount'] > 0));
            }
        }

        $applied = min($money, $invoice);
        $receivable = $invoice - $applied;

        if (!empty($a['walk_in_must_pay']) && !$hasCustomer && ($receivable > 0 || $declaredCredit > 0)) {
            throw new MoneyException(
                'Choose a customer to sell on credit or take a part payment. Walk-in sales must be paid in full.',
                'walk_in_unpaid'
            );
        }

        // Physically handed over. Change can only ever be CASH handed back, so it
        // is derived from cash alone:
        //  - cash_tendered (v2 till): the notes the customer gave for the cash
        //    part. Change = cash_tendered − cash applied, never less than zero.
        //  - tendered_amount (older tills, a total of everything): trusted ONLY
        //    when every money line is cash — with a card/bank/wallet line present
        //    the total cannot say how much of it was cash, so it is ignored.
        // Either way nothing may be owed (extra cash would have reduced the
        // receivable) and no advance is being kept. A report that does not fit
        // is ignored and logged, never trusted.
        $tendered = $applied + $change + $advance;
        $tenderReportIgnored = null;
        $moneyLines = array_filter($lines, fn ($l) => !in_array($l['method'], self::RECEIVABLE_METHODS, true));
        $cashApplied = array_sum(array_map(fn ($l) => $l['method'] === 'cash' ? $l['amount'] : 0, $moneyLines));
        $hasCash = $cashApplied > 0;
        $allCash = $hasCash && count(array_filter($moneyLines, fn ($l) => $l['method'] !== 'cash')) === 0;
        $changeAllowed = $hasCash && !$keepAdvance && $invoice - $applied === 0 && $declaredCredit === 0;
        $present = fn ($k) => isset($a[$k]) && $a[$k] !== null && $a[$k] !== '';

        if ($present('cash_tendered')) {
            $cashGiven = Money::parseMinor($a['cash_tendered'], 'cash tendered', $strict);
            if ($cashGiven < $cashApplied) {
                throw new MoneyException('The cash handed over is less than the cash part of the payment.', 'cash_tender_short');
            }
            $extra = $cashGiven - $cashApplied - $change; // $change already taken out of cash lines above
            if ($extra > 0) {
                if ($changeAllowed) {
                    $change += $extra;
                    $tendered += $extra;
                } else {
                    $tenderReportIgnored = $cashGiven;
                }
            }
        } elseif ($present('tendered_amount')) {
            $reported = Money::parseMinor($a['tendered_amount'], 'tendered amount', $strict);
            if ($reported > $tendered) {
                if ($changeAllowed && $allCash) {
                    $change += $reported - $tendered;
                    $tendered = $reported;
                } else {
                    $tenderReportIgnored = $reported;
                }
            }
        }

        $result = [
            'lines' => array_values($lines),
            'applied' => $applied,
            'receivable' => $receivable,
            'declared_credit' => $declaredCredit,
            'change' => $change,
            'advance' => $advance,
            'tendered' => $tendered,
            'tender_report_ignored' => $tenderReportIgnored,
            // Existing meaning, unchanged by this fix: an explicit 'credit' leg in a
            // split counts toward "paid" (the leg is booked to the customer's
            // ledger). money_status is the strict money-only view.
            'payment_status' => $applied + $declaredCredit >= $invoice ? 'paid' : ($applied + $declaredCredit > 0 ? 'partial' : 'unpaid'),
            'money_status' => $applied >= $invoice ? 'paid' : ($applied > 0 ? 'partial' : 'unpaid'),
            // Receivable not already declared as a credit leg — what the existing
            // credit-limit check has always measured.
            'undeclared_receivable' => max(0, $receivable - $declaredCredit),
        ];
        self::assertIdentities($invoice, $result);
        return $result;
    }

    private static function assertIdentities(int $invoice, array $r): void
    {
        $moneyLines = array_sum(array_map(
            fn ($l) => in_array($l['method'], self::RECEIVABLE_METHODS, true) ? 0 : $l['amount'],
            $r['lines']
        ));
        if ($r['applied'] + $r['receivable'] !== $invoice
            || $moneyLines !== $r['applied'] + $r['advance']
            || $r['tendered'] !== $r['applied'] + $r['change'] + $r['advance']) {
            throw new \LogicException('Payment allocation identity failed: ' . json_encode([$invoice, $r]));
        }
    }
}
