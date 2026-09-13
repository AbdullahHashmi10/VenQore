<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DemoBannerMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (app()->bound('current.tenant')) {
            $tenant = app('current.tenant');
            
            if ($tenant->is_demo) {
                // Share data globally with React frontend
                Inertia::share('demo', [
                    'is_active' => true,
                    'expires_at' => $tenant->demo_expires_at,
                    'signup_url' => route('register', ['ref' => 'demo_conversion']),
                ]);
            }
        }

        return $next($request);
    }
}
