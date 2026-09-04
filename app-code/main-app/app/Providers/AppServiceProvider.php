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
        // ── Growth Engine V2 ────────────────────────────────────────────
        // These MUST be singletons.
        //
        // ThresholdTuner memoises each tenant's insight statistics for the
        // duration of a run. If Laravel handed out a fresh instance to every
        // consumer (the repository, the four brains, the evaluator, the
        // controller), each would re-query the same rows and — worse — one
        // could act on stats another had already invalidated. GrowthDataSource
        // is stateless but shared for the same reason: one instance, one set
        // of prepared statements.
        $this->app->singleton(\App\Services\Growth\GrowthDataSource::class);
        $this->app->singleton(\App\Services\Growth\ThresholdTuner::class);
        $this->app->singleton(\App\Services\Growth\SignalRepository::class);
        $this->app->singleton(\App\Services\Growth\OutcomeEvaluator::class);
        $this->app->singleton(\App\Services\Growth\MetricSnapshotter::class);
        $this->app->singleton(\App\Services\Growth\GrowthEngine::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        if ($this->app->runningInConsole()) {
            try {
                $this->app->make('inertia.testing.view-finder')->addExtension('jsx');
                $this->app->make('inertia.testing.view-finder')->addExtension('tsx');
            } catch (\Throwable $e) {
                // Ignore if testing view-finder is not bound
            }
        }

        // 1. Fix for "Key too long" error on older MySQL/MariaDB
        \Illuminate\Support\Facades\Schema::defaultStringLength(191);

        // 2. Prevent "Ghost" Attributes (Crash on missing UUIDs etc)
        \Illuminate\Database\Eloquent\Model::preventAccessingMissingAttributes(!app()->isProduction());

        // 3. Phase 1.2 — Immutable Lock: The Deadbolt
        Sale::observe(SaleObserver::class);

        // Chatbot session state machine observer
        \App\Models\ChatSession::observe(\App\Observers\ChatSessionObserver::class);

        // 4. Phase 1.7: Tenant-aware Rate Limiting
        // Limits are per-tenant (not per-IP) so one bad actor can't hurt others.
        RateLimiter::for('api', function (Request $request) {
            $tenantId = app()->bound('current.tenant')
                ? app('current.tenant')->id
                : ($request->user()?->current_store_id ?? $request->user()?->id ?? $request->ip());
            $key = 'api:' . $tenantId;
            return Limit::perMinute(300)->by($key)->response(function () {
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

        // 4b. Free Tools program (SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md §4.2)
        // Public, unauthenticated, IP-keyed — these are NOT tenant-scoped routes.
        RateLimiter::for('tools', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        RateLimiter::for('tool-leads', function (Request $request) {
            return [
                Limit::perHour(5)->by($request->ip()),
                Limit::perDay(3)->by('tool-lead-email:' . strtolower((string) $request->input('email'))),
            ];
        });

        // 5. Phase 19: Unbound Broadcaster Async Context Failures Fix
        // Automatically inject current.tenant context into queued jobs, and re-bind it on queue worker run
        \Illuminate\Support\Facades\Queue::createPayloadUsing(function ($connection, $queue, $payload) {
            return app()->bound('current.tenant') 
                ? ['tenant_id' => app('current.tenant')->id] 
                : [];
        });

        \Illuminate\Support\Facades\Queue::before(function (\Illuminate\Queue\Events\JobProcessing $event) {
            $payload = $event->job->payload();
            if (isset($payload['tenant_id'])) {
                $tenant = \App\Models\Tenant::find($payload['tenant_id']);
                if ($tenant) {
                    app()->instance('current.tenant', $tenant);
                }
            }
        });
    }
}
