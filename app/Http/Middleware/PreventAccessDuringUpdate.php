<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class PreventAccessDuringUpdate
{
    public function handle(Request $request, Closure $next)
    {
        // ── SELF-HEALING: Flawless automatic cleanup of native "artisan down"
        // If the old flawed native Laravel maintenance file somehow exists, destroy it.
        // This ensures the customer is NEVER locked out requiring cPanel intervention again.
        $nativeDown = storage_path('framework/down');
        if (File::exists($nativeDown)) {
            @unlink($nativeDown);
        }

        // ── CUSTOM SOFT-LOCK ──────────────────────────────────────────
        // This replaces "php artisan down" with a much smarter system
        // that never accidentally locks the updater itself.
        $lockPath = storage_path('update.lock');

        if (File::exists($lockPath)) {
            $lockTime = File::lastModified($lockPath);
            $ageMinutes = round((time() - $lockTime) / 60);

            // AUTO-HEALING: If the update lock is older than 15 minutes,
            // assume the update crashed or timed out and silently ignore it.
            // This guarantees the app ALWAYS comes back online without manual intervention.
            if ($ageMinutes < 15) {
                // Allow the Updater, Installer, and Health Checks to operate flawlessly
                if ($request->is('updater', 'updater/*', 'api/updater/*', 'installer', 'installer/*', 'api/installer/*', 'attendance/*', 'up')) {
                    return $next($request);
                }

                if ($request->expectsJson()) {
                    return response()->json(['error' => 'System is currently applying a smooth update. Please wait a few seconds.'], 503);
                }

                return response()->view('errors.503', [
                    'message' => 'System Update in Progress. Please wait a moment...',
                    'auto_refresh' => true
                ], 503);
            } else {
                // The lock is stale. Auto-delete the failed lock so the system is clean.
                @unlink($lockPath);
            }
        }

        return $next($request);
    }
}
