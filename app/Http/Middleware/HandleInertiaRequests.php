<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     *
     * Returning null in local development disables Inertia's version-mismatch
     * detection (409 Conflict), which would otherwise cause a silent full-page
     * reload on every form submission after an `npm run build`.
     * In production this is re-enabled so browsers pick up new deploys correctly.
     */
    public function version(Request $request): ?string
    {
        return null;
    }


    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Skip heavy DB queries for installer/updater API routes
        if ($request->is('api/installer/*') || $request->is('api/updater/*')) {
            return [
                ...parent::share($request),
                'auth' => ['user' => null, 'notifications' => [], 'unread_notifications_count' => 0],
                'growth_engine' => ['count' => 0, 'popup' => null],
                'terminals' => [],
                'settings' => [],
                'flash' => ['success' => null, 'error' => null],
            ];
        }

        // Check if database is properly set up to prevent crashes
        $dbReady = $this->isDatabaseReady();
        $user = $dbReady ? $request->user() : null;

        $shared = [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge(
                    $user->only(['id', 'name', 'email', 'email_verified_at', 'is_platform_admin', 'last_store_id']),
                    [
                        'role'              => $user->role,
                        'permissions'       => $user->permissions,
                        'avatar_initial'    => strtoupper(substr($user->name, 0, 1)),
                        'is_platform_staff' => $user->isPlatformStaff(),
                        'staff_role'        => $user->staff_role,
                        // PIN status flags for the Profile settings page
                        // pos_pin (quick-login) and security_pin live on tenant_users, not users
                        'has_passcode'      => !empty($user->passcode),
                        'security_pin'      => !empty($user->security_pin) ? '****' : null,
                        // Google Auth flags — used by DangerSettingsSection to determine
                        // whether to ask for password or email address for confirmation.
                        'google_id'         => !empty($user->google_id),
                        'has_password'      => !empty($user->password),
                    ]
                ) : null,
                'notifications' => $user ? \Illuminate\Support\Facades\Cache::remember("user_notifications:{$user->id}", 15, function () use ($user) {
                    return $user->notifications()->latest()->take(5)->get();
                }) : [],
                'unread_notifications_count' => $user ? \Illuminate\Support\Facades\Cache::remember("user_unread_notifications_count:{$user->id}", 15, function () use ($user) {
                    return $user->unreadNotifications()->count();
                }) : 0,
                // Drives StoreSwitcher show/hide in sidebar
                'my_stores_count' => $user && $this->hasTable('tenant_users')
                    ? \Illuminate\Support\Facades\Cache::remember("user_stores_count:{$user->id}", 300, function () use ($user) {
                        return \App\Models\TenantUser::where('user_id', $user->id)->where('status', 'active')->count();
                    })
                    : 0,
            ],
            'growth_engine' => [
                'count' => ($user && $this->hasTable('ai_recommendations')) 
                    ? \Illuminate\Support\Facades\Cache::remember("ai_recommendations_count:{$user->id}", 60, function () use ($user) {
                        return \App\Models\AiRecommendation::active()->where('is_read', false)->count();
                    }) 
                    : 0,
                'popup' => ($user && $this->hasTable('ai_recommendations')) 
                    ? \Illuminate\Support\Facades\Cache::remember("ai_recommendations_popup:{$user->id}", 60, function () use ($user) {
                        return \App\Models\AiRecommendation::active()->where('is_read', false)->where('priority', 'urgent')->latest()->first();
                    }) 
                    : null,
            ],
            'terminals' => (function() use ($dbReady) {
                if (!$dbReady || !$this->hasTable('terminals')) return [];
                
                $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : 'global';
                return \Illuminate\Support\Facades\Cache::remember("terminals_shared_list:{$tenantId}", 15, function () {
                    return \App\Models\Terminal::select('id', 'name', 'status', 'last_heartbeat_at', 'last_status_reason')->get();
                });
            })(),
            'settings' => (function() use ($dbReady) {
                if (!$dbReady || !$this->hasTable('settings')) return [];
                
                if (app()->bound('current.tenant')) {
                    return \App\Helpers\SettingsHelper::all();
                }
                
                return \Illuminate\Support\Facades\Cache::remember('settings:global', 300, function () {
                    return \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->pluck('value', 'key')->toArray();
                });
            })(),
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error'   => fn() => $request->session()->get('error'),
                'info'    => fn() => $request->session()->get('info'),
                'plan_limit' => fn() => $request->session()->get('plan_limit'),
            ],
            // ── Layer 3: Impersonation Banner ─────────────────────────────
            // Read-only flag injected into every page so the UI can show a warning.
            'impersonation' => (function () use ($request, $user) {
                $impersonatingId = $request->session()->get('impersonating_user_id');
                if (!$impersonatingId || !$user) return null;
                return [
                    'active'          => true,
                    'impersonator_id' => $request->session()->get('impersonator_id'),
                    'target_name'     => $user->name,
                    'target_email'    => $user->email,
                    'exit_url'        => route('platform.impersonate.end'),
                ];
            })(),
            'store' => app()->bound('current.tenant') ? app('current.tenant') : null,
            'vensynq_enabled' => (function () use ($dbReady) {
                // Priority: DB global setting (set via Platform HQ toggle) > .env config
                if ($dbReady && $this->hasTable('settings')) {
                    $dbValue = \Illuminate\Support\Facades\Cache::remember('vensynq_enabled_flag', 60, function () {
                        return \App\Models\Setting::withoutGlobalScopes()
                            ->whereNull('tenant_id')
                            ->where('key', 'vensynq_enabled')
                            ->value('value');
                    });
                    if ($dbValue !== null) {
                        return (bool) $dbValue;
                    }
                }
                return (bool) config('vensynq.enabled', false);
            })(),
            'woocommerce_enabled' => (function () use ($dbReady) {
                if (!$dbReady || !app()->bound('current.tenant')) return false;
                return \App\Services\PlanGate::check('woocommerce');
            })(),
            'cookbook_enabled' => (function () use ($dbReady) {
                if (!$dbReady || !app()->bound('current.tenant')) return false;
                return \App\Services\PlanGate::check('bill_of_materials');
            })(),
            'report_tiers' => \App\Services\ReportTierGate::allTiers(),
            'allowed_reports' => \App\Services\ReportTierGate::allowedKeys(),
        ];

        return $shared;
    }

    /**
     * Check if database connection and essential tables exist.
     */
    private function isDatabaseReady(): bool
    {
        return \Illuminate\Support\Facades\Cache::remember('schema_db_ready', 60, function () {
            try {
                return Schema::hasTable('users');
            } catch (\Exception $e) {
                return false;
            }
        });
    }

    /**
     * Cache table existence check to avoid metadata DB hits on every request.
     */
    private function hasTable(string $table): bool
    {
        return \Illuminate\Support\Facades\Cache::remember("schema_table_exists:{$table}", 3600, function () use ($table) {
            try {
                return Schema::hasTable($table);
            } catch (\Exception $e) {
                return false;
            }
        });
    }
}
