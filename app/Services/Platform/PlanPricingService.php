<?php

namespace App\Services\Platform;

use App\Models\Plan;
use Illuminate\Support\Facades\Cache;

/**
 * PlanPricingService — the ONE price source (Roadmap T1.4).
 *
 * Replaces the three disagreeing price sources (the hard-coded
 * ['starter'=>19,...] array in SuperAdminController, config/plans.php,
 * and ad-hoc reads). Every monthly-equivalent price the platform layer
 * needs is resolved here, from the `plans` table, in USD or PKR.
 *
 * Lifetime (LTD) deals are amortised to a monthly figure over a policy
 * window so they contribute a sane number to MRR without overstating it.
 */
class PlanPricingService
{
    /** Months to amortise a lifetime deal across for MRR purposes. */
    public const LTD_AMORTISE_MONTHS = 24;

    /**
     * Monthly-equivalent price for a plan slug, in the given currency.
     *
     * @param  string  $planSlug
     * @param  string  $currency  'USD' | 'PKR'
     */
    public function monthly(string $planSlug, string $currency = 'USD'): float
    {
        $plans = $this->planMap();
        $plan  = $plans[$planSlug] ?? null;

        if (! $plan) {
            return 0.0;
        }

        $pkr = strtoupper($currency) === 'PKR';

        // Direct monthly price wins.
        $monthly = (float) ($pkr ? $plan->price_monthly_pkr : $plan->price_monthly);
        if ($monthly > 0) {
            return round($monthly, 2);
        }

        // Annual → divide by 12.
        $annual = (float) ($pkr ? $plan->price_annual_pkr : $plan->price_annual);
        if ($annual > 0) {
            return round($annual / 12, 2);
        }

        // Lifetime → amortise.
        $lifetime = (float) ($pkr ? $plan->price_lifetime_pkr : $plan->price_lifetime);
        if ($lifetime > 0) {
            return round($lifetime / self::LTD_AMORTISE_MONTHS, 2);
        }

        return 0.0;
    }

    /** Annual-equivalent price for a plan slug. */
    public function annual(string $planSlug, string $currency = 'USD'): float
    {
        return round($this->monthly($planSlug, $currency) * 12, 2);
    }

    /** Headline list price (whatever the plan is primarily sold as). */
    public function listPrice(string $planSlug, string $currency = 'USD'): array
    {
        $plans = $this->planMap();
        $plan  = $plans[$planSlug] ?? null;
        if (! $plan) {
            return ['amount' => 0.0, 'interval' => 'month'];
        }
        $pkr = strtoupper($currency) === 'PKR';

        if (($pkr ? $plan->price_monthly_pkr : $plan->price_monthly) > 0) {
            return ['amount' => round((float) ($pkr ? $plan->price_monthly_pkr : $plan->price_monthly), 2), 'interval' => 'month'];
        }
        if (($pkr ? $plan->price_annual_pkr : $plan->price_annual) > 0) {
            return ['amount' => round((float) ($pkr ? $plan->price_annual_pkr : $plan->price_annual), 2), 'interval' => 'year'];
        }
        if (($pkr ? $plan->price_lifetime_pkr : $plan->price_lifetime) > 0) {
            return ['amount' => round((float) ($pkr ? $plan->price_lifetime_pkr : $plan->price_lifetime), 2), 'interval' => 'lifetime'];
        }
        return ['amount' => 0.0, 'interval' => 'month'];
    }

    /**
     * All plans keyed by slug, cached briefly so a dashboard render that
     * prices many tenants only hits the DB once. Busted on plan writes.
     */
    protected function planMap()
    {
        return Cache::remember('platform.plan_pricing.map', 60, function () {
            return Plan::all()->keyBy('slug');
        });
    }

    /** Invalidate the price cache (call after any plan create/update/delete). */
    public static function flush(): void
    {
        Cache::forget('platform.plan_pricing.map');
    }
}
