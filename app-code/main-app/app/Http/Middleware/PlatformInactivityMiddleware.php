<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class PlatformInactivityMiddleware
{
    /**
     * Handle an incoming request.
     * 
     * If the user is a platform admin, enforce a 30-minute inactivity timeout.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // Only enforce for platform admins
        if ($user && $user->is_platform_admin) {
            $lastActivity = session('platform_last_activity');
            $timeout = 30 * 60; // 30 minutes in seconds

            if ($lastActivity && (time() - $lastActivity > $timeout)) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('platform.login')->with('status', 'Your administrative session expired due to inactivity. Please sign in again.');
            }

            // Update activity timestamp
            session(['platform_last_activity' => time()]);
        }

        return $next($request);
    }
}
