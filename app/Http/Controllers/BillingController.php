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

        $geoService = new \App\Services\GeoPricingService();
        $country = $geoService->resolveCountry(request());

        // Load available subscription plans from DB (visible, active, subscription type only)
        // Grouped by platform for the upgrade carousel in the UI
        $rate = (float) (\App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'usd_pkr_rate')->value('value') ?: 280.0);
        $availablePlans = Plan::with(['limits', 'features', 'platform'])
            ->whereNull('archived_at')
            ->where('is_active', true)
            ->where('is_visible', true)
            ->whereIn('type', ['subscription', 'trial'])
            ->orderBy('sort_order')
            ->get()
            ->map(function (Plan $plan) use ($country, $rate) {
                // Resolve dynamic prices based on geolocation and DB overrides
                if ($country === 'PK') {
                    $priceMonthly = $plan->price_monthly_pkr ?? ($plan->price_monthly ? round($plan->price_monthly * $rate) : null);
                    $priceAnnual = $plan->price_annual_pkr ?? ($plan->price_annual ? round($plan->price_annual * $rate) : null);
                } else {
                    $priceMonthly = $plan->price_monthly;
                    $priceAnnual = $plan->price_annual;
                }

                // Transform limits into a simple key => value map for the frontend
                $limitsMap = $plan->limits->pluck('value', 'key')->toArray();
                return [
                    'id'             => $plan->id,
                    'slug'           => $plan->slug,
                    'name'           => $plan->display_name ?? $plan->name,
                    'type'           => $plan->type,
                    'price_monthly'      => $priceMonthly,
                    'price_annual'       => $priceAnnual,
                    'price_monthly_usd'  => $plan->price_monthly,
                    'price_annual_usd'   => $plan->price_annual,
                    'is_featured'        => $plan->is_featured,
                    'platform'           => $plan->platform?->name,
                    'limits'             => $limitsMap,
                    'features'       => $plan->features->map(fn($f) => [
                        'feature'     => $f->feature,
                        'is_included' => $f->is_included,
                    ])->values()->toArray(),
                ];
            });

        // Compute plan-gated features status for Extra Features tab
        $activeFeatures = [];
        $activeFeatures['woocommerce'] = \App\Models\WooConnection::where('tenant_id', $tenant->id)->exists()
            || (!empty($tenant->sync_channels) && in_array('woocommerce', $tenant->sync_channels));
        $activeFeatures['chatbot'] = \App\Models\Setting::where('tenant_id', $tenant->id)
            ->where('key', 'chatbot_api_key')
            ->where('value', '!=', '')
            ->exists()
            || ($tenant->ai_status && $tenant->ai_status !== 'none');
        $activeFeatures['recurring_invoicing'] = \App\Models\RecurringInvoice::where('tenant_id', $tenant->id)->exists();
        $activeFeatures['multi_branch'] = \App\Models\Warehouse::where('tenant_id', $tenant->id)->count() > 1;
        $activeFeatures['bill_of_materials'] = \DB::table('bill_of_materials')
            ->where('tenant_id', $tenant->id)
            ->exists();
        $activeFeatures['fixed_asset_depreciation'] = \DB::table('journal_entries')
            ->where('tenant_id', $tenant->id)
            ->where('reference_type', 'depreciation')
            ->exists();
        $activeFeatures['fiscal_year_closing'] = \DB::table('journal_entries')
            ->where('tenant_id', $tenant->id)
            ->where('reference_type', 'fiscal_year_close')
            ->exists();
        $activeFeatures['chat_support'] = \App\Models\ChatSession::exists();
        $activeFeatures['api_access'] = \App\Models\Setting::where('tenant_id', $tenant->id)->where('key', 'api_key')->exists()
            || \DB::table('personal_access_tokens')
                ->where('tokenable_type', \App\Models\User::class)
                ->whereIn('tokenable_id', \App\Models\TenantUser::where('tenant_id', $tenant->id)->pluck('user_id'))
                ->exists();
        $activeFeatures['feature_serials'] = (bool) $tenant->feature_serials || \App\Models\ProductSerial::exists();
        $activeFeatures['whatsapp_reminders'] = \App\Models\Setting::where('tenant_id', $tenant->id)->where('key', 'whatsapp_enabled')->where('value', '1')->exists();
        $activeFeatures['loyalty_points'] = \App\Models\Setting::where('tenant_id', $tenant->id)->where('key', 'loyalty_enabled')->where('value', '1')->exists()
            || \App\Models\LoyaltyPoint::exists();
        $activeFeatures['wholesale_pricing'] = \App\Models\Setting::where('tenant_id', $tenant->id)->where('key', 'wholesale_price_enabled')->where('value', '1')->exists();
        $activeFeatures['dedicated_account_manager'] = false;

        $featureStatus = [
            [
                'key' => 'recurring_invoicing',
                'name' => 'Recurring Invoicing',
                'description' => 'Automated invoice generation for retainer and subscription contracts.',
                'is_active' => $activeFeatures['recurring_invoicing'],
                'is_locked' => !PlanGate::check('recurring_invoicing'),
            ],
            [
                'key' => 'multi_branch',
                'name' => 'Multi-Branch Support',
                'description' => 'Managing multiple warehouse and store locations under one tenant.',
                'is_active' => $activeFeatures['multi_branch'],
                'is_locked' => !PlanGate::check('multi_branch') || ($tenant->getLimit('locations') !== null && $tenant->getLimit('locations') <= 1),
            ],
            [
                'key' => 'bill_of_materials',
                'name' => 'Bill of Materials & Manufacturing',
                'description' => 'Create bills of materials and run manufacturing cycles.',
                'is_active' => $activeFeatures['bill_of_materials'],
                'is_locked' => !PlanGate::check('bill_of_materials'),
            ],
            [
                'key' => 'fixed_asset_depreciation',
                'name' => 'Fixed Asset Depreciation',
                'description' => 'Automated ledger entry and depreciation schedules for assets.',
                'is_active' => $activeFeatures['fixed_asset_depreciation'],
                'is_locked' => !PlanGate::check('fixed_asset_depreciation'),
            ],
            [
                'key' => 'fiscal_year_closing',
                'name' => 'Fiscal Year Closing Wizard',
                'description' => 'Wizard to automatically zero P&L accounts and close the financial year.',
                'is_active' => $activeFeatures['fiscal_year_closing'],
                'is_locked' => !PlanGate::check('fiscal_year_closing'),
            ],
            [
                'key' => 'chat_support',
                'name' => 'Live Chat Support',
                'description' => 'Embedded live chat widget, AI bot auto-replies, and agent referral network.',
                'is_active' => $activeFeatures['chat_support'],
                'is_locked' => !PlanGate::check('chat_support'),
            ],
            [
                'key' => 'api_access',
                'name' => 'Public REST API Access',
                'description' => 'Integrate third-party systems and automate inventory syncing via REST API.',
                'is_active' => $activeFeatures['api_access'],
                'is_locked' => !PlanGate::check('api_access'),
            ],
            [
                'key' => 'feature_serials',
                'name' => 'Serial & IMEI Tracking',
                'description' => 'Unique barcode, serial number, and IMEI lifecycle tracking for electronics and batches.',
                'is_active' => $activeFeatures['feature_serials'],
                'is_locked' => !PlanGate::check('imei_scanner'),
            ],
            [
                'key' => 'whatsapp_reminders',
                'name' => 'WhatsApp & SMS Alerts',
                'description' => 'Send automated invoices, payment reminders, and debt alerts via WhatsApp and SMS.',
                'is_active' => $activeFeatures['whatsapp_reminders'],
                'is_locked' => !PlanGate::check('whatsapp_reminders'),
            ],
            [
                'key' => 'loyalty_points',
                'name' => 'Customer Loyalty Points',
                'description' => 'Reward customers with loyalty points and enable redemption cycles.',
                'is_active' => $activeFeatures['loyalty_points'],
                'is_locked' => !PlanGate::check('loyalty_points'),
            ],
            [
                'key' => 'wholesale_pricing',
                'name' => 'Wholesale Pricing Tiers',
                'description' => 'Set separate wholesale prices and bulk quantity rules for buyers.',
                'is_active' => $activeFeatures['wholesale_pricing'],
                'is_locked' => !PlanGate::check('wholesale_pricing'),
            ],
            [
                'key' => 'dedicated_account_manager',
                'name' => 'Dedicated Account Manager',
                'description' => 'White-glove 1-on-1 support access with a dedicated account manager.',
                'is_active' => $activeFeatures['dedicated_account_manager'],
                'is_locked' => !PlanGate::check('dedicated_account_manager'),
            ],
        ];

        $pkVerification = \App\Models\PkVerification::where('tenant_id', $tenant->id)->first();
        $geoInfo = $geoService->getCurrencyInfo($country);

        return Inertia::render('Billing/Index', [
            'tenant' => [
                'id'                   => $tenant->id,
                'name'                 => $tenant->name,
                'plan'                 => $tenant->plan,
                'status'               => $tenant->status,
                'trial_ends_at'        => $tenant->trial_ends_at?->toIso8601String(),
                'subscription_ends_at' => $tenant->subscription_ends_at?->toIso8601String(),
                'ai_status'            => $tenant->ai_status,
                'sync_channels'        => $tenant->sync_channels,
                'grace_ends_at'        => $tenant->grace_ends_at?->toIso8601String(),
                'view_only_since'      => $tenant->view_only_since?->toIso8601String(),
                'plan_limits'          => $tenant->plan_limits,
                'has_customer_id'      => !empty($tenant->lemon_squeezy_customer_id),
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
            'feature_status' => $featureStatus,
            'country'         => $country,
            'geo'             => $geoInfo,
            'pk_verification' => $pkVerification ? [
                'id'               => $pkVerification->id,
                'status'           => $pkVerification->status,
                'rejection_reason' => $pkVerification->rejection_reason,
            ] : null,
            'mode' => 'admin'
        ]);
    }

    /**
     * Redirect tenant to Lemon Squeezy checkout for an upgrade.
     * Supports ?cycle=annual to redirect to annual billing variants.
     */
    public function upgrade(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        if (!app()->bound('current.tenant')) {
            abort(403, 'No tenant context.');
        }

        $tenant = app('current.tenant');

        // Determine the target plan (default: next tier up)
        $targetPlan = strtolower($request->get('plan', match($tenant->plan) {
            'starter' => 'growth',
            'growth'  => 'business',
            default   => 'growth',
        }));

        if ($targetPlan === 'enterprise') {
            $targetPlan = 'business';
        }

        // Read the billing cycle: 'monthly' (default) or 'annual'
        $cycle = $request->get('cycle', 'monthly') === 'annual' ? 'annual' : 'monthly';
        $isAnnual = $cycle === 'annual';

        // Run server-side geolocation resolution
        $geoService = new \App\Services\GeoPricingService();
        $country = $geoService->resolveCountry($request);

        $planModel = Plan::where('slug', $targetPlan)->first();

        $isVerified = \App\Models\PkVerification::where('tenant_id', $tenant->id)
            ->where('status', 'approved')
            ->exists();

        $requestedCurrency = strtoupper($request->get('currency', ''));
        $usePKR = $requestedCurrency === 'PKR' || ($requestedCurrency !== 'USD' && $country === 'PK' && $isVerified);

        if ($usePKR) {
            if ($isAnnual) {
                // Annual PKR: try annual_pkr_url → annual_url → fallback to monthly PKR
                $url = ($planModel && $planModel->checkout_url_annual_pkr)
                    ? $planModel->checkout_url_annual_pkr
                    : match ($targetPlan) {
                        'starter'  => config('services.lemon_squeezy.starter_annual_pkr_url') ?: config('services.lemon_squeezy.starter_pkr_url') ?: config('services.lemon_squeezy.starter_checkout_url'),
                        'growth'   => config('services.lemon_squeezy.growth_annual_pkr_url') ?: config('services.lemon_squeezy.growth_pkr_url') ?: config('services.lemon_squeezy.growth_checkout_url'),
                        'business' => config('services.lemon_squeezy.business_annual_pkr_url') ?: config('services.lemon_squeezy.business_pkr_url') ?: config('services.lemon_squeezy.business_checkout_url'),
                        default    => config('services.lemon_squeezy.growth_annual_pkr_url') ?: config('services.lemon_squeezy.growth_pkr_url') ?: config('services.lemon_squeezy.growth_checkout_url'),
                    };
            } else {
                $url = ($planModel && $planModel->checkout_url_pkr)
                    ? $planModel->checkout_url_pkr
                    : match ($targetPlan) {
                        'starter'  => config('services.lemon_squeezy.starter_pkr_url') ?: config('services.lemon_squeezy.starter_checkout_url'),
                        'growth'   => config('services.lemon_squeezy.growth_pkr_url') ?: config('services.lemon_squeezy.growth_checkout_url'),
                        'business' => config('services.lemon_squeezy.business_pkr_url') ?: config('services.lemon_squeezy.business_checkout_url'),
                        default    => config('services.lemon_squeezy.growth_pkr_url') ?: config('services.lemon_squeezy.growth_checkout_url'),
                    };
            }
        } else {
            if ($isAnnual) {
                // Annual USD: try annual_checkout_url → fallback to monthly
                $url = ($planModel && $planModel->checkout_url_annual)
                    ? $planModel->checkout_url_annual
                    : match ($targetPlan) {
                        'starter'  => config('services.lemon_squeezy.starter_annual_checkout_url') ?: config('services.lemon_squeezy.starter_checkout_url'),
                        'growth'   => config('services.lemon_squeezy.growth_annual_checkout_url') ?: config('services.lemon_squeezy.growth_checkout_url'),
                        'business' => config('services.lemon_squeezy.business_annual_checkout_url') ?: config('services.lemon_squeezy.business_checkout_url'),
                        default    => config('services.lemon_squeezy.growth_annual_checkout_url') ?: config('services.lemon_squeezy.growth_checkout_url'),
                    };
            } else {
                $url = ($planModel && $planModel->checkout_url_usd)
                    ? $planModel->checkout_url_usd
                    : match ($targetPlan) {
                        'starter'  => config('services.lemon_squeezy.starter_checkout_url'),
                        'growth'   => config('services.lemon_squeezy.growth_checkout_url'),
                        'business' => config('services.lemon_squeezy.business_checkout_url'),
                        default    => config('services.lemon_squeezy.growth_checkout_url'),
                    };
            }
        }

        if (!$url) {
            return redirect()->route('store.billing', ['store_slug' => $tenant->slug])
                ->with('error', 'Lemon Squeezy checkout is not configured on this local server. Redirected to billing dashboard plans panel.');
        }

        // Pre-fill Lemon Squeezy checkout with tenant context
        $url = $url
            . '?checkout[email]=' . urlencode($tenant->ownerEmail() ?? '')
            . '&checkout[custom][tenant_id]=' . $tenant->id;

        return Inertia::location($url);
    }


    /**
     * Redirect tenant to their Lemon Squeezy customer portal (manage/cancel subscription).
     */
    public function portal(): \Symfony\Component\HttpFoundation\Response
    {
        if (!app()->bound('current.tenant')) {
            abort(403, 'No tenant context.');
        }

        $tenant = app('current.tenant');

        // No Lemon Squeezy customer ID means this is a trial, local, or manually-provisioned store.
        // Redirect back to billing with a visible flash message instead of withErrors() which
        // gets silently lost when the frontend navigates via window.location.href (GET request).
        if (!$tenant->lemon_squeezy_customer_id) {
            return redirect()
                ->route('store.billing', ['store_slug' => $tenant->slug])
                ->with('info', 'No active Lemon Squeezy subscription found. Please subscribe to a paid plan first to access the billing portal.');
        }

        // Lemon Squeezy customer portal — users log in with their purchase email.
        // The correct URL format is: https://app.lemonsqueezy.com/my-orders
        // Pre-filling with the customer ID as query param for direct access.
        return Inertia::location(
            'https://app.lemonsqueezy.com/my-orders?customer_id=' . $tenant->lemon_squeezy_customer_id
        );
    }

    /**
     * Cancel the active free trial, placing the store in View-Only mode immediately.
     */
    public function cancelTrial(Request $request): RedirectResponse
    {
        if (!app()->bound('current.tenant')) {
            abort(403, 'No tenant context.');
        }

        $tenant = app('current.tenant');

        if ($tenant->status !== 'trial') {
            return back()->with('error', 'Only stores in trial mode can cancel their trial.');
        }

        $tenant->update([
            'status' => 'cancelled',
            'view_only_since' => now(),
        ]);

        \Illuminate\Support\Facades\Log::info("Tenant {$tenant->id} ('{$tenant->slug}') manually cancelled trial and entered View-Only mode.");

        return back()->with('success', 'Your trial has been cancelled. Your store is now in View-Only mode for the next 30 days.');
    }

    /**
     * Generate a Lemon Squeezy checkout URL for an AI/Sync Add-on.
     */
    public function checkoutAddon(Request $request): \Illuminate\Http\JsonResponse
    {
        if (!app()->bound('current.tenant')) {
            return response()->json(['error' => 'No tenant context.'], 403);
        }

        $tenant = app('current.tenant');

        $request->validate([
            'addon_type' => 'required|string|in:ai_byok,ai_starter,ai_lite,ai_pro,ai_ultimate,sync_woocommerce'
        ]);

        $addonType = $request->input('addon_type');

        // Map addon_type to variant ID from config/services.php
        $variantId = match ($addonType) {
            'ai_byok'         => config('services.lemon_squeezy.ai_byok_addon_id'),
            'ai_starter'      => config('services.lemon_squeezy.ai_starter_addon_id'),
            'ai_lite'         => config('services.lemon_squeezy.ai_lite_addon_id'),
            'ai_pro'          => config('services.lemon_squeezy.ai_pro_addon_id'),
            'ai_ultimate'     => config('services.lemon_squeezy.ai_ultimate_addon_id'),
            'sync_woocommerce' => config('services.lemon_squeezy.woocommerce_addon_id'),
            default           => null
        };

        if (!$variantId) {
            return response()->json(['error' => 'Add-on variant ID not configured.'], 500);
        }

        $storeId = env('LEMON_SQUEEZY_STORE_ID');
        $apiKey = env('LEMON_SQUEEZY_API_KEY');

        if (!$storeId || !$apiKey) {
            return response()->json(['error' => 'Lemon Squeezy credentials not configured on the server.'], 500);
        }

        // Call Lemon Squeezy API to generate checkout
        $response = \Illuminate\Support\Facades\Http::withToken($apiKey)
            ->withHeaders(['Accept' => 'application/vnd.api+json', 'Content-Type' => 'application/vnd.api+json'])
            ->post('https://api.lemonsqueezy.com/v1/checkouts', [
                'data' => [
                    'type' => 'checkouts',
                    'attributes' => [
                        'product_options' => [
                            'redirect_url' => route('store.billing', ['store_slug' => $tenant->slug]),
                        ],
                        'checkout_data' => [
                            'email' => $tenant->ownerEmail() ?? '',
                            'custom' => [
                                'tenant_id' => $tenant->id,
                            ]
                        ]
                    ],
                    'relationships' => [
                        'store' => [
                            'data' => [
                                'type' => 'stores',
                                'id' => (string)$storeId
                            ]
                        ],
                        'variant' => [
                            'data' => [
                                'type' => 'variants',
                                'id' => (string)$variantId
                            ]
                        ]
                    ]
                ]
            ]);

        if ($response->failed()) {
            \Illuminate\Support\Facades\Log::error("Lemon Squeezy Add-on checkout generation failed: " . $response->body());
            return response()->json(['error' => 'Failed to create checkout. Lemon Squeezy API returned an error.'], 500);
        }

        $checkoutUrl = $response->json('data.attributes.url');

        return response()->json(['url' => $checkoutUrl]);
    }

    /**
     * Change the tenant's plan (simulate local upgrades and scheduled downgrades).
     */
    public function changePlan(Request $request): RedirectResponse
    {
        if (!app()->bound('current.tenant')) {
            abort(403, 'No tenant context.');
        }

        $tenant = app('current.tenant');

        if ($request->has('cancel_downgrade')) {
            $limits = $tenant->plan_limits ?? [];
            if (isset($limits['pending_downgrade'])) {
                unset($limits['pending_downgrade']);
                $tenant->update(['plan_limits' => $limits]);
                
                \App\Services\PlanRepository::invalidateTenantCache($tenant->id);
                return back()->with('success', 'Scheduled plan downgrade cancelled successfully.');
            }
            return back()->with('error', 'No pending downgrade found.');
        }

        $request->validate([
            'plan' => 'required|string|in:starter,growth,business',
        ]);

        $targetPlan = $request->input('plan');
        $currentPlan = $tenant->plan;

        if ($targetPlan === $currentPlan) {
            return back()->with('error', 'You are already on the ' . ucfirst($targetPlan) . ' plan.');
        }

        $planOrder = ['trial', 'starter', 'growth', 'business'];
        $currentIdx = array_search($currentPlan, $planOrder);
        $targetIdx = array_search($targetPlan, $planOrder);

        if ($currentIdx === false || $targetIdx === false) {
            return back()->with('error', 'Invalid plan transition.');
        }

        // Resolve dynamic prices based on geolocation and DB overrides
        $geoService = new \App\Services\GeoPricingService();
        $country = $geoService->resolveCountry($request);
        $currencySymbol = ($country === 'PK') ? 'Rs ' : '$';

        $targetPlanModel = Plan::where('slug', $targetPlan)->first();
        $currentPlanModel = Plan::where('slug', $currentPlan)->first();

        $fallbackPrices = [
            'trial'    => 0.00,
            'starter'  => 36.00,
            'growth'   => 63.00,
            'business' => 129.00,
        ];

        $rate = (float) (\App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'usd_pkr_rate')->value('value') ?: 280.0);
        if ($targetPlanModel && $currentPlanModel) {
            if ($country === 'PK') {
                $targetPrice = $targetPlanModel->price_monthly_pkr ?? ($targetPlanModel->price_monthly ? round($targetPlanModel->price_monthly * $rate) : $fallbackPrices[$targetPlan]);
                $currentPrice = $currentPlanModel->price_monthly_pkr ?? ($currentPlanModel->price_monthly ? round($currentPlanModel->price_monthly * $rate) : $fallbackPrices[$currentPlan]);
            } else {
                $targetPrice = $targetPlanModel->price_monthly ?? $fallbackPrices[$targetPlan];
                $currentPrice = $currentPlanModel->price_monthly ?? $fallbackPrices[$currentPlan];
            }
        } else {
            $targetPrice = $fallbackPrices[$targetPlan] ?? 0;
            $currentPrice = $fallbackPrices[$currentPlan] ?? 0;
        }

        // Convert types to float for calculations
        $targetPrice = (float)$targetPrice;
        $currentPrice = (float)$currentPrice;

        // ─── Trial Mode Logic ────────────────────────────────────────────────
        if ($tenant->status === 'trial') {
            // Free plan changes during trial
            $limits = $tenant->plan_limits ?? [];
            unset($limits['pending_downgrade']); // Clear any pending scheduled events

            $tenant->update([
                'plan'        => $targetPlan,
                'plan_limits' => $limits,
            ]);

            \App\Services\PlanRepository::invalidatePlanCache($targetPlan);
            \App\Services\PlanRepository::invalidateTenantCache($tenant->id);

            return back()->with('success', 'Trial upgraded to ' . ucfirst($targetPlan) . ' Trial successfully! Since you are in the trial period, this change is completely free.');
        }

        // ─── Regular subscription logic ──────────────────────────────────────
        if ($targetIdx > $currentIdx) {
            // UPGRADE: Immediate change + prorated charge
            $cycleEnd = $tenant->subscription_ends_at ?: now()->addDays(30);
            if ($tenant->subscription_ends_at === null) {
                // If no sub date, set cycle ending in 30 days and charge full target price
                $tenant->update([
                    'plan' => $targetPlan,
                    'status' => 'active',
                    'subscription_ends_at' => $cycleEnd,
                ]);

                \App\Services\PlanRepository::invalidatePlanCache($targetPlan);
                \App\Services\PlanRepository::invalidateTenantCache($tenant->id);

                return back()->with('success', 'Subscription activated on ' . ucfirst($targetPlan) . ' plan successfully! Billed ' . $currencySymbol . number_format($targetPrice, 2) . '.');
            }

            // Prorated calculation
            $cycleStart = $cycleEnd->clone()->subMonth();
            $totalDays = $cycleStart->diffInDays($cycleEnd) ?: 30;
            $remainingDays = now()->diffInDays($cycleEnd, false);
            $remainingDays = max(0, $remainingDays);

            $diff = $targetPrice - $currentPrice;
            $proratedAmount = round($diff * ($remainingDays / $totalDays), 2);
            $proratedAmount = max(0.00, $proratedAmount);

            $limits = $tenant->plan_limits ?? [];
            unset($limits['pending_downgrade']); // Clear scheduled downgrade if upgrading

            $tenant->update([
                'plan'        => $targetPlan,
                'plan_limits' => $limits,
            ]);

            \App\Services\PlanRepository::invalidatePlanCache($targetPlan);
            \App\Services\PlanRepository::invalidateTenantCache($tenant->id);

            return back()->with('success', 'Plan upgraded to ' . ucfirst($targetPlan) . ' successfully! Charged prorated surplus difference of ' . $currencySymbol . number_format($proratedAmount, 2) . " for the remaining {$remainingDays} days of your cycle. Next full billing of " . $currencySymbol . number_format($targetPrice, 2) . ' starts on ' . $cycleEnd->format('F j, Y') . '.');
        } else {
            // DOWNGRADE: Scheduled change at cycle completion
            $effectiveAt = $tenant->subscription_ends_at ?: now()->addDays(30);

            $limits = $tenant->plan_limits ?? [];
            $limits['pending_downgrade'] = [
                'plan'         => $targetPlan,
                'effective_at' => $effectiveAt->toIso8601String(),
            ];

            $tenant->update([
                'plan_limits' => $limits,
            ]);

            \App\Services\PlanRepository::invalidateTenantCache($tenant->id);

            return back()->with('success', 'Downgrade to ' . ucfirst($targetPlan) . ' scheduled successfully. Your plan will change on ' . $effectiveAt->format('F j, Y') . ' after completing your current billing cycle. You will keep all current features and limits until then.');
        }
    }

    /**
     * Deactivate a plan-gated feature locally to return below limit.
     */
    public function deactivateFeature(Request $request): RedirectResponse
    {
        if (!app()->bound('current.tenant')) {
            abort(403, 'No tenant context.');
        }

        $tenant = app('current.tenant');
        $feature = $request->input('feature');

        switch ($feature) {
            case 'woocommerce':
                \App\Models\WooConnection::where('tenant_id', $tenant->id)->forceDelete();
                // Also clear from sync channels list on tenant if present
                $syncs = $tenant->sync_channels ?? [];
                if (($key = array_search('woocommerce', $syncs)) !== false) {
                    unset($syncs[$key]);
                    $tenant->update(['sync_channels' => array_values($syncs)]);
                }
                $message = 'WooCommerce connection disconnected successfully.';
                break;

            case 'growth_engine':
                // Disable chatbot by deleting the settings row
                \App\Models\Setting::where('tenant_id', $tenant->id)
                    ->where('key', 'chatbot_api_key')
                    ->delete();
                $tenant->update(['ai_status' => 'none']);
                $message = 'AI Chatbot and Growth Engine deactivated successfully.';
                break;

            case 'recurring_invoicing':
                // Delete recurring invoices
                \App\Models\RecurringInvoice::where('tenant_id', $tenant->id)->forceDelete();
                $message = 'All recurring invoices deleted successfully.';
                break;

            case 'multi_branch':
                // Keep only the first warehouse (primary)
                $primaryWarehouse = \App\Models\Warehouse::where('tenant_id', $tenant->id)
                    ->orderBy('created_at', 'asc')
                    ->first();
                if ($primaryWarehouse) {
                    \App\Models\Warehouse::where('tenant_id', $tenant->id)
                        ->where('id', '!=', $primaryWarehouse->id)
                        ->delete();
                }
                $message = 'Extra branch locations removed. Only the primary location remains.';
                break;

            case 'bill_of_materials':
                \DB::table('bom_items')->where('tenant_id', $tenant->id)->delete();
                \DB::table('bill_of_materials')->where('tenant_id', $tenant->id)->delete();
                $message = 'All Bill of Materials (BOM) deleted successfully.';
                break;

            case 'fixed_asset_depreciation':
                $entryIds = \DB::table('journal_entries')
                    ->where('tenant_id', $tenant->id)
                    ->where('reference_type', 'depreciation')
                    ->pluck('id')
                    ->toArray();
                app(\App\Services\V3\AccountingService::class)->deleteEntries($entryIds);
                $message = 'Asset depreciation postings cleared from ledger.';
                break;

            case 'fiscal_year_closing':
                $entryIds = \DB::table('journal_entries')
                    ->where('tenant_id', $tenant->id)
                    ->where('reference_type', 'fiscal_year_close')
                    ->pluck('id')
                    ->toArray();
                app(\App\Services\V3\AccountingService::class)->deleteEntries($entryIds);
                $message = 'Fiscal year close postings cleared from ledger.';
                break;

            case 'chat_support':
                \App\Models\ChatSession::query()->each(function ($session) {
                    $session->messages()->delete();
                    $session->delete();
                });
                $message = 'Live Chat Support deactivated and all chat sessions cleared.';
                break;

            case 'api_access':
                \App\Models\Setting::where('tenant_id', $tenant->id)->where('key', 'api_key')->delete();
                $userIds = \App\Models\TenantUser::where('tenant_id', $tenant->id)->pluck('user_id');
                \DB::table('personal_access_tokens')
                    ->where('tokenable_type', \App\Models\User::class)
                    ->whereIn('tokenable_id', $userIds)
                    ->delete();
                $message = 'Public REST API Access keys and tokens revoked successfully.';
                break;

            case 'feature_serials':
                $tenant->update(['feature_serials' => false]);
                \App\Models\ProductSerial::query()->delete();
                $message = 'Serial & IMEI Tracking disabled and all product serials removed.';
                break;

            case 'whatsapp_reminders':
                \App\Models\Setting::where('tenant_id', $tenant->id)
                    ->where('key', 'whatsapp_enabled')
                    ->delete();
                $message = 'WhatsApp & SMS Alerts deactivated successfully.';
                break;

            case 'loyalty_points':
                \App\Models\Setting::where('tenant_id', $tenant->id)
                    ->where('key', 'loyalty_enabled')
                    ->delete();
                \App\Models\LoyaltyBalance::query()->delete();
                \App\Models\LoyaltyPoint::query()->delete();
                $message = 'Customer Loyalty Points program disabled and balances cleared.';
                break;

            case 'wholesale_pricing':
                \App\Models\Setting::where('tenant_id', $tenant->id)
                    ->where('key', 'wholesale_price_enabled')
                    ->delete();
                $message = 'Wholesale Pricing Tiers deactivated successfully.';
                break;

            default:
                return back()->with('error', 'Invalid feature specified.');
        }

        \App\Services\PlanRepository::invalidateTenantCache($tenant->id);

        return back()->with('success', $message);
    }

    /**
     * Generate a Lemon Squeezy checkout URL for the Professional Product Upload Service.
     */
    public function checkoutUploadService(Request $request): \Illuminate\Http\JsonResponse
    {
        if (!app()->bound('current.tenant')) {
            return response()->json(['error' => 'No tenant context.'], 403);
        }

        $tenant = app('current.tenant');

        $request->validate([
            'tier'     => 'required|string|in:basic,descriptions,images',
            'products' => 'required|integer|min:1',
            'variants' => 'required|integer|min:1',
        ]);

        $tier = $request->input('tier');
        $products = (int) $request->input('products');
        $variants = (int) $request->input('variants');

        // Resolve country and dynamic rates
        $geoService = new \App\Services\GeoPricingService();
        $country = $geoService->resolveCountry($request);

        if ($country === 'PK') {
            $baseRates = [
                'basic'        => 100,
                'descriptions' => 150,
                'images'       => 200,
            ];
            $extraPrice = 50;
            $currency = 'PKR';
        } else {
            $baseRates = [
                'basic'        => 0.50,
                'descriptions' => 1.00,
                'images'       => 1.50,
            ];
            $extraPrice = 0.25;
            $currency = 'USD';
        }

        $basePrice = $baseRates[$tier] ?? $baseRates['basic'];
        $extraBlocks = $variants > 5 ? (int) ceil(($variants - 5) / 5) : 0;
        $pricePerProduct = $basePrice + ($extraBlocks * $extraPrice);
        $totalCost = $products * $pricePerProduct;

        if ($currency === 'PKR') {
            $rate = (float) (\App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'usd_pkr_rate')->value('value') ?: 280.0);
            // Convert PKR to USD using an exchange rate of $rate for Lemon Squeezy custom_price
            // Explicitly round the result after scaling to integer cents to prevent IEEE 754 floating point drift
            $amountInCents = (int) round(($totalCost * 100) / $rate);
        } else {
            $amountInCents = (int) round($totalCost * 100);
        }

        // Lemon Squeezy requires checkouts to be at least $1.00 USD (100 cents)
        $amountInCents = max(100, $amountInCents);

        // Fetch credentials from config
        $apiKey = config('services.lemon_squeezy.api_key');
        $storeId = config('services.lemon_squeezy.store_id');
        $variantId = config('services.lemon_squeezy.upload_service_variant_id') ?: config('services.lemon_squeezy.starter_variant_id');

        if (!$apiKey || !$storeId || !$variantId) {
            return response()->json(['error' => 'Lemon Squeezy credentials or variant configuration is missing.'], 500);
        }

        // Call Lemon Squeezy API to generate custom price checkout
        $response = \Illuminate\Support\Facades\Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Accept'        => 'application/vnd.api+json',
            'Content-Type'  => 'application/vnd.api+json',
        ])->post('https://api.lemonsqueezy.com/v1/checkouts', [
            'data' => [
                'type' => 'checkouts',
                'attributes' => [
                    'custom_price' => $amountInCents,
                    'product_options' => [
                        'name' => "Professional Product Upload Service - " . ($tier === 'basic' ? 'Basic Upload' : ($tier === 'descriptions' ? 'Rich Descriptions' : 'AI Images')) . " (" . $products . " products, " . $variants . " variants)",
                        'description' => "Professional catalog preparation and bulk data entry.",
                        'redirect_url' => route('store.billing', ['store_slug' => $tenant->slug]),
                    ],
                    'checkout_data' => [
                        'email' => $tenant->ownerEmail() ?? '',
                        'custom' => [
                            'tenant_id'             => (string) $tenant->id,
                            'is_onboarding_service' => '1',
                            'tier'                  => $tier,
                            'products_count'        => (string) $products,
                            'variants_count'        => (string) $variants,
                            'total_price'           => (string) $totalCost,
                            'currency'              => $currency
                        ]
                    ]
                ],
                'relationships' => [
                    'store' => [
                        'data' => [
                            'type' => 'stores',
                            'id' => (string) $storeId
                        ]
                    ],
                    'variant' => [
                        'data' => [
                            'type' => 'variants',
                            'id' => (string) $variantId
                        ]
                    ]
                ]
            ]
        ]);

        if ($response->failed()) {
            \Illuminate\Support\Facades\Log::error("Lemon Squeezy checkout generation failed: " . $response->body());
            return response()->json(['error' => 'Failed to create checkout. Lemon Squeezy API returned an error.'], 500);
        }

        $checkoutUrl = $response->json('data.attributes.url');

        return response()->json(['url' => $checkoutUrl]);
    }
}
