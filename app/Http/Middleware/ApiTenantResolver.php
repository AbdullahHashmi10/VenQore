<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\TenantUser;

class ApiTenantResolver
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Fallback tenant resolution for bare API routes outside /s/{store_slug}.
        // SECURITY: bind only after active membership is proven. HasTenant keys
        // its global scope on this binding, so binding earlier lets revoked users
        // retain access through their stale last_store_id.
        if ($user && !app()->bound('current.tenant')) {
            $membership = null;
            if ($user->last_store_id) {
                $membership = TenantUser::where('tenant_id', $user->last_store_id)
                    ->where('user_id', $user->id)
                    ->where('status', 'active')
                    ->with('tenant')
                    ->first();
            }

            if (!$membership) {
                $membership = TenantUser::where('user_id', $user->id)
                    ->where('status', 'active')
                    ->with('tenant')
                    ->first();
            }

            if ($membership && $membership->tenant) {
                app()->instance('current.tenant', $membership->tenant);
                app()->instance('current.membership', $membership);
            }
        }

        return $next($request);
    }
}
