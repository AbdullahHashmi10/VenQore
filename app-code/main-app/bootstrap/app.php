<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        channels: __DIR__.'/../routes/channels.php',
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Canonical host (www → apex 301) + HSTS header — must run before everything
        // else so a www.venqore.com request redirects immediately (2026-07-05 SEO fix).
        $middleware->prepend(\App\Http\Middleware\CanonicalHostMiddleware::class);

        // Run our flawless custom updater lock on ALL requests first
        $middleware->append(\App\Http\Middleware\PreventAccessDuringUpdate::class);

        $middleware->web(append: [
            \App\Http\Middleware\DatabaseHealthCheck::class,
            \App\Http\Middleware\ConfigureSystem::class,
            \App\Http\Middleware\PlatformInactivityMiddleware::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\GeoPricingMiddleware::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\DemoBannerMiddleware::class,
            \App\Http\Middleware\LastModifiedMiddleware::class,
            \App\Http\Middleware\PreventAuthenticatedPageCaching::class,
        ]);

        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        $middleware->alias([
            'permission'              => \App\Http\Middleware\CheckPermissions::class,
            'tenant'                  => \App\Http\Middleware\TenantMiddleware::class,
            'lifecycle'               => \App\Http\Middleware\SubscriptionLifecycleMiddleware::class,
            'superadmin'              => \App\Http\Middleware\SuperAdminMiddleware::class,
            'lemon-squeezy.signature' => \App\Http\Middleware\VerifyLemonSqueezySignature::class,
            'drm'                     => \App\Http\Middleware\DrmOfflineLockMiddleware::class,
            'drm.license'             => \App\Http\Middleware\DrmLockMiddleware::class,
            'visitor.chat.guard'      => \App\Http\Middleware\VisitorChatGuard::class,
            'plan.feature'            => \App\Http\Middleware\EnsurePlanFeature::class,
        ]);

        // ── Phase 1.7: Tenant-aware Rate Limiting ──────────────────────────
        // Limits are per-tenant (not per-IP) so one bad actor can't hurt others.
        // Definitions moved to AppServiceProvider.php to avoid early facade calls.
        // $middleware->throttleWithRedis(); // Disabled: No Redis on local XAMPP

        $middleware->validateCsrfTokens(except: [
            'installer',
            'installer/*',
            'api/installer/*',  // Essential for the DB test and Run steps
            'api/updater/*',    // Large ZIP upload can lose CSRF token — auth middleware protects these
            'api/webhooks/*',   // Phase 2.1: Lemon Squeezy webhooks — server-to-server, no browser session
            'refresh-csrf',
            'api/report-error', // Frontend error reporter fires after session-destroying 500s — no valid CSRF token available
        ]);

        // Allow updater/installer API to work even when app is in maintenance mode
        // Without this, the extract step's maintenance mode blocks subsequent steps (migrate, cache, version)
        $middleware->preventRequestsDuringMaintenance(except: [
            'updater',
            'api/updater/*',
            'installer',
            'api/installer/*',
            'attendance/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {


        // ── Auto-log all backend exceptions to error_logs table ──────────────
        $exceptions->report(function (\Throwable $e) {
            // Skip: validation errors, auth redirects, and 404s (not real bugs)
            if ($e instanceof \Illuminate\Validation\ValidationException) return;
            if ($e instanceof \Illuminate\Auth\AuthenticationException) return;
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) return;
            if ($e instanceof \Illuminate\Session\TokenMismatchException) return;
            if (method_exists($e, 'getStatusCode') && $e->getStatusCode() === 419) return;

            try {
                $request = request();
                \App\Models\ErrorLog::record([
                    'type'        => 'backend',
                    'message'     => substr($e->getMessage(), 0, 1000),
                    'url'         => $request ? substr($request->fullUrl(), 0, 500) : null,
                    'method'      => $request?->method(),
                    'stack_trace' => substr($e->getTraceAsString(), 0, 5000),
                    'file'        => substr($e->getFile(), 0, 500),
                    'line'        => $e->getLine(),
                    'status_code' => method_exists($e, 'getStatusCode') ? (string)$e->getStatusCode() : '500',
                    'tenant_id'   => app()->bound('current.tenant') ? app('current.tenant')->id : null,
                    'user_id'     => auth()->id(),
                    'user_agent'  => $request ? substr($request->userAgent() ?? '', 0, 500) : null,
                    'ip_address'  => $request?->ip(),
                ]);
            } catch (\Throwable) {
                // Never let the logger crash the app
            }

            // CRITICAL FIX: In Laravel 11, a custom report closure MUST return false
            // if you want the exception to STILL be logged to the default logger (laravel.log).
            // Without this, Laravel assumes this closure completely handled the reporting.
            return false;
        });

        // ── L020 / L040: Error monitoring / APM (Sentry) ─────────────────────
        // The sentry/sentry-laravel package (added to composer.json) auto-registers
        // its own exception reporter, so we do NOT capture exceptions manually here
        // (that would double-report). Instead we enrich Sentry's scope with tenant
        // and user context so captured events are diagnosable without reproduction.
        // Entirely inert until SENTRY_LARAVEL_DSN is set and the package installed.
        // The same Sentry project is the intended sink for the reconciliation/
        // backup/cron failure alerts wired in routes/console.php (L007/L019/L021).
        $exceptions->report(function (\Throwable $e) {
            if (!config('sentry.dsn') || !app()->bound('sentry')) {
                return; // APM not configured/installed — no-op.
            }
            try {
                \Sentry\configureScope(function (\Sentry\State\Scope $scope): void {
                    if (app()->bound('current.tenant')) {
                        $scope->setTag('tenant_id', (string) app('current.tenant')->id);
                    }
                    if ($uid = auth()->id()) {
                        $scope->setUser(['id' => (string) $uid]);
                    }
                });
            } catch (\Throwable) {
                // Monitoring must never crash the app.
            }
        });

        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            // Skip: validation errors, auth redirects, and custom HTTP responses
            // This ensures standard Laravel/Inertia forms display validation errors gracefully
            if ($e instanceof \Illuminate\Validation\ValidationException) return null;
            if ($e instanceof \Illuminate\Auth\AuthenticationException) return null;
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) return null;

            // CSRF Token Mismatch - cleanly reload the page and display error message
            $isCsrfMismatch = $e instanceof \Illuminate\Session\TokenMismatchException || 
                (method_exists($e, 'getStatusCode') && $e->getStatusCode() === 419);

            if ($isCsrfMismatch) {
                \Illuminate\Support\Facades\Log::warning("CSRF Token Mismatch Detected", [
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                    'session_id' => $request->hasSession() ? $request->session()->getId() : 'no_session',
                    'is_inertia' => $request->header('X-Inertia') ? 'yes' : 'no'
                ]);
                if ($request->header('X-Inertia')) {
                    if ($request->hasSession()) {
                        // Issue a fresh CSRF token before sending the browser back.
                        // Without this the reloaded page is handed the same dead
                        // token it just failed with, re-POSTs, fails again, and
                        // the user rides the loop down to /error/500.
                        $request->session()->regenerateToken();
                        $request->session()->reflash();
                        $request->session()->flash('error', 'Your session has expired. Please try again.');
                    }

                    // `fullUrl()` is the URL that was just POSTed to. Sending the
                    // browser there turns a failed POST into a GET of an endpoint
                    // that only answers POST — a 405, or on this codebase another
                    // trip through the error page. Redirect to the page the user
                    // was actually looking at instead.
                    $target = $request->headers->get('referer')
                        ?: ($request->isMethod('GET') ? $request->fullUrl() : url('/'));

                    return \Inertia\Inertia::location($target);
                }
                return redirect()->back()->withInput()->with('error', 'Your session has expired. Please try again.');
            }

            // INSTALLER/UPDATER API: Always return the REAL error as JSON

            // This overrides Laravel's default "Server Error" page in production
            if ($request->is('api/installer/*') || $request->is('api/updater/*')) {
                return response()->json([
                    'error' => $e->getMessage(),
                    'file' => basename($e->getFile()) . ':' . $e->getLine(),
                    'trace' => collect($e->getTrace())->take(3)->map(fn($t) => 
                        ($t['file'] ?? '?') . ':' . ($t['line'] ?? '?') . ' ' . ($t['function'] ?? '')
                    )->toArray(),
                ], 500);
            }

            // ── Inertia requests: never return a plain HTML 500 page ─────────────
            // When an Inertia XHR gets back HTML instead of JSON, the client-side
            // router calls resolveComponent(null) → "Cannot read properties of null"
            // and the entire SPA crashes with a white screen.
            // Instead: redirect the Inertia client to a safe error page so React
            // stays mounted and the user sees a friendly message with a retry button.
            if ($request->header('X-Inertia')) {
                $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                // CRITICAL: Let Inertia handle its own 409 Conflict (version mismatch) natively.
                // This triggers a silent browser refresh to load the latest build assets,
                // instead of showing a scary 500 error screen after a new deploy.
                if ($statusCode === 409) {
                    return null;
                }

                // ── Local development: show the error, do not hide it ─────────
                //
                // Redirecting to /error/500 replaces the exception with a
                // friendly page, and because that redirect is signalled to the
                // Inertia client as a 409, the browser console reports
                // "409 Conflict" for what is really a 500. Combined with
                // ErrorLog::record() deduplicating by fingerprint — so a
                // repeating fault stops producing new log lines after the first
                // — a genuine server error can look like an Inertia versioning
                // problem and leave no trace anywhere obvious.
                //
                // In local/dev the real message goes back as JSON instead. The
                // production path below is unchanged.
                if (! app()->environment('production')) {
                    return response()->json([
                        'message' => $e->getMessage(),
                        'exception' => get_class($e),
                        'file' => $e->getFile() . ':' . $e->getLine(),
                        'trace' => collect($e->getTrace())->take(8)->map(
                            fn ($f) => ($f['file'] ?? '?') . ':' . ($f['line'] ?? '?') . ' ' . ($f['function'] ?? '')
                        )->toArray(),
                    ], $statusCode === 200 ? 500 : $statusCode);
                }

                // Use Inertia::location() for a full redirect so the page reloads cleanly
                return \Inertia\Inertia::location(route('error.page', ['code' => $statusCode]));
            }

            // Other API/AJAX requests: let Laravel's default handler deal with it
            if ($request->expectsJson() || $request->is('api/*')) {
                return null;
            }

            // Catch Missing App Key - Critical Setup Error
            if ($e instanceof \Illuminate\Encryption\MissingAppKeyException) {
                $envPath = base_path('.env');
                if (!file_exists($envPath) && file_exists(base_path('.env.example'))) {
                    copy(base_path('.env.example'), $envPath);
                }
                
                if (file_exists($envPath)) {
                    $key = 'base64:' . base64_encode(\Illuminate\Support\Str::random(32));
                    $envContent = file_get_contents($envPath);
                    if (preg_match('/^APP_KEY=/m', $envContent)) {
                        $envContent = preg_replace('/^APP_KEY=.*$/m', 'APP_KEY=' . $key, $envContent);
                    } else {
                        $envContent .= "\nAPP_KEY=" . $key . "\n";
                    }
                    file_put_contents($envPath, $envContent);
                    
                    // Clear config cache just in case
                    if (file_exists(base_path('bootstrap/cache/config.php'))) {
                        @unlink(base_path('bootstrap/cache/config.php'));
                    }
                    
                    return redirect(request()->getRequestUri());
                }

                return response(
                    "<html><body style='font-family:sans-serif;padding:2rem;text-align:center;background:#0f172a;color:#f8fafc;'>" .
                    "<h2 style='color:#ef4444;'>CRITICAL PERMISSION ERROR</h2>" .
                    "<p>VenQore cannot initialize because it does not have write permissions to create the <b>.env</b> file.</p>" .
                    "<p>Please change the permissions on your main application directory to <b>775</b> or <b>777</b> (or CHOWN to the web user).</p>" .
                    "<p style='color:#94a3b8;font-size:0.875rem;margin-top:2rem;'>Technical details: " . htmlspecialchars($e->getMessage()) . "</p>" .
                    "</body></html>", 
                    500
                );
            }

            // Catch Database/Query Errors - Show Premium 500 Page
            if ($e instanceof \Illuminate\Database\QueryException || $e instanceof \PDOException) {
                 try {
                     return response()->view('errors.500', [], 500);
                 } catch (\Throwable $nestedException) {
                     $details = ! app()->environment('production')
                         ? "<p style='color:#94a3b8;font-size:0.875rem;margin-top:2rem;'>Original error: " . htmlspecialchars($e->getMessage()) . "</p>" .
                           "<p style='color:#94a3b8;font-size:0.875rem;'>Secondary error: " . htmlspecialchars($nestedException->getMessage()) . "</p>"
                         : "<p style='color:#94a3b8;font-size:0.875rem;margin-top:2rem;'>Our engineering team has been notified and is working on a fix.</p>";

                     return response(
                         "<html><body style='font-family:sans-serif;padding:2rem;text-align:center;background:#0f172a;color:#f8fafc;'>" .
                         "<h2 style='color:#ef4444;'>DATABASE CONNECTION ERROR</h2>" .
                         "<p>VenQore could not connect to the database. Please try refreshing the page in a few moments.</p>" .
                         $details .
                         "</body></html>", 
                         500
                     );
                 }
            }

            // Catch All Critical Errors (500) - "Billion Dollar" Stability
            // We ignore AuthenticationException/ValidationException as Laravel handles them
            // We ignore HttpException as they have their own views (404, 403, etc)
            if ($e instanceof \Throwable && 
                !$e instanceof \Illuminate\Auth\AuthenticationException &&
                !$e instanceof \Illuminate\Validation\ValidationException &&
                !$e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface
            ) {
                 try {
                     return response()->view('errors.500', [], 500);
                 } catch (\Throwable $nestedException) {
                     $details = ! app()->environment('production')
                         ? "<p style='color:#94a3b8;font-size:0.875rem;margin-top:2rem;'>Original error: " . htmlspecialchars($e->getMessage()) . "</p>" .
                           "<p style='color:#94a3b8;font-size:0.875rem;'>Secondary error: " . htmlspecialchars($nestedException->getMessage()) . "</p>"
                         : "<p style='color:#94a3b8;font-size:0.875rem;margin-top:2rem;'>Our engineering team has been notified and is working on a fix.</p>";

                     return response(
                         "<html><body style='font-family:sans-serif;padding:2rem;text-align:center;background:#0f172a;color:#f8fafc;'>" .
                         "<h2 style='color:#ef4444;'>SYSTEM ERROR</h2>" .
                         "<p>VenQore encountered an unexpected error. Please try refreshing the page in a few moments.</p>" .
                         $details .
                         "</body></html>", 
                         500
                     );
                 }
            }

            return null;
        });
    })->create();
