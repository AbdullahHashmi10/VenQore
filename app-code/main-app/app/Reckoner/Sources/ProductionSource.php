<?php

namespace App\Reckoner\Sources;

use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use Illuminate\Support\Facades\DB;

/**
 * §7.14 — `production.total_cost` was hardcoded to 0 in
 * ProductionController::index() (`'month_cost' => 0` — verified directly
 * against the live controller). The real figure exists:
 * `production_runs.total_cost` (= material_cost + labor_cost, added by the
 * 2026_03_05/2026_03_06 migrations) has been populated by
 * ManufacturingService all along; the controller simply never read it.
 *
 * `production.total_cost` returns `not_applicable`, never `0`, when a store
 * has recorded no completed production runs in the period — a real zero
 * (production happened and genuinely cost nothing) is indistinguishable
 * from "nothing to report" otherwise, and §2A/§3.3 are explicit that a
 * confident 0 standing in for "we don't know" is the one thing a dashboard
 * must never show.
 */
final class ProductionSource implements ReckonerSource
{
    public function supports(): array
    {
        return [
            'production.total_cost',
            'production.run_count',
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

            $baseQuery = fn () => DB::table('production_runs')
                ->where('tenant_id', $tenantId)
                ->where('status', 'completed')
                ->whereBetween('created_at', [$period->start, $period->end]);

            $out[$id] = match ($key) {
                'production.run_count' => $baseQuery()->count(),
                'production.total_cost' => $baseQuery()->exists()
                    ? (float) $baseQuery()->sum('total_cost')
                    : null, // not_applicable — no runs to report, not a real zero.
                default => null,
            };
        }

        return $out;
    }
}
