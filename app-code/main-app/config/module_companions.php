<?php

/*
|--------------------------------------------------------------------------
| Module companions — "if you do X, you will also need Y"
|--------------------------------------------------------------------------
|
| Not hard dependencies (those are `requires` in config/modules.php, and the
| store cannot work without them). These are the modules a good consultant
| would switch on alongside: buy from suppliers → you will also send things
| back to them; sell at a counter → you will also take returns.
|
| Applied by the signup builder to the PROPOSAL, before the visitor edits it,
| so every companion shows on the review screen with its reason and can be
| switched off there. Read by WorkspaceBuilderController::show() → `companions`.
|
| Rules: one hop only (companions of companions are NOT followed — that is
| how a lean setup turns into everything). Only live modules. Keep `why`
| short and in plain international English.
*/

return [
    'purchases' => [
        'suppliers'        => 'You buy from suppliers, so you need their details and what you owe them.',
        'purchase_orders'  => 'Send orders to suppliers and receive against them.',
        'purchase_returns' => 'Send faulty or wrong goods back and adjust what you owe.',
        'payments'         => 'Record payments to suppliers.',
    ],
    'products' => [
        'inventory'     => 'Know how much of each product you have.',
        'sales_returns' => 'Customers sometimes bring things back — refund or exchange correctly.',
    ],
    'inventory' => [
        'stock_takes' => 'Count your shelves and fix any difference.',
    ],
    'pos' => [
        'cash_register' => 'Open and close the till and count the cash each day.',
        'sales_returns' => 'Refunds and exchanges at the counter.',
        'park_recall'   => 'Hold a bill while you serve the next customer.',
        'payments'      => 'Card, cash, transfer and split payments.',
    ],
    'invoicing' => [
        'customers'     => 'Invoices go to customers you can look up again.',
        'payments'      => 'Record when an invoice is paid, in full or in part.',
        'sales_returns' => 'Credit notes when something is returned or cancelled.',
    ],
    'sales_orders' => [
        'pre_sales' => 'Reserve stock for an order so it cannot be sold twice.',
    ],
    'khata_credit' => [
        'payments' => 'Record what customers pay off their balance.',
    ],
    'payments' => [
        'bank_accounts' => 'See which bank or cash account the money went to.',
    ],
    'multi_location' => [
        'stock_transfers' => 'Move stock between your locations.',
    ],
    'services' => [
        'invoicing' => 'Bill for the work you do.',
    ],
];
