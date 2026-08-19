<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\AppSumoCode;
use Inertia\Inertia;

/**
 * SuperAdminController — Platform Owner War Room
 *
 * Platform-level command center. Only accessible to is_platform_admin = true users.
 * Provides a full overview of all tenants, revenue, users, and platform health.
 *
 * URL prefix: /admin/ (migrating to /hq/ in V2 per architecture plan)
 */
class SuperAdminController extends Controller
{
    public function dashboard(Request $request)
    {
        $period = $request->get('period', 'all');
        $dateLimit = match($period) {
            'today' => now()->startOfDay(),
            'month' => now()->startOfMonth(),
            'year'  => now()->startOfYear(),
            default => null,
        };

        $tenants = Tenant::withTrashed()->get();
        // Billable = excludes demo AND internal/owner/test stores (the $52k fix).
        $realTenants = $tenants->where('is_demo', false)->where('is_internal', false);

        // ── Money is computed server-side, from one source of truth ──────────
        // Revenue (paid subscriptions only) and GMV (merchant volume) come from
        // PlatformRevenueService — never hard-coded prices, never browser math.
        $revenueService = app(\App\Services\Platform\PlatformRevenueService::class);
        $revenue        = $revenueService->summary($period);

        // Coupon-adjusted MRR from the canonical Reckoner platform.mrr metric
        $mrr = (float) (app(\App\Reckoner\Reckoner::class)->read(
            new \App\Reckoner\ReckonerRequest('platform.mrr', 'live'),
            request()->user(),
            null
        )->data ?? 0.0);
        $totalVolume = $revenue['gmv'];          // merchant GMV — NOT platform revenue

        $months      = (int) $request->get('months', 1);
        $payoutPool  = $revenueService->payoutPoolSummary($months);

        // Dynamic Trend Calculation
        $storeTrend = collect();
        $trendQuery = Tenant::query()->where('is_demo', false);
        if ($period === 'today') {
            $storeTrend = collect(range(0, 23))->map(function ($h) use ($trendQuery) {
                $start = now()->startOfDay()->addHours($h);
                $end   = $start->copy()->endOfHour();
                $count = (clone $trendQuery)->whereBetween('created_at', [$start, $end])->count();
                return ['month' => $start->format('H:00'), 'stores' => $count];
            });
        } elseif ($period === 'month') {
            $days = now()->day;
            $storeTrend = collect(range(1, $days))->map(function ($d) use ($trendQuery) {
                $date = now()->startOfMonth()->addDays($d - 1);
                $count = (clone $trendQuery)->whereDate('created_at', $date->toDateString())->count();
                return ['month' => $date->format('M d'), 'stores' => $count];
            });
        } else {
            $storeTrend = collect(range(5, 0))->map(function ($i) use ($trendQuery) {
                $date = now()->subMonths($i);
                $count = (clone $trendQuery)->whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])->count();
                return ['month' => $date->format('M'), 'stores' => $count];
            });
        }

        // Plan Distribution — counts per plan; MRR priced from the plans table
        // with coupon adjustment applied (T7.9 / T7.10).
        $pricing = app(\App\Services\Platform\PlanPricingService::class);
        $planSlugs = \App\Models\Plan::orderBy('sort_order')->pluck('slug')->all();
        if (empty($planSlugs)) {
            $planSlugs = ['trial', 'starter', 'growth', 'business', 'ltd'];
        }
        $planDist = collect($planSlugs)->map(function ($plan) use ($realTenants, $pricing) {
            $group = $realTenants->where('plan', $plan);
            $activePaid = $group->where('status', 'active');
            
            $planMrr = 0.0;
            foreach ($activePaid as $t) {
                $basePrice = $pricing->monthly((string) $plan, 'USD');
                
                $redemption = \App\Models\CouponRedemption::withoutTenantScope()
                    ->where('tenant_id', $t->id)
                    ->with('coupon')
                    ->first();
                if ($redemption && $redemption->coupon) {
                    $coupon = $redemption->coupon;
                    if ($coupon->discount_type === 'percentage' || $coupon->discount_type === 'percent') {
                        $discountVal = ($basePrice * ($coupon->discount_value / 100));
                        $finalPrice = max(0, $basePrice - $discountVal);
                    } else {
                        $finalPrice = max(0, $basePrice - $coupon->discount_value);
                    }
                } else {
                    $finalPrice = $basePrice;
                }
                $planMrr += $finalPrice;
            }

            return [
                'plan'  => $plan,
                'count' => $group->count(),
                'mrr'   => round($planMrr, 2),
            ];
        })->values();

        // Expiring Stores
        $expiringStores = $realTenants
            ->filter(fn($t) => $t->status === 'trial' && $t->trial_ends_at?->isFuture() && $t->trial_ends_at?->diffInDays(now()) <= 7)
            ->map(fn($t) => [
                'id'          => $t->id,
                'name'        => $t->name ?? '(Unnamed)',
                'owner_email' => $t->ownerEmail(),
                'days_left'   => $t->trial_ends_at?->diffInDays(now()),
                'trial_ends'  => $t->trial_ends_at->toDateString(),
            ])->values();

        // Recent Stores
        $recentStores = $realTenants->take(10)->map(fn($t) => [
            'id'            => $t->id,
            'name'          => $t->name ?? '(Unnamed Store)',
            'slug'          => $t->slug,
            'plan'          => $t->plan,
            'status'        => $t->trashed() ? 'deleted' : $t->status,
            'owner_email'   => $t->ownerEmail(),
            'setup_done'    => (bool) $t->setup_completed,
            'created_at'    => $t->created_at->diffForHumans(),
        ])->values();

        // Stats summary for header
        $stats = [
            'total_stores'      => $realTenants->count(),
            'active_stores'     => $realTenants->where('status', 'active')->count(),
            'trial_stores'      => $realTenants->where('status', 'trial')->count(),
            'suspended_stores'  => $realTenants->where('status', 'suspended')->count(),
            'churned_stores'    => $realTenants->where('status', 'cancelled')->count(),
            'total_deleted_stores' => $tenants->whereNotNull('deleted_at')->count(),
            'new_today'         => $realTenants->filter(fn($t) => $t->created_at?->isToday())->count(),
            'new_this_month'    => $realTenants->filter(fn($t) => $t->created_at?->isCurrentMonth())->count(),
            'mrr'               => $mrr,
            'arr'               => $revenue['arr'],
            'net_revenue'       => $revenue['net_revenue'],
            'paid_subscribers'  => $revenue['paid_count'],
            'total_volume'      => $totalVolume,
            'period'            => $period,
            'total_users'       => User::where('is_platform_admin', false)->where('email', 'not like', '%@venqore-demo.internal')->count(),
            'platform_admins'   => User::where('is_platform_admin', true)->count(),
            'deleted_users'     => User::onlyTrashed()->count(),
            'open_errors'       => \App\Models\ErrorLog::where('is_resolved', false)->count(),
            'new_contacts'      => \App\Models\ContactSubmission::where('status', 'new')->count(),
            'monetization'      => [
                'total_plans'      => \App\Models\Plan::count(),
                'website_plans'    => \App\Models\Plan::where('is_ltd', false)->count(),
                'appsumo_plans'    => \App\Models\Plan::where('is_ltd', true)->count(),
                
                'total_platforms'  => \App\Models\Platform::count(),
                'active_platforms' => \App\Models\Platform::where('is_active', true)->count(),
                'inactive_platforms' => \App\Models\Platform::where('is_active', false)->count(),
                
                'total_coupons'    => \App\Models\Coupon::count(),
                'active_coupons'   => \App\Models\Coupon::where('is_active', true)->count(),
                'inactive_coupons' => \App\Models\Coupon::where('is_active', false)->count(),

                'total_overrides'  => \App\Models\TenantPlanOverride::withoutTenantScope()->count(),
                'active_overrides' => \App\Models\TenantPlanOverride::withoutTenantScope()->where(function($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })->count(),
                'expired_overrides' => \App\Models\TenantPlanOverride::withoutTenantScope()->where('expires_at', '<=', now())->count(),
                'pk_verifications' => [
                    'pending' => \App\Models\PkVerification::withoutTenantScope()->where('status', 'pending')->count(),
                    'approved' => \App\Models\PkVerification::withoutTenantScope()->where('status', 'approved')->count(),
                    'rejected' => \App\Models\PkVerification::withoutTenantScope()->where('status', 'rejected')->count(),
                ],
            ],
        ];

        $pkVerificationsList = \App\Models\PkVerification::withoutTenantScope()->with(['tenant', 'user'])
            ->latest()
            ->get()
            ->map(fn($v) => [
                'id'           => $v->id,
                'tenant_name'  => $v->tenant?->name ?? '—',
                'tenant_slug'  => $v->tenant?->slug ?? '—',
                'user_name'    => $v->user?->name ?? '—',
                'user_email'   => $v->user?->email ?? '—',
                'phone'        => $v->phone,
                'status'       => $v->status,
                'created_at'   => $v->created_at->toDateString(),
                'rejection'    => $v->rejection_reason,
            ])->toArray();

        $settings = \App\Models\Setting::withoutGlobalScopes()
            ->whereNull('tenant_id')
            ->pluck('value', 'key')
            ->toArray();

        $ticketStatus = $request->get('ticket_status', 'open');
        $ticketSource = $request->get('ticket_source', 'all');

        $ticketsQuery = \App\Models\SupportTicket::with(['tenant:id,name,slug', 'submittedBy:id,name,email'])
            ->withoutGlobalScopes()
            ->latest();

        if ($ticketStatus !== 'all') {
            $ticketsQuery->where('status', $ticketStatus);
        }

        if ($ticketSource !== 'all') {
            $ticketsQuery->where('source', $ticketSource);
        }

        $tickets = $ticketsQuery->paginate(25, ['*'], 'tickets_page')->withQueryString();

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats'             => $stats,
            'revenue'           => $revenue,
            'payout_pool'       => $payoutPool,
            'pk_verifications'  => $pkVerificationsList,
            'settings'          => $settings,
            'store_trend'       => $storeTrend->values(),
            'plan_distribution' => $planDist,
            'recent_stores'     => $recentStores,
            'expiring_stores'   => $expiringStores,
            'activity_feed'     => $this->buildActivityFeed(),
            'platform_users'    => $this->buildPlatformUsers(),
            'tickets'           => $tickets,
            'ticket_filters'    => [
                'status' => $ticketStatus,
                'source' => $ticketSource,
            ],
        ]);
    }

    // ─── Data Builders ──────────────────────────────────────────────────────
    private function buildActivityFeed(): array
    {
        // New store signups
        $newStores = Tenant::where('is_demo', false)->latest()->take(5)->get()->map(fn($t) => [
            'type'    => 'new_store',
            'icon'    => 'building',
            'message' => '🏪 New store registered: ' . ($t->name ?? 'Unnamed'),
            'sub'     => $t->plan . ' plan · ' . $t->created_at->diffForHumans(),
            'time'    => $t->created_at->timestamp,
            'color'   => 'indigo',
        ]);

        // Suspended stores
        $suspended = Tenant::where('status', 'suspended')->where('is_demo', false)->latest('updated_at')->take(3)->get()->map(fn($t) => [
            'type'    => 'suspended',
            'icon'    => 'alert',
            'message' => '⚠️ Store suspended: ' . ($t->name ?? 'Unnamed'),
            'sub'     => 'Suspended ' . $t->updated_at->diffForHumans(),
            'time'    => $t->updated_at->timestamp,
            'color'   => 'amber',
        ]);

        // Audit Logs (T7.3)
        $auditLogs = \App\Models\PlatformAuditLog::with('user:id,name')
            ->latest()
            ->take(15)
            ->get()
            ->map(function ($log) {
                $userName = $log->user?->name ?? 'System';
                $message = "🛡️ Action [{$log->action}] performed";
                
                switch ($log->action) {
                    case 'partner.created':
                        $message = "🤝 Partner Added: " . ($log->payload['name'] ?? 'Unknown');
                        break;
                    case 'partner.removed':
                        $message = "🤝 Partner Removed: " . ($log->payload['name'] ?? 'Unknown');
                        break;
                    case 'partner.drawing':
                        $message = "💸 Partner Drawing logged: " . ($log->payload['partner'] ?? 'Unknown') . " (PKR " . number_format($log->payload['amount'] ?? 0) . ")";
                        break;
                    case 'settings.updated':
                        $message = "⚙️ Platform Settings updated";
                        break;
                    case 'system.updated':
                        $message = "🚀 System updated to version " . ($log->payload['version'] ?? 'unknown');
                        break;
                }

                return [
                    'type'    => 'audit_log',
                    'icon'    => 'shield',
                    'message' => $message,
                    'sub'     => "By {$userName} · " . $log->created_at->diffForHumans(),
                    'time'    => $log->created_at->timestamp,
                    'color'   => 'emerald',
                ];
            });

        return collect($newStores)->merge($suspended)->merge($auditLogs)
            ->sortByDesc('time')
            ->take(15)
            ->values()
            ->toArray();
    }

    private function buildPlatformUsers(): array
    {
        return User::where('is_platform_admin', true)
            ->latest()
            ->get()
            ->map(fn($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'role'       => 'Hashmi Dashboard',
                'last_login' => $u->updated_at->diffForHumans(),
                'status'     => 'active',
            ])->toArray();
    }

    // ─── Actions ─────────────────────────────────────────────────────────────

    public function stores(Request $request)
    {
        $query = Tenant::query()->where('is_demo', false)->where('slug', '!=', 'demo');
        
        if ($request->boolean('trashed')) {
            $query->onlyTrashed();
        }

        $query->with(['ownerMembership.user']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($plan = $request->get('plan')) {
            $query->where('plan', $plan);
        }

        $tenants = $query->latest()->paginate(20)->through(function (Tenant $t) {
            $owner = $t->ownerMembership?->user;
            return [
                'id'           => $t->id,
                'name'         => $t->name ?? '(Unnamed)',
                'slug'         => $t->slug,
                'plan'         => $t->plan,
                'status'       => $t->status,
                'owner_email'  => $owner?->email ?? '—',
                'owner_name'   => $owner?->name ?? '—',
                'staff_count'  => $t->memberships()->count(),
                'trial_ends'   => $t->trial_ends_at?->toDateString(),
                'setup_done'   => (bool) $t->setup_completed,
                'is_internal'  => (bool) $t->is_internal,
                'created_at'   => $t->created_at->toDateString(),
                'deleted_at'   => $t->deleted_at?->toDateTimeString(),
                'is_trashed'   => $t->trashed(),
            ];
        });

        return Inertia::render('SuperAdmin/Stores', [
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'status', 'plan', 'trashed'])
        ]);
    }

    public function users(Request $request)
    {
        $query = User::query()
            ->where('email', 'not like', '%@venqore-demo.internal')
            ->where('is_platform_admin', false);

        if ($request->boolean('trashed')) {
            $query->onlyTrashed();
        }

        if ($search = $request->get('search')) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->latest()->paginate(20)->through(fn($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'is_platform_admin' => $u->is_platform_admin,
            'platform_role' => $u->platform_role,
            'created_at' => $u->created_at->toDateString(),
            'deleted_at' => $u->deleted_at?->toDateTimeString(),
            'is_trashed' => $u->trashed(),
        ]);

        return Inertia::render('SuperAdmin/Users', [
            'users' => $users,
            'filters' => $request->only(['search', 'trashed'])
        ]);
    }

    public function destroyStore(Tenant $tenant)
    {
        $tenant->delete();
        return back()->with('success', "Store '{$tenant->name}' has been moved to trash.");
    }

    public function bulkDestroyStores(Request $request)
    {
        $request->validate(['ids' => 'required|array']);
        Tenant::whereIn('id', $request->ids)->delete();
        return back()->with('success', count($request->ids) . " stores have been moved to trash.");
    }

    public function destroyUser(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete yourself.');
        }
        $user->delete();
        return back()->with('success', "User '{$user->name}' has been moved to trash.");
    }

    public function bulkDestroyUsers(Request $request)
    {
        $request->validate(['ids' => 'required|array']);
        $ids = array_diff($request->ids, [auth()->id()]);
        if (empty($ids)) return back();
        User::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . " users have been moved to trash.");
    }

    public function restoreStore($id)
    {
        $tenant = Tenant::onlyTrashed()->findOrFail($id);
        $tenant->restore();
        return back()->with('success', "Store '{$tenant->name}' has been restored.");
    }

    public function purgeStore($id, Request $request)
    {
        $this->gateSuperAdmin();
        $this->verifyActionPasscode($request);

        $tenant = Tenant::onlyTrashed()->findOrFail($id);
        $name = $tenant->name;
        
        try {
            $tenant->forceDelete();
            return back()->with('success', "Store '{$name}' has been PERMANENTLY deleted.");
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == 23000) {
                return back()->with('error', "Cannot permanently delete '{$name}' due to restrictive data constraints (e.g., active sales records). It must remain in the Trash.");
            }
            throw $e;
        }
    }

    public function restoreUser($id)
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();
        return back()->with('success', "User '{$user->name}' has been restored.");
    }

    public function purgeUser($id, Request $request)
    {
        $this->gateSuperAdmin();
        $this->verifyActionPasscode($request);

        $user = User::onlyTrashed()->findOrFail($id);
        $name = $user->name;
        
        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($user) {
                \App\Models\StoreLicense::where('user_id', $user->id)->delete();
                \App\Models\TenantUser::where('user_id', $user->id)->delete();
                \App\Models\ActivityLog::where('user_id', $user->id)->delete();
                $user->forceDelete();
            });
    
            return back()->with('success', "User '{$name}' has been PERMANENTLY deleted.");
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == 23000) {
                return back()->with('error', "Cannot permanently delete '{$name}' because they have processed sales or financial records. They must remain safely in the Trash.");
            }
            throw $e;
        }
    }

    public function suspend(Tenant $tenant)
    {
        $this->gateSuperAdmin();
        $tenant->update(['status' => 'suspended']);
        return back()->with('success', "Store '{$tenant->name}' has been suspended.");
    }

    public function activate(Tenant $tenant)
    {
        $this->gateSuperAdmin();
        $tenant->update(['status' => 'active']);
        return back()->with('success', "Store '{$tenant->name}' has been activated.");
    }

    public function extendTrial(Request $request, Tenant $tenant)
    {
        $this->gateSuperAdmin();
        $days = $request->integer('days', 7);

        $payload = [
            'trial_ends_at' => $tenant->trial_ends_at
                ? $tenant->trial_ends_at->addDays($days)
                : now()->addDays($days),
        ];

        // Never demote a paying/active store to "trial" (Roadmap T3.5 / bug #6).
        // Only (re)set trial status if the store is currently in a trial state.
        if ($tenant->status === 'trial') {
            $payload['status'] = 'trial';
        }

        $tenant->update($payload);

        return back()->with('success', "Trial extended by {$days} days for '{$tenant->name}'.");
    }

    /**
     * Toggle a store's "internal / non-billable" flag (Roadmap T1.2).
     * Internal stores are excluded from all revenue & KPI counts.
     */
    public function toggleInternal(Tenant $tenant)
    {
        $this->gateOwner();
        $tenant->update(['is_internal' => ! $tenant->is_internal]);
        $state = $tenant->is_internal ? 'marked internal (non-billable)' : 'marked billable';
        return back()->with('success', "'{$tenant->name}' {$state}.");
    }

    public function appsumoCodes(Request $request)
    {
        $this->checkAppSumo();
        $query = AppSumoCode::query();

        if ($request->get('search')) {
            $query->where('code', 'like', "%{$request->get('search')}%")
                  ->orWhere('redeemed_by_email', 'like', "%{$request->get('search')}%");
        }

        if ($request->get('status') === 'redeemed') {
            $query->where('is_redeemed', true);
        } elseif ($request->get('status') === 'available') {
            $query->where('is_redeemed', false);
        }

        $codes = $query->latest()
            ->with('tenant:id,name,slug')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('SuperAdmin/AppSumo/Index', [
            'codes'   => $codes,
            'filters' => $request->only(['search', 'status']),
            'stats'   => [
                'total'     => AppSumoCode::count(),
                'available' => AppSumoCode::where('is_redeemed', false)->count(),
                'redeemed'  => AppSumoCode::where('is_redeemed', true)->count(),
            ]
        ]);
    }

    public function generateAppSumoCodes(Request $request)
    {
        $this->checkAppSumo();
        $request->validate([
            'count' => 'required|integer|min:1|max:1000',
            'tier'  => 'required|string'
        ]);

        \Illuminate\Support\Facades\Artisan::call('appsumo:generate', [
            'count'  => $request->count,
            '--tier' => $request->tier
        ]);

        return back()->with('success', "{$request->count} codes generated successfully.");
    }

    public function importAppSumoCodes(Request $request)
    {
        $this->checkAppSumo();
        $request->validate([
            'codes' => 'required|string', // Expecting raw text/csv
            'tier'  => 'required|string'
        ]);

        $rawCodes = preg_split('/\r\n|\r|\n|,/', $request->codes);
        $importedCount = 0;

        foreach ($rawCodes as $code) {
            $code = trim($code);
            if (empty($code)) continue;

            if (!AppSumoCode::where('code', $code)->exists()) {
                AppSumoCode::create([
                    'code'      => $code,
                    'plan_tier' => $request->tier
                ]);
                $importedCount++;
            }
        }

        return back()->with('success', "Imported {$importedCount} new codes.");
    }

    public function exportAppSumoCodes(Request $request)
    {
        $this->checkAppSumo();
        $codes = AppSumoCode::all(['code', 'plan_tier', 'is_redeemed', 'redeemed_at', 'redeemed_by_email']);
        
        $csvHeader = ['Code', 'Tier', 'Status', 'Redeemed At', 'Redeemed By'];
        $csvData = [];
        $csvData[] = implode(',', $csvHeader);

        foreach ($codes as $c) {
            $csvData[] = implode(',', [
                $c->code,
                $c->plan_tier,
                $c->is_redeemed ? 'Redeemed' : 'Available',
                $c->redeemed_at ? $c->redeemed_at->toIso8601String() : '',
                $c->redeemed_by_email ?? ''
            ]);
        }

        $csvString = implode("\n", $csvData);
        $filename = "venqore_appsumo_codes_" . date('Y-m-d_His') . ".csv";

        return response($csvString)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename={$filename}");
    }

    public function purgeAppSumoCodes()
    {
        $this->checkAppSumo();
        AppSumoCode::where('is_redeemed', false)->delete();
        return back()->with('success', 'All unredeemed codes have been cleared.');
    }

    // ── System Health & Monitoring ────────────────────────────────────

    public function errorLogs(Request $request)
    {
        $query = \App\Models\ErrorLog::with(['tenant:id,name', 'user:id,name']);

        if ($request->boolean('resolved')) {
            $query->where('is_resolved', true);
        } else {
            $query->where('is_resolved', false);
        }

        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        $errors = $query->latest('last_seen_at')->paginate(50);

        return Inertia::render('SuperAdmin/Health/Errors', [
            'errors' => $errors,
            'filters' => $request->only(['resolved', 'type'])
        ]);
    }

    public function resolveError(\App\Models\ErrorLog $error, Request $request)
    {
        $error->update([
            'is_resolved'     => true,
            'resolution_note' => $request->get('note', 'Manually resolved.')
        ]);
        return back()->with('success', 'Error marked as resolved.');
    }

    public function resolveAllErrors(Request $request)
    {
        \App\Models\ErrorLog::where('is_resolved', false)->update([
            'is_resolved'     => true,
            'resolution_note' => $request->get('note', 'Bulk resolved by admin.')
        ]);
        return back()->with('success', 'All open errors marked as resolved.');
    }

    /**
     * Detect likely-fixed errors by comparing file modification times to last_seen_at.
     *
     * IMPORTANT — This is a HEURISTIC only. A file being modified after an error was last
     * seen does NOT guarantee the error is fixed. Always manually verify before closing
     * tickets in production. Errors auto-resolved here are marked with a clear note.
     */
    public function detectFixes()
    {
        $openErrors = \App\Models\ErrorLog::where('is_resolved', false)
            ->whereNotNull('file')
            ->get();

        $resolvedCount = 0;
        /** @var \App\Models\ErrorLog $error */
        foreach ($openErrors as $error) {
            $filePath = $error->file;

            if (file_exists($filePath)) {
                $lastModified = filemtime($filePath);
                $lastSeen     = $error->last_seen_at->timestamp;

                // Heuristic: file was touched AFTER the error was last seen → possible fix.
                if ($lastModified > $lastSeen) {
                    $error->update([
                        'is_resolved'     => true,
                        'resolution_note' => '[HEURISTIC] File was modified after the last occurrence — please verify manually before treating as confirmed-fixed.',
                    ]);
                    $resolvedCount++;
                }
            }
        }

        return back()->with('success', "Heuristic scan complete: {$resolvedCount} error(s) marked as likely-fixed based on file modification times. Please verify each one before closing.");
    }

    public function contactSubmissions(Request $request)
    {
        $query = \App\Models\ContactSubmission::query();

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $submissions = $query->latest()->paginate(30);

        return Inertia::render('SuperAdmin/Health/Contacts', [
            'submissions' => $submissions,
            'filters' => $request->only(['status'])
        ]);
    }

    public function readContact(\App\Models\ContactSubmission $contact)
    {
        $contact->markRead();
        return back()->with('success', 'Message marked as read.');
    }

    // ── VenSynQ Module Control ────────────────────────────────────────────

    /**
     * Toggle VenSynQ on/off platform-wide.
     * State is persisted in the global `settings` table (tenant_id = null)
     * so it survives deployments without touching .env files.
     */
    public function toggleVenSynQ(Request $request)
    {
        $this->gateOwner();
        $enabled = $request->boolean('enabled');

        \App\Models\Setting::withoutGlobalScopes()
            ->updateOrCreate(
                ['key' => 'vensynq_enabled', 'tenant_id' => null],
                ['value' => $enabled ? '1' : '0']
            );

        // Flush shared caches so the new state propagates immediately
        \Illuminate\Support\Facades\Cache::forget('settings:global');
        \Illuminate\Support\Facades\Cache::forget('vensynq_enabled_flag');
        \Illuminate\Support\Facades\Cache::forget('schema_db_ready');

        $status = $enabled ? 'enabled' : 'disabled';
        return back()->with('success', "VenSynQ has been {$status} platform-wide.");
    }

    public function addPartner(Request $request)
    {
        $this->gateOwner();
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'role'       => 'required|string|max:255',
            'equity_pct' => 'required|numeric|min:0|max:100',
        ]);

        $partner = \App\Models\PlatformPartner::create($validated);
        \App\Models\PlatformAuditLog::logAction('partner.created', ['name' => $partner->name]);

        return back()->with('success', 'Partner added successfully.');
    }

    public function removePartner($id)
    {
        $this->gateOwner();
        $partner = \App\Models\PlatformPartner::findOrFail($id);
        \App\Models\PlatformAuditLog::logAction('partner.removed', ['name' => $partner->name]);
        $partner->delete();

        return back()->with('success', 'Partner removed successfully.');
    }

    public function logDrawing(Request $request)
    {
        $this->gateOwner();
        $validated = $request->validate([
            'partner_id'  => 'required|exists:platform_partners,id',
            'amount'      => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
        ]);

        $validated['date'] = now();

        $drawing = \App\Models\PlatformEquityDrawing::create($validated);
        $partner = \App\Models\PlatformPartner::find($validated['partner_id']);
        $partnerName = $partner?->name ?? 'Unknown';
        \App\Models\PlatformAuditLog::logAction('partner.drawing', ['partner' => $partnerName, 'amount' => $drawing->amount]);

        return back()->with('success', 'Drawing logged successfully.');
    }

    public function clearAllDrawings(Request $request)
    {
        $this->gateOwner();
        $this->verifyActionPasscode($request);

        \App\Models\PlatformEquityDrawing::truncate();

        return back()->with('success', 'All drawings history cleared.');
    }

    public function saveSettings(Request $request)
    {
        $validated = $request->validate([
            'usd_pkr_rate'              => 'nullable|numeric|min:0',
            'gateway_fee_pct'           => 'nullable|numeric|min:0|max:100',
            'default_grace_days'        => 'nullable|integer|min:0',
            'public_signups_enabled'    => 'nullable|boolean',
            'maintenance_mode_enabled'  => 'nullable|boolean',
            'appsumo_enabled'           => 'nullable|boolean',
            'smartcapture_enabled'      => 'nullable|boolean',
            'vensynq_enabled'           => 'nullable|boolean',
            'vensynq_platform_amazon'   => 'nullable|boolean',
            'vensynq_platform_woocommerce' => 'nullable|boolean',
            'vensynq_platform_ebay'     => 'nullable|boolean',
            'vensynq_platform_tiktok'   => 'nullable|boolean',
        ]);

        foreach ($validated as $key => $val) {
            $strVal = $val === null ? '' : (string) $val;
            // For booleans, convert to '1' or '0'
            if (is_bool($val)) {
                $strVal = $val ? '1' : '0';
            }
            \App\Models\Setting::withoutGlobalScopes()
                ->updateOrCreate(
                    ['key' => $key, 'tenant_id' => null],
                    ['value' => $strVal]
                );
        }

        \App\Models\PlatformAuditLog::logAction('settings.updated', $validated);

        // Flush global settings cache
        \Illuminate\Support\Facades\Cache::forget('settings:global');
        \Illuminate\Support\Facades\Cache::forget('vensynq_enabled_flag');
        \Illuminate\Support\Facades\Cache::forget('smartcapture_enabled_flag');
        \Illuminate\Support\Facades\Cache::forget('schema_db_ready');

        return back()->with('success', 'Platform settings updated successfully.');
    }

    private function checkAppSumo()
    {
        $enabled = \App\Models\Setting::withoutGlobalScopes()
            ->where('key', 'appsumo_enabled')
            ->whereNull('tenant_id')
            ->value('value');

        if ($enabled !== '1') {
            abort(404, 'AppSumo module is disabled.');
        }
    }

    private function gateOwner()
    {
        if (!auth()->user()->isPlatformOwner()) {
            abort(403, 'Unauthorized. Hashmi Dashboard role required.');
        }
    }

    private function gateSuperAdmin()
    {
        if (!auth()->user()->isPlatformSuperAdmin()) {
            abort(403, 'Unauthorized. Platform Admin or Owner role required.');
        }
    }

    private function gateSupport()
    {
        if (!auth()->user()->isPlatformSupport()) {
            abort(403, 'Unauthorized. Platform Support role required.');
        }
    }

    private function verifyActionPasscode(Request $request)
    {
        $request->validate([
            'passcode' => 'required|string',
        ]);

        $user = auth()->user();
        $membership = \App\Models\TenantUser::where('user_id', $user->id)
            ->where('tenant_id', $user->last_store_id ?: 1)
            ->first();

        if (!$membership || !$membership->security_pin) {
            abort(403, 'Action passcode is not set. Please set it in your account security settings first.');
        }

        if (!\Illuminate\Support\Facades\Hash::check($request->passcode, $membership->security_pin)) {
            abort(403, 'Invalid action passcode.');
        }
    }
}

