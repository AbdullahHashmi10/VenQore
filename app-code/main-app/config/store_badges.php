<?php

/*
|--------------------------------------------------------------------------
| Store badges
|--------------------------------------------------------------------------
| Shown on a store's public page and in the shop directory. Earned
| automatically (nightly, `commerce:badges-refresh`) from real activity; the
| platform owner can force any badge on or off for a store in Platform HQ
| (Store Badges). A forced "off" is never undone by the nightly run.
|
| `priority` decides which three show on a directory card (lowest first).
| Thresholds are deliberately modest so a young marketplace has something to
| award, and are cheap to raise later.
*/
return [
    'max_on_card' => 3,

    'badges' => [
        'early_merchant' => [
            'label' => 'Early merchant',
            'description' => 'One of the first businesses on VenQore.',
            'tone' => 'amber',
            'priority' => 1,
            'limit' => (int) env('BADGE_EARLY_MERCHANT_LIMIT', 100), // first N stores to sign up
        ],
        'top_rated' => [
            'label' => 'Top rated',
            'description' => 'Customers rate this business 4.5 or higher.',
            'tone' => 'emerald',
            'priority' => 2,
            'min_rating' => 4.5,
            'min_reviews' => 5,
        ],
        'most_reviewed' => [
            'label' => 'Most reviewed',
            'description' => 'Among the most reviewed businesses on VenQore.',
            'tone' => 'violet',
            'priority' => 3,
            'min_reviews' => 5,
            'top' => 5,
        ],
        'fastest_growing' => [
            'label' => 'Fastest growing',
            'description' => 'Orders are climbing fast compared with last month.',
            'tone' => 'sky',
            'priority' => 4,
            'min_recent_orders' => 10,
            'min_growth' => 0.5, // +50% on the previous 30 days
            'top' => 5,
        ],
        'most_ordered' => [
            'label' => 'Most ordered',
            'description' => 'One of the busiest businesses this month.',
            'tone' => 'rose',
            'priority' => 5,
            'min_orders' => 20,
            'top' => 5,
        ],
        'fast_responder' => [
            'label' => 'Fast responder',
            'description' => 'Usually confirms orders within minutes.',
            'tone' => 'teal',
            'priority' => 6,
            'max_minutes' => 10,
            'min_orders' => 10,
        ],
    ],
];
