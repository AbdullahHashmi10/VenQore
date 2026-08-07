<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;

class UpdaterLock
{
    public function handle(Request $request, Closure $next)
    {
        // ── 0. Token-based bypass (session-independent) ────────────
        // After the extract step writes new PHP files to disk, the old
        // bootstrap/cache/*.php may conflict with new code and cause
        // Auth::user() to fail the role check on subsequent requests.
        // The update_token was generated at upload time, stored in the
        // lock file, and returned to the browser. If it matches, we
        // allow the request through without relying on the HTTP session.
        $requestToken = $request->input('update_token') ?? $request->header('X-Update-Token');
        if (!empty($requestToken)) {
            $lockPath = storage_path('update.lock');
            if (File::exists($lockPath)) {
                $lockData = json_decode(File::get($lockPath), true);
                if (
                    isset($lockData['update_token']) &&
                    is_string($lockData['update_token']) &&
                    strlen($lockData['update_token']) >= 32 &&
                    hash_equals($lockData['update_token'], $requestToken)
                ) {
                    // Valid secure token — allow this step through
                    return $next($request);
                }
            }
        }

        // ── 1. Must be installed first ─────────────────────────────
        if (!File::exists(storage_path('installed'))) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Application is not installed yet.'], 403);
            }
            return redirect()->route('installer.index');
        }

        // ── 2. Must be authenticated ───────────────────────────────
        if (!Auth::check()) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthenticated.'], 401);
            }
            return redirect()->route('login')->with('error', 'Please log in to access system updates.');
        }

        // ── 3. Must be platform_admin role ────────────────────────────
        if (Auth::user()->role !== 'platform_admin') {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthorized. Platform Owner access required for system updates.'], 403);
            }
            // Regular users get redirected to dashboard with a message
            return redirect()->route('dashboard')->with('error', 'You do not have permission to access the System Updater.');
        }

        return $next($request);
    }
}
