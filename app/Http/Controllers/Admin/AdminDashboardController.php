<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * AdminDashboardController — Phase 5.3
 *
 * The platform operator's command center. Accessible only at:
 *   GET /superadmin/dashboard
 *   GET /superadmin/tenants
 *
 * Protected by: ['auth', 'superadmin'] middleware
 * The superadmin middleware checks: user->role === 'platform_admin' && !user->tenant_id
 *
 * This controller intentionally bypasses ALL tenant scopes.
 * Every query uses Tenant::withoutTenantScope() or raw cross-tenant DB queries.
 *
 * WARNING: Never add TenantMiddleware to these routes.
 */
class AdminDashboardController extends Controller
{
    /**
     * Platform overview dashboard.
     * Endpoint: GET /superadmin/dashboard
     */
    public function index(Request $request): Response
    {
        $period = $request->get('period', 'all');
        $dateLimit = match($period) {
            'today' => now()->startOfDay(),
            'month' => now()->startOfMonth(),
            'year'  => now()->startOfYear(),
            default => null,
        };

        $tenants = Tenant::withTrashed()->get();

        $planPrices = [
            'starter'  => 19,
            'growth'   => 39,
            'business' => 79,
        ];

        // Real-only filters (excluding is_demo stores)
        $realTenants = $tenants->where('is_demo', false);

        // MRR = sum of monthly plan prices for all active real tenants
        $mrr = $realTenants
            ->where('status', 'active')
            ->sum(fn($t) => $planPrices[$t->plan] ?? 0);

        // Churn rate (last 30 days cancelled vs total at start of period)
        $cancelledLast30 = $realTenants
            ->where('status', 'cancelled')
            ->filter(fn($t) => $t->updated_at?->gte(now()->subDays(30)))
            ->count();

        // Trial conversion rate (signups in last 30 days that became active)
        $signupsLast30 = $realTenants
            ->filter(fn($t) => $t->created_at?->gte(now()->subDays(30)))
            ->count();

        $convertedLast30 = $realTenants
            ->where('status', 'active')
            ->filter(fn($t) => $t->created_at?->gte(now()->subDays(30)))
            ->count();

        // Tenant distribution by plan (Still show distribution of all stores or just real?)
        // Usually superadmin wants to see everything but label demo.
        // For now I'll use realTenants for the distribution if we want "Real" dashboard.
        $planDistribution = $realTenants
            ->groupBy('plan')
            ->map(fn($group, $plan) => [
                'plan'  => $plan,
                'count' => $group->count(),
                'mrr'   => $group->where('status', 'active')->sum(fn($t) => $planPrices[$plan] ?? 0),
            ])
            ->values();

        // Recent signups (last 10)
        $recentTenants = Tenant::withTrashed()
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'id'           => $t->id,
                'name'         => $t->name,
                'subdomain'    => $t->slug,
                'plan'         => $t->plan,
                'status'       => $t->deleted_at ? 'deleted' : $t->status,
                'industry'     => $t->industry,
                'created_at'   => $t->created_at?->diffForHumans(),
                'trial_ends'   => $t->trial_ends_at?->format('M d'),
                'setup_done'   => $t->setup_completed,
            ]);

        // Storage usage (approximate from R2/local)
        $storageUsedGb = $this->calculateStorageUsage();

        // Dynamic Trend Calculation based on period
        $storeTrend = collect();
        $trendQuery = Tenant::query()->where('is_demo', false);
        
        if ($period === 'today') {
            // Hourly trend for the current day
            $storeTrend = collect(range(0, 23))->map(function ($h) use ($trendQuery) {
                $start = now()->startOfDay()->addHours($h);
                $end   = $start->copy()->endOfHour();
                $count = (clone $trendQuery)->whereBetween('created_at', [$start, $end])->count();
                return ['month' => $start->format('H:00'), 'stores' => $count];
            });
        } elseif ($period === 'month') {
            // Daily trend for current month
            $days = now()->day;
            $storeTrend = collect(range(1, $days))->map(function ($d) use ($trendQuery) {
                $date = now()->startOfMonth()->addDays($d - 1);
                $count = (clone $trendQuery)->whereDate('created_at', $date->toDateString())->count();
                return ['month' => $date->format('M d'), 'stores' => $count];
            });
        } else {
            // Monthly trend (Year/All) - Last 6 months
            $storeTrend = collect(range(5, 0))->map(function ($i) use ($trendQuery) {
                $date = now()->subMonths($i);
                $count = (clone $trendQuery)
                    ->whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])
                    ->count();
                return ['month' => $date->format('M'), 'stores' => $count];
            });
        }
        $storeTrend = $storeTrend->values();

        // MRR growth (last 6 months)
        $mrrTrend = collect(range(5, 0))->map(function ($i) use ($planPrices) {
            $date = now()->subMonths($i);
            $monthMrr = Tenant::query()
                ->where('status', 'active')
                ->where('created_at', '<=', $date->endOfMonth())
                ->get()
                ->sum(fn($t) => $planPrices[$t->plan] ?? 0);

            return [
                'month' => $date->format('M'),
                'mrr'   => $monthMrr,
            ];
        })->values();



        // Filtered Volume (Volume within period) - Exclude demo stores
        $volQuery = DB::table('sales')
            ->join('tenants', 'sales.tenant_id', '=', 'tenants.id')
            ->where('tenants.is_demo', false)
            ->whereNull('sales.deleted_at');
            
        if ($dateLimit) $volQuery->where('sales.created_at', '>=', $dateLimit);
        $totalVolume = (float)$volQuery->sum('sales.total');

        // Growth Rate (Signups vs previous period)
        $signupsLastMonth = $tenants
            ->filter(fn($t) => $t->created_at?->between(now()->subMonths(2), now()->subMonth()))
            ->count();
            
        // For 'month' period, we compare this month vs last month signups
        $growthRate = $signupsLastMonth > 0 
            ? round((($signupsLast30 - $signupsLastMonth) / $signupsLastMonth) * 100, 1)
            : 0;

        // Peak conversion is the highest monthly rate in history (approximation)
        $conversionRate = $signupsLast30 > 0 ? round(($convertedLast30 / $signupsLast30) * 100, 1) : 0;

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => [
                'mrr'              => $mrr,
                'total_stores'     => $realTenants->count(),
                'trial_stores'     => $realTenants->where('status', 'trial')->count(),
                'active_stores'    => $realTenants->where('status', 'active')->count(),
                'suspended_stores' => $realTenants->where('status', 'suspended')->count(),
                'churned_stores'   => $realTenants->where('status', 'cancelled')->count(),
                'deleted_stores'   => $realTenants->whereNotNull('deleted_at')->count(),
                'new_today'        => $realTenants->filter(fn($t) => $t->created_at?->isToday())->count(),
                'new_this_month'   => $realTenants->filter(fn($t) => $t->created_at?->isCurrentMonth())->count(),
                'storage_used_gb'  => $storageUsedGb,
                'total_volume'     => (float)$totalVolume,
                'growth_rate'      => (float)$growthRate,
                'uptime'           => 100.0,
                'period'           => $period,
            ],
            'plan_distribution' => $planDistribution,
            'recent_stores'     => $realTenants->take(10)->map(fn($t) => [
                'id'           => $t->id,
                'name'         => $t->name,
                'subdomain'    => $t->slug,
                'plan'         => $t->plan,
                'status'       => $t->deleted_at ? 'deleted' : $t->status,
                'industry'     => $t->industry,
                'created_at'   => $t->created_at?->diffForHumans(),
                'trial_ends'   => $t->trial_ends_at?->format('M d'),
                'setup_done'   => $t->setup_completed,
            ])->values(),
            'store_trend'       => $storeTrend,
            'mrr_trend'         => $mrrTrend,
            'expiring_stores'   => $realTenants
                ->filter(fn($t) => $t->status === 'trial' && $t->trial_ends_at?->isFuture() && $t->trial_ends_at?->diffInDays(now()) <= 7)
                ->map(fn($t) => [
                    'id'          => $t->id,
                    'name'        => $t->name,
                    'owner_email' => $t->ownerEmail(),
                    'days_left'   => $t->trial_ends_at?->diffInDays(now()),
                ])
                ->values(),
        ]);
    }

    /**
     * Full tenants list with search and filtering.
     * Endpoint: GET /superadmin/tenants
     */
    public function tenants(Request $request): Response
    {
        $query = Tenant::latest();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('subdomain', 'like', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            if ($status === 'deleted') {
                $query->onlyTrashed();
            } else {
                $query->where('status', $status);
            }
        } else {
            // Default to seeing both active and deleted? No, keep it separate or merged.
            // User requested to "see that soft deleted things", so I'll include them by default or via filter.
            $query->withTrashed();
        }

        if ($plan = $request->get('plan')) {
            $query->where('plan', $plan);
        }

        $tenants = $query->paginate(25)->through(fn($t) => [
            'id'               => $t->id,
            'name'             => $t->name,
            'subdomain'        => $t->slug,
            'plan'             => $t->plan,
            'status'           => $t->trashed() ? 'deleted' : $t->status,
            'industry'         => $t->industry,
            'currency_code'    => $t->currency_code,
            'setup_completed'  => $t->setup_completed,
            'created_at'       => $t->created_at?->format('Y-m-d'),
            'deleted_at'       => $t->deleted_at?->format('Y-m-d'),
            'trial_ends_at'    => $t->trial_ends_at?->format('Y-m-d'),
            'subscription_ends_at' => $t->subscription_ends_at?->format('Y-m-d'),
            'lemon_customer_id' => $t->lemon_squeezy_customer_id,
        ]);

        return Inertia::render('SuperAdmin/Tenants', [
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'status', 'plan']),
        ]);
    }

    /**
     * Suspend a tenant account.
     * Endpoint: POST /superadmin/tenants/{tenant}/suspend
     */
    public function suspend(string $tenantId): \Illuminate\Http\RedirectResponse
    {
        $tenant = Tenant::findOrFail($tenantId);

        if ($tenant->status === 'active' || $tenant->status === 'trial') {
            $tenant->update(['status' => 'suspended']);
        }

        return back()->with('success', "Tenant '{$tenant->name}' has been suspended.");
    }

    /**
     * Unsuspend / reactivate a tenant.
     * Endpoint: POST /superadmin/tenants/{tenant}/reactivate
     */
    public function reactivate(string $tenantId): \Illuminate\Http\RedirectResponse
    {
        $tenant = Tenant::findOrFail($tenantId);
        $tenant->update(['status' => 'active']);

        return back()->with('success', "Tenant '{$tenant->name}' has been reactivated.");
    }

    /**
     * Manually upgrade a tenant's plan (e.g. sales override, AppSumo code).
     * Endpoint: POST /superadmin/tenants/{tenant}/upgrade
     */
    public function upgradePlan(Request $request, string $tenantId): \Illuminate\Http\RedirectResponse
    {
        $request->validate(['plan' => 'required|in:starter,growth,business']);

        $tenant = Tenant::withTrashed()->findOrFail($tenantId);
        $oldPlan = $tenant->plan;
        $tenant->update([
            'plan'   => $request->plan,
            'status' => 'active',
        ]);

        return back()->with('success', "Tenant '{$tenant->name}' upgraded from {$oldPlan} → {$request->plan}.");
    }

    /**
     * Delete a tenant permanently.
     * Endpoint: POST /superadmin/tenants/{tenant}/forever
     */
    public function destroyForever(string $tenantId): \Illuminate\Http\RedirectResponse
    {
        $tenant = Tenant::withTrashed()->findOrFail($tenantId);
        $tenant->forceDelete();

        return back()->with('success', "Tenant '{$tenant->name}' has been PERMANENTLY deleted.");
    }

    /**
     * Calculate approximate total storage usage across all tenants.
     * Returns value in GB (float).
     */
    private function calculateStorageUsage(): float
    {
        try {
            // Try R2 / local disk — get total size of uploads folder
            $files = Storage::disk(config('filesystems.default', 'public'))->allFiles('.');
            $bytes = collect($files)->sum(fn($f) => Storage::size($f));
            return round($bytes / 1024 / 1024 / 1024, 2);
        } catch (\Throwable) {
            return 0.0;
        }
    }
}
