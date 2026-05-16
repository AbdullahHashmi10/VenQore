<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Services\PlanGate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * BillingController — Plan Management System v2
 *
 * Now reads plan data from the database (plans + plan_limits tables)
 * instead of the static config/plans.php file.
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
        try {
            $locationCount = \App\Models\Warehouse::count();
        } catch (\Throwable) {
            $locationCount = 1;
        }

        // Load available subscription plans from DB (visible, active, subscription type only)
        // Grouped by platform for the upgrade carousel in the UI
        $availablePlans = Plan::with(['limits', 'features', 'platform'])
            ->where('is_active', true)
            ->where('is_visible', true)
            ->whereIn('type', ['subscription', 'trial'])
            ->orderBy('sort_order')
            ->get()
            ->map(function (Plan $plan) {
                // Transform limits into a simple key => value map for the frontend
                $limitsMap = $plan->limits->pluck('value', 'key')->toArray();
                return [
                    'id'             => $plan->id,
                    'slug'           => $plan->slug,
                    'name'           => $plan->display_name ?? $plan->name,
                    'type'           => $plan->type,
                    'price_monthly'  => $plan->price_monthly,
                    'price_annual'   => $plan->price_annual,
                    'is_featured'    => $plan->is_featured,
                    'platform'       => $plan->platform?->name,
                    'limits'         => $limitsMap,
                    'features'       => $plan->features->map(fn($f) => [
                        'feature'     => $f->feature,
                        'is_included' => $f->is_included,
                    ])->values()->toArray(),
                ];
            });

        return Inertia::render('Billing/Index', [
            'tenant' => [
                'name'                 => $tenant->name,
                'plan'                 => $tenant->plan,
                'status'               => $tenant->status,
                'trial_ends_at'        => $tenant->trial_ends_at?->toIso8601String(),
                'subscription_ends_at' => $tenant->subscription_ends_at?->toIso8601String(),
            ],
            'plans' => $availablePlans,
            'usage' => [
                'staff_count'    => $staffCount,
                'staff_limit'    => $tenant->getLimit('staff_limit'),
                'product_count'  => $productCount,
                'sku_limit'      => $tenant->getLimit('sku_limit'),
                'location_count' => $locationCount,
                'locations'      => $tenant->getLimit('locations'),
                'transactions'   => $tenant->getLimit('transactions_per_month'),
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

        $checkoutUrls = [
            'starter'  => env('LEMON_SQUEEZY_STARTER_CHECKOUT_URL'),
            'growth'   => env('LEMON_SQUEEZY_GROWTH_CHECKOUT_URL'),
            'business' => env('LEMON_SQUEEZY_BUSINESS_CHECKOUT_URL'),
        ];

        $url = $checkoutUrls[$targetPlan] ?? $checkoutUrls['growth'];

        if (!$url) {
            return back()->withErrors(['billing' => 'Upgrade URL is not configured. Please contact support.']);
        }

        // Pre-fill Lemon Squeezy checkout with tenant context
        $url = $url
            . '?checkout[email]=' . urlencode($tenant->ownerEmail() ?? '')
            . '&checkout[custom][tenant_id]=' . $tenant->id;

        return redirect()->away($url);
    }

    /**
     * Redirect tenant to their Lemon Squeezy customer portal (manage/cancel subscription).
     */
    public function portal(): RedirectResponse
    {
        if (!app()->bound('current.tenant')) {
            abort(403, 'No tenant context.');
        }

        $tenant = app('current.tenant');

        if (!$tenant->lemon_squeezy_customer_id) {
            return back()->withErrors(['billing' => 'No active subscription found to manage.']);
        }

        return redirect()->away(
            'https://app.lemonsqueezy.com/my-orders/' . $tenant->lemon_squeezy_customer_id
        );
    }
}
