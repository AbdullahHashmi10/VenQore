<?php

/*
|--------------------------------------------------------------------------
| Builder module policy ledger — 48 modules (BUILDER_DECISION_SYSTEM_V2.md §7)
|--------------------------------------------------------------------------
| Class
|   B baseline          always on
|   W workflow companion  on because a confirmed workflow includes it
|   C conditional task    on only when an owner fact establishes the task
|   O optional enhancement  on only by active choice
|   U unavailable         never composed in ordinary onboarding
|
| Every module in config/modules.php needs a row here (PolicyCoverageTest).
| `why` is the ledger's rule text; the composer's per-module reasons come from
| config/builder/workflows.php.
*/

return [
    'products'             => ['class' => 'C', 'why' => 'Goods catalogue or internal materials.'],
    'services'             => ['class' => 'C', 'why' => 'Service, work or jobs.'],
    'customers'            => ['class' => 'W', 'why' => 'Client bills, identified orders, credit or settlement prerequisite.'],
    'suppliers'            => ['class' => 'W', 'why' => 'Relevant purchasing or supplier settlement.'],
    'pos'                  => ['class' => 'C', 'why' => 'Counter charging.'],
    'invoicing'            => ['class' => 'C', 'why' => 'Client bills or service billing.'],
    'quotations'           => ['class' => 'U', 'why' => 'Detect estimates; keep the gap.'],
    'sales_orders'         => ['class' => 'C', 'why' => 'Committed order for later fulfilment.'],
    'sales_returns'        => ['class' => 'W', 'why' => 'Sale recovery, return or credit.'],
    'recurring_invoices'   => ['class' => 'C', 'why' => 'Automatic repeat-document intention; no schedule from cadence alone.'],
    'b2b_proposals'        => ['class' => 'U', 'why' => 'Formal offers; held until its dependency is ready.'],
    'pricing_tiers'        => ['class' => 'O', 'why' => 'Group or customer pricing.'],
    'park_recall'          => ['class' => 'W', 'why' => 'Inside Counter.'],
    'table_service'        => ['class' => 'C', 'why' => 'Table and kitchen workflow.'],
    'pre_sales'            => ['class' => 'C', 'why' => 'Goods set aside; a deposit alone is not enough.'],
    'inventory'            => ['class' => 'C', 'why' => 'Tracked quantities.'],
    'multi_location'       => ['class' => 'C', 'why' => 'Separately counted stock places.'],
    'stock_transfers'      => ['class' => 'W', 'why' => 'Part of the multi-location bundle.'],
    'stock_takes'          => ['class' => 'W', 'why' => 'Counts and corrections inside Stock.'],
    'batches_expiry'       => ['class' => 'C', 'why' => 'Lot or expiry need on handled stock.'],
    'serials'              => ['class' => 'C', 'why' => 'Individually identified stock.'],
    'variants'             => ['class' => 'C', 'why' => 'Sizes, colours or versions.'],
    'barcodes_labels'      => ['class' => 'O', 'why' => 'Scanning or label workflow.'],
    'units_of_measure'     => ['class' => 'C', 'why' => 'Measured quantities or conversions.'],
    'purchases'            => ['class' => 'C', 'why' => 'Stock or material procurement; expense-only excluded.'],
    'purchase_orders'      => ['class' => 'W', 'why' => 'Always part of Purchasing, whatever the payment terms.'],
    'purchase_returns'     => ['class' => 'W', 'why' => 'Always part of Purchasing.'],
    'landed_cost'          => ['class' => 'U', 'why' => 'Freight or duty allocation; beta.'],
    'cookbook'             => ['class' => 'C', 'why' => 'Recipe, BOM or material costing.'],
    'production_runs'      => ['class' => 'C', 'why' => 'Output and material-usage recording.'],
    'composite_items'      => ['class' => 'U', 'why' => 'Auto-deduction bundles; beta.'],
    'khata_credit'         => ['class' => 'C', 'why' => 'Party balances for pay-later.'],
    'payments'             => ['class' => 'B', 'why' => 'Settlements.'],
    'expenses'             => ['class' => 'B', 'why' => 'Operating expenses; not a substitute for procurement.'],
    'cash_register'        => ['class' => 'W', 'why' => 'Only with evidence of cash or a till.'],
    'bank_accounts'        => ['class' => 'W', 'why' => 'Where non-cash money lands.'],
    'bank_reconciliation'  => ['class' => 'C', 'why' => 'Bank statement matching.'],
    'accounting_workspace' => ['class' => 'C', 'why' => 'Journals and detailed books; the ledger is always on.'],
    'tax_compliance'       => ['class' => 'C', 'why' => 'Confirmed tax setup; never guesses obligations.'],
    'fixed_assets'         => ['class' => 'C', 'why' => 'Asset or depreciation task.'],
    'loans'                => ['class' => 'C', 'why' => 'Borrowing and repayment task.'],
    'reports'              => ['class' => 'B', 'why' => 'Reports for the enabled workflows.'],
    'ai_insights'          => ['class' => 'B', 'why' => 'AI Advisor gift, within the plan allowance.'],
    'loyalty_gift'         => ['class' => 'O', 'why' => 'Rewards or gift cards.'],
    'marketplace_sync'     => ['class' => 'O', 'why' => 'Verified provider only; never connected by a prior.'],
    'staff_attendance'     => ['class' => 'C', 'why' => 'Shifts or attendance only if asked for.'],
    'online_store'         => ['class' => 'O', 'why' => 'Gift by active choice; unpublished.'],
    'onsite_catalogue'     => ['class' => 'O', 'why' => 'Gift by active choice; unpublished.'],
];
