<?php

/*
|--------------------------------------------------------------------------
| Dashboard Card Access Overrides
|--------------------------------------------------------------------------
|
| CardAccessPolicy uses ReckonerRegistry::all()['permissions'] as the default
| view gate for every card. This file overrides only the EXCEPTIONS to those
| defaults.
|
| Structure of each override:
|
|   'drill_overrides'   — specific permission(s) required to drill a card
|                         (default = same as view permissions)
|   'export_overrides'  — specific permission(s) required to export a card
|                         (default = view permissions + data.export)
|   'denial_overrides'  — 'hidden' | 'greyed' when the user cannot view
|                         (default = 'hidden')
|
| Source of truth for the complete card contract matrix:
|   docs/approval-dashboard-audit-2026-09-22/role-card-contracts-349.json
|
| Do not add a card here unless the desired behaviour differs from the
| default rules above.  Approval cards use the default rules and need
| no entries here.
|
*/

return [

    /*
    |----------------------------------------------------------------------
    | Drill overrides
    |----------------------------------------------------------------------
    | Cards whose drill gate differs from their view gate.
    |
    | Key   = card key (e.g. 'finance.cash_balance')
    | Value = permission string OR array of permissions (any-of)
    |----------------------------------------------------------------------
    */
    'drill_overrides' => [
        // Financial drill-downs require the stronger reports.financial key even
        // if the summary card itself is visible to holders of reports.summary
        'core.revenue'            => ['reports.financial'],
        'core.revenue_trend'      => ['reports.financial'],
        'core.net_profit'         => ['reports.financial'],
        'core.gross_profit'       => ['reports.financial'],
        'finance.cash_balance'    => ['reports.financial', 'finance.balances'],
        'finance.bank_balance'    => ['reports.financial', 'finance.balances'],
        'finance.receivables'     => ['reports.financial', 'finance.balances'],
        'finance.payables'        => ['reports.financial', 'finance.balances'],
        'core.receivables_aging'  => ['reports.financial'],
        'core.payables_aging'     => ['reports.financial'],
    ],

    /*
    |----------------------------------------------------------------------
    | Export overrides
    |----------------------------------------------------------------------
    | Cards whose export gate differs from (view + data.export).
    |----------------------------------------------------------------------
    */
    'export_overrides' => [
        // POS-only operational cards are never exported — no drill route
        'pos.items_sold'        => [],  // empty = never
        'pos.transaction_count' => [],
        // Approval queue cards are exported only by reviewers with data.export
        'approval.awaiting_review' => ['approvals.review'],
        'approval.pending_aging'   => ['approvals.review'],
    ],

    /*
    |----------------------------------------------------------------------
    | Denial behaviour overrides
    |----------------------------------------------------------------------
    | Default denial behaviour for all cards is 'hidden'.
    | Set to 'greyed' only when a greyed placeholder is more useful than
    | complete absence (e.g., the card slot is permanent on the layout and
    | a blank shows the user they lack access rather than leaving a hole).
    |----------------------------------------------------------------------
    */
    'denial_overrides' => [
        // Financial summary cards that always appear on owner/admin layouts
        // are greyed rather than hidden when the role lacks the permission,
        // so the layout does not shift unexpectedly.
        'core.revenue'         => 'greyed',
        'core.net_profit'      => 'greyed',
        'core.gross_profit'    => 'greyed',
        'finance.cash_balance' => 'greyed',
        'finance.bank_balance' => 'greyed',
    ],

];
