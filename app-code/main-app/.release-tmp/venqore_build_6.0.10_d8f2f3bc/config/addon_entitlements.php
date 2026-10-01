<?php

/**
 * Add-on Entitlements Mapping (F8)
 *
 * Maps add-on product slugs from config/pricing.php to the exact feature keys
 * and limit increments they grant to a tenant.
 *
 * Prefixed keys with '+' are quantity add-ons: the increment is multiplied by quantity
 * and added to the current effective value.
 * Unprefixed keys are capability unlocks ('1').
 */

return [
    'audit_roles' => [
        'audit_trail'           => '1',
        'custom_roles'          => '1',
        'security_activity_log' => '1',
    ],
    'api_webhooks' => [
        'api_webhooks' => '1',
        'webhooks'     => '1',
        'api_access'   => '1',
    ],
    'white_label' => [
        'white_label' => '1',
    ],
    'channel_sync' => [
        'woocommerce' => '1',
        'amazon_sync' => '1',
        'ebay_sync'   => '1',
        'tiktok_sync' => '1',
    ],
    'byok' => [
        'hypersearch_byok' => '1',
    ],
    // Quantity add-ons: '+key' => increment applied to current effective value per unit
    'extra_location' => [
        '+locations'      => 1,
        '+location_limit' => 1,
    ],
    'extra_seat' => [
        '+staff_limit' => 1,
    ],
    'extra_register' => [
        '+registers' => 1,
    ],
    'extra_catalogue' => [
        '+sku_limit' => 50000,
    ],
    'ai_topup' => [
        '+ai_credits_monthly' => 1000,
    ],
    'ai_rebuilds' => [
        '+ai_structural_rebuilds' => 5,
    ],
];
