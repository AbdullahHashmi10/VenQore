<?php

/*
|--------------------------------------------------------------------------
| Builder capability flags — Phase 0 (BUILDER_FINAL_PLAN.md §7, §13, §14)
|--------------------------------------------------------------------------
| "Live in config/modules.php" means the registry says live. It does NOT mean
| the task works end to end. This file records what has actually been walked.
|
|   modules[key].state
|     verified      a person walked the bundle's real task end to end
|     registry_live registry says live, task NOT yet walked (Phase 0 pending)
|     blocked       never composed in onboarding; the need is kept as a gap
|   modules[key].note     what was checked, or what still has to be walked
|
| LAUNCH GATE (§14): no module a workflow can compose may be `registry_live`
| when the campaign starts. CapabilityGateTest::test_launch_gate_report lists
| every one that is.
|
| Static evidence only so far (read from the repo on 14 Oct 2026): a person
| still has to walk the tasks named in each note under the default owner role
| before changing a state to `verified`.
|
| flags — read by workflow conditions as `cap:<flag>` / `!cap:<flag>`
*/

$live = fn (string $note) => ['state' => 'registry_live', 'note' => $note];
$blocked = fn (string $note, string $gap) => ['state' => 'blocked', 'note' => $note, 'gap' => $gap];

return [

    'flags' => [
        // POS without a fake product. Unknown => false => quick invoice is used instead.
        'pos_pure_service' => false,
        // WooCommerce webhook + stock sync exists (WooSync\WooOrderPoster, woocommerce:sync-stock).
        'woocommerce' => true,
        // True only once a marketplace connector (other than WooCommerce) is verified.
        'marketplace_provider_selected' => false,
    ],

    // Providers Q8c may offer in its picker. An alias such as "Daraz" never implies a connector.
    'marketplace_providers' => [
        // 'daraz' => ['label' => 'Daraz', 'verified' => false],
    ],

    // Needs that are never offered at launch (§15 decision 3). Shown as "Coming soon — notify me".
    'gaps' => [
        'hire'          => 'Hiring items out with availability and returns',
        'memberships'   => 'Memberships and class access',
        'estimates'     => 'Formal estimates',
        'proposals'     => 'Detailed proposals and tenders',
        'landed_cost'   => 'Freight and duty added to item cost',
        'composite'     => 'Bundles that deduct their parts automatically',
        'marketplace'   => 'Selling on an online marketplace',
        'existing_site' => 'Connecting your existing website',
    ],

    'modules' => [
        'products'            => $live('Walk: add item → price → sell. Static: InventoryController serves the catalogue.'),
        'services'            => $live('Walk: create service → job → complete → invoice.'),
        'customers'           => $live('Walk: add customer → invoice → payment.'),
        'suppliers'           => $live('Walk: add supplier → purchase → payment → balance.'),
        'pos'                 => $live('Walk: sell → refund. Pure-service use is flagged off (pos_pure_service).'),
        'invoicing'           => $live('Walk: invoice for a service with no stock item → credit note.'),
        'quotations'          => $blocked('Registry status: building.', 'estimates'),
        'sales_orders'        => $live('Walk: order → fulfil later → invoice.'),
        'sales_returns'       => $live('Walk: refund at till; credit note against an ordinary invoice with no stock.'),
        'recurring_invoices'  => $live('Walk: enable with no schedule created; confirm nothing sends.'),
        'b2b_proposals'       => $blocked('Held back until quotations is live (plan §1: depends on a module still being built).', 'proposals'),
        'pricing_tiers'       => $live('Walk: price group on a product; confirm service-price support.'),
        'park_recall'         => $live('Walk: hold a bill → recall.'),
        'table_service'       => $live('Walk: table → order → pay (FOH, /foh/tables).'),
        'pre_sales'           => $live('Walk: set goods aside for an order; confirm a deposit alone does not reserve stock.'),
        'inventory'           => $live('Walk: count, correct, sale deducts.'),
        'multi_location'      => $live('Walk: two locations, separate counts.'),
        'stock_transfers'     => $live('Walk: move stock between locations.'),
        'stock_takes'         => $live('Walk: count → apply difference.'),
        'batches_expiry'      => $live('Walk: receive batch with expiry → sell → FIFO.'),
        'serials'             => $live('Walk: receive serial → sell → return.'),
        'variants'            => $live('Walk: item with size/colour → sell one variant.'),
        'barcodes_labels'     => $live('Walk: scan at till; print a label.'),
        'units_of_measure'    => $live('Walk: buy a box, sell pieces; sell by weight.'),
        'purchases'           => $live('Walk: purchase → receive → pay (partial).'),
        'purchase_orders'     => $live('Walk: order → receive against it.'),
        'purchase_returns'    => $live('Walk: partial return → debit note → supplier balance (task smoke test 8).'),
        'landed_cost'         => $blocked('Registry status: beta.', 'landed_cost'),
        'cookbook'            => $live('Walk: recipe with cost.'),
        'production_runs'     => $live('Walk: production run uses materials, adds output.'),
        'composite_items'     => $blocked('Registry status: beta.', 'composite'),
        'khata_credit'        => $live('Walk: customer balance AND the supplier side (payables surface) — verify before launch.'),
        'payments'            => $live('Walk: part-pay a sale and a purchase.'),
        'expenses'            => $live('Walk: record an expense.'),
        'cash_register'       => $live('Walk: open → sell cash → close; confirm cashless stores are not forced to count cash.'),
        'bank_accounts'       => $live('Walk: pay into a bank account.'),
        'bank_reconciliation' => $live('Walk: match one statement line.'),
        'accounting_workspace'=> $live('Walk: journal view after a sale.'),
        'tax_compliance'      => $live('Walk: sale → tax on receipt (task smoke test 8). Never decides legal obligations.'),
        'fixed_assets'        => $live('Walk: asset → depreciation. Registry note: route/page verification outstanding.'),
        'loans'               => $live('Walk: loan → repayment.'),
        'reports'             => $live('Walk: reports render with only the enabled workflows.'),
        'ai_insights'         => $live('Metered by plan; copy must not promise unlimited use.'),
        'loyalty_gift'        => $live('Walk: earn → redeem; gift card.'),
        'marketplace_sync'    => $live('WooCommerce only. Enabled but NOT connected by any prior.'),
        'staff_attendance'    => $live('Walk: clock in/out.'),
        'online_store'        => $live('Walk: enabled but unpublished; publish is a separate owner action.'),
        'onsite_catalogue'    => $live('Walk: enabled but unpublished; publish is a separate owner action.'),
    ],
];
