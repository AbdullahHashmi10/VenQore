<?php

namespace App\Services\Platform;

use App\Models\Tenant;
use App\Models\PlatformPartner;
use App\Models\PlatformEquityDrawing;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * PlatformRevenueService — server-side, single source of truth for money
 * (Roadmap T1.3 / T1.5 / T1.6).
 *
 * Hard rules enforced here, never in the browser:
 *   • Revenue = monthly-equivalent price of ACTIVE, PAID subscriptions.
 *   • "Paid" = has a LemonSqueezy subscription id OR a currently-valid,
 *      non-comp StoreLicense. Manually-flipped "active" stores with no
 *      payment record are NOT counted.
 *   • Demo + internal tenants are excluded everywhere (Tenant::billable()).
 *   • GMV (merchant sales volume) is computed separately and is NEVER
 *      presented as platform revenue.
 */
class PlatformRevenueService
{
    public function __construct(
        protected PlanPricingService $pricing = new PlanPricingService(),
    ) {}

    /**
     * Monthly Recurring Revenue — sum of monthly-equivalent price of every
     * active, paid, billable subscription.
     */
    public function mrr(string $currency = 'USD'): float
    {
        $paid = $this->paidTenants();

        $mrr = 0.0;
        foreach ($paid as $t) {
            $mrr += $this->pricing->monthly((string) $t->plan, $currency);
        }

        return round($mrr, 2);
    }

    /** Annual Recurring Revenue. */
    public function arr(string $currency = 'USD'): float
    {
        return round($this->mrr($currency) * 12, 2);
    }

    /**
     * Gross Merchant Volume — the sum of merchants' OWN sales. This is the
     * money that flows through stores, NOT money VenQore earns. Shown as a
     * clearly-labelled, separate metric. Excludes demo + internal.
     */
    public function gmv(?string $period = 'all'): float
    {
        $dateLimit = $this->dateLimit($period);

        $q = DB::table('sales')
            ->join('tenants', 'sales.tenant_id', '=', 'tenants.id')
            ->where('tenants.is_demo', false)
            ->where('tenants.is_internal', false)
            ->whereNull('sales.deleted_at')
            ->whereNull('tenants.deleted_at');

        if ($dateLimit) {
            $q->where('sales.created_at', '>=', $dateLimit);
        }

        return (float) $q->sum('sales.total');
    }

    /**
     * Net revenue = gross MRR minus an estimated gateway-fee + refund rate.
     * Rate is read from platform settings (fallback to a sane default) so it
     * is configurable, not hard-coded in a component.
     */
    public function netRevenue(string $currency = 'USD'): float
    {
        $feePct  = (float) $this->setting('gateway_fee_pct', 5); // 5% default
        $feeRate = $feePct / 100;
        $gross   = $this->mrr($currency);
        return round($gross * (1 - $feeRate), 2);
    }

    /** Count + MRR contribution per plan, from the plans table. */
    public function planDistribution(string $currency = 'USD'): array
    {
        $paid = $this->paidTenants();
        $byPlan = [];

        foreach ($paid as $t) {
            $slug = (string) ($t->plan ?: 'unknown');
            $byPlan[$slug] ??= ['plan' => $slug, 'count' => 0, 'mrr' => 0.0];
            $byPlan[$slug]['count']++;
            $byPlan[$slug]['mrr'] += $this->pricing->monthly($slug, $currency);
        }

        // Round and sort by MRR desc.
        $rows = array_map(function ($r) {
            $r['mrr'] = round($r['mrr'], 2);
            return $r;
        }, array_values($byPlan));

        usort($rows, fn ($a, $b) => $b['mrr'] <=> $a['mrr']);
        return $rows;
    }

    /**
     * A compact, UI-ready bundle of every money figure the Overview needs,
     * with both currencies and the GMV split, plus footnotes flags.
     */
    public function summary(?string $period = 'all'): array
    {
        return [
            'currency'       => 'USD',
            'mrr'            => $this->mrr('USD'),
            'arr'            => $this->arr('USD'),
            'net_revenue'    => $this->netRevenue('USD'),
            'mrr_pkr'        => $this->mrr('PKR'),
            'gmv'            => $this->gmv($period),
            'paid_count'     => $this->paidTenants()->count(),
            'plan_mrr'       => $this->planDistribution('USD'),
            'excludes'       => 'Excludes internal & demo stores',
            'period'         => $period,
        ];
    }

    public function payoutPoolSummary(int $months = 1): array
    {
        $netMrrPkr = $this->netRevenue('PKR');
        $netMrrUsd = $this->netRevenue('USD');
        $cumulativePkr = $netMrrPkr * $months;

        $partners = PlatformPartner::all();
        $totalEquityAllocated = $partners->sum('equity_pct');

        $profiles = $partners->map(function ($p) use ($cumulativePkr) {
            $totalShare = $cumulativePkr * ($p->equity_pct / 100);
            $totalDrawn = (float) PlatformEquityDrawing::where('partner_id', $p->id)->sum('amount');
            $remaining = $totalShare - $totalDrawn;

            return [
                'id' => $p->id,
                'name' => $p->name,
                'role' => $p->role,
                'equity_pct' => $p->equity_pct,
                'total_share' => round($totalShare, 2),
                'total_drawn' => round($totalDrawn, 2),
                'remaining' => round($remaining, 2),
            ];
        })->toArray();

        $drawings = PlatformEquityDrawing::with('partner')
            ->latest('date')
            ->get()
            ->map(fn($d) => [
                'id' => $d->id,
                'date' => $d->date->toDateString(),
                'partner_id' => $d->partner_id,
                'partner_name' => $d->partner?->name ?? 'Deleted Partner',
                'amount' => (float) $d->amount,
                'description' => $d->description ?? '',
            ])->toArray();

        return [
            'net_mrr_pkr' => $netMrrPkr,
            'net_mrr_usd' => $netMrrUsd,
            'months' => $months,
            'cumulative_payout_pot' => round($cumulativePkr, 2),
            'total_equity_allocated' => $totalEquityAllocated,
            'profiles' => $profiles,
            'drawings' => $drawings,
        ];
    }

    // ──────────────────────────────────────────────────────────────────
    // Internals
    // ──────────────────────────────────────────────────────────────────

    /**
     * Active, PAID, billable tenants. The definition of "real revenue".
     */
    protected function paidTenants()
    {
        return Tenant::query()
            ->billable()
            ->whereNull('deleted_at')
            ->where('status', 'active')
            ->where(function ($q) {
                // Has a gateway subscription …
                $q->whereNotNull('lemon_squeezy_subscription_id')
                  // … OR a currently-valid, non-comp license.
                  ->orWhereHas('licenses', function ($l) {
                      $l->whereNotIn('status', ['expired', 'cancelled'])
                        ->where('type', '!=', 'comp')
                        ->where(function ($v) {
                            $v->whereNull('valid_until')
                              ->orWhere('valid_until', '>', now());
                        });
                  });
            })
            ->get(['id', 'plan', 'status', 'lemon_squeezy_subscription_id']);
    }

    protected function dateLimit(?string $period): ?Carbon
    {
        return match ($period) {
            'today' => now()->startOfDay(),
            'month' => now()->startOfMonth(),
            'year'  => now()->startOfYear(),
            default => null,
        };
    }

    protected function setting(string $key, $default = null)
    {
        try {
            if (! class_exists(\App\Models\Setting::class)) {
                return $default;
            }
            $row = \App\Models\Setting::withoutGlobalScopes()
                ->whereNull('tenant_id')
                ->where('key', $key)
                ->first();
            $val = $row?->value;
            return ($val === null || $val === '') ? $default : $val;
        } catch (\Throwable $e) {
            return $default;
        }
    }
}
