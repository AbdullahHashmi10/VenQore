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
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
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

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge(
                    $user->only(['id', 'name', 'email', 'email_verified_at', 'is_platform_admin', 'last_store_id']),
                    [
                        'role'           => $user->role,
                        'permissions'    => $user->permissions,
                        'avatar_initial' => strtoupper(substr($user->name, 0, 1))
                    ]
                ) : null,
                'notifications'              => $user ? $user->notifications()->latest()->take(5)->get() : [],
                'unread_notifications_count' => $user ? $user->unreadNotifications()->count() : 0,
                // Drives StoreSwitcher show/hide in sidebar
                'my_stores_count' => $user && Schema::hasTable('tenant_users')
                    ? \App\Models\TenantUser::where('user_id', $user->id)->where('status', 'active')->count()
                    : 0,
            ],
            'growth_engine' => [
                'count' => ($user && Schema::hasTable('ai_recommendations')) 
                    ? \App\Models\AiRecommendation::active()->where('is_read', false)->count() 
                    : 0,
                'popup' => ($user && Schema::hasTable('ai_recommendations')) 
                    ? \App\Models\AiRecommendation::active()->where('is_read', false)->where('priority', 'urgent')->latest()->first() 
                    : null,
            ],
            'terminals' => ($dbReady && Schema::hasTable('terminals'))
                ? \App\Models\Terminal::select('id', 'name', 'status', 'last_heartbeat_at', 'last_status_reason')->get()
                : [],
            'settings' => (function() use ($dbReady) {
                if (!$dbReady || !Schema::hasTable('settings')) return [];
                
                $query = \App\Models\Setting::query();
                if (app()->bound('current.tenant')) {
                    // Global scope from HasTenant handles filtering if bound
                    return $query->get()->pluck('value', 'key')->toArray();
                }
                
                // Fallback for non-tenant routes (if any global settings exist)
                return \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->pluck('value', 'key')->toArray();
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
        ];
    }

    /**
     * Check if database connection and essential tables exist.
     */
    private function isDatabaseReady(): bool
    {
        try {
            return Schema::hasTable('users');
        } catch (\Exception $e) {
            return false;
        }
    }
}
