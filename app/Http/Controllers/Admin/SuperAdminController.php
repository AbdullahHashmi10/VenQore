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
    public function dashboard()
    {
        $stats          = $this->buildStats();
        $storeTrend     = $this->buildStoreTrend();
        $planDist       = $this->buildPlanDistribution();
        $recentStores   = $this->buildRecentStores(10);
        $expiringStores = $this->buildExpiringStores();
        $activityFeed   = $this->buildActivityFeed();
        $platformUsers  = $this->buildPlatformUsers();

        // V1 Support Inbox — open tickets only for default view
        $tickets     = [];
        $openCount   = 0;
        $totalTickets = 0;
        try {
            $tickets = \App\Models\SupportTicket::with(['tenant:id,name', 'submittedBy:id,name,email'])
                ->whereIn('status', ['open', 'in_progress'])
                ->orderByRaw("FIELD(priority, 'urgent','high','normal','low')")
                ->orderBy('created_at', 'desc')
                ->take(50)->get();
            $openCount    = \App\Models\SupportTicket::whereIn('status', ['open', 'in_progress'])->count();
            $totalTickets = \App\Models\SupportTicket::count();
        } catch (\Throwable) {}

        // Webhook log
        $webhooks = [];
        try {
            $webhooks = \App\Models\WebhookLog::latest()->take(100)->get()->map(fn($w) => [
                'id'         => $w->id,
                'event_type' => $w->event_type,
                'status'     => $w->status,
                'store_name' => $w->store_name,
                'plan'       => $w->plan,
                'created_at' => $w->created_at->toIso8601String(),
            ]);
        } catch (\Throwable) {}

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats'             => $stats,
            'store_trend'       => $storeTrend,
            'plan_distribution' => $planDist,
            'recent_stores'     => $recentStores,
            'expiring_stores'   => $expiringStores,
            'activity_feed'     => $activityFeed,
            'platform_users'    => $platformUsers,
            'tickets'           => $tickets,
            'tickets_total'     => $totalTickets,
            'open_count'        => $openCount,
            'active_filter'     => 'open',
            'webhooks'          => $webhooks,
        ]);
    }

    // ─── Data Builders ──────────────────────────────────────────────────────

    private function buildStats(): array
    {
        $total       = Tenant::withTrashed()->count();
        $active      = Tenant::where('status', 'active')->count();
        $trial       = Tenant::where('status', 'trial')->whereDate('trial_ends_at', '>=', now())->count();
        $suspended   = Tenant::where('status', 'suspended')->count();
        $churned     = Tenant::where('status', 'cancelled')->count();
        $trashed     = Tenant::onlyTrashed()->count();
        $newToday    = Tenant::whereDate('created_at', today())->count();
        $newThisMonth = Tenant::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count();
        $cancelledLast30 = Tenant::where('status', 'cancelled')
            ->where('updated_at', '>=', now()->subDays(30))->count();

        $expiringSoon = Tenant::where('status', 'trial')
            ->whereDate('trial_ends_at', '<=', now()->addDays(7))
            ->whereDate('trial_ends_at', '>=', now())
            ->count();

        $totalUsers = User::count();
        $deletedUsers = User::onlyTrashed()->count();
        $platformAdmins = User::where('is_platform_admin', true)->count();
        $storeUsers = TenantUser::distinct('user_id')->count('user_id');

        $totalDeletedStores = Tenant::onlyTrashed()->count();

        // Conversion rate: active / (active + churned in last 30 days) * 100
        $conversionBase = $active + $cancelledLast30;
        $conversionRate = $conversionBase > 0 ? round(($active / $conversionBase) * 100, 1) : 0;

        // MRR estimation based on plan counts
        $planPrices = ['starter' => 19, 'growth' => 39, 'business' => 79, 'ltd' => 0];
        $mrr = 0;
        foreach ($planPrices as $plan => $price) {
            $count = Tenant::where('status', 'active')->where('plan', $plan)->count();
            $mrr += $count * $price;
        }
        $arr = $mrr * 12;

        return [
            'total_stores'      => $total,
            'active_stores'     => $active,
            'trial_stores'      => $trial,
            'suspended_stores'  => $suspended,
            'churned_stores'    => $churned,
            'trashed_stores'    => $trashed,
            'new_today'         => $newToday,
            'new_this_month'    => $newThisMonth,
            'cancelled_last_30' => $cancelledLast30,
            'expiring_soon'     => $expiringSoon,
            'conversion_rate'   => $conversionRate,
            'total_users'       => $totalUsers,
            'deleted_users'     => $deletedUsers,
            'total_deleted_stores' => $totalDeletedStores,
            'platform_admins'   => $platformAdmins,
            'store_users'       => $storeUsers,
            'mrr'               => $mrr,
            'arr'               => $arr,
        ];
    }

    private function buildStoreTrend(): array
    {
        return collect(range(5, 0))->map(function ($i) {
            $date = now()->subMonths($i);
            $count = Tenant::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            return ['month' => $date->format('M'), 'stores' => $count];
        })->values()->toArray();
    }

    private function buildPlanDistribution(): array
    {
        $planPrices = ['starter' => 19, 'growth' => 39, 'business' => 79, 'ltd' => 0];
        $plans = ['trial', 'starter', 'growth', 'business', 'ltd'];

        return collect($plans)->map(function ($plan) use ($planPrices) {
            $count = Tenant::where('plan', $plan)->count();
            $activePaid = Tenant::where('plan', $plan)->where('status', 'active')->count();
            $mrr = $activePaid * ($planPrices[$plan] ?? 0);
            return ['plan' => $plan, 'count' => $count, 'mrr' => $mrr];
        })->filter(fn($p) => $p['count'] > 0)->values()->toArray();
    }

    private function buildRecentStores(int $limit = 10): array
    {
        return Tenant::withTrashed()
            ->latest()
            ->take($limit)
            ->get()
            ->map(function (Tenant $t) {
                $owner = $t->ownerMembership()->with('user')->first();
                $staffCount = $t->memberships()->count();
                $daysLeft = null;
                if ($t->status === 'trial' && $t->trial_ends_at) {
                    $daysLeft = max(0, now()->diffInDays($t->trial_ends_at, false));
                }
                return [
                    'id'            => $t->id,
                    'name'          => $t->name ?? '(Unnamed Store)',
                    'slug'          => $t->slug ?? 'store-' . $t->id,
                    'plan'          => $t->plan ?? 'trial',
                    'status'        => $t->trashed() ? 'deleted' : ($t->status ?? 'trial'),
                    'owner_email'   => $owner?->user?->email ?? '—',
                    'owner_name'    => $owner?->user?->name ?? '—',
                    'owner_user_id' => $owner?->user_id,          // ← for Impersonate button
                    'plan_limits'   => $t->plan_limits ?? [],     // ← for Feature Flag toggles
                    'staff_count'   => $staffCount,
                    'setup_done'    => (bool) $t->setup_completed,
                    'trial_ends_at' => $t->trial_ends_at?->toDateString(),
                    'days_left'     => $daysLeft,
                    'created_at'    => $t->created_at->diffForHumans(),
                    'country'       => $t->country_code ?? '—',
                    'industry'      => $t->industry ?? '—',
                ];
            })->toArray();
    }

    private function buildExpiringStores(): array
    {
        return Tenant::where('status', 'trial')
            ->whereNotNull('trial_ends_at')
            ->whereDate('trial_ends_at', '>=', now())
            ->whereDate('trial_ends_at', '<=', now()->addDays(7))
            ->orderBy('trial_ends_at')
            ->get()
            ->map(function (Tenant $t) {
                $owner = $t->ownerMembership()->with('user')->first();
                $daysLeft = max(0, now()->diffInDays($t->trial_ends_at, false));
                return [
                    'id'          => $t->id,
                    'name'        => $t->name ?? '(Unnamed)',
                    'owner_email' => $owner?->user?->email ?? '—',
                    'plan'        => $t->plan ?? 'trial',
                    'days_left'   => $daysLeft,
                    'trial_ends'  => $t->trial_ends_at->toDateString(),
                ];
            })->toArray();
    }

    private function buildActivityFeed(): array
    {
        $feed = [];

        // New store signups
        $newStores = Tenant::latest()->take(5)->get()->map(fn($t) => [
            'type'    => 'new_store',
            'icon'    => 'building',
            'message' => '🏪 New store registered: ' . ($t->name ?? 'Unnamed'),
            'sub'     => $t->plan . ' plan · ' . $t->created_at->diffForHumans(),
            'time'    => $t->created_at->timestamp,
            'color'   => 'indigo',
        ]);

        // Suspended stores
        $suspended = Tenant::where('status', 'suspended')->latest('updated_at')->take(3)->get()->map(fn($t) => [
            'type'    => 'suspended',
            'icon'    => 'alert',
            'message' => '⚠️ Store suspended: ' . ($t->name ?? 'Unnamed'),
            'sub'     => 'Suspended ' . $t->updated_at->diffForHumans(),
            'time'    => $t->updated_at->timestamp,
            'color'   => 'amber',
        ]);

        // Expiring trials
        $expiring = Tenant::where('status', 'trial')
            ->whereDate('trial_ends_at', '<=', now()->addDays(3))
            ->whereDate('trial_ends_at', '>=', now())
            ->take(3)->get()->map(fn($t) => [
                'type'    => 'trial_expiring',
                'icon'    => 'clock',
                'message' => '⏰ Trial expiring: ' . ($t->name ?? 'Unnamed'),
                'sub'     => 'Expires ' . $t->trial_ends_at->toDateString(),
                'time'    => $t->trial_ends_at->timestamp,
                'color'   => 'red',
            ]);

        $feed = collect($newStores)->merge($suspended)->merge($expiring)
            ->sortByDesc('time')
            ->take(15)
            ->values()
            ->toArray();

        return $feed;
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
        $query = Tenant::query();
        
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
        $query = User::query();

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
        $tenant->forceDelete();
        return back()->with('success', "Store '{$name}' has been PERMANENTLY deleted.");
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
        $user->forceDelete();
        return back()->with('success', "User '{$name}' has been PERMANENTLY deleted.");
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
}
