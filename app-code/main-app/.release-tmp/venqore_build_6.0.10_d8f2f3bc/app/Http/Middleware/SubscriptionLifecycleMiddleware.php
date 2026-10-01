<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SubscriptionLifecycleMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. If we have a tenant context, check its subscription status
        if (app()->bound('current.tenant')) {
            $tenant = app('current.tenant');

            // Demo stores are always fully active — never locked into view-only mode.
            if ($tenant->is_demo) {
                return $next($request);
            }

            // 2. Check if the store is locked in View-Only mode
            if ($tenant->view_only_since !== null) {
                
                // Allow GET/HEAD/OPTIONS requests to read data safely
                if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'])) {
                    return $next($request); // reads always allowed
                }

                // Whitelist billing, backup recovery, and logout endpoints to allow payment/rescue
                $allowedRoutes = [
                    'store.billing',
                    'store.billing.upgrade',
                    'store.billing.portal',
                    'store.backup.export',
                    'store.backup.import',
                    'logout',
                ];

                $currentRouteName = $request->route() ? $request->route()->getName() : '';

                if (in_array($currentRouteName, $allowedRoutes)) {
                    return $next($request);
                }

                // Block write requests with a clear JSON error or Inertia flash redirect
                if ($request->expectsJson() || $request->header('X-Inertia')) {
                    return response()->json([
                        'type' => 'subscription_expired',
                        'message' => 'Your store is currently in View-Only mode. Please upgrade or subscribe to restore editing and transactions.',
                        'billing_url' => route('store.billing', ['store_slug' => $tenant->slug]),
                    ], 403);
                }

                return redirect()->route('store.billing', ['store_slug' => $tenant->slug])
                    ->with('error', 'Your store is in View-Only mode. Please subscribe to perform this action.');
            }
        }

        return $next($request);
    }
}
