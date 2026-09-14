<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Provider & Model Pricing Rates (USD per 1,000,000 Tokens)
    |--------------------------------------------------------------------------
    |
    | Rates used by AiUsageRecorder to compute exact USD cost for telemetry
    | logging in ai_usage_events table.
    |
    */

    'models' => [
        // Gemini Models
        'gemini-2.5-flash-lite' => [
            'input_per_m'  => 0.10,
            'output_per_m' => 0.40,
        ],
        'gemini-2.5-flash' => [
            'input_per_m'  => 0.30,
            'output_per_m' => 2.50,
        ],
        'gemini-1.5-flash' => [
            'input_per_m'  => 0.35,
            'output_per_m' => 1.05,
        ],
        'gemini-1.5-pro' => [
            'input_per_m'  => 1.25,
            'output_per_m' => 5.00,
        ],

        // OpenAI Models
        'gpt-4o-mini' => [
            'input_per_m'  => 0.15,
            'output_per_m' => 0.60,
        ],
        'gpt-4o' => [
            'input_per_m'  => 2.50,
            'output_per_m' => 10.00,
        ],

        // Anthropic Models
        'claude-3-5-haiku-20241022' => [
            'input_per_m'  => 0.80,
            'output_per_m' => 4.00,
        ],
        'claude-3-5-sonnet-20241022' => [
            'input_per_m'  => 3.00,
            'output_per_m' => 15.00,
        ],

        // DeepSeek Models
        'deepseek-chat' => [
            'input_per_m'  => 0.14,
            'output_per_m' => 0.28,
        ],
        'deepseek-reasoner' => [
            'input_per_m'  => 0.55,
            'output_per_m' => 2.19,
        ],
    ],

    'default' => [
        'input_per_m'  => 0.30,
        'output_per_m' => 2.50,
    ],
];
