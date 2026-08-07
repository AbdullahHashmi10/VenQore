<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;

class DemoSessionMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (app()->bound('current.tenant')) {
            $tenant = app('current.tenant');
            
            if ($tenant->is_demo) {
                $cookieToken = $request->cookie('demo_session');
                
                if ($tenant->demo_session_token !== $cookieToken) {
                    abort(403, 'Unauthorized Demo Access. This session belongs to another visitor.');
                }
                
                // If past expiry
                if ($tenant->demo_expires_at && $tenant->demo_expires_at->isPast()) {
                    return redirect('/demo-expired');
                }
            }
        }

        return $next($request);
    }
}
