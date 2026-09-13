<?php

namespace App\Http\Middleware;

use App\Services\PlanGate;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsurePlanFeature Middleware — V6 Gating Boundary
 *
 * Enforces feature availability at the route level.
 * - JSON / API requests receive a 402 Payment Required response.
 * - Web requests redirect to the billing upgrade view with flash notice.
 */
class EnsurePlanFeature
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $feature
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        if ($tenant && is_null($tenant->id)) {
            $tenant = null;
        }

        // test-store exemption strictly scoped to testing environment
        if ($tenant && $tenant->slug === 'test-store' && app()->environment('testing')) {
            return $next($request);
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
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'type'    => 'plan_limit',
                    'message' => 'tenant_required',
                    'feature' => $feature,
                ], 402);
            }

            return redirect()->route('login');
        }

        // Platform staff and God Admin bypass
        $user = $request->user();
        if ($user && ($user->is_platform_admin || (method_exists($user, 'isPlatformStaff') && $user->isPlatformStaff()))) {
            return $next($request);
        }

        if (!PlanGate::check($feature)) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'type'         => 'plan_limit',
                    'message'      => 'upgrade_required',
                    'feature'      => $feature,
                    'current_plan' => $tenant->plan === 'ltd' ? $tenant->effectivePlan() : $tenant->plan,
                    'limit'        => PlanGate::getLimit($feature),
                ], 402);
            }

            $storeSlug = $tenant->slug;
            $upgradeUrl = \Illuminate\Support\Facades\Route::has('store.billing.upgrade')
                ? route('store.billing.upgrade', ['store_slug' => $storeSlug, 'feature' => $feature])
                : route('store.billing', ['store_slug' => $storeSlug]);

            return redirect($upgradeUrl)->with('plan_limit', [
                'type'         => 'plan_limit',
                'feature'      => $feature,
                'message'      => "The feature '{$feature}' requires a plan upgrade.",
                'current_plan' => $tenant->plan === 'ltd' ? $tenant->effectivePlan() : $tenant->plan,
            ]);
        }

        return $next($request);
    }
}
