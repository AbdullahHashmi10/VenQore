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
        'api_key'              => env('LEMON_SQUEEZY_API_KEY'),
        'store_id'             => env('LEMON_SQUEEZY_STORE_ID'),
        'signing_secret'       => env('LEMON_SQUEEZY_SIGNING_SECRET'),
        'starter_variant_id'   => env('LEMON_SQUEEZY_STARTER_VARIANT_ID'),
        'growth_variant_id'    => env('LEMON_SQUEEZY_GROWTH_VARIANT_ID'),
        'business_variant_id'  => env('LEMON_SQUEEZY_BUSINESS_VARIANT_ID'),
    ],

    'google' => [
        'client_id'     => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect'      => env('GOOGLE_REDIRECT_URL', 'http://127.0.0.1:8000/auth/google/callback'),
    ],

];
