<?php

namespace App\Reckoner\Sources;

use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use Illuminate\Support\Facades\DB;

/**
 * Tax collected on sales, from `sales.total_tax` — the column the
 * 2026_02_20_120002 migration introduced specifically so tax "goes to Tax
 * Payable liability, NOT Revenue" (its own migration comment). Only posted
 * sales count, matching Sale::scopePosted().
 *
 * This is deliberately narrower than the build spec's §7.19
 * `finance.balance_sheet_ok` / a full tax-payable GL reconciliation — no
 * chart-of-accounts tax-liability code (e.g. a GL "2200") was found anywhere
 * in FinancialReportingService to build a ledger-based payable/refundable
 * figure against, and inventing one would be exactly the kind of unverified
 * guess this build is trying to eliminate. `tax.collected` is sales-side tax
 * only; a real `tax.net_payable` (with the §7.16 Payable/Refundable signed
 * label) is Phase 3+ work once that GL account is confirmed.
 */
final class TaxSource implements ReckonerSource
{
    public function supports(): array
    {
        return [
            'tax.collected',
        ];
    }

    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $out = [];
        $tenantId = $ctx->tenant->id;

        foreach ($requests as $request) {
            $key = $request['key'];
            $id = $request['id'];
            /** @var ReckonerPeriod $period */
            $period = $request['period'];

            $out[$id] = match ($key) {
                'tax.collected' => (float) DB::table('sales')
                    ->where('tenant_id', $tenantId)
                    ->where('status', 'posted')
                    ->whereNotNull('posted_at')
                    ->whereBetween('posted_at', [$period->start, $period->end])
                    ->sum('total_tax'),
                default => null,
            };
        }

        return $out;
    }
}
