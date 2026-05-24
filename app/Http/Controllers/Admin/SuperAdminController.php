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
        $realTenants = $tenants->where('is_demo', false);

        // MRR
        $planPrices = ['starter' => 19, 'growth' => 39, 'business' => 79, 'ltd' => 0];
        $mrr = $realTenants->where('status', 'active')->sum(fn($t) => $planPrices[$t->plan] ?? 0);

        // Volume (Real-only)
        $volQuery = DB::table('sales')
            ->join('tenants', 'sales.tenant_id', '=', 'tenants.id')
            ->where('tenants.is_demo', false)
            ->whereNull('sales.deleted_at');
        if ($dateLimit) $volQuery->where('sales.created_at', '>=', $dateLimit);
        $totalVolume = (float)$volQuery->sum('sales.total');

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

        // Plan Distribution
        $planDist = collect(['trial', 'starter', 'growth', 'business', 'ltd'])->map(function ($plan) use ($realTenants, $planPrices) {
            $group = $realTenants->where('plan', $plan);
            return [
                'plan'  => $plan,
                'count' => $group->count(),
                'mrr'   => $group->where('status', 'active')->sum(fn($t) => $planPrices[$plan] ?? 0),
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
            'arr'               => $mrr * 12,
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

                'total_overrides'  => \App\Models\TenantPlanOverride::count(),
                'active_overrides' => \App\Models\TenantPlanOverride::where(function($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })->count(),
                'expired_overrides' => \App\Models\TenantPlanOverride::where('expires_at', '<=', now())->count(),
            ],
        ];

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats'             => $stats,
            'store_trend'       => $storeTrend->values(),
            'plan_distribution' => $planDist,
            'recent_stores'     => $recentStores,
            'expiring_stores'   => $expiringStores,
            'activity_feed'     => $this->buildActivityFeed(),
            'platform_users'    => $this->buildPlatformUsers(),
            'tickets'           => \App\Models\SupportTicket::whereIn('status', ['open', 'in_progress'])->take(10)->get(),
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

        return collect($newStores)->merge($suspended)
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
                'role'       => 'Platform Owner',
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

    public function purgeStore($id)
    {
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

    public function purgeUser($id)
    {
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
        $tenant->update(['status' => 'suspended']);
        return back()->with('success', "Store '{$tenant->name}' has been suspended.");
    }

    public function activate(Tenant $tenant)
    {
        $tenant->update(['status' => 'active']);
        return back()->with('success', "Store '{$tenant->name}' has been activated.");
    }

    public function extendTrial(Request $request, Tenant $tenant)
    {
        $days = $request->integer('days', 7);
        $tenant->update([
            'status'        => 'trial',
            'trial_ends_at' => $tenant->trial_ends_at
                ? $tenant->trial_ends_at->addDays($days)
                : now()->addDays($days),
        ]);
        return back()->with('success', "Trial extended by {$days} days for '{$tenant->name}'.");
    }

    public function appsumoCodes(Request $request)
    {
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

    public function detectFixes()
    {
        $openErrors = \App\Models\ErrorLog::where('is_resolved', false)
            ->whereNotNull('file')
            ->get();

        $resolvedCount = 0;
        /** @var \App\Models\ErrorLog $error */
        foreach ($openErrors as $error) {
            // Adjust paths: If the error has an absolute path we use it. 
            // Often frontend errors just have filenames, so we may need to skip or map them.
            // But backend errors usually have full paths.
            $filePath = $error->file;

            if (file_exists($filePath)) {
                $lastModified = filemtime($filePath);
                $lastSeen     = $error->last_seen_at->timestamp;

                // If file was modified AFTER the error was last seen, it's a fixed candidate.
                if ($lastModified > $lastSeen) {
                    $error->update([
                        'is_resolved'     => true,
                        'resolution_note' => 'Automatically resolved: File modification detected after last occurrence.'
                    ]);
                    $resolvedCount++;
                }
            }
        }

        return back()->with('success', "Scanning complete. {$resolvedCount} errors were auto-detected as fixed based on recent code changes.");
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
}

