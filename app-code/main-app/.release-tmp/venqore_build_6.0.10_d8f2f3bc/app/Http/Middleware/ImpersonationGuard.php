<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ImpersonationGuard — Layer 2 of the 3-Layer Safety Protocol
 *
 * During an impersonation session, ALL write HTTP methods (POST/PUT/PATCH/DELETE)
 * are blocked and return a 403 JSON error. This prevents accidental or malicious
 * data corruption while a Platform Owner is viewing a store as a staff member.
 *
 * Safe methods (GET, HEAD, OPTIONS) are always allowed.
 * The logout route is always allowed so the admin can cleanly exit.
 *
 * Usage: Add to the store route group middleware stack.
 * The session key 'impersonating_user_id' is the flag set by ImpersonationController.
 */
class ImpersonationGuard
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->session()->has('impersonating_user_id')) {
            return $next($request);
        }

        // Allow safe HTTP methods
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'])) {
            return $next($request);
        }

        // Always allow the impersonation exit route
        if ($request->routeIs('admin.impersonate.end')) {
            return $next($request);
        }

        // Block all writes
        return response()->json([
            'message'     => 'Write operations are blocked during impersonation. This session is read-only.',
            'impersonating'=> true,
        ], 403);
    }
}
