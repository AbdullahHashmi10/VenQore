<?php

return [
    /*
    |--------------------------------------------------------------------------
    | VenSynQ Multi-Channel E-Commerce Fulfillment Engine Config
    |--------------------------------------------------------------------------
    |
    | This file holds configuration settings for platform driver endpoints, OAuth
    | secrets, credentials, and simulation mode flags for local testing.
    |
    */

    // Developer Simulation Mode
    // If true, redirects bypass official API handshakes and simulate connection details and sync lists.
    'simulation_mode' => env('VENSYNQ_SIMULATION_MODE', true),

    // Sandbox Mode — Uses Amazon sandbox endpoints instead of production.
    // Enable this when testing with sandbox credentials from Amazon Developer Console.
    // Set to false only when you have live approved Seller Central credentials.
    'sandbox_mode' => env('VENSYNQ_SANDBOX_MODE', false),

    'platforms' => [
        'amazon' => [
            'client_id'      => env('VENSYNQ_AMAZON_CLIENT_ID', 'amzn1.application-oa2-client.mock_id'),
            'client_secret'  => env('VENSYNQ_AMAZON_CLIENT_SECRET', 'mock_amazon_secret_key_12345'),
            'redirect_uri'   => env('VENSYNQ_AMAZON_REDIRECT_URI', '/vensynq/callback/amazon'),
            'marketplace_id' => env('VENSYNQ_AMAZON_MARKETPLACE_ID', 'A1F83G8C2ARO7P'), // Amazon UK Default
            'refresh_token'  => env('VENSYNQ_AMAZON_REFRESH_TOKEN', null), // Platform-level sandbox/dev token
            'base_url'       => env('VENSYNQ_AMAZON_BASE_URL', 'https://sellingpartnerapi-eu.amazon.com'), // Production EU
            'sandbox_url'    => 'https://sandbox.sellingpartnerapi-eu.amazon.com', // Sandbox EU
        ],

        'tiktok' => [
            'app_key'       => env('VENSYNQ_TIKTOK_APP_KEY', 'mock_tiktok_app_key_54321'),
            'app_secret'    => env('VENSYNQ_TIKTOK_APP_SECRET', 'mock_tiktok_app_secret_abcde'),
            'redirect_uri'  => env('VENSYNQ_TIKTOK_REDIRECT_URI', '/vensynq/callback/tiktok'),
        ],

        'ebay' => [
            'client_id'     => env('VENSYNQ_EBAY_CLIENT_ID', 'mock_ebay_client_id_99988'),
            'client_secret' => env('VENSYNQ_EBAY_CLIENT_SECRET', 'mock_ebay_client_secret_66677'),
            'redirect_uri'  => env('VENSYNQ_EBAY_REDIRECT_URI', '/vensynq/callback/ebay'),
        ],
    ],
];
