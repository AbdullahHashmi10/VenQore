<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

class DemoMiddleware
{
    public function handle(Request $request, Closure $next): mixed
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        if (!$tenant?->is_demo) {
            return $next($request);
        }

        // Block these destructive or restricted actions in demo mode
        $blockedRoutes = [
            'store.settings.update',
            'store.staff.invite',
            'store.staff.remove',
            'store.billing',
            'store.billing.portal',
            'store.admin.users.destroy',
            'store.admin.backups.store',
        ];

        if (in_array($request->route()?->getName(), $blockedRoutes)) {
            if ($request->wantsJson() || $request->inertia()) {
                return response()->json([
                    'demo' => true,
                    'message' => 'This action is disabled in the demo store.',
                    'cta' => 'Start your free trial at venqore.com'
                ], 403);
            }
            return redirect()->back()->with('error', 'This action is disabled in the demo store.');
        }

        // Block password changes
        if ($request->routeIs('store.admin.users.update') && $request->has('password')) {
            return response()->json([
                'demo' => true,
                'message' => 'Passwords cannot be changed in the demo store.'
            ], 403);
        }

        // Rate limit writes
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $writeLimit = RateLimiter::attempt(
                'demo-write:' . $request->ip(),
                100,
                fn() => null,
                3600
            );

            if (!$writeLimit) {
                if ($request->wantsJson() || $request->inertia()) {
                    return response()->json([
                        'demo' => true,
                        'message' => 'You have made many changes in the demo. Start your free trial for unlimited access.',
                    ], 429);
                }
                abort(429, 'Too many write attempts in demo mode.');
            }
        }

        return $next($request);
    }
}
