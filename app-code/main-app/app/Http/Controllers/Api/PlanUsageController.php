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

        // Monthly transaction usage — the cap AppSumo LTD buyers actually hit.
        // Limits are 1000/3000/8000 for ltd_1/ltd_2/ltd_3 (config/plans.php,
        // config/pricing.php and PlanFeatureMatrixSeeder all agree); subscription
        // plans are uncapped (null) per the 2026-07-03 decision.
        //
        // NOTE: the AppSumo listing/decision docs still describe a 500 tx/month
        // Code-1 cap. The code says 1000. Reconcile before publishing the listing —
        // AppSumo's grandfathering policy makes advertised limits hard to tighten.
        //
        // Counted live from posted sales, matching EnforceTransactionLimit (which
        // performs the actual block) and SaleController::store(). The
        // `tenants.transactions_this_month` column is a denormalised mirror that
        // nothing incremented before 2026-08-11, so reading it reported 0 for
        // every tenant. This endpoint is read-only.
        $txCount = \App\Models\Sale::where('status', 'posted')
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();

        // Get plan limits from config (with per-tenant overrides via getLimit)
        $skuLimit       = $tenant->getLimit('sku_limit');
        $staffLimit     = $tenant->getLimit('staff_limit');
        $locationLimit  = $tenant->getLimit('locations');
        $txLimit        = $tenant->getLimit('transactions_per_month');

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
                    'near_limit'=> $skuLimit !== null && $productCount >= ($skuLimit * 0.80),
                    'critical'  => $skuLimit !== null && $productCount >= ($skuLimit * 0.95),
                ],
                'staff' => [
                    'used'      => $staffCount,
                    'limit'     => $staffLimit,
                    'unlimited' => $staffLimit === null,
                    'percent'   => $staffLimit ? round(($staffCount / $staffLimit) * 100) : 0,
                    'at_limit'  => $staffLimit !== null && $staffCount >= $staffLimit,
                    'near_limit'=> $staffLimit !== null && $staffCount >= ($staffLimit * 0.80),
                    'critical'  => $staffLimit !== null && $staffCount >= ($staffLimit * 0.95),
                ],
                'warehouses' => [
                    'used'      => $warehouseCount,
                    'limit'     => $locationLimit,
                    'unlimited' => $locationLimit === null,
                    'percent'   => $locationLimit ? round(($warehouseCount / $locationLimit) * 100) : 0,
                    'at_limit'  => $locationLimit !== null && $warehouseCount >= $locationLimit,
                    'near_limit'=> $locationLimit !== null && $warehouseCount >= ($locationLimit * 0.80),
                    'critical'  => $locationLimit !== null && $warehouseCount >= ($locationLimit * 0.95),
                ],
                'transactions' => [
                    'used'      => $txCount,
                    'limit'     => $txLimit,            // null = unlimited (all subscription plans)
                    'unlimited' => $txLimit === null,
                    'percent'   => $txLimit ? round(($txCount / $txLimit) * 100) : 0,
                    'at_limit'  => $txLimit !== null && $txCount >= $txLimit,
                    'near_limit'=> $txLimit !== null && $txCount >= ($txLimit * 0.80),
                    'critical'  => $txLimit !== null && $txCount >= ($txLimit * 0.95),
                    // The allowance is a calendar-month window (see the live count
                    // above), so it always resets at the start of next month.
                    'resets_at' => now()->addMonth()->startOfMonth()->toIso8601String(),
                ],
            ],

            'features' => [
                'woocommerce'   => PlanGate::check('woocommerce'),
                'api_access'    => PlanGate::check('api_access'),
                'growth_engine' => PlanGate::check('growth_engine'),
                'multi_branch'  => PlanGate::check('multi_branch'),
                'reports'       => $tenant->getLimit('reports'), // 'basic' | 'advanced'
            ],

            // Available upgrade path. LTD tenants store plan = 'ltd' on the
            // Tenant row (see Tenant::setPlanAttribute) — matching on the raw
            // $tenant->plan here previously fell through to the default case
            // and told every AppSumo buyer to "upgrade to Starter", which is
            // a downgrade for ltd_2/ltd_3 holders. effectivePlan() resolves
            // 'ltd' to its actual tier (ltd_1/ltd_2/ltd_3) via the tenant's
            // snapshotted transactions_per_month.
            'upgrade_to' => match($tenant->effectivePlan()) {
                'starter', 'ltd_1' => 'growth',
                'growth', 'ltd_2'  => 'business',
                'business', 'ltd_3' => null,   // already on top tier
                default             => 'starter',
            },
        ]);
    }
}
