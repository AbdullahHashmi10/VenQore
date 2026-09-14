<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Horizon Domain
    |--------------------------------------------------------------------------
    | The subdomain under which Horizon will be accessible.
    | For VenQore: venqore.com/horizon (super-admin eyes only)
    */

    'domain' => env('HORIZON_DOMAIN', null),
    'path'   => env('HORIZON_PATH', 'horizon'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Notifications (Pre-Launch Checklist §14)
    |--------------------------------------------------------------------------
    | Alert the operator when a queue exceeds wait-time thresholds OR when
    | a job enters the failed state.
    |
    | Slack: Set HORIZON_SLACK_WEBHOOK in .env to a Slack Incoming Webhook URL.
    |   Create at: https://api.slack.com/apps → Incoming Webhooks
    |   Recommended channel: #venqore-alerts
    |
    | SMS:  Set HORIZON_SMS_NUMBER to a Nexmo/Vonage number to get text alerts.
    |       Requires "laravel/vonage-notification-channel" package.
    |
    | The alert fires when:
    |   - A queue wait time exceeds the 'waits' thresholds below
    |   - A job fails (all retry attempts exhausted)
    */
    'notifications' => [
        'sms' => [
            'via'       => [\Illuminate\Notifications\Channels\VonageSmsChannel::class],
            'to'        => env('HORIZON_SMS_NUMBER', ''),
        ],

        'slack' => [
            'webhook_url' => env('HORIZON_SLACK_WEBHOOK', ''),
        ],
        'email' => [
            'to'   => env('HORIZON_ALERT_EMAIL', env('MAIL_FROM_ADDRESS', 'hello@venqore.com')),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Connection
    |--------------------------------------------------------------------------
    */

    'use' => 'default',

    'prefix' => env('HORIZON_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_') . '_horizon:'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Route Middleware
    |--------------------------------------------------------------------------
    | Only super-admins can see the Horizon dashboard.
    */

    'middleware' => ['web', 'auth', 'superadmin'],

    /*
    |--------------------------------------------------------------------------
    | Queue Wait Time Thresholds
    |--------------------------------------------------------------------------
    | Alert (Slack/email) if a queue exceeds these wait times (seconds).
    */

    'waits' => [
        'redis:provisioning' => 30,   // Provisioning must complete in <30s
        'redis:emails'       => 60,
        'redis:default'      => 120,
        'redis:heavy'        => 300,  // Report exports can take up to 5 min
    ],

    'trim' => [
        'recent'        => 60,    // Keep recent jobs for 60 minutes
        'pending'       => 60,
        'completed'     => 60,
        'recent_failed' => 10080, // Keep failed jobs for 7 days for debugging
        'failed'        => 10080,
        'monitored'     => 10080,
    ],

    'silenced' => [],

    'metrics' => [
        'trim_snapshots' => [
            'job'   => 24,
            'queue' => 24,
        ],
    ],

    'fast_termination' => false,

    'memory_limit' => 256, // MB — increase if report exports OOM

    /*
    |--------------------------------------------------------------------------
    | Queue Worker Configuration
    |--------------------------------------------------------------------------
    |
    | Queue strategy:
    |   provisioning — Highest priority. New customer signup. Never starved.
    |   emails       — High priority. Lifecycle emails. 1 worker, fast.
    |   default      — Normal background work.
    |   heavy        — Report exports, WooCommerce sync. Low priority, high memory.
    */

    'environments' => [

        'production' => [
            'supervisor-provisioning' => [
                'connection'  => 'redis',
                'queue'       => ['provisioning'],
                'balance'     => 'simple',
                'processes'   => 2,
                'tries'       => 3,
                'timeout'     => 60,
                'memory'      => 128,
            ],
            'supervisor-emails' => [
                'connection'  => 'redis',
                'queue'       => ['emails'],
                'balance'     => 'simple',
                'processes'   => 2,
                'tries'       => 3,
                'timeout'     => 30,
                'memory'      => 64,
            ],
            'supervisor-default' => [
                'connection'  => 'redis',
                'queue'       => ['default'],
                'balance'     => 'auto',
                'processes'   => 4,
                'tries'       => 3,
                'timeout'     => 90,
                'memory'      => 128,
                'balanceMaxShift'    => 5,
                'balanceCooldown'    => 3,
            ],
            'supervisor-heavy' => [
                'connection'  => 'redis',
                'queue'       => ['heavy'],
                'balance'     => 'simple',
                'processes'   => 1,  // One at a time to prevent server overload
                'tries'       => 2,
                'timeout'     => 600, // 10 min max for report exports
                'memory'      => 256,
            ],
        ],

        'local' => [
            'supervisor-local' => [
                'connection' => 'redis',
                'queue'      => ['provisioning', 'emails', 'default', 'heavy'],
                'balance'    => 'simple',
                'processes'  => 2,
                'tries'      => 3,
                'timeout'    => 300,
                'memory'     => 256,
            ],
        ],
    ],
];
