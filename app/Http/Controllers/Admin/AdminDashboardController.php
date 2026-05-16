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
    public function index(): Response
    {
        $tenants = Tenant::withTrashed()->get();

        $planPrices = [
            'starter'  => 19,
            'growth'   => 39,
            'business' => 79,
        ];

        // MRR = sum of monthly plan prices for all active tenants
        $mrr = $tenants
            ->where('status', 'active')
            ->sum(fn($t) => $planPrices[$t->plan] ?? 0);

        // Churn rate (last 30 days cancelled vs total at start of period)
        $cancelledLast30 = $tenants
            ->where('status', 'cancelled')
            ->filter(fn($t) => $t->updated_at?->gte(now()->subDays(30)))
            ->count();

        // Trial conversion rate (signups in last 30 days that became active)
        $signupsLast30 = $tenants
            ->filter(fn($t) => $t->created_at?->gte(now()->subDays(30)))
            ->count();

        $convertedLast30 = $tenants
            ->where('status', 'active')
            ->filter(fn($t) => $t->created_at?->gte(now()->subDays(30)))
            ->count();

        // Tenant distribution by plan
        $planDistribution = $tenants
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
                'status'       => $t->trashed() ? 'deleted' : $t->status,
                'industry'     => $t->industry,
                'created_at'   => $t->created_at?->diffForHumans(),
                'trial_ends'   => $t->trial_ends_at?->format('M d'),
                'setup_done'   => $t->setup_completed,
            ]);

        // Storage usage (approximate from R2/local)
        $storageUsedGb = $this->calculateStorageUsage();

        // MRR growth (last 6 months)
        $mrrTrend = collect(range(5, 0))->map(function ($i) use ($planPrices) {
            $date = now()->subMonths($i);
            $monthMrr = Tenant::withoutTenantScope()
                ->where('status', 'active')
                ->where('created_at', '<=', $date->endOfMonth())
                ->get()
                ->sum(fn($t) => $planPrices[$t->plan] ?? 0);

            return [
                'month' => $date->format('M'),
                'mrr'   => $monthMrr,
            ];
        })->values();

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => [
                'mrr'               => $mrr,
                'tenants_total'     => $tenants->count(),
                'tenants_trial'     => $tenants->where('status', 'trial')->count(),
                'tenants_active'    => $tenants->where('status', 'active')->whereNull('deleted_at')->count(),
                'tenants_suspended' => $tenants->where('status', 'suspended')->whereNull('deleted_at')->count(),
                'tenants_churned'   => $tenants->where('status', 'cancelled')->whereNull('deleted_at')->count(),
                'tenants_deleted'   => $tenants->whereNotNull('deleted_at')->count(),
                'new_today'         => $tenants->filter(fn($t) => $t->created_at?->isToday())->count(),
                'new_this_month'    => $tenants->filter(fn($t) => $t->created_at?->isCurrentMonth())->count(),
                'storage_used_gb'   => $storageUsedGb,
                'cancelled_last_30' => $cancelledLast30,
                'conversion_rate'   => $signupsLast30 > 0
                    ? round(($convertedLast30 / $signupsLast30) * 100, 1)
                    : 0,
            ],
            'plan_distribution' => $planDistribution,
            'recent_tenants'    => $recentTenants,
            'mrr_trend'         => $mrrTrend,
        ]);
    }

    /**
     * Full tenants list with search and filtering.
     * Endpoint: GET /superadmin/tenants
     */
    public function tenants(Request $request): Response
    {
        $query = Tenant::withoutTenantScope()->latest();

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
        $tenant = Tenant::withoutTenantScope()->findOrFail($tenantId);

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
        $tenant = Tenant::withoutTenantScope()->findOrFail($tenantId);
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
