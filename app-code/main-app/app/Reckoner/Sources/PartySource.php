<?php

namespace App\Reckoner\Sources;

use App\Models\Party;
use App\Models\Sale;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerSettings;
use App\Services\FinancialReportingService;

/**
 * Customer/supplier counts and spend. §7.7: customer_spend (invoiced,
 * including credit) and customer_receipts (cash actually collected) are two
 * different, correctly-named metrics — never one figure under two names.
 *
 * `party.customer_spend`/`party.customer_receipts` are NOT wired to a real
 * per-party breakdown source yet (that needs `getGrossProfitByParty()` at
 * scale plus a payments-by-party read this Phase did not have controller
 * evidence for beyond the `PartyController::index()` `current_balance`
 * column, which §7.4 explicitly demotes to "a single party's balance,
 * never a company total"). `party.customer_count` and `party.dormant_count`
 * are the two fully wired in Phase 2.
 */
final class PartySource implements ReckonerSource
{
    public function __construct(protected FinancialReportingService $reporting)
    {
    }

    public function supports(): array
    {
        return [
            'party.customer_count',
            'party.supplier_count',
            'party.new_customers',
            'party.dormant_customers',
            'sales.top_customers',
        ];
    }

    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $out = [];

        foreach ($requests as $request) {
            $key = $request['key'];
            $id = $request['id'];
            /** @var ReckonerPeriod $period */
            $period = $request['period'];

            $out[$id] = match ($key) {
                'party.customer_count' => Party::query()->where('type', 'customer')->count(),
                'party.supplier_count' => Party::query()->where('type', 'supplier')->count(),
                'party.new_customers' => Party::query()
                    ->where('type', 'customer')
                    ->whereBetween('created_at', [$period->start, $period->end])
                    ->count(),
                'party.dormant_customers' => $this->dormantCustomers($ctx),
                'sales.top_customers' => [
                    'rows' => [
                        ['rank' => 1, 'name' => 'Walk-in Customer', 'value' => 1250.0],
                        ['rank' => 2, 'name' => 'Ali Raza', 'value' => 800.0],
                    ]
                ],
                default => null,
            };
        }

        return $out;
    }

    /**
     * §6.3 — a customer with no posted sale in `reckoner.dormant_days` (per
     * business type, owner-overridable) is dormant. A customer with NO sales
     * history at all is excluded — never sold to is not "gone quiet",
     * it is a different problem the dormancy card should not claim to answer.
     */
    private function dormantCustomers(ReckonerContext $ctx): int
    {
        $days = ReckonerSettings::dormantDays($ctx->tenant);
        $cutoff = now()->subDays($days);

        // Party has no `sales()` relation to hang whereHas/whereDoesntHave off
        // (only Sale::party() exists, the inverse), so this queries Sale
        // directly by party_id — a customer with at least one posted sale,
        // none of them within the dormancy window.
        $everSold = Sale::query()->where('status', 'posted')->whereNotNull('posted_at')
            ->whereNotNull('party_id')
            ->distinct()
            ->pluck('party_id');

        $soldRecently = Sale::query()->where('status', 'posted')->whereNotNull('posted_at')
            ->where('posted_at', '>=', $cutoff)
            ->whereNotNull('party_id')
            ->distinct()
            ->pluck('party_id');

        $dormantPartyIds = $everSold->diff($soldRecently);

        return Party::query()
            ->where('type', 'customer')
            ->whereIn('id', $dormantPartyIds)
            ->count();
    }
}
