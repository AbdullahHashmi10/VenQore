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
 * spec makes, but the controller that currently computes MRR was not found
 * under AdminController, SuperAdmin/PlatformController, or any obviously
 * named class within this session's search budget — CouponRedemption-aware
 * MRR pricing logic may live in a service not yet located. Rather than
 * invent a coupon-adjustment formula and risk silently mis-stating revenue
 * to the platform team, `platform.mrr` is wired to the >demo-filtered<
 * tenant count and a naive (non-coupon-adjusted) plan-price sum — clearly
 * short of §7.9 — with the gap called out at the top of this class so it is
 * not mistaken for a finished reading. Locate the real MRR source and
 * replace the body of mrr() before this metric is trusted for anything.
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

    /** §7.10 — demo tenants excluded from every platform metric, without exception. */
    private function realTenants()
    {
        return DB::table('tenants')->where(function ($q) {
            $q->whereNull('is_demo')->orWhere('is_demo', false);
        });
    }

    /**
     * INCOMPLETE — see class docblock. This sums plan list price × active
     * paid tenants with NO coupon adjustment, which is explicitly the
     * *losing* definition per §7.9. Do not treat this figure as correct;
     * it exists so `platform.mrr` fails loudly in a review rather than
     * silently returning null.
     */
    private function mrr(): float
    {
        return (float) $this->realTenants()
            ->join('plans', 'tenants.plan', '=', 'plans.slug')
            ->where('tenants.status', 'active')
            ->sum('plans.price');
    }
}
