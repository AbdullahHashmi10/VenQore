<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Feature Rate Limits & Spend Caps
    |--------------------------------------------------------------------------
    |
    | Defines per-feature token bucket capacity, refill rates, daily limits,
    | and spend caps used by AiRateLimiter and AiSpendGuard.
    |
    */
    'features' => [
        'query' => [
            'capacity'       => 10,
            'refill_per_sec' => 0.5,
            'day_limit'      => 100,
            'spend_cap'      => 3.00,
            'estimated_cost' => 0.0015,
        ],
        'scan' => [
            'capacity'       => 5,
            'refill_per_sec' => 0.2,
            'day_limit'      => 50,
            'spend_cap'      => 5.00,
            'estimated_cost' => 0.0050,
        ],
        'catalog' => [
            'capacity'       => 5,
            'refill_per_sec' => 0.2,
            'day_limit'      => 50,
            'spend_cap'      => 2.00,
            'estimated_cost' => 0.0010,
        ],
        'visitor_chat' => [
            'capacity'       => 5,
            'refill_per_sec' => 0.2,
            'day_limit'      => 50,
            'spend_cap'      => 3.00,
            'estimated_cost' => 0.0010,
        ],
        'public_tool' => [
            'capacity'       => 10,
            'refill_per_sec' => 0.5,
            'day_limit'      => 200,
            'spend_cap'      => 10.00,
            'estimated_cost' => 0.0120,
        ],
        'match_fallback' => [
            'capacity'       => 10,
            'refill_per_sec' => 1.0,
            'day_limit'      => 200,
            'spend_cap'      => 1.00,
            'estimated_cost' => 0.0005,
        ],
    ],

    'default' => [
        'capacity'       => 10,
        'refill_per_sec' => 0.5,
        'day_limit'      => 100,
        'spend_cap'      => 3.00,
        'estimated_cost' => 0.0020,
    ],

    /*
    |--------------------------------------------------------------------------
    | Upstream HTTP Timeouts (Seconds)
    |--------------------------------------------------------------------------
    */
    'timeout' => [
        'query'   => 20,
        'scan'    => 30,
        'catalog' => 25,
        'default' => 20,
    ],

    /*
    |--------------------------------------------------------------------------
    | Execution Budgets
    |--------------------------------------------------------------------------
    */
    'tool_loop_max_rounds'   => 2,
    'tool_loop_wall_clock_s' => 25,

    /*
    |--------------------------------------------------------------------------
    | Resolver Pipeline
    |--------------------------------------------------------------------------
    */
    'resolvers' => [
        // Phase 3 will prepend:
        // \App\Services\Ai\Resolvers\DeterministicResolver::class,
        // \App\Services\Ai\Resolvers\MemoryResolver::class,
        // \App\Services\Ai\Resolvers\CacheResolver::class,
        \App\Services\Ai\Resolvers\ModelResolver::class,
    ],
];
