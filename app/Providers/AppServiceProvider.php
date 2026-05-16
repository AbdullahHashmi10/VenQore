<?php

namespace App\Providers;

use App\Models\Sale;
use App\Observers\SaleObserver;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // 1. Fix for "Key too long" error on older MySQL/MariaDB
        \Illuminate\Support\Facades\Schema::defaultStringLength(191);

        // 2. Prevent "Ghost" Attributes (Crash on missing UUIDs etc)
        \Illuminate\Database\Eloquent\Model::preventAccessingMissingAttributes(!app()->isProduction());

        // 3. Phase 1.2 — Immutable Lock: The Deadbolt
        Sale::observe(SaleObserver::class);

        // 4. Phase 1.7: Tenant-aware Rate Limiting
        // Limits are per-tenant (not per-IP) so one bad actor can't hurt others.
        RateLimiter::for('api', function (Request $request) {
            $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : $request->ip();
            $key = app()->bound('current.tenant') ? 'tenant:' . $tenantId : 'ip:' . $tenantId;
            return Limit::perMinute(120)->by($key)->response(function () {
                return response()->json([
                    'message'     => 'Too many requests. Please slow down.',
                    'retry_after' => 60,
                ], 429);
            });
        });

        RateLimiter::for('pos', function (Request $request) {
            $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : $request->ip();
            $key = app()->bound('current.tenant') ? 'pos-tenant:' . $tenantId : 'pos-ip:' . $tenantId;
            return Limit::perMinute(300)->by($key);
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });
    }
}
