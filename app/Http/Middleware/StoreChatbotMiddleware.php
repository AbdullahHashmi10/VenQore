<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StoreChatbotMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        if (!$user) {
            abort(403, 'Unauthorized.');
        }

        if ($user->isPlatformStaff()) {
            return $next($request);
        }

        $tenant = app('current.tenant');
        if ($tenant) {
            $isMember = \App\Models\TenantUser::where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->exists();

            if ($isMember) {
                if ($tenant->ai_status === 'none') {
                    throw new \App\Exceptions\PlanLimitException('ai_access');
                }
                return $next($request);
            }
        }

        abort(403, 'Unauthorized.');
    }
}
