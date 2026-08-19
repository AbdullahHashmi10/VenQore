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
        $user = request()->user();

        $reckonerResult = app(\App\Reckoner\Reckoner::class)->read(
            new \App\Reckoner\ReckonerRequest('plan.usage_summary', 'live'),
            $user,
            $tenant
        );

        if (!$reckonerResult->ok) {
            return response()->json(['error' => 'Reckoner resolution failed: ' . $reckonerResult->errorMsg], 500);
        }

        $data = $reckonerResult->data;

        return response()->json([
            'plan' => $tenant->plan,
            'status' => $tenant->status,
            'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
            'subscription_ends_at' => $tenant->subscription_ends_at?->toIso8601String(),

            'usage' => $data['details']['usage'],
            'features' => $data['details']['features'],

            'upgrade_to' => match($tenant->effectivePlan()) {
                'starter', 'ltd_1' => 'growth',
                'growth', 'ltd_2'  => 'business',
                'business', 'ltd_3' => null,   // already on top tier
                default             => 'starter',
            },
        ]);
    }
}
