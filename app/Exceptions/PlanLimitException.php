<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

/**
 * PlanLimitException — Phase 4.4
 *
 * Thrown by PlanGate::enforce() when a tenant exceeds a plan limit.
 * The render() method returns a structured JSON response that the
 * React frontend can intercept globally to show an upgrade modal.
 *
 * Frontend pattern (in your axios interceptor):
 *   if (error.response?.data?.type === 'plan_limit') {
 *     showUpgradeModal(error.response.data);
 *   }
 */
class PlanLimitException extends Exception
{
    protected string $feature;
    protected ?int   $currentCount;

    public function __construct(string $feature, ?int $currentCount = null)
    {
        $this->feature      = $feature;
        $this->currentCount = $currentCount;

        $messages = [
            'sku_limit'    => 'You\'ve reached the maximum number of products for your plan.',
            'locations'    => 'You\'ve reached the maximum number of warehouses for your plan.',
            'staff_limit'  => 'You\'ve reached the maximum number of staff accounts for your plan.',
            'woocommerce'  => 'WooCommerce integration is not available on your current plan.',
            'api_access'   => 'API access requires an upgrade.',
            'growth_engine'=> 'The Growth Engine is not available on your current plan.',
            'multi_branch' => 'Multi-branch features require the Growth plan or above.',
        ];

        parent::__construct($messages[$feature] ?? "You've reached the limit for your current plan.");
    }

    /**
     * Render into a structured JSON response for Axios or flash redirect for Inertia.
     */
    public function render($request)
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        $payload = [
            'type'         => 'plan_limit',
            'feature'      => $this->feature,
            'message'      => $this->getMessage(),
            'upgrade_url'  => $tenant ? route('store.billing.upgrade', ['store_slug' => $tenant->slug]) : '#',
            'billing_url'  => $tenant ? route('store.billing', ['store_slug' => $tenant->slug]) : '#',
            'portal_url'   => $tenant ? route('store.billing.portal', ['store_slug' => $tenant->slug]) : '#',
            'current_plan' => $tenant?->plan,
            'current_count'=> $this->currentCount,
            'limit'        => $tenant?->getLimit($this->feature),
        ];

        if ($request->header('X-Inertia')) {
            return back()->with('plan_limit', $payload);
        }

        return response()->json($payload, 403);
    }
}
