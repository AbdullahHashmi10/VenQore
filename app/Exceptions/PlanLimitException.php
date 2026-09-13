<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

/**
 * PlanLimitException — Phase 4.4 / V6 Gating
 *
 * Thrown by PlanGate::enforce() when a tenant exceeds a plan limit or attempts
 * to access a fenced capability.
 *
 * Carries:
 *   - feature: string
 *   - currentCount: ?int
 *   - limit: mixed
 *   - upgradeTarget: string ('growth' | 'business' | 'custom')
 */
class PlanLimitException extends Exception
{
    protected string $feature;
    protected ?int   $currentCount;
    protected mixed  $limit;
    protected string $upgradeTarget;

    public function __construct(string $feature, ?int $currentCount = null, mixed $limit = null, ?string $upgradeTarget = null)
    {
        $this->feature      = $feature;
        $this->currentCount = $currentCount;
        $this->limit        = $limit;

        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        $currentPlan = $tenant?->plan ?? 'starter';
        if ($currentPlan === 'ltd' && method_exists($tenant, 'effectivePlan')) {
            $currentPlan = $tenant->effectivePlan();
        }

        // Determine upgrade target slug
        if ($upgradeTarget !== null) {
            $this->upgradeTarget = $upgradeTarget;
        } else {
            // Scale-only features (Scale $299/mo)
            $scaleOnlyFeatures = [
                'white_label', 'consolidated_reporting',
            ];
            // Core features ($99/mo) - API, webhooks, audit log, custom roles, network unlimited
            $coreFeatures = [
                'api_access', 'webhooks', 'api_webhooks', 'security_activity_log', 'audit_trail', 'custom_roles', 'network_unlimited'
            ];

            if (in_array($feature, $scaleOnlyFeatures, true)) {
                $this->upgradeTarget = 'scale';
            } elseif (in_array($feature, $coreFeatures, true)) {
                $this->upgradeTarget = in_array($currentPlan, ['scale', 'business', 'custom'], true) ? 'custom' : 'core';
            } elseif ($currentPlan === 'solo') {
                $this->upgradeTarget = 'starter';
            } elseif ($currentPlan === 'starter') {
                $this->upgradeTarget = 'core';
            } elseif (in_array($currentPlan, ['core', 'growth'], true)) {
                $this->upgradeTarget = 'scale';
            } else {
                $this->upgradeTarget = 'custom';
            }
        }

        $messages = [
            'sku_limit'                => 'You\'ve reached the maximum number of catalogue items for your plan.',
            'locations'                => 'You\'ve reached the maximum number of store locations for your plan.',
            'location_limit'           => 'You\'ve reached the maximum number of store locations for your plan.',
            'registers'                => 'You\'ve reached the maximum number of POS registers for your plan.',
            'staff_limit'              => 'You\'ve reached the maximum number of full staff seats for your plan. Till logins remain free and unlimited.',
            'multi_branch'             => 'Multi-branch operations activate automatically with a 2nd location or on the Scale plan.',
            'growth_engine'            => 'The Growth Engine is available on paid plans.',
            'owners_daily_pulse'       => 'Owner\'s Daily Pulse is available on paid plans.',
            'recurring_invoices'       => 'Recurring Invoices are available on paid plans.',
            'bank_reconciliation'      => 'Bank Reconciliation is available on paid plans.',
            'e_invoicing'              => 'E-Invoicing integration is available on paid plans.',
            'fund_management'          => 'Fund Management is available on paid plans.',
            'invoice_reminders'        => 'Automated Invoice Reminders are available on paid plans.',
            'fiscal_year_closing'      => 'Fiscal Year Closing is available on paid plans.',
            'fixed_asset_depreciation' => 'Fixed Asset Depreciation is available on paid plans.',
            'google_drive_backup'      => 'Google Drive backup is available on all paid plans.',
            'adviser_seat'             => 'Adviser seat is available on all paid plans.',
            'api_access'               => 'REST API and Webhook access is available as a $29/mo add-on on Starter, or included on Core & Scale.',
            'webhooks'                 => 'Webhooks access is available as a $29/mo add-on on Starter, or included on Core & Scale.',
            'security_activity_log'    => 'Security Activity Log & Audit Trail is available as a $39/mo add-on on Starter, or included on Core & Scale.',
            'custom_roles'             => 'Custom Role Permissions are available as a $39/mo add-on on Starter, or included on Core & Scale.',
            'white_label'              => 'White-label customization is available as a $49/mo add-on on Core, or included on Scale.',
            'network_unlimited'        => 'Unlimited B2B network connections are included on Core & Scale.',
            'consolidated_reporting'   => 'Consolidated multi-entity reporting requires the Scale plan.',
            'woocommerce'              => 'WooCommerce channel sync is available as a $19/mo add-on or included on Scale.',
        ];

        $targetLabel = match ($this->upgradeTarget) {
            'starter' => 'Starter ($49/mo)',
            'core' => 'Core ($99/mo)',
            'scale', 'business' => 'Scale ($299/mo)',
            default => 'Enterprise',
        };

        $msg = $messages[$feature] ?? "The feature '{$feature}' requires an upgrade to {$targetLabel}.";
        parent::__construct($msg);
    }

    public function getFeature(): string
    {
        return $this->feature;
    }

    public function getCurrentCount(): ?int
    {
        return $this->currentCount;
    }

    public function getLimit(): mixed
    {
        return $this->limit;
    }

    public function getUpgradeTarget(): string
    {
        return $this->upgradeTarget;
    }

    /**
     * Render into a structured JSON response for Axios or flash redirect for Inertia.
     */
    public function render($request)
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        $payload = [
            'type'           => 'plan_limit',
            'feature'        => $this->feature,
            'message'        => $this->getMessage(),
            'upgrade_target' => $this->upgradeTarget,
            'upgrade_url'    => $tenant ? route('store.billing.upgrade', ['store_slug' => $tenant->slug, 'feature' => $this->feature]) : '#',
            'billing_url'    => $tenant ? route('store.billing', ['store_slug' => $tenant->slug]) : '#',
            'portal_url'     => ($tenant && $tenant->lemon_squeezy_customer_id) ? route('store.billing.portal', ['store_slug' => $tenant->slug]) : '#',
            'current_plan'   => $tenant?->plan === 'ltd' ? $tenant->effectivePlan() : $tenant?->plan,
            'current_count'  => $this->currentCount,
            'limit'          => $this->limit ?? $tenant?->getLimit($this->feature),
        ];

        if ($request->header('X-Inertia')) {
            return back()->with('plan_limit', $payload);
        }

        return response()->json($payload, 403);
    }
}
