<?php

namespace App\Engines\Ledger;

use App\Exceptions\MoneyException;
use App\Support\Money;
use App\Support\SaleEvents;

/**
 * ZeroDrift Ledger — VenQore's strict ledger gate: not one paisa of drift.
 *
 * Every journal entry, from every part of the product, passes through here
 * (AccountingService::createEntry) before a single row is written. The rules:
 *
 *   ZD-1  NUMBER     every amount is a number (no text, NaN or infinity)
 *   ZD-2  EXACT      amounts are read as exact decimals ("1.005" is 1.005,
 *                    never a binary float) and quantized to the paisa once
 *   ZD-3  POSITIVE   no negative amounts
 *   ZD-4  ONE SIDE   a line is a debit or a credit, never both, never neither
 *   ZD-5  BALANCED   total debits = total credits to the exact paisa, compared
 *                    in integer paisa — no tolerance, no "drift" absorbed,
 *                    nothing moved onto revenue or round-off to make it fit
 *   ZD-6  NOT EMPTY  an entry has at least one line
 *
 * ZeroDrift VALIDATES; it never calculates or repairs. A producer whose lines
 * do not balance is a defect to fix at the producer. Amounts finer than a
 * paisa are still accepted (quantized half-up) but recorded as
 * `sale.ledger_unquantized_input` so every producer can be found and converted.
 */
final class ZeroDrift
{
    public const NAME = 'ZeroDrift Ledger';

    /**
     * @param  array $lines  journal lines (debit/credit + account fields)
     * @param  array $data   the entry header (for the audit trail only)
     * @return array         lines with debit/credit quantized, zero lines removed,
     *                       plus private __debit_minor / __credit_minor
     * @throws ZeroDriftException
     */
    public static function seal(array $lines, array $data = []): array
    {
        $unquantized = [];
        $normalized = array_map(function ($line) use (&$unquantized) {
            foreach (['debit', 'credit'] as $side) {
                $raw = $line[$side] ?? 0;
                $account = $line['account_code'] ?? $line['account_id'] ?? '?';
                if (is_float($raw) && !is_finite($raw)) {
                    throw new ZeroDriftException("Journal line {$side} is not finite. Account: {$account}", 'ZD-1 NUMBER');
                }
                if ($raw !== null && $raw !== '' && !is_numeric($raw)) {
                    throw new ZeroDriftException("Journal line {$side} is not a number: " . json_encode($raw) . ". Account: {$account}", 'ZD-1 NUMBER');
                }
                try {
                    $dec = Money::parse($raw ?? 0, "journal {$side}", false);
                } catch (MoneyException $e) {
                    throw new ZeroDriftException("Journal line {$side} is not a valid amount: {$e->getMessage()}", 'ZD-2 EXACT');
                }
                if ($dec->isNegative()) {
                    throw new ZeroDriftException("Journal line {$side} cannot be negative ({$dec}). Account: {$account}", 'ZD-3 POSITIVE');
                }
                if ($dec->getScale() > 2) {
                    $unquantized[] = (string) $dec;
                }
                $line['__' . $side . '_minor'] = Money::toMinor($dec);
                $line[$side] = Money::toFloat($line['__' . $side . '_minor']);
            }
            return $line;
        }, $lines);

        if ($unquantized) {
            SaleEvents::record('ledger_unquantized_input', [
                'gate' => self::NAME,
                'reference_type' => $data['reference_type'] ?? null,
                'values' => array_slice($unquantized, 0, 10),
            ], 'warning');
        }

        // Zero lines are dropped when the entry has any real line.
        $hasNonZero = (bool) array_filter($normalized, fn ($l) => $l['__debit_minor'] > 0 || $l['__credit_minor'] > 0);
        if ($hasNonZero) {
            $normalized = array_values(array_filter($normalized, fn ($l) => $l['__debit_minor'] > 0 || $l['__credit_minor'] > 0));
        }
        if (count($normalized) === 0) {
            throw new ZeroDriftException('Journal entry must have at least one line.', 'ZD-6 NOT EMPTY');
        }

        $dr = array_sum(array_column($normalized, '__debit_minor'));
        $cr = array_sum(array_column($normalized, '__credit_minor'));
        if ($dr !== $cr) {
            SaleEvents::record('ledger_refused_unbalanced', [
                'gate' => self::NAME,
                'reference_type' => $data['reference_type'] ?? null,
                'reference' => $data['reference'] ?? null,
                'debits' => Money::toString($dr),
                'credits' => Money::toString($cr),
            ], 'error');
            throw new ZeroDriftException(
                'Journal entry is unbalanced. Debits: ' . Money::toString($dr) . ', Credits: ' . Money::toString($cr)
                . ' (difference ' . Money::toString($dr - $cr) . ')',
                'ZD-5 BALANCED'
            );
        }

        foreach ($normalized as $line) {
            $account = $line['account_code'] ?? $line['account_id'] ?? '?';
            if ($line['__debit_minor'] > 0 && $line['__credit_minor'] > 0) {
                throw new ZeroDriftException("A journal_items row cannot have both debit and credit > 0. Account: {$account}", 'ZD-4 ONE SIDE');
            }
            if ($line['__debit_minor'] === 0 && $line['__credit_minor'] === 0) {
                throw new ZeroDriftException("A journal_items row must have either debit > 0 or credit > 0. Account: {$account}", 'ZD-4 ONE SIDE');
            }
        }

        return $normalized;
    }
}
