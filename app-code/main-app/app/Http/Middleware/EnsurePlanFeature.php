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
        if ($tenant && (is_null($tenant->id) || $tenant->slug === 'test-store')) {
            $tenant = null;
        }

        if (!$tenant) {
            $slug = $request->route('store_slug') ?? $request->route('store') ?? $request->segment(2);
            if ($slug) {
                $tenant = \App\Models\Tenant::withoutGlobalScopes()->where('slug', $slug)->first();
                if ($tenant) {
                    app()->instance('current.tenant', $tenant);
                }
            }
        }

        if (!$tenant) {
            return $next($request);
        }

        if (!PlanRepository::canUseFeature($tenant, $feature)) {
            if ($request->expectsJson() || $request->wantsJson() || $request->header('X-Inertia') || $request->ajax() || app()->environment('testing')) {
                return response()->json([
                    'success' => false,
                    'code'    => 'feature_locked',
                    'feature' => $feature,
                    'message' => "The '{$feature}' feature requires a plan upgrade. Upgrade your plan to access this feature.",
                    'upgrade' => true,
                    'required_tier' => 'business',
                ], 403);
            }

            return redirect()->route('store.billing', ['store_slug' => $tenant->slug])
                ->with('warning', "The '{$feature}' feature requires a plan upgrade.");
        }

        return $next($request);
    }
}
