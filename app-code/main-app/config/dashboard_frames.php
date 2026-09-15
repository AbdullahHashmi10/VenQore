<?php

/*
|==============================================================================
| Dashboard frames — the eight shapes
|==============================================================================
|
| A FRAME IS GEOMETRY. It contains no reading key, no chart type, no business
| name. If you are about to add one of those to this file, you want
| config/dashboard_pool.php instead.
|
| Every slot's `category` + `fit` is DERIVED from its w x h and must be a fit
| declared in resources/layout-law.json. LayoutLaw::validate() fails any card
| whose w/h disagrees with its fit, so a typo here is caught on write.
|
| `accepts` is an ordered preference list of card classes
| (App\Services\Dashboard\CardClass). FrameFiller walks it left to right and
| takes the first available pool entry of that class whose chart's legibility
| floor is at or below this slot's category.
|
| `accent_slot` is Mechanism M1 — the one accent-filled card on the board.
|
| A slot that cannot be filled stays EMPTY. The board never re-packs. That is
| what makes "the same layout whatever card is inside it" true.
|
| Geometry cheat-sheet (layout-law.json, after this spec's eleven additions):
|   C2 inline 4x1 | C3 standard 3x2 | C3 wide 4x2 | C3 band 6x2
|   C4 standard 3x4 | C4 wide 6x3 | C4 broad 6x4 | C4 column 4x6
|   C5 band 8x3 | C5 wideband 7x4 | C5 stage 8x6 | C5 pillar 5x8
|   C6 banner 12x4 | C6 hero 12x5
*/

return [

    'spotlight' => [
        'name'        => 'Spotlight',
        'rows'        => 14,
        'accent_slot' => 1,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 4 , 'h' => 1, 'category' => 'C2', 'fit' => 'inline', 'role' => 'strip', 'accepts' => ['kpi', 'status']],
            ['slot' => 2 , 'x' => 4 , 'y' => 0 , 'w' => 4 , 'h' => 1, 'category' => 'C2', 'fit' => 'inline', 'role' => 'strip', 'accepts' => ['kpi', 'status']],
            ['slot' => 3 , 'x' => 8 , 'y' => 0 , 'w' => 4 , 'h' => 1, 'category' => 'C2', 'fit' => 'inline', 'role' => 'strip', 'accepts' => ['kpi', 'status']],
            ['slot' => 4 , 'x' => 0 , 'y' => 1 , 'w' => 12, 'h' => 4, 'category' => 'C6', 'fit' => 'banner', 'role' => 'hero', 'accepts' => ['trend', 'ledger']],
            ['slot' => 5 , 'x' => 0 , 'y' => 5 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 6 , 'x' => 6 , 'y' => 5 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 7 , 'x' => 0 , 'y' => 8 , 'w' => 4 , 'h' => 6, 'category' => 'C4', 'fit' => 'column', 'role' => 'panel-tall', 'accepts' => ['ranking', 'feed', 'breakdown']],
            ['slot' => 8 , 'x' => 4 , 'y' => 8 , 'w' => 8 , 'h' => 3, 'category' => 'C5', 'fit' => 'band', 'role' => 'stage-band', 'accepts' => ['trend', 'ledger', 'ranking']],
            ['slot' => 9 , 'x' => 4 , 'y' => 11, 'w' => 8 , 'h' => 3, 'category' => 'C5', 'fit' => 'band', 'role' => 'stage-band', 'accepts' => ['trend', 'ledger', 'ranking']],
        ],
    ],

    'headline' => [
        'name'        => 'Headline',
        'rows'        => 12,
        'accent_slot' => 4,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 12, 'h' => 4, 'category' => 'C6', 'fit' => 'banner', 'role' => 'hero', 'accepts' => ['trend', 'ledger']],
            ['slot' => 2 , 'x' => 0 , 'y' => 4 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 3 , 'x' => 6 , 'y' => 4 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 4 , 'x' => 0 , 'y' => 7 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 5 , 'x' => 4 , 'y' => 7 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 6 , 'x' => 8 , 'y' => 7 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 7 , 'x' => 0 , 'y' => 9 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 8 , 'x' => 6 , 'y' => 9 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
        ],
    ],

    'mosaic' => [
        'name'        => 'Mosaic',
        'rows'        => 11,
        'accent_slot' => 4,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 2 , 'x' => 6 , 'y' => 0 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 3 , 'x' => 0 , 'y' => 3 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 4 , 'x' => 6 , 'y' => 3 , 'w' => 6 , 'h' => 2, 'category' => 'C3', 'fit' => 'band', 'role' => 'metric-wide', 'accepts' => ['kpi', 'gauge', 'status']],
            ['slot' => 5 , 'x' => 6 , 'y' => 5 , 'w' => 6 , 'h' => 2, 'category' => 'C3', 'fit' => 'band', 'role' => 'metric-wide', 'accepts' => ['kpi', 'gauge', 'status']],
            ['slot' => 6 , 'x' => 0 , 'y' => 6 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 7 , 'x' => 6 , 'y' => 7 , 'w' => 6 , 'h' => 2, 'category' => 'C3', 'fit' => 'band', 'role' => 'metric-wide', 'accepts' => ['kpi', 'gauge', 'status']],
            ['slot' => 8 , 'x' => 0 , 'y' => 9 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 9 , 'x' => 4 , 'y' => 9 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 10, 'x' => 8 , 'y' => 9 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
        ],
    ],

    'command' => [
        'name'        => 'Command Centre',
        'rows'        => 19,
        'accent_slot' => 1,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 12, 'h' => 5, 'category' => 'C6', 'fit' => 'hero', 'role' => 'hero', 'accepts' => ['trend', 'ledger']],
            ['slot' => 2 , 'x' => 0 , 'y' => 5 , 'w' => 6 , 'h' => 4, 'category' => 'C4', 'fit' => 'broad', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 3 , 'x' => 6 , 'y' => 5 , 'w' => 6 , 'h' => 4, 'category' => 'C4', 'fit' => 'broad', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 4 , 'x' => 0 , 'y' => 9 , 'w' => 4 , 'h' => 6, 'category' => 'C4', 'fit' => 'column', 'role' => 'panel-tall', 'accepts' => ['ranking', 'feed', 'breakdown']],
            ['slot' => 5 , 'x' => 4 , 'y' => 9 , 'w' => 4 , 'h' => 6, 'category' => 'C4', 'fit' => 'column', 'role' => 'panel-tall', 'accepts' => ['ranking', 'feed', 'breakdown']],
            ['slot' => 6 , 'x' => 8 , 'y' => 9 , 'w' => 4 , 'h' => 6, 'category' => 'C4', 'fit' => 'column', 'role' => 'panel-tall', 'accepts' => ['ranking', 'feed', 'breakdown']],
            ['slot' => 7 , 'x' => 0 , 'y' => 15, 'w' => 12, 'h' => 4, 'category' => 'C6', 'fit' => 'banner', 'role' => 'hero', 'accepts' => ['trend', 'ledger']],
        ],
    ],

    'classic' => [
        'name'        => 'Classic',
        'rows'        => 9,
        'accent_slot' => 1,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 3 , 'h' => 2, 'category' => 'C3', 'fit' => 'standard', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 2 , 'x' => 3 , 'y' => 0 , 'w' => 3 , 'h' => 2, 'category' => 'C3', 'fit' => 'standard', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 3 , 'x' => 6 , 'y' => 0 , 'w' => 3 , 'h' => 2, 'category' => 'C3', 'fit' => 'standard', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 4 , 'x' => 9 , 'y' => 0 , 'w' => 3 , 'h' => 2, 'category' => 'C3', 'fit' => 'standard', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 5 , 'x' => 0 , 'y' => 2 , 'w' => 12, 'h' => 4, 'category' => 'C6', 'fit' => 'banner', 'role' => 'hero', 'accepts' => ['trend', 'ledger']],
            ['slot' => 6 , 'x' => 0 , 'y' => 6 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 7 , 'x' => 6 , 'y' => 6 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
        ],
    ],

    'workbench' => [
        'name'        => 'Workbench',
        'rows'        => 11,
        'accent_slot' => 4,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 2 , 'x' => 6 , 'y' => 0 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 3 , 'x' => 0 , 'y' => 3 , 'w' => 8 , 'h' => 6, 'category' => 'C5', 'fit' => 'stage', 'role' => 'stage', 'accepts' => ['trend', 'ledger', 'breakdown']],
            ['slot' => 4 , 'x' => 8 , 'y' => 3 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 5 , 'x' => 8 , 'y' => 5 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 6 , 'x' => 8 , 'y' => 7 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 7 , 'x' => 0 , 'y' => 9 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 8 , 'x' => 4 , 'y' => 9 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 9 , 'x' => 8 , 'y' => 9 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
        ],
    ],

    'pillar' => [
        'name'        => 'Pillar',
        'rows'        => 13,
        'accent_slot' => 4,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 5 , 'h' => 8, 'category' => 'C5', 'fit' => 'pillar', 'role' => 'board-tall', 'accepts' => ['ranking', 'ledger', 'feed', 'breakdown']],
            ['slot' => 2 , 'x' => 5 , 'y' => 0 , 'w' => 7 , 'h' => 4, 'category' => 'C5', 'fit' => 'wideband', 'role' => 'stage', 'accepts' => ['trend', 'ledger', 'breakdown']],
            ['slot' => 3 , 'x' => 5 , 'y' => 4 , 'w' => 7 , 'h' => 4, 'category' => 'C5', 'fit' => 'wideband', 'role' => 'stage', 'accepts' => ['trend', 'ledger', 'breakdown']],
            ['slot' => 4 , 'x' => 0 , 'y' => 8 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 5 , 'x' => 4 , 'y' => 8 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 6 , 'x' => 8 , 'y' => 8 , 'w' => 4 , 'h' => 2, 'category' => 'C3', 'fit' => 'wide', 'role' => 'metric', 'accepts' => ['headline', 'kpi', 'gauge', 'status']],
            ['slot' => 7 , 'x' => 0 , 'y' => 10, 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 8 , 'x' => 6 , 'y' => 10, 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
        ],
    ],

    'focus' => [
        'name'        => 'Focus',
        'rows'        => 12,
        'accent_slot' => 1,
        'slots'       => [
            ['slot' => 1 , 'x' => 0 , 'y' => 0 , 'w' => 4 , 'h' => 1, 'category' => 'C2', 'fit' => 'inline', 'role' => 'strip', 'accepts' => ['kpi', 'status']],
            ['slot' => 2 , 'x' => 4 , 'y' => 0 , 'w' => 4 , 'h' => 1, 'category' => 'C2', 'fit' => 'inline', 'role' => 'strip', 'accepts' => ['kpi', 'status']],
            ['slot' => 3 , 'x' => 8 , 'y' => 0 , 'w' => 4 , 'h' => 1, 'category' => 'C2', 'fit' => 'inline', 'role' => 'strip', 'accepts' => ['kpi', 'status']],
            ['slot' => 4 , 'x' => 0 , 'y' => 1 , 'w' => 3 , 'h' => 4, 'category' => 'C4', 'fit' => 'standard', 'role' => 'panel', 'accepts' => ['breakdown', 'ranking', 'feed']],
            ['slot' => 5 , 'x' => 3 , 'y' => 1 , 'w' => 6 , 'h' => 4, 'category' => 'C4', 'fit' => 'broad', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 6 , 'x' => 9 , 'y' => 1 , 'w' => 3 , 'h' => 4, 'category' => 'C4', 'fit' => 'standard', 'role' => 'panel', 'accepts' => ['breakdown', 'ranking', 'feed']],
            ['slot' => 7 , 'x' => 0 , 'y' => 5 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 8 , 'x' => 6 , 'y' => 5 , 'w' => 6 , 'h' => 3, 'category' => 'C4', 'fit' => 'wide', 'role' => 'panel-wide', 'accepts' => ['ranking', 'breakdown', 'ledger', 'trend']],
            ['slot' => 9 , 'x' => 0 , 'y' => 8 , 'w' => 12, 'h' => 4, 'category' => 'C6', 'fit' => 'banner', 'role' => 'hero', 'accepts' => ['trend', 'ledger']],
        ],
    ],
];
