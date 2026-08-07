<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\PlanGate;
use Illuminate\Http\JsonResponse;

/**
 * PlanUsageController — Phase 4.4
 *
 * Provides the current tenant's resource usage against their plan limits.
 * Used by the React frontend to:
 *   1. Show "X of Y products used" progress bars in Settings → Billing
 *   2. Proactively warn before hitting a limit (e.g., "95% of SKUs used")
 *   3. Show which features are locked vs available
 *
 * GET /api/plan/usage
 * Authenticated, tenant-scoped.
 */
class PlanUsageController extends Controller
{
    public function usage(): JsonResponse
    {
        if (!app()->bound('current.tenant')) {
            return response()->json(['error' => 'No tenant context'], 400);
        }

        $tenant = app('current.tenant');

        // Count current usage — all queries scoped to tenant via HasTenant
        $productCount   = Product::count();
        $staffCount     = User::whereNotIn('role', ['platform_admin'])->count();
        $warehouseCount = Warehouse::count();

        // Get plan limits from config (with per-tenant overrides via getLimit)
        $skuLimit       = $tenant->getLimit('sku_limit');
        $staffLimit     = $tenant->getLimit('staff_limit');
        $locationLimit  = $tenant->getLimit('locations');

        return response()->json([
            'plan' => $tenant->plan,
            'status' => $tenant->status,
            'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
            'subscription_ends_at' => $tenant->subscription_ends_at?->toIso8601String(),

            'usage' => [
                'products' => [
                    'used'      => $productCount,
                    'limit'     => $skuLimit,           // null = unlimited
                    'unlimited' => $skuLimit === null,
                    'percent'   => $skuLimit ? round(($productCount / $skuLimit) * 100) : 0,
                    'at_limit'  => $skuLimit !== null && $productCount >= $skuLimit,
                    'near_limit'=> $skuLimit !== null && $productCount >= ($skuLimit * 0.90),
                ],
                'staff' => [
                    'used'      => $staffCount,
                    'limit'     => $staffLimit,
                    'unlimited' => $staffLimit === null,
                    'percent'   => $staffLimit ? round(($staffCount / $staffLimit) * 100) : 0,
                    'at_limit'  => $staffLimit !== null && $staffCount >= $staffLimit,
                    'near_limit'=> $staffLimit !== null && $staffCount >= ($staffLimit * 0.90),
                ],
                'warehouses' => [
                    'used'      => $warehouseCount,
                    'limit'     => $locationLimit,
                    'unlimited' => $locationLimit === null,
                    'percent'   => $locationLimit ? round(($warehouseCount / $locationLimit) * 100) : 0,
                    'at_limit'  => $locationLimit !== null && $warehouseCount >= $locationLimit,
                    'near_limit'=> $locationLimit !== null && $warehouseCount >= ($locationLimit * 0.90),
                ],
            ],

            'features' => [
                'woocommerce'   => PlanGate::check('woocommerce'),
                'api_access'    => PlanGate::check('api_access'),
                'growth_engine' => PlanGate::check('growth_engine'),
                'multi_branch'  => PlanGate::check('multi_branch'),
                'reports'       => $tenant->getLimit('reports'), // 'basic' | 'advanced'
            ],

            // Available upgrade path
            'upgrade_to' => match($tenant->plan) {
                'starter'  => 'growth',
                'growth'   => 'business',
                'business' => null,    // already on top plan
                default    => 'starter',
            },
        ]);
    }
}
