<?php

namespace App\Reckoner\Sources;

use App\Reckoner\ReckonerContext;
use Illuminate\Support\Facades\DB;

/**
 * Platform-only readings (§8 — `scope: 'platform'`). Unreachable from a
 * tenant context: Reckoner::readMany() returns `not_found` (not `forbidden`)
 * for any platform-scoped key before this class is ever touched, so a store
 * owner cannot learn these metrics exist, let alone read one.
 *
 * §7.9 (MRR — coupon-adjusted figure wins over `activePaidCount ×
 * PlanPricingService::monthly()`) and §7.10 (deleted-store-count uses the
 * demo-filtered denominator everywhere) are both real decisions this build
 * spec makes. `platform.mrr` reads PlatformRevenueService::couponAdjustedMrr()
 * (2026-10-11), the same paying-store definition the Revenue view uses.
 *
 * §7.10 IS fully implemented here: every platform metric in this class
 * excludes tenants where is_demo = true from its denominator, without
 * exception, per the build spec's explicit instruction.
 */
final class PlatformSource implements ReckonerSource
{
    public function supports(): array
    {
        return [
            'platform.active_tenant_count',
            'platform.mrr',
        ];
    }

    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $out = [];

        foreach ($requests as $request) {
            $key = $request['key'];
            $id = $request['id'];

            $out[$id] = match ($key) {
                'platform.active_tenant_count' => $this->realTenants()->where('status', 'active')->count(),
                'platform.mrr' => $this->mrr(),
                default => null,
            };
        }

        return $out;
    }

    /**
     * §7.10 — demo tenants excluded from every platform metric, without exception.
     * Deleted and internal (non-billable) stores are excluded too.
     */
    private function realTenants()
    {
        return DB::table('tenants')
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->whereNull('is_demo')->orWhere('is_demo', false);
            })
            ->where(function ($q) {
                $q->whereNull('is_internal')->orWhere('is_internal', false);
            });
    }

    /**
     * §7.9 — coupon-adjusted MRR.
     *
     * 2026-10-11: this used to price stores from config('saas.plans') — a
     * config file that does not exist — so the dashboard MRR was always 0. It
     * also counted deleted, internal and unpaid "active" stores. It now uses
     * the one revenue definition (PlatformRevenueService: paying, billable
     * stores, priced from the plans table) with each store's coupon applied.
     */
    private function mrr(): float
    {
        return app(\App\Services\Platform\PlatformRevenueService::class)->couponAdjustedMrr('USD');
    }
}
