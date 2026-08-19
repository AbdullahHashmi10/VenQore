<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\Log;

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

        Log::info('ApiTenantResolver trace', [
            'user' => $user ? $user->id : 'NULL',
            'last_store_id' => $user ? $user->last_store_id : 'NULL',
            'bound' => app()->bound('current.tenant') ? 'YES' : 'NO',
        ]);

        // Fallback resolution for bare API routes outside the /s/{store_slug} prefix
        if ($user && !app()->bound('current.tenant')) {
            $tenantId = $user->last_store_id;

            if ($tenantId) {
                $tenant = Tenant::find($tenantId);

                if ($tenant) {
                    app()->instance('current.tenant', $tenant);

                    $membership = TenantUser::where('tenant_id', $tenant->id)
                        ->where('user_id', $user->id)
                        ->where('status', 'active')
                        ->first();

                    if ($membership) {
                        app()->instance('current.membership', $membership);
                    }
                    
                    Log::info('ApiTenantResolver successfully bound tenant', [
                        'tenant_id' => $tenant->id,
                        'membership_role' => $membership ? $membership->role : 'NONE',
                    ]);
                }
            }
        }

        return $next($request);
    }
}
