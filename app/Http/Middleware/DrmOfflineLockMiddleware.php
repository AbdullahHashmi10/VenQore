<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * DrmOfflineLockMiddleware — Module 03
 *
 * Blocks access to POS routes when the tenant's `last_online_at` timestamp
 * indicates the terminal has not verified its license online in more than
 * 30 days. Returns 403 so the Electron shell can display the lock screen.
 *
 * If `last_online_at` is NULL (new installs) the lock is NOT triggered —
 * the tenant gets a grace period until the first successful online check-in.
 */
class DrmOfflineLockMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->bound('current.tenant')) {
            $tenant = app('current.tenant');

            // Retrieve last_online_at with a 60-second cache to prevent DB overhead on every hot POS route request
            $lastOnlineRaw = \Illuminate\Support\Facades\Cache::remember(
                "tenant_{$tenant->id}_last_online_at",
                60,
                fn() => \Illuminate\Support\Facades\DB::table('tenants')
                    ->where('id', $tenant->id)
                    ->value('last_online_at')
            );

            if ($lastOnlineRaw !== null) {
                $lastOnline = \Carbon\Carbon::parse($lastOnlineRaw);

                if ($lastOnline->diffInDays(now()) > 30) {
                    if ($request->expectsJson()) {
                        return response()->json([
                            'error' => 'License offline lock active. Please connect to the internet to reactivate.',
                        ], 403);
                    }

                    abort(403, 'License offline lock active. Please connect to the internet to reactivate.');
                }
            }
        }

        return $next($request);
    }
}
