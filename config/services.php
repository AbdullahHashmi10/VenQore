<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'lemon_squeezy' => [
        'api_key'                     => env('LEMON_SQUEEZY_API_KEY'),
        'store_id'                    => env('LEMON_SQUEEZY_STORE_ID'),
        'signing_secret'              => env('LEMON_SQUEEZY_SIGNING_SECRET'),
        
        // Monthly
        'starter_variant_id'          => env('LEMON_SQUEEZY_STARTER_VARIANT_ID'),
        'growth_variant_id'           => env('LEMON_SQUEEZY_GROWTH_VARIANT_ID'),
        'business_variant_id'         => env('LEMON_SQUEEZY_BUSINESS_VARIANT_ID'),
        
        // Annual
        'starter_annual_variant_id'   => env('LEMON_SQUEEZY_STARTER_ANNUAL_VARIANT_ID'),
        'growth_annual_variant_id'    => env('LEMON_SQUEEZY_GROWTH_ANNUAL_VARIANT_ID'),
        'business_annual_variant_id'  => env('LEMON_SQUEEZY_BUSINESS_ANNUAL_VARIANT_ID'),
        
        // LTD
        'starter_ltd_variant_id'      => env('LEMON_SQUEEZY_STARTER_LTD_VARIANT_ID'),
        'growth_ltd_variant_id'       => env('LEMON_SQUEEZY_GROWTH_LTD_VARIANT_ID'),
        'business_ltd_variant_id'     => env('LEMON_SQUEEZY_BUSINESS_LTD_VARIANT_ID'),

        // Add-ons (Sync)
        'woocommerce_addon_id'        => env('LEMON_SQUEEZY_WOOCOMMERCE_ADDON_ID'),
        'amazon_addon_id'             => env('LEMON_SQUEEZY_AMAZON_ADDON_ID'),
        'ebay_addon_id'               => env('LEMON_SQUEEZY_EBAY_ADDON_ID'),
        'tiktok_addon_id'             => env('LEMON_SQUEEZY_TIKTOK_ADDON_ID'),

        // Add-ons (AI)
        'ai_starter_addon_id'         => env('LEMON_SQUEEZY_AI_STARTER_ADDON_ID'),
        'ai_lite_addon_id'            => env('LEMON_SQUEEZY_AI_LITE_ADDON_ID'),
        'ai_pro_addon_id'             => env('LEMON_SQUEEZY_AI_PRO_ADDON_ID'),
        'ai_ultimate_addon_id'        => env('LEMON_SQUEEZY_AI_ULTIMATE_ADDON_ID'),
        'ai_byok_addon_id'            => env('LEMON_SQUEEZY_AI_BYOK_ADDON_ID'),

        // Onboarding Upload Service
        'upload_service_variant_id'   => env('LEMON_SQUEEZY_UPLOAD_SERVICE_VARIANT_ID'),
    ],

    'google' => [
        'client_id'     => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect'      => env('GOOGLE_REDIRECT_URL', 'http://127.0.0.1:8000/auth/google/callback'),
    ],

];
