<?php

/**
 * Plan Limits Configuration — Phase 4.1 + Phase 7 (AppSumo LTD)
 *
 * This file is the single source of truth for what each pricing tier allows.
 * PlanGate reads this to enforce limits.
 *
 * null  = unlimited
 * false = feature disabled entirely
 * int   = numeric cap
 *
 * Per-tenant overrides are stored in tenants.plan_limits (JSON).
 * The Tenant::getLimit() helper applies overrides before falling back here.
 *
 * AppSumo LTD stacking:
 *   1 code  → plan = 'ltd_1'  (starter-equivalent)
 *   2 codes → plan = 'ltd_2'  (growth-equivalent)
 *   3 codes → plan = 'ltd_3'  (business-equivalent)
 * LTD plans never have a subscription_ends_at — they run forever.
 * Hosting is included for 2 years; afterwards $9/month to stay hosted.
 */

return [

    'starter' => [
        'transactions_per_month' => 2000,   // AppSumo Starter-equivalent
        'locations'    => 1,        // warehouses
        'sku_limit'    => 1000,     // products
        'staff_limit'  => 3,        // users (excluding platform_admin)
        'woocommerce'  => false,    // WooCommerce integration
        'api_access'   => false,    // Public REST API
        'reports'      => 'basic',  // basic | advanced
        'growth_engine'=> false,    // AI retention engine
        'multi_branch' => false,
    ],

    'growth' => [
        'transactions_per_month' => 10000,  // Generous for subscription growth plan
        'locations'    => 3,
        'sku_limit'    => null,     // unlimited
        'staff_limit'  => 10,
        'woocommerce'  => true,
        'api_access'   => false,
        'reports'      => 'advanced',
        'growth_engine'=> true,
        'multi_branch' => true,
    ],

    'business' => [
        'transactions_per_month' => null,   // unlimited
        'locations'    => null,     // unlimited
        'sku_limit'    => null,
        'staff_limit'  => null,
        'woocommerce'  => true,
        'api_access'   => true,
        'reports'      => 'advanced',
        'growth_engine'=> true,
        'multi_branch' => true,
    ],

    // ── AppSumo LTD Plans (Phase 7) ─────────────────────────────────────────
    // Lifetime license + 2 years hosted. No recurring billing.

    'ltd_1' => [   // 1 AppSumo code — Starter-level
        'transactions_per_month' => 500,    // AppSumo listing: 500 tx/mo
        'locations'    => 1,
        'sku_limit'    => 1000,
        'staff_limit'  => 3,
        'woocommerce'  => false,
        'api_access'   => false,
        'reports'      => 'basic',
        'growth_engine'=> false,
        'multi_branch' => false,
        'ltd'          => true,     // perpetual license flag
        'hosted_until' => '+2 years',
    ],

    'ltd_2' => [   // 2 AppSumo codes stacked — Growth-level
        'transactions_per_month' => 2000,   // AppSumo listing: 2,000 tx/mo
        'locations'    => 3,
        'sku_limit'    => null,
        'staff_limit'  => 10,
        'woocommerce'  => true,
        'api_access'   => false,
        'reports'      => 'advanced',
        'growth_engine'=> true,
        'multi_branch' => true,
        'ltd'          => true,
        'hosted_until' => '+2 years',
    ],

    'ltd_3' => [   // 3 AppSumo codes stacked — Business-level
        'transactions_per_month' => 6000,   // AppSumo listing: 6,000 tx/mo
        'locations'    => null,
        'sku_limit'    => null,
        'staff_limit'  => null,
        'woocommerce'  => true,
        'api_access'   => true,
        'reports'      => 'advanced',
        'growth_engine'=> true,
        'multi_branch' => true,
        'ltd'          => true,
        'hosted_until' => '+2 years',
    ],
];
