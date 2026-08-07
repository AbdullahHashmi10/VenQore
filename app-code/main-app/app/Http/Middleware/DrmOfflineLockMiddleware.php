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
    /**
     * Tolerance for "future" timestamps before we treat them as clock tampering.
     * Absorbs timezone offsets (max real-world ~14h) and minor clock skew so
     * honest users are never locked out, while a genuine backwards clock roll
     * of days/weeks is still caught.
     */
    private const CLOCK_TOLERANCE_HOURS = 24;

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

                // Clock tampering check: now (plus tolerance) < last_online
                if (\Carbon\Carbon::now()->addHours(self::CLOCK_TOLERANCE_HOURS)->lt($lastOnline)) {
                    if ($request->expectsJson()) {
                        return response()->json([
                            'error' => 'Clock tampering detected. Please set your system clock to the correct time.',
                        ], 403);
                    }
                    abort(403, 'Clock tampering detected. Please set your system clock to the correct time.');
                }

                if ($lastOnline->diffInDays(now()) > 30) {
                    if ($request->expectsJson()) {
                        return response()->json([
                            'error' => 'License offline lock active. Please connect to the internet to reactivate.',
                        ], 403);
                    }

                    abort(403, 'License offline lock active. Please connect to the internet to reactivate.');
                }
            }

            // Also check latest transaction to prevent date inversion clock manipulation
            $maxPostedAt = \Illuminate\Support\Facades\DB::table('sales')
                ->where('tenant_id', $tenant->id)
                ->where('status', 'posted')
                ->max('posted_at');
            
            if ($maxPostedAt && \Carbon\Carbon::now()->addHours(self::CLOCK_TOLERANCE_HOURS)->lt(\Carbon\Carbon::parse($maxPostedAt))) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'error' => 'Clock tampering detected. Please set your system clock to the correct time.',
                    ], 403);
                }
                abort(403, 'Clock tampering detected. Please set your system clock to the correct time.');
            }
        }

        return $next($request);
    }
}
