<?php

namespace App\Http\Middleware;

use App\Models\TenantUser;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * SEC-02 (2026-09-10): fail-closed store resolution for bare API routes.
 *
 * Bare /api/* routes have no {store_slug}. Previously SyncController trusted
 * users.last_store_id directly, so a suspended or removed member with a live
 * session/token kept reading that store's data and could post sales.
 *
 * This middleware binds current.tenant / current.membership ONLY when the
 * authenticated user holds an ACTIVE membership of the store, and returns 403
 * otherwise. Routes that need store data must use it (alias: store.member).
 */
class EnsureActiveStoreMembership
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $bound = app()->bound('current.tenant') ? app('current.tenant') : null;
        $tenantId = ($bound && !empty($bound->id)) ? $bound->id : $user->last_store_id;
        if (! $tenantId) {
            return response()->json(['message' => 'No active store selected.'], 403);
        }

        $membership = TenantUser::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->with('tenant')
            ->first();

        if (! $membership || ! $membership->tenant) {
            return response()->json(['message' => 'You do not have active access to this store.'], 403);
        }

        app()->instance('current.tenant', $membership->tenant);
        app()->instance('current.membership', $membership);

        return $next($request);
    }
}
