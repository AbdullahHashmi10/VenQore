<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * SuperAdminMiddleware — Platform HQ Gate
 *
 * Protects all /VenQore/* routes. Redirects unauthenticated visitors to
 * the dedicated /VenQore-login page (NOT the regular store login page).
 * Rejects authenticated non-platform-admins with a 403.
 */
class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // ── Security: 404 for everyone who is not a platform admin ────────────
        // A 403 would reveal that this route exists. A 404 does not.
        // Never redirect to platform.login from here — that reveals the URL.

        // Not logged in → 404 (do not redirect to platform.login)
        if (!Auth::check()) {
            abort(404);
        }

        $user = $request->user();

        // Logged in but not a platform admin → 404 (not 403, not redirect)
        if (!$user->isPlatformAdmin()) {
            abort(404);
        }

        // ── Security Feature: 30-minute Inactivity Timeout for Platform Admins ──
        $lastActivity = session('platform_last_activity');
        $timeout = 30 * 60; // 30 minutes in seconds

        if ($lastActivity && (time() - $lastActivity > $timeout)) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('platform.login')
                ->with('status', 'You have been logged out due to 30 minutes of inactivity.');
        }

        // Update activity timestamp for every valid request to Platform HQ
        session(['platform_last_activity' => time()]);

        return $next($request);
    }
}
