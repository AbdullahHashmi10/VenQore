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
            $membership = \App\Models\TenantUser::where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->first();

            if ($membership) {
                if ($tenant->ai_status === 'none') {
                    throw new \App\Exceptions\PlanLimitException('ai_access');
                }

                // Strictly require owner or admin membership status for any write modifications
                if ($request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('PATCH') || $request->isMethod('DELETE')) {
                    if (!in_array($membership->role, ['owner', 'admin'])) {
                        abort(403, 'Unauthorized. Only store owners or administrators can modify chatbot settings.');
                    }
                }

                return $next($request);
            }
        }

        abort(403, 'Unauthorized.');
    }
}
