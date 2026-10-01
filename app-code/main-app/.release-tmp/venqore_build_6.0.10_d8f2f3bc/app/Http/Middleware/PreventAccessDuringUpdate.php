<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class PreventAccessDuringUpdate
{
    public function handle(Request $request, Closure $next)
    {
        // ── CUSTOM UPDATE LOCK ──────────────────────────────────────────
        // Only active during actual deployment activation / migrations,
        // and does NOT touch or delete native Laravel maintenance state.
        $lockPath = storage_path('update.lock');

        if (File::exists($lockPath)) {
            $lockData = @json_decode(File::get($lockPath), true) ?: [];

            // If lock explicitly states maintenance is false (e.g. during upload or pre-validation),
            // do not block ordinary user requests.
            $isMaintenance = $lockData['maintenance'] ?? true;
            if (!$isMaintenance) {
                return $next($request);
            }

            // Allowed paths during maintenance: only Updater, Installer, and health check
            if ($request->is('updater', 'updater/*', 'api/updater/*', 'installer', 'installer/*', 'api/installer/*', 'up')) {
                return $next($request);
            }

            $status = $lockData['status'] ?? 'in_progress';
            $isFailed = ($status === 'failed');

            // If the deployment failed, DO NOT auto-unlock into a corrupted release.
            if ($isFailed) {
                $failedMsg = 'System update encountered an error and is held in maintenance mode for recovery. Please contact administrator.';
                if ($request->expectsJson()) {
                    return response()->json(['error' => $failedMsg, 'update_status' => 'failed'], 503);
                }
                return response()->view('errors.503', [
                    'message' => $failedMsg,
                    'auto_refresh' => false
                ], 503);
            }

            $lockTime = File::lastModified($lockPath);
            $ageMinutes = round((time() - $lockTime) / 60);

            if ($ageMinutes < \App\Http\Controllers\UpdaterController::LOCK_MAX_AGE_MINUTES) {
                if ($request->expectsJson()) {
                    return response()->json(['error' => 'System is currently applying an update. Please wait a few moments.'], 503);
                }

                return response()->view('errors.503', [
                    'message' => 'System Update in Progress. Please wait a moment...',
                    'auto_refresh' => true
                ], 503);
            } else {
                // If it is genuinely abandoned upload that never started extraction/mutation, clear it.
                $phase = $lockData['phase'] ?? ($lockData['step'] ?? '');
                if ($phase === 'uploading' || $phase === 'uploading_chunks') {
                    @unlink($lockPath);
                } else {
                    // Mutation had started; keep holding lock for safety rather than exposing mixed files
                    $abandonedMsg = 'System update timed out during deployment. Held in maintenance mode for safety.';
                    if ($request->expectsJson()) {
                        return response()->json(['error' => $abandonedMsg, 'update_status' => 'timeout_held'], 503);
                    }
                    return response()->view('errors.503', [
                        'message' => $abandonedMsg,
                        'auto_refresh' => false
                    ], 503);
                }
            }
        }

        return $next($request);
    }
}
