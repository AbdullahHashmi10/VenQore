<?php

namespace App\Http\Controllers;

use App\Services\PlanGate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * BillingController — Phase 4.3
 *
 * Handles the billing portal for tenants.
 *
 * Routes:
 *   GET  /billing          → Billing dashboard (shows plan, usage, upgrade options)
 *   GET  /billing/upgrade  → Redirect to Lemon Squeezy checkout for upgrade
 *   GET  /billing/portal   → Redirect to Lemon Squeezy customer portal (manage sub)
 *
 * The 'billing.upgrade' route name is referenced by PlanLimitException::render().
 */
class BillingController extends Controller
{
    /**
     * Show the billing dashboard.
     * This page is the destination for all upgrade prompts.
     */
    public function index(): Response
    {
        if (!app()->bound('current.tenant')) {
            abort(403, 'No tenant context.');
        }

        $tenant = app('current.tenant');

        // Live usage counts — compared against plan limits in the UI
        $staffCount    = \App\Models\TenantUser::where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->count();
        $productCount  = \App\Models\Product::count(); // scoped by HasTenant
        $locationCount = \App\Models\Warehouse::count(); // may not exist — catch gracefully
        try {
            $locationCount = \App\Models\Warehouse::count();
        } catch (\Throwable) {
            $locationCount = 1;
        }

        return Inertia::render('Billing/Index', [
            'tenant' => [
                'name'                 => $tenant->name,
                'plan'                 => $tenant->plan,
                'status'               => $tenant->status,
                'trial_ends_at'        => $tenant->trial_ends_at?->toIso8601String(),
                'subscription_ends_at' => $tenant->subscription_ends_at?->toIso8601String(),
            ],
            'plans' => config('plans'),
            'usage' => [
                'staff_count'    => $staffCount,
                'staff_limit'    => $tenant->getLimit('staff_limit'),
                'product_count'  => $productCount,
                'sku_limit'      => $tenant->getLimit('sku_limit'),
                'location_count' => $locationCount,
                'locations'      => $tenant->getLimit('locations'),
            ],
            'mode' => 'admin'
        ]);
    }

    /**
     * Redirect tenant to Lemon Squeezy checkout for an upgrade.
     * The checkout URL is configured per plan variant in .env.
     */
    public function upgrade(Request $request): RedirectResponse
    {
        if (!app()->bound('current.tenant')) {
            abort(403, 'No tenant context.');
        }

        $tenant = app('current.tenant');

        // Determine the target plan (default: next tier up)
        $targetPlan = $request->get('plan', match($tenant->plan) {
            'starter' => 'growth',
            'growth'  => 'business',
            default   => 'growth',
        });

        // Get the Lemon Squeezy checkout URL for this plan
        $checkoutUrl = match($targetPlan) {
            'growth'   => env('LEMON_SQUEEZY_GROWTH_CHECKOUT_URL'),
            'business' => env('LEMON_SQUEEZY_BUSINESS_CHECKOUT_URL'),
            default    => env('LEMON_SQUEEZY_STARTER_CHECKOUT_URL'),
        };

        if (!$checkoutUrl) {
            return back()->withErrors(['billing' => 'Checkout URL not configured. Please contact support.']);
        }

        // Pass pre-fill data to Lemon Squeezy via checkout URL params
        $adminUser = \App\Models\User::withoutTenantScope()
            ->where('tenant_id', $tenant->id)
            ->where('role', 'platform_admin')
            ->first();

        if ($adminUser) {
            $checkoutUrl .= '?checkout[email]=' . urlencode($adminUser->email)
                . '&checkout[custom][tenant_id]=' . urlencode($tenant->id);
        }

        return redirect()->away($checkoutUrl);
    }

    /**
     * Redirect tenant to Lemon Squeezy customer portal to manage their subscription
     * (update card, cancel, view invoices).
     */
    public function portal(): RedirectResponse
    {
        if (!app()->bound('current.tenant')) {
            abort(403, 'No tenant context.');
        }

        $tenant = app('current.tenant');

        // Build the Lemon Squeezy Customer Portal URL
        $portalUrl = 'https://app.lemonsqueezy.com/my-orders/'
            . ($tenant->lemon_squeezy_customer_id ?? '');

        return redirect()->away($portalUrl);
    }
}
