<?php

namespace App\Services\VenSynQ;

use App\Models\BankAccount;
use App\Models\EcommerceChannel;
use App\Models\MarketplacePayout;
use App\Models\Sale;
use App\Models\Tenant;
use App\Services\V3\AccountingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * MarketplaceSettlementService — the Clearing Pipeline.
 *
 * ══ The problem ═══════════════════════════════════════════════════════════════
 * A $100 WooCommerce sale is not $100 of cash. Stripe holds it ~2 days and takes
 * a fee; Amazon holds it ~14 days. The pre-T17 behaviour was split and both
 * halves were wrong:
 *
 *   • WooCommerceController::webhook() posted DR 1000 Cash / CR 4000 Sales,
 *     telling the owner they had spendable cash the gateway was still holding.
 *   • SmartFulfillmentService::processDropshipSale() posted NO journal at all,
 *     so Amazon / eBay / TikTok revenue never reached the P&L or Balance Sheet.
 *
 * ══ The model ═════════════════════════════════════════════════════════════════
 *
 *   Sale posted        DR 1205 Marketplace Clearing   (gross − estimated fee)
 *                      DR 5400 Marketplace Fees       (estimated fee)
 *                          CR 4000 Sales Income       (gross)
 *                      DR 5000 COGS / CR 1100 Inventory
 *
 *   Payout confirmed   DR 1010 Bank                   (what ACTUALLY landed)
 *                      DR 5410 Fee Variance           (if platform took more)
 *                          CR 1205 Marketplace Clearing (what we expected)
 *                          CR 5410 Fee Variance       (if we received more)
 *
 *   Refund             DR 4000 Sales Income           (revenue reversed)
 *                          CR 1205 Marketplace Clearing
 *
 * ══ Design decisions worth knowing ════════════════════════════════════════════
 *
 * ESTIMATES ARE NEVER EXACT. The fee booked at sale time is an estimate from the
 * channel's fee_percentage. It will not match settlement to the cent — ever.
 * That is why 5410 exists. Any design promising exact-cent matching produces
 * software that permanently looks broken.
 *
 * REFUNDS HIT CLEARING, NOT THE TILL. A customer refunded online before payout
 * must reduce the clearing pool. Deducting it from 1000 Cash on Hand — which is
 * what naive implementations do — creates a phantom shortfall in the physical
 * cash drawer that the shopkeeper can never reconcile.
 *
 * CUTOVER, NOT BACKFILL. Clearing applies only to sales created after the
 * tenant's `clearing_go_live_at`. Historical entries are left exactly as they
 * are, so closed periods and filed reports are never rewritten.
 */
class MarketplaceSettlementService
{
    // Chart-of-accounts codes. Numbered into the existing 1xxx/5xxx bands rather
    // than the 6xxx range originally proposed — this chart has no 6xxx group.
    public const ACCT_CLEARING  = '1205';
    public const ACCT_BANK      = '1010';
    public const ACCT_REVENUE   = '4000';
    public const ACCT_COGS      = '5000';
    public const ACCT_INVENTORY = '1100';
    public const ACCT_FEES      = '5400';
    public const ACCT_VARIANCE  = '5410';

    public function __construct(private AccountingService $accounting)
    {
    }

    // ─── Sale → Clearing ──────────────────────────────────────────────────────

    /**
     * Post a marketplace sale into the clearing pool and attach it to the open
     * payout batch for its channel.
     *
     * Idempotent on the sale: calling twice will not double-post, because the
     * sale is skipped once it already carries a marketplace_payout_id.
     *
     * @param  float  $grossRevenue  Pre-fee revenue for the order.
     * @param  float  $estimatedFee  Platform commission estimate (0 for Woo).
     * @param  float  $cogs          FIFO cost already computed by the caller.
     */
    public function postSaleToClearing(
        Sale $sale,
        EcommerceChannel $channel,
        float $grossRevenue,
        float $estimatedFee,
        float $cogs = 0.0
    ): ?MarketplacePayout {
        if (!$this->isClearingActive($sale)) {
            return null;
        }

        if ($sale->marketplace_payout_id) {
            Log::info('[T17] Sale already in a clearing batch; skipping.', ['sale_id' => $sale->id]);
            return MarketplacePayout::find($sale->marketplace_payout_id);
        }

        $grossRevenue = round($grossRevenue, 2);
        $estimatedFee = round(min($estimatedFee, $grossRevenue), 2); // fee can never exceed revenue
        $cogs         = round($cogs, 2);
        $netToClear   = round($grossRevenue - $estimatedFee, 2);

        if ($grossRevenue <= 0) {
            return null;
        }

        return DB::transaction(function () use ($sale, $channel, $grossRevenue, $estimatedFee, $cogs, $netToClear) {
            $payout = $this->openPayoutFor($channel);

            $lines = [
                ['account_code' => self::ACCT_CLEARING, 'debit' => $netToClear, 'credit' => 0],
                ['account_code' => self::ACCT_REVENUE,  'debit' => 0,           'credit' => $grossRevenue],
            ];

            if ($estimatedFee > 0) {
                $lines[] = ['account_code' => self::ACCT_FEES, 'debit' => $estimatedFee, 'credit' => 0];
            }

            if ($cogs > 0) {
                $lines[] = ['account_code' => self::ACCT_COGS,      'debit' => $cogs, 'credit' => 0];
                $lines[] = ['account_code' => self::ACCT_INVENTORY, 'debit' => 0,     'credit' => $cogs];
            }

            $entry = $this->accounting->createEntry([
                'date'            => now()->toDateString(),
                'reference_type'  => 'sale',
                'reference'       => $sale->channel_order_id ?? $sale->reference_number ?? $sale->id,
                'description'     => "{$channel->name} order held in Marketplace Clearing",
                // Belt-and-braces against a replayed webhook creating a second entry.
                'idempotency_key' => 't17-clearing-' . $sale->id,
            ], $lines);

            $payout->increment('expected_gross', $grossRevenue);
            $payout->increment('expected_fees', $estimatedFee);

            $reserve = round($netToClear * ((float) $channel->reserve_percentage / 100), 2);
            if ($reserve > 0) {
                $payout->increment('expected_reserve', $reserve);
            }

            $payout->increment('expected_net', round($netToClear - $reserve, 2));

            $sale->forceFill([
                'marketplace_payout_id' => $payout->id,
            ])->save();

            return $payout->refresh();
        });
    }

    // ─── Refund → Clearing (not the till) ─────────────────────────────────────

    /**
     * Reverse revenue for an online refund against the CLEARING pool.
     *
     * This is the correctness fix: a refund on an unsettled online order has not
     * touched the physical cash drawer, so it must not reduce 1000 Cash on Hand.
     */
    public function postRefundToClearing(Sale $sale, float $amount, string $reason = ''): bool
    {
        $amount = round($amount, 2);

        if ($amount <= 0 || !$this->isClearingActive($sale)) {
            return false;
        }

        return DB::transaction(function () use ($sale, $amount, $reason) {
            $this->accounting->createEntry([
                'date'            => now()->toDateString(),
                'reference_type'  => 'sale_return',
                'reference'       => $sale->channel_order_id ?? $sale->reference_number ?? $sale->id,
                'description'     => 'Online refund reversed against Marketplace Clearing'
                                     . ($reason !== '' ? " — {$reason}" : ''),
                'idempotency_key' => 't17-refund-' . $sale->id . '-' . $amount,
            ], [
                ['account_code' => self::ACCT_REVENUE,  'debit' => $amount, 'credit' => 0],
                ['account_code' => self::ACCT_CLEARING, 'debit' => 0,       'credit' => $amount],
            ]);

            // Reduce the batch this order was going to settle in, so the owner's
            // expected payout figure stays honest.
            if ($sale->marketplace_payout_id) {
                $payout = MarketplacePayout::find($sale->marketplace_payout_id);

                if ($payout && $payout->status !== 'confirmed') {
                    $payout->decrement('expected_gross', $amount);
                    $payout->decrement('expected_net', $amount);
                }
            }

            return true;
        });
    }

    // ─── Payout confirmation ──────────────────────────────────────────────────

    /**
     * Owner confirms what actually arrived. This is the ONLY place clearing money
     * becomes bank money.
     *
     * Auto-sweep is deliberately not the default: posting deposits that may not
     * have landed silently destroys bank reconciliation.
     *
     * @param  float  $actualNet  What the bank statement really shows.
     */
    public function confirmPayout(
        MarketplacePayout $payout,
        float $actualNet,
        ?string $bankAccountId = null,
        ?int $userId = null,
        ?string $externalPayoutId = null
    ): MarketplacePayout {
        if ($payout->status === 'confirmed') {
            throw new \RuntimeException('This payout has already been confirmed.');
        }

        $actualNet  = round($actualNet, 2);
        $expectedNet = round((float) $payout->expected_net, 2);
        $variance   = round($actualNet - $expectedNet, 2);

        if ($actualNet < 0) {
            throw new \InvalidArgumentException('A payout amount cannot be negative.');
        }

        return DB::transaction(function () use ($payout, $actualNet, $expectedNet, $variance, $bankAccountId, $userId, $externalPayoutId) {
            $lines = [];

            // Bank rises by what genuinely arrived.
            if ($actualNet > 0) {
                $lines[] = ['account_code' => self::ACCT_BANK, 'debit' => $actualNet, 'credit' => 0];
            }

            // Clearing is relieved of what we expected — that is the balance the
            // sales actually put there.
            if ($expectedNet > 0) {
                $lines[] = ['account_code' => self::ACCT_CLEARING, 'debit' => 0, 'credit' => $expectedNet];
            }

            // The gap is the true-up. Negative variance = the platform deducted
            // more than we estimated (storage, ads, disputes) → extra expense.
            if ($variance < 0) {
                $lines[] = ['account_code' => self::ACCT_VARIANCE, 'debit' => abs($variance), 'credit' => 0];
            } elseif ($variance > 0) {
                $lines[] = ['account_code' => self::ACCT_VARIANCE, 'debit' => 0, 'credit' => $variance];
            }

            $entry = $this->accounting->createEntry([
                'date'            => now()->toDateString(),
                'reference_type'  => 'payment',
                'reference'       => $externalPayoutId ?? ('PAYOUT-' . substr($payout->id, 0, 8)),
                'description'     => "Marketplace payout received — {$payout->channel?->name}",
                'idempotency_key' => 't17-payout-' . $payout->id,
                'user_id'         => $userId,
            ], $lines);

            // GL account 1010 aggregates every bank. BankAccount.current_balance
            // is the per-bank subledger and must be moved in step, or the two
            // views of "my bank balance" disagree.
            $this->creditBankSubledger($payout->tenant_id, $bankAccountId, $actualNet);

            $payout->forceFill([
                'actual_net'         => $actualNet,
                'variance'           => $variance,
                'status'             => 'confirmed',
                'confirmed_at'       => now(),
                'confirmed_by'       => $userId,
                'journal_entry_id'   => $entry->id,
                'external_payout_id' => $externalPayoutId ?? $payout->external_payout_id,
            ])->save();

            Sale::where('marketplace_payout_id', $payout->id)
                ->whereNull('cleared_at')
                ->update(['cleared_at' => now(), 'payment_status' => 'paid']);

            return $payout->refresh();
        });
    }

    // ─── Maturity sweep ───────────────────────────────────────────────────────

    /**
     * Flip batches whose settlement window has elapsed from 'pending' to 'due'
     * so the dashboard can prompt the owner. Does NOT move money.
     *
     * @return int number of batches matured
     */
    public function matureDuePayouts(?Tenant $tenant = null): int
    {
        $query = MarketplacePayout::withoutTenantScope()
            ->where('status', 'pending')
            ->where('expected_at', '<=', now())
            ->where('expected_net', '>', 0);

        if ($tenant) {
            $query->where('tenant_id', $tenant->id);
        }

        return $query->update(['status' => 'due']);
    }

    // ─── Money Pipeline ───────────────────────────────────────────────────────

    /**
     * The three-stage figure set behind the dashboard widget:
     *
     *   [ Online sales ] → [ Held by platforms ] → [ Cleared to bank ]
     */
    public function pipeline(int|string $tenantId): array
    {
        $payouts = MarketplacePayout::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->with('channel')
            ->get();

        $unsettled = $payouts->whereIn('status', ['pending', 'due']);
        $due       = $payouts->where('status', 'due');

        $byChannel = $unsettled
            ->groupBy('ecommerce_channel_id')
            ->map(function ($group) {
                /** @var MarketplacePayout $first */
                $first = $group->first();
                $next  = $group->whereNotNull('expected_at')->sortBy('expected_at')->first();

                return [
                    'channel_id'   => $first->ecommerce_channel_id,
                    'channel_name' => $first->channel?->name ?? 'Unknown channel',
                    'platform'     => $first->channel?->platform,
                    'amount'       => round((float) $group->sum('expected_net'), 2),
                    'currency'     => $first->currency,
                    'arrives_at'   => $next?->expected_at?->toIso8601String(),
                    'arrives_human'=> $next?->expected_at?->diffForHumans(),
                    'is_overdue'   => $group->contains(fn ($p) => $p->is_overdue),
                ];
            })
            ->values()
            ->all();

        return [
            // Stage 1 — gross value of online orders still working through the pipe.
            'gross_in_pipeline' => round((float) $unsettled->sum('expected_gross'), 2),
            // Stage 2 — what platforms are holding, net of estimated fees/reserve.
            'pending_payout'    => round((float) $unsettled->sum('expected_net'), 2),
            // Stage 3 — what has genuinely reached the bank.
            'cleared_to_bank'   => round((float) $payouts->where('status', 'confirmed')->sum('actual_net'), 2),

            'estimated_fees'    => round((float) $unsettled->sum('expected_fees'), 2),
            'held_in_reserve'   => round((float) $unsettled->sum('expected_reserve'), 2),

            // Awaiting owner confirmation — drives the "confirm payout" prompt.
            'awaiting_confirmation' => [
                'count'  => $due->count(),
                'amount' => round((float) $due->sum('expected_net'), 2),
            ],
            'overdue_count' => $payouts->filter(fn ($p) => $p->is_overdue)->count(),
            'by_channel'    => $byChannel,
            'computed_at'   => now()->toIso8601String(),
        ];
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Clearing is opt-in per tenant and applies only from the cutover forward.
     * A sale created before `clearing_go_live_at` keeps whatever posting it had,
     * so historical reports and closed periods stay byte-identical.
     */
    public function isClearingActive(Sale $sale): bool
    {
        $tenant = Tenant::find($sale->tenant_id);

        if (!$tenant || !$tenant->clearing_go_live_at) {
            return false;
        }

        $createdAt = $sale->created_at ?? now();

        return $createdAt->gte($tenant->clearing_go_live_at);
    }

    /**
     * Find the open batch for a channel, or start one.
     *
     * `expected_at` is set from the channel's settlement_days at the moment the
     * batch opens, so the owner sees a real arrival date rather than a guess.
     */
    private function openPayoutFor(EcommerceChannel $channel): MarketplacePayout
    {
        $existing = MarketplacePayout::withoutTenantScope()
            ->where('ecommerce_channel_id', $channel->id)
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->first();

        if ($existing) {
            return $existing;
        }

        $days = (int) ($channel->settlement_days ?? 0);

        return MarketplacePayout::create([
            'tenant_id'            => $channel->tenant_id,
            'ecommerce_channel_id' => $channel->id,
            'currency'             => $channel->currency ?? 'GBP',
            'period_start'         => now()->toDateString(),
            'period_end'           => now()->addDays($days)->toDateString(),
            'expected_at'          => now()->addDays($days),
            'status'               => 'pending',
            'expected_gross'       => 0,
            'expected_fees'        => 0,
            'expected_reserve'     => 0,
            'expected_net'         => 0,
        ]);
    }

    /**
     * Move the per-bank subledger in step with GL account 1010.
     * Falls back to the tenant's first bank account when none is specified.
     */
    private function creditBankSubledger(int|string $tenantId, ?string $bankAccountId, float $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        $bank = $bankAccountId
            ? BankAccount::withoutTenantScope()->where('tenant_id', $tenantId)->find($bankAccountId)
            : BankAccount::withoutTenantScope()->where('tenant_id', $tenantId)
                ->where(fn ($q) => $q->where('account_type', '!=', 'cash')->orWhereNull('account_type'))
                ->orderBy('created_at')
                ->first();

        if (!$bank) {
            // Not fatal — the GL is still correct. Logged so the owner can be
            // prompted to create a bank account for accurate per-bank balances.
            Log::warning('[T17] Payout confirmed with no bank account to credit.', [
                'tenant_id' => $tenantId,
                'amount'    => $amount,
            ]);
            return;
        }

        $bank->increment('current_balance', $amount);
    }
}
