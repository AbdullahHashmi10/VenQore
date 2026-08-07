<?php

return [
    /*
    |--------------------------------------------------------------------------
    | VenQore Single Source of Truth for Pricing & Plans (V4 Spec)
    |--------------------------------------------------------------------------
    |
    | All plan prices, add-ons, AI quotas, and external payment provider (Lemon
    | Squeezy) variant IDs live here. UI components (Pricing.jsx), billing
    | controllers, provisioning jobs, and seeders must consume this config.
    |
    */

    'currency' => 'USD',

    'plans' => [
        'counter' => [
            'name'           => 'Counter',
            'slug'           => 'counter',
            'price_monthly'  => 18.00,
            'price_annual'   => 180.00,
            'sku_limit'      => 500,
            'staff_limit'    => 2,
            'location_limit' => 1,
            'ai_pages'       => 10,
            'ai_queries'     => 50,
            'value_badge'    => null,
            'variant_id_monthly' => env('LEMONSQUEEZY_VARIANT_COUNTER_MONTHLY', 'REPLACE_ME'),
            'variant_id_annual'  => env('LEMONSQUEEZY_VARIANT_COUNTER_ANNUAL', 'REPLACE_ME'),
        ],
        'starter' => [
            'name'           => 'Starter',
            'slug'           => 'starter',
            'price_monthly'  => 36.00,
            'price_annual'   => 360.00,
            'sku_limit'      => 5000,
            'staff_limit'    => 5,
            'location_limit' => 2,
            'ai_pages'       => 25,
            'ai_queries'     => 100,
            'value_badge'    => '5× better value per product',
            'variant_id_monthly' => env('LEMONSQUEEZY_VARIANT_STARTER_MONTHLY', 'REPLACE_ME'),
            'variant_id_annual'  => env('LEMONSQUEEZY_VARIANT_STARTER_ANNUAL', 'REPLACE_ME'),
        ],
        'growth' => [
            'name'           => 'Growth',
            'slug'           => 'growth',
            'price_monthly'  => 63.00,
            'price_annual'   => 630.00,
            'sku_limit'      => 20000,
            'staff_limit'    => 10,
            'location_limit' => 5,
            'ai_pages'       => 100,
            'ai_queries'     => 500,
            'value_badge'    => '11× better value per product',
            'variant_id_monthly' => env('LEMONSQUEEZY_VARIANT_GROWTH_MONTHLY', 'REPLACE_ME'),
            'variant_id_annual'  => env('LEMONSQUEEZY_VARIANT_GROWTH_ANNUAL', 'REPLACE_ME'),
        ],
        'business' => [
            'name'           => 'Business',
            'slug'           => 'business',
            'price_monthly'  => 129.00,
            'price_annual'   => 1290.00,
            'sku_limit'      => 50000,
            'staff_limit'    => 50,
            'location_limit' => 10,
            'ai_pages'       => 500,
            'ai_queries'     => 2500,
            'value_badge'    => '14× better value per product',
            'variant_id_monthly' => env('LEMONSQUEEZY_VARIANT_BUSINESS_MONTHLY', 'REPLACE_ME'),
            'variant_id_annual'  => env('LEMONSQUEEZY_VARIANT_BUSINESS_ANNUAL', 'REPLACE_ME'),
        ],
    ],

    'ai_tiers' => [
        'spark' => [
            'name'          => 'Spark',
            'price_monthly' => 3.00,
            'pages'         => 500,
            'queries'       => 2500,
            'variant_id'    => env('LEMONSQUEEZY_VARIANT_AI_SPARK', 'REPLACE_ME'),
            'capabilities'  => [
                'audio_upload'    => false,
                'pdf_multipage'   => true,
                'bulk_upload'     => false,
                'priority_queue'  => false,
                'growth_signals'  => false,
                'scan_api'        => false,
            ],
        ],
        'shop' => [
            'name'          => 'Shop',
            'price_monthly' => 6.00,
            'pages'         => 1000,
            'queries'       => 5000,
            'variant_id'    => env('LEMONSQUEEZY_VARIANT_AI_SHOP', 'REPLACE_ME'),
            'capabilities'  => [
                'audio_upload'    => true,
                'pdf_multipage'   => true,
                'bulk_upload'     => false,
                'priority_queue'  => false,
                'growth_signals'  => false,
                'scan_api'        => false,
            ],
        ],
        'pro' => [
            'name'          => 'Pro',
            'price_monthly' => 12.00,
            'pages'         => 2000,
            'queries'       => 10000,
            'variant_id'    => env('LEMONSQUEEZY_VARIANT_AI_PRO', 'REPLACE_ME'),
            'capabilities'  => [
                'audio_upload'    => true,
                'pdf_multipage'   => true,
                'bulk_upload'     => true,
                'priority_queue'  => true,
                'growth_signals'  => false,
                'scan_api'        => false,
            ],
        ],
        'max' => [
            'name'          => 'Max',
            'price_monthly' => 24.00,
            'pages'         => 4000,
            'queries'       => 20000,
            'variant_id'    => env('LEMONSQUEEZY_VARIANT_AI_MAX', 'REPLACE_ME'),
            'capabilities'  => [
                'audio_upload'    => true,
                'pdf_multipage'   => true,
                'bulk_upload'     => true,
                'priority_queue'  => true,
                'growth_signals'  => true,
                'scan_api'        => true,
            ],
        ],
    ],

    'add_ons' => [
        'ai_topup' => [
            'name'          => '200 AI Pages Top-up',
            'price'         => 2.00,
            'pages'         => 200,
            'variant_id'    => env('LEMONSQUEEZY_VARIANT_AI_TOPUP', 'REPLACE_ME'),
        ],
        'staff_seat' => [
            'name'          => 'Additional Staff Seat',
            'price_monthly' => 5.00,
            'variant_id'    => env('LEMONSQUEEZY_VARIANT_STAFF_SEAT', 'REPLACE_ME'),
        ],
        'location_seat' => [
            'name'          => 'Additional Location Seat',
            'price_monthly' => 10.00,
            'variant_id'    => env('LEMONSQUEEZY_VARIANT_LOCATION_SEAT', 'REPLACE_ME'),
        ],
        'byok' => [
            'name'          => 'Use My Own AI Key (BYOK)',
            'price_monthly' => 19.00,
            'trial_pages'   => 50,
            'variant_id'    => env('LEMONSQUEEZY_VARIANT_BYOK', 'REPLACE_ME'),
        ],
    ],

    'smart_upgrade_nudges' => [
        'counter' => [
            'staff_threshold'    => 2,
            'location_threshold' => 1,
            'suggested_plan'     => 'starter',
        ],
        'starter' => [
            'staff_threshold'    => 4,
            'location_threshold' => 1,
            'suggested_plan'     => 'growth',
        ],
        'growth' => [
            'staff_threshold'    => 12,
            'location_threshold' => 5,
            'suggested_plan'     => 'business',
        ],
    ],

    'ltd_plans' => [
        // Value must match database/seeders/PlanFeatureMatrixSeeder.php — the seeded plan_limits table is the runtime source of truth. This config value is read only as a fallback if the plan was never seeded.
        'ltd_tier_1' => [
            'name'                   => 'AppSumo Tier 1 (LTD)',
            'slug'                   => 'ltd_tier_1',
            'price_lifetime'         => 99.00,
            'transactions_per_month' => 1000,
            'sku_limit'              => 5000,
            'staff_limit'            => 2,
            'location_limit'         => 1,
            'managed_ai_blocked'     => true,
            'variant_id'             => env('LEMONSQUEEZY_VARIANT_LTD_TIER_1', 'REPLACE_ME'),
        ],
        'ltd_tier_2' => [
            'name'                   => 'AppSumo Tier 2 (LTD)',
            'slug'                   => 'ltd_tier_2',
            'price_lifetime'         => 199.00,
            'transactions_per_month' => 3000,
            'sku_limit'              => 20000,
            'staff_limit'            => 5,
            'location_limit'         => 2,
            'managed_ai_blocked'     => true,
            'variant_id'             => env('LEMONSQUEEZY_VARIANT_LTD_TIER_2', 'REPLACE_ME'),
        ],
        'ltd_tier_3' => [
            'name'                   => 'AppSumo Tier 3 (LTD)',
            'slug'                   => 'ltd_tier_3',
            'price_lifetime'         => 349.00,
            'transactions_per_month' => 8000,
            'sku_limit'              => 50000,
            'staff_limit'            => 15,
            'location_limit'         => 5,
            'managed_ai_blocked'     => true,
            'variant_id'             => env('LEMONSQUEEZY_VARIANT_LTD_TIER_3', 'REPLACE_ME'),
        ],
    ],
];
