<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\PlanGate;
use App\Support\ReportPlanMap;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureReportPlanFeature
{
    public function handle(Request $request, Closure $next): Response
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
                $tenant = Tenant::withoutGlobalScopes()->where('slug', $slug)->first();
                if ($tenant) {
                    app()->instance('current.tenant', $tenant);
                }
            }
        }

        // Resolve report suffix
        $routeName = $request->route()?->getName();
        $suffix = null;

        if ($routeName && str_starts_with($routeName, 'reports.')) {
            $suffix = substr($routeName, strlen('reports.'));
        }

        if (!$suffix) {
            $path = $request->path();
            if (preg_match('#reports/([^/?]+)#', $path, $matches)) {
                $suffix = $matches[1];
            }
        }

        // If it's the index / hub (/reports or reports.index), allow access
        if (empty($suffix) || $suffix === 'index') {
            return $next($request);
        }

        $featureKey = ReportPlanMap::requiresPlanFeature($suffix);

        // If report is unmapped / free, allow access
        if ($featureKey === null) {
            return $next($request);
        }

        if (!$tenant) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'type'    => 'plan_limit',
                    'message' => 'tenant_required',
                    'feature' => $featureKey,
                ], 402);
            }

            return redirect()->route('login');
        }

        // Platform staff and God Admin bypass
        $user = $request->user();
        if ($user && ($user->is_platform_admin || (method_exists($user, 'isPlatformStaff') && $user->isPlatformStaff()))) {
            return $next($request);
        }

        if (!PlanGate::check($featureKey, $tenant)) {
            $decisionMsg = ReportPlanMap::decisionFor($featureKey);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'type'         => 'plan_limit',
                    'message'      => 'upgrade_required',
                    'feature'      => $featureKey,
                    'tier'         => ReportPlanMap::tierFor($featureKey),
                    'decision'     => $decisionMsg,
                    'current_plan' => $tenant->plan === 'ltd' ? $tenant->effectivePlan() : $tenant->plan,
                    'limit'        => PlanGate::getLimit($featureKey, $tenant),
                ], 402);
            }

            $storeSlug = $tenant->slug;
            $upgradeUrl = \Illuminate\Support\Facades\Route::has('store.billing.upgrade')
                ? route('store.billing.upgrade', ['store_slug' => $storeSlug, 'feature' => $featureKey])
                : route('store.billing', ['store_slug' => $storeSlug]);

            return redirect($upgradeUrl)->with('plan_limit', [
                'type'         => 'plan_limit',
                'feature'      => $featureKey,
                'tier'         => ReportPlanMap::tierFor($featureKey),
                'message'      => $decisionMsg,
                'current_plan' => $tenant->plan === 'ltd' ? $tenant->effectivePlan() : $tenant->plan,
            ]);
        }

        return $next($request);
    }
}
