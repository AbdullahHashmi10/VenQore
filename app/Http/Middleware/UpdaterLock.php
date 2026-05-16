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
