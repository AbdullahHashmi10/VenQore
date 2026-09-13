<?php

namespace App\Reckoner\Sources;

use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use Illuminate\Support\Facades\DB;

/**
 * §7.6 — two metrics, two names, never conflated:
 *
 *   purchasing.spend           "Purchases"          accrual: purchases.total on purchase_date.
 *   finance.paid_to_suppliers  "Paid to Suppliers"   cash: allocated payments against purchases.
 *
 * `paid_amount` is never read from a stored column (CLAUDE.md, "Purchases
 * live in `purchases`. Full stop." — a stored column drifts). The real
 * derivation, confirmed against V3\PaymentService (the only writer of
 * purchase payment state): SUM(allocations.allocated_amount) where
 * purchase_id is set and status = 'active'. Voided/reversed allocations are
 * status = 'reversed' and excluded automatically by that filter — there is
 * no separate "non-reversed journal entry" join needed once you go through
 * allocations rather than the ledger directly, because
 * PaymentService::voidAllocations() is the only place a purchase payment is
 * ever unwound, and it always flips status to 'reversed'.
 *
 * `purchases` has no `deleted_at` column (verified against every purchases
 * migration — CLAUDE.md's "never hard-delete a posted purchase" rule is
 * enforced entirely through workflow_status = 'cancelled', not soft deletes),
 * so cancelled purchases are excluded via workflow_status alone.
 */
final class PurchasingSource implements ReckonerSource
{
    public function supports(): array
    {
        return [
            'purchasing.spend',
            'finance.paid_to_suppliers',
            'purchasing.count',
            'purchase_orders.count',
        ];
    }

    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $out = [];
        $tenantId = $ctx->tenant->id;

        foreach ($requests as $request) {
            $key    = $request['key'];
            $id     = $request['id'];
            $args   = $request['args'] ?? [];
            $status = $args['status'] ?? 'all';
            /** @var ReckonerPeriod $period */
            $period = $request['period'];

            $out[$id] = match ($key) {
                'purchasing.spend' => (function() use ($tenantId, $period, $args) {
                    $groupBy = $args['group_by'] ?? 'none';
                    if ($groupBy === 'supplier') {
                        $rows = DB::table('purchases')
                            ->leftJoin('parties', 'purchases.party_id', '=', 'parties.id')
                            ->where('purchases.tenant_id', $tenantId)
                            ->where('purchases.workflow_status', '!=', 'cancelled')
                            ->whereBetween('purchases.purchase_date', [$period->start->toDateString(), $period->end->toDateString()])
                            ->select('parties.name as label', DB::raw('SUM(purchases.total) as value'))
                            ->groupBy('parties.name')
                            ->get();
                        return [
                            'rows' => $rows->map(fn($r) => ['name' => $r->label ?: 'Unknown Supplier', 'value' => (float)$r->value])->all(),
                            'total' => (float) $rows->sum('value')
                        ];
                    }
                    return (float) DB::table('purchases')
                        ->where('tenant_id', $tenantId)
                        ->where('workflow_status', '!=', 'cancelled')
                        ->whereBetween('purchase_date', [$period->start->toDateString(), $period->end->toDateString()])
                        ->sum('total');
                })(),

                'purchasing.count' => (function() use ($tenantId, $period, $args) {
                    $groupBy = $args['group_by'] ?? 'none';
                    if ($groupBy === 'supplier') {
                        $rows = DB::table('purchases')
                            ->leftJoin('parties', 'purchases.party_id', '=', 'parties.id')
                            ->where('purchases.tenant_id', $tenantId)
                            ->where('purchases.workflow_status', '!=', 'cancelled')
                            ->whereBetween('purchases.purchase_date', [$period->start->toDateString(), $period->end->toDateString()])
                            ->select('parties.name as label', DB::raw('COUNT(*) as value'))
                            ->groupBy('parties.name')
                            ->get();
                        return [
                            'rows' => $rows->map(fn($r) => ['name' => $r->label ?: 'Unknown Supplier', 'value' => (int)$r->value])->all(),
                            'total' => (int) $rows->sum('value')
                        ];
                    }
                    return (int) DB::table('purchases')
                        ->where('tenant_id', $tenantId)
                        ->where('workflow_status', '!=', 'cancelled')
                        ->whereBetween('purchase_date', [$period->start->toDateString(), $period->end->toDateString()])
                        ->count();
                })(),

                'purchase_orders.count' => \Illuminate\Support\Facades\Schema::hasTable('purchase_orders')
                    ? (int) DB::table('purchase_orders')
                        ->where('tenant_id', $tenantId)
                        ->when($status !== 'all', fn ($q) => $q->where('status', $status))
                        ->count()
                    : 0,

                'finance.paid_to_suppliers' => (float) DB::table('allocations')
                    ->join('purchases', 'allocations.purchase_id', '=', 'purchases.id')
                    ->where('allocations.tenant_id', $tenantId)
                    ->where('allocations.status', 'active')
                    ->whereNotNull('allocations.purchase_id')
                    ->whereBetween('purchases.purchase_date', [$period->start->toDateString(), $period->end->toDateString()])
                    ->sum('allocations.allocated_amount'),

                default => null,
            };
        }

        return $out;
    }
}
