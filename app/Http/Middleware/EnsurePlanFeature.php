<?php

namespace App\Http\Middleware;

use App\Services\PlanRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlanFeature
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        if (!$tenant) {
            return $next($request);
        }

        if (!PlanRepository::canUseFeature($tenant, $feature)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'code'    => 'feature_locked',
                    'feature' => $feature,
                    'message' => "The '{$feature}' feature requires a plan upgrade. Upgrade your plan to access this feature.",
                ], 402);
            }

            return redirect()->route('billing.index')->with('warning', "The '{$feature}' feature requires a plan upgrade.");
        }

        return $next($request);
    }
}
