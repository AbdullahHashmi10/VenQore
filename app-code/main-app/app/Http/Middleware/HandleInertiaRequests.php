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
        if (! app()->environment('production')) {
            return null;
        }

        if (file_exists($manifest = public_path('build/manifest.json'))) {
            return md5_file($manifest);
        }

        return parent::version($request);
    }


    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Scope Inertia SSR: enable SSR ONLY for public marketing routes, keep tenant app 100% client-side SPA
        $isMarketingRoute = $request->routeIs('welcome', 'marketing.*', 'blog.*', 'demo.*', 'terms', 'privacy', 'refund-policy', 'register')
            || $request->is('/', 'features', 'features/*', 'pricing', 'about', 'contact', 'roadmap', 'solutions', 'solutions/*', 'compare', 'compare/*', 'blog', 'blog/*', 'demo', 'terms', 'privacy', 'refund-policy', 'register', 'subscribe', 'vensynq', 'smartcapture', 'digital-products', 'partners', 'partners/*', 'docs', 'docs/*');

        config(['inertia.ssr.enabled' => $isMarketingRoute]);

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
            'ziggy' => fn () => [
                ...(new \Tighten\Ziggy\Ziggy)->toArray(),
                'location' => $request->url(),
            ],
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
                    // SEC-1 (2026-07-03): the admin passcode (bcrypt hash) is server-side only.
                    $all = \App\Helpers\SettingsHelper::all();
                    unset($all['admin_passcode']);
                    return $all;
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
            // ── Presentation preferences (New Experience, 2026-08-08) ─────────
            // Shared on every page rather than fetched by the pages that need it:
            // the theme has to be correct on the POS terminal and the trial
            // balance too, and a prop that is only present on some screens would
            // make the app change appearance as you navigate. Resolution is a
            // single indexed lookup and falls back to defaults on any failure —
            // see App\Support\Appearance.
            'appearance' => fn () => \App\Support\Appearance::forRequest(),
            'store' => app()->bound('current.tenant') ? app('current.tenant') : null,
            'plan' => (function () {
                $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
                if (!$tenant) return null;
                return [
                    'slug'     => $tenant->plan,
                    'features' => \App\Services\PlanRepository::featuresFor($tenant),
                    'limits'   => \App\Services\PlanRepository::limitsFor($tenant),
                    'usage'    => [
                        'skus'      => \Illuminate\Support\Facades\Cache::remember("tenant_usage_skus:{$tenant->id}", 60, fn() => \App\Models\Product::where('tenant_id', $tenant->id)->count()),
                        'staff'     => \Illuminate\Support\Facades\Cache::remember("tenant_usage_staff:{$tenant->id}", 60, fn() => \App\Models\TenantUser::where('tenant_id', $tenant->id)->count()),
                        'locations' => \Illuminate\Support\Facades\Cache::remember("tenant_usage_locations:{$tenant->id}", 60, fn() => \App\Models\Warehouse::where('tenant_id', $tenant->id)->count()),
                        'ai_pages'  => $tenant->ai_pages_used ?? 0,
                    ],
                ];
            })(),
            'smartcapture_enabled' => (function () use ($dbReady) {
                if ($dbReady && $this->hasTable('settings')) {
                    $dbValue = \Illuminate\Support\Facades\Cache::remember('smartcapture_enabled_flag', 60, function () {
                        return \App\Models\Setting::withoutGlobalScopes()
                            ->whereNull('tenant_id')
                            ->where('key', 'smartcapture_enabled')
                            ->value('value');
                    });
                    if ($dbValue !== null) {
                        return (bool) $dbValue;
                    }
                }
                return (bool) config('smartcapture.enabled', true);
            })(),
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
            'pricing' => config('pricing'),
            'turnstile_site_key' => config('services.cloudflare.turnstile_site_key', ''),
            'terms' => (function () use ($dbReady) {
                if (!$dbReady || !$this->hasTable('tenant_terminology')) return [];
                try {
                    $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
                    $tenantId = $tenant?->id ?? null;
                    return $tenantId ? \App\Support\Terms::forTenant($tenantId) : [];
                } catch (\Throwable) {
                    return [];
                }
            })(),
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
