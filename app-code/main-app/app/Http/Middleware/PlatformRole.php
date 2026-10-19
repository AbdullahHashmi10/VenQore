<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Role gate for Hashmi Dashboard (Platform HQ) write routes.
 *
 * SuperAdminMiddleware lets ANY platform account into /VenQore — including
 * support agents. Before this (2026-10-11) many write endpoints had no role
 * check of their own, so a support agent could gift plans, change a store's
 * plan, edit coupons or flush the job queue. Usage on a route:
 *
 *     ->middleware(PlatformRole::class . ':admin')    // owner, platform manager, product manager
 *     ->middleware(PlatformRole::class . ':support')  // admin roles + support team
 *     ->middleware(PlatformRole::class . ':owner')    // platform owner only
 */
class PlatformRole
{
    public function handle(Request $request, Closure $next, string $level = 'admin'): Response
    {
        $user = $request->user();

        $allowed = match ($level) {
            'owner'   => $user?->isPlatformOwner(),
            'support' => $user?->isPlatformSupport(),
            default   => $user?->isPlatformSuperAdmin(),
        };

        if (!$allowed) {
            $message = match ($level) {
                'owner'   => 'Only the platform owner can do this.',
                'support' => 'A platform support role is required for this.',
                default   => 'A Platform Admin or Owner role is required for this.',
            };

            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return response()->json(['error' => $message, 'message' => $message, 'success' => false], 403);
            }
            abort(403, $message);
        }

        return $next($request);
    }
}
