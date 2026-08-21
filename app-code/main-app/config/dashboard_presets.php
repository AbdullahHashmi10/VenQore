<?php

/*
|==============================================================================
| Dashboard presets — the default boards
|==============================================================================
|
| One unified dashboard, seeded differently per business and per role. Every
| card here is a Reckoner reading (app/Reckoner/ReckonerRegistry.php) with
| Layout Law v2.0 geometry — category C1–C6 + a declared fit, never the
| retired 2x4…8x8 presets. Everything passes through DashboardSanitizer on
| write, so an entry that drifts from the law is coerced, not crashed.
|
| RESOLUTION ORDER (Api\DashboardController::defaultBoard):
|   1. `roles.<role>`            — cashier / accountant / purchasing_officer /
|                                  viewer get a task-shaped board.
|   2. `business.<key>`          — owner / admin / manager get the board for
|                                  the tenant's business (tenants.business_type,
|                                  via `aliases`, or an ai_builder preset key).
|   3. `business.default`        — the fallback board.
|
| Readings a tenant cannot see (permission, plan, capability, module) are
| dropped at seed time by Reckoner::checkAvailability() — a pharmacy without
| staff_attendance simply gets a board without the staff card. Positions are
| then re-packed left-to-right, so a dropped card never leaves a hole.
|
| M1: exactly one card per board carries `style.accent` — the headline metric.
|
| Geometry cheat-sheet (layout-law.json):
|   C2 inline 4x1 · C3 standard 3x2 · C3 full 4x3 · C4 standard 3x4
|   C4 full 4x4 · C5 full 6x6 · C6 full 8x8
*/

return [

    /* ── Role boards ─────────────────────────────────────────────────────── */

    'roles' => [

        'cashier' => [
            ['reading_key' => 'sales.revenue',           'period' => 'today',      'chart' => 'stat',   'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'sales.gross_margin_pct',  'period' => 'today',      'chart' => 'stat',   'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'staff.on_shift_count',    'period' => 'today',      'chart' => 'stat',   'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'party.customer_count',    'period' => 'today',      'chart' => 'stat',   'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.live_feed',         'period' => 'live',       'chart' => 'feed',   'category' => 'C4', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 4, 'h' => 4],
            ['reading_key' => 'sales.payment_breakdown', 'period' => 'today',      'chart' => 'pie',    'category' => 'C4', 'fit' => 'full',     'x' => 4, 'y' => 2, 'w' => 4, 'h' => 4],
            ['reading_key' => 'sales.top_products',      'period' => 'today',      'chart' => 'bar',    'category' => 'C4', 'fit' => 'full',     'x' => 8, 'y' => 2, 'w' => 4, 'h' => 4],
        ],

        'accountant' => [
            ['reading_key' => 'finance.net_profit',           'period' => 'this_month', 'chart' => 'stat',   'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'finance.total_liquidity',      'period' => 'live',       'chart' => 'stat',   'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.receivables',          'period' => 'live',       'chart' => 'stat',   'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.payables',             'period' => 'live',       'chart' => 'stat',   'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.profit_trend',         'period' => 'this_year',  'chart' => 'area',   'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'finance.expenses_by_category', 'period' => 'this_month', 'chart' => 'pie',    'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'finance.receivables_aging',    'period' => 'live',       'chart' => 'bar',    'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'finance.balance_sheet_ok',     'period' => 'live',       'chart' => 'status', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 6, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.expenses_total',       'period' => 'this_month', 'chart' => 'stat',   'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 6, 'w' => 3, 'h' => 2],
        ],

        'purchasing_officer' => [
            ['reading_key' => 'purchasing.spend',          'period' => 'this_month', 'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'purchasing.count',          'period' => 'this_month', 'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.payables',          'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.paid_to_suppliers', 'period' => 'this_month', 'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.low_stock_list',  'period' => 'live',       'chart' => 'table', 'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'inventory.low_stock_count', 'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 2],
            ['reading_key' => 'party.supplier_count',      'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 2],
        ],

        'viewer' => [
            ['reading_key' => 'sales.revenue',       'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'finance.net_profit',  'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.stock_value', 'period' => 'live',     'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'party.customer_count', 'period' => 'live',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend', 'period' => 'this_month', 'chart' => 'area', 'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'sales.top_products',  'period' => 'this_month', 'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
        ],
    ],

    /* ── Business boards (owner / admin / manager) ───────────────────────── */

    'business' => [

        'default' => [
            ['reading_key' => 'sales.revenue',           'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'finance.net_profit',      'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.receivables',     'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.stock_value',   'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',     'period' => 'this_month', 'chart' => 'area', 'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'sales.payment_breakdown', 'period' => 'today',      'chart' => 'pie',  'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'sales.top_products',      'period' => 'this_month', 'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'inventory.low_stock_count', 'period' => 'live',     'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 6, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.expenses_total',  'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 6, 'w' => 3, 'h' => 2],
        ],

        'pos_only' => [
            ['reading_key' => 'sales.revenue',           'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'sales.gross_margin_pct',  'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.expenses_total',  'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'party.customer_count',    'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',     'period' => 'this_month', 'chart' => 'area', 'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'sales.top_products',      'period' => 'this_month', 'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'sales.payment_breakdown', 'period' => 'today',      'chart' => 'pie',  'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
        ],

        'retail_shop' => [
            ['reading_key' => 'sales.revenue',           'period' => 'today',      'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'finance.net_profit',      'period' => 'this_month', 'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.receivables',     'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.stock_value',   'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',     'period' => 'this_month', 'chart' => 'area',  'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'inventory.low_stock_list','period' => 'live',       'chart' => 'table', 'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'sales.top_products',      'period' => 'this_month', 'chart' => 'bar',   'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'finance.expenses_total',  'period' => 'this_month', 'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 6, 'w' => 3, 'h' => 2],
            ['reading_key' => 'party.customer_count',    'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 6, 'w' => 3, 'h' => 2],
        ],

        'grocery' => [
            ['reading_key' => 'sales.revenue',            'period' => 'today',      'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'inventory.low_stock_count','period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.receivables',      'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.payables',         'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',      'period' => 'this_month', 'chart' => 'area',  'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'inventory.low_stock_list', 'period' => 'live',       'chart' => 'table', 'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'sales.payment_breakdown',  'period' => 'today',      'chart' => 'pie',   'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'finance.total_liquidity',  'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 6, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.out_of_stock_count', 'period' => 'live',   'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 6, 'w' => 3, 'h' => 2],
        ],

        'pharmacy' => [
            ['reading_key' => 'sales.revenue',            'period' => 'today',      'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'inventory.low_stock_count','period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.receivables',      'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.stock_value',    'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',      'period' => 'this_month', 'chart' => 'area',  'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'inventory.low_stock_list', 'period' => 'live',       'chart' => 'table', 'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'finance.expenses_by_category', 'period' => 'this_month', 'chart' => 'pie', 'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
        ],

        'cafe' => [
            ['reading_key' => 'sales.revenue',           'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'sales.gross_margin_pct',  'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.expenses_total',  'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'staff.on_shift_count',    'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',     'period' => 'this_month', 'chart' => 'area', 'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'sales.top_products',      'period' => 'today',      'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'sales.payment_breakdown', 'period' => 'today',      'chart' => 'pie',  'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
        ],

        'restaurant' => [
            ['reading_key' => 'sales.revenue',                    'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'restaurant.tables_occupied',       'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'restaurant.kitchen_orders_pending','period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'staff.on_shift_count',             'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',              'period' => 'this_month', 'chart' => 'area', 'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'sales.top_products',               'period' => 'today',      'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'finance.expenses_by_category',     'period' => 'this_month', 'chart' => 'pie',  'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
        ],

        'bakery' => [
            ['reading_key' => 'sales.revenue',              'period' => 'today',      'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'production.run_count',       'period' => 'today',      'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'operations.open_sales_orders','period' => 'live',      'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.low_stock_count',  'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',        'period' => 'this_month', 'chart' => 'area',  'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'sales.top_products',         'period' => 'today',      'chart' => 'bar',   'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'inventory.low_stock_list',   'period' => 'live',       'chart' => 'table', 'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'production.total_cost',      'period' => 'this_month', 'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 6, 'w' => 3, 'h' => 2],
        ],

        'mobile_electronics' => [
            ['reading_key' => 'sales.revenue',          'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'inventory.stock_value',  'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.receivables',    'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.gross_margin_pct', 'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',    'period' => 'this_month', 'chart' => 'area', 'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'sales.top_products',     'period' => 'this_month', 'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'sales.top_customers',    'period' => 'this_month', 'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
        ],

        'clothing' => [
            ['reading_key' => 'sales.revenue',            'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'sales.gross_margin_pct',   'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.low_stock_count','period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.stock_value',    'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',      'period' => 'this_month', 'chart' => 'area', 'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'sales.top_products',       'period' => 'this_month', 'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'sales.payment_breakdown',  'period' => 'today',      'chart' => 'pie',  'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
        ],

        'hardware_store' => [
            ['reading_key' => 'sales.revenue',            'period' => 'today',      'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'finance.receivables',      'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.payables',         'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.low_stock_count','period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',      'period' => 'this_month', 'chart' => 'area',  'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'inventory.low_stock_list', 'period' => 'live',       'chart' => 'table', 'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'sales.top_customers',      'period' => 'this_month', 'chart' => 'bar',   'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
        ],

        'wholesale' => [
            ['reading_key' => 'sales.revenue',             'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'finance.receivables',       'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.payables',          'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.stock_value',     'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.profit_trend',      'period' => 'this_year',  'chart' => 'area', 'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'sales.top_customers',       'period' => 'this_month', 'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'finance.receivables_aging', 'period' => 'live',       'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'purchasing.spend',          'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 6, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.net_profit',        'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 6, 'w' => 3, 'h' => 2],
        ],

        'multi_branch_retail' => [
            ['reading_key' => 'sales.revenue',            'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'finance.total_liquidity',  'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'staff.on_shift_count',     'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.low_stock_count','period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',      'period' => 'this_month', 'chart' => 'area', 'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'sales.payment_breakdown',  'period' => 'today',      'chart' => 'pie',  'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'sales.top_products',       'period' => 'this_month', 'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
        ],

        'manufacturing' => [
            ['reading_key' => 'sales.revenue',           'period' => 'this_month', 'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'production.run_count',    'period' => 'today',      'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'production.total_cost',   'period' => 'this_month', 'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.stock_value',   'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',     'period' => 'this_month', 'chart' => 'area',  'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'inventory.low_stock_list','period' => 'live',       'chart' => 'table', 'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'purchasing.spend',        'period' => 'this_month', 'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 2],
        ],

        'freelancer' => [
            ['reading_key' => 'sales.revenue',             'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'finance.receivables',       'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.expenses_total',    'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.net_profit',        'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.profit_trend',      'period' => 'this_year',  'chart' => 'area', 'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'finance.receivables_aging', 'period' => 'live',       'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'sales.top_customers',       'period' => 'this_month', 'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
        ],

        'salon' => [
            ['reading_key' => 'sales.revenue',           'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'staff.on_shift_count',    'period' => 'today',      'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.expenses_total',  'period' => 'this_month', 'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'party.customer_count',    'period' => 'live',       'chart' => 'stat', 'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',     'period' => 'this_month', 'chart' => 'area', 'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'sales.top_customers',     'period' => 'this_month', 'chart' => 'bar',  'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'sales.payment_breakdown', 'period' => 'today',      'chart' => 'pie',  'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
        ],

        'repair_workshop' => [
            ['reading_key' => 'sales.revenue',              'period' => 'today',      'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2, 'style' => ['accent' => true]],
            ['reading_key' => 'operations.open_sales_orders','period' => 'live',      'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 3, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'inventory.low_stock_count',  'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 6, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'finance.receivables',        'period' => 'live',       'chart' => 'stat',  'category' => 'C3', 'fit' => 'standard', 'x' => 9, 'y' => 0, 'w' => 3, 'h' => 2],
            ['reading_key' => 'sales.revenue_trend',        'period' => 'this_month', 'chart' => 'area',  'category' => 'C5', 'fit' => 'full',     'x' => 0, 'y' => 2, 'w' => 6, 'h' => 6],
            ['reading_key' => 'inventory.low_stock_list',   'period' => 'live',       'chart' => 'table', 'category' => 'C4', 'fit' => 'standard', 'x' => 6, 'y' => 2, 'w' => 3, 'h' => 4],
            ['reading_key' => 'sales.top_customers',        'period' => 'this_month', 'chart' => 'bar',   'category' => 'C4', 'fit' => 'standard', 'x' => 9, 'y' => 2, 'w' => 3, 'h' => 4],
        ],
    ],

    /* ── Aliases ─────────────────────────────────────────────────────────────
       tenants.business_type values (and looser words) → business board keys.
       An unknown value falls through to `default`. */

    'aliases' => [
        'retail' => 'retail_shop',
        'generic' => 'default',
        'automotive' => 'hardware_store',
        'services' => 'freelancer',
        'kiryana' => 'grocery',
        'supermarket' => 'grocery',
        'cafe_bakery' => 'cafe',
        'distribution' => 'wholesale',
    ],
];
