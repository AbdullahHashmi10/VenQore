<?php

/*
|--------------------------------------------------------------------------
| Builder workflows — facts → bundles of modules (BUILDER_FINAL_PLAN.md §4)
|--------------------------------------------------------------------------
| A workflow turns on when its `when` condition holds (condition DSL: see
| config/builder/questions.php). It contributes an explicit, bounded set of
| modules; the WorkflowComposer then runs hard-dependency closure
| (BusinessTypes::withDependencies) and the capability gate on the result.
|
| Companions come from the workflow itself, never from a one-hop chain, and a
| negative fact removes only its own workflow: a module stays on while ANY
| surviving workflow justifies it, and every reason is kept.
|
|   key      W-number from the plan
|   label    owner-facing reason text ("Included so you can ...")
|   area     parent navigation area (a key of `areas` below)
|   tab      where the module lives inside the area (shown on the read-back)
|   when     condition
|   modules  module keys (config/modules.php)
|   gap      instead of modules: a need the product cannot meet yet
|   skip_assumed  true => this workflow never fires from a template assumption
|
| `cap:` and `!cap:` conditions read config/builder/capabilities.php `flags`.
*/

return [

    'areas' => [
        'items'        => 'Items',
        'stock'        => 'Stock',
        'purchasing'   => 'Purchasing',
        'sell'         => 'Sell',
        'invoices'     => 'Invoices',
        'jobs'         => 'Jobs',
        'foh'          => 'Front of house',
        'production'   => 'Production',
        'customers'    => 'Customers',
        'money'        => 'Money & reports',
        'accounts'     => 'Accounts',
        'team'         => 'Team',
        'online'       => 'Online shop',
        'integrations' => 'Integrations',
        'settings'     => 'Settings',
    ],

    // Always on. `ai_insights` is the AI Advisor gift, within the plan's allowance.
    'baseline' => [
        'expenses'    => ['area' => 'money', 'tab' => 'Expenses'],
        'reports'     => ['area' => 'money', 'tab' => 'Reports'],
        'payments'    => ['area' => 'money', 'tab' => 'Payments'],
        'ai_insights' => ['area' => 'money', 'tab' => 'AI Advisor'],
    ],

    'workflows' => [

        'W1'  => ['label' => 'You keep a catalogue of items.', 'area' => 'items',
            'when' => ['any' => ['activity.goods', 'activity.making', 'items.work_materials', 'items.counted_supplies']],
            'modules' => ['products'], 'tab' => 'Items'],

        'W2'  => ['label' => 'You count how much you have, so counts and corrections are included.', 'area' => 'stock',
            'when' => ['d.tracks_qty'],
            'modules' => ['inventory', 'stock_takes'], 'tab' => 'Counts'],

        'W3'  => ['label' => 'You buy stock or materials, so ordering, receiving, paying and returning are included.', 'area' => 'purchasing',
            'when' => ['d.procures'],
            'modules' => ['purchases', 'suppliers', 'purchase_orders', 'purchase_returns', 'payments'], 'tab' => 'Record · Orders · Returns & debit notes · Suppliers'],

        'W3b' => ['label' => 'You pay suppliers later, so supplier balances are included.', 'area' => 'purchasing',
            'when' => ['money.supplier_later'],
            'modules' => ['khata_credit', 'suppliers'], 'tab' => 'Suppliers'],

        'W4'  => ['label' => 'Customers pay at the counter, so refunds and held bills are included.', 'area' => 'sell',
            'when' => ['d.sells_goods_at_counter'],
            'modules' => ['pos', 'park_recall', 'sales_returns', 'payments'], 'tab' => 'Refunds · Held bills'],

        // Pure services that charge on the spot: only if POS works without a fake product (Phase 0).
        'W4s' => ['label' => 'You are paid on the spot, so a quick sale screen is included.', 'area' => 'sell',
            'when' => ['all' => ['work.on_the_spot', ['not' => 'd.sells_goods_at_counter'], 'cap:pos_pure_service']],
            'modules' => ['pos', 'park_recall', 'sales_returns', 'payments'], 'tab' => 'Quick sale'],
        'W4q' => ['label' => 'You are paid on the spot, so a quick invoice is included.', 'area' => 'invoices',
            'when' => ['all' => ['work.on_the_spot', ['not' => 'd.sells_goods_at_counter'], '!cap:pos_pure_service']],
            'modules' => ['invoicing', 'customers', 'payments', 'sales_returns'], 'tab' => 'Quick invoice'],

        'W4b' => ['label' => 'You take cash at a till, so opening and closing the drawer is included.', 'area' => 'sell',
            'when' => ['all' => ['d.sells_goods_at_counter', 'money.cash_till']],
            'modules' => ['cash_register'], 'tab' => 'Cash drawer'],

        'W5'  => ['label' => 'You send bills, so invoices, credit notes and customers are included.', 'area' => 'invoices',
            'when' => ['any' => ['sale.bill', 'work.bill']],
            'modules' => ['invoicing', 'customers', 'payments', 'sales_returns'], 'tab' => 'Invoices'],

        'W6'  => ['label' => 'Customers order now and you supply later, so orders are included.', 'area' => 'sell',
            'when' => ['sale.order_later'],
            'modules' => ['sales_orders', 'customers'], 'tab' => 'Orders'],

        'W6b' => ['label' => 'You set goods aside for customers, so reserved stock is included.', 'area' => 'sell',
            'when' => ['job.goods_set_aside'],
            'modules' => ['pre_sales'], 'tab' => 'Orders'],

        'W7'  => ['label' => 'You do service work, so jobs and customers are included.', 'area' => 'jobs',
            'when' => ['activity.services'],
            'modules' => ['services', 'invoicing', 'customers', 'payments'], 'tab' => 'Jobs'],

        'W8'  => ['label' => 'Customers are served at tables, so table service is included.', 'area' => 'foh',
            'when' => ['any' => ['sale.tables', 'food.tables']],
            'modules' => ['table_service', 'sales_returns'], 'tab' => 'Tables'],

        'W9'  => ['label' => 'You cost what you make, so recipes are included.', 'area' => 'production',
            'when' => ['make.costing'],
            'modules' => ['cookbook'], 'tab' => 'Recipes'],

        'W10' => ['label' => 'You record what you make, so production is included.', 'area' => 'production',
            'when' => ['make.runs'],
            'modules' => ['cookbook', 'production_runs'], 'tab' => 'Production'],

        'W11' => ['label' => 'Some customers pay later, so customer balances are included.', 'area' => 'customers',
            'when' => ['money.customer_later'],
            'modules' => ['customers', 'khata_credit', 'payments'], 'tab' => 'Balances'],

        'W12' => ['label' => 'You take advance payments, so advance handling is included.', 'area' => 'money',
            'when' => ['money.advances'],
            'modules' => ['payments', 'customers'], 'tab' => 'Advances'],

        'W13a' => ['label' => 'You sell sizes, colours or versions.', 'area' => 'stock', 'when' => ['id.variants'], 'modules' => ['variants'], 'tab' => 'Item form'],
        'W13b' => ['label' => 'You track batch numbers or expiry dates.', 'area' => 'stock', 'when' => ['id.batch_expiry'], 'modules' => ['batches_expiry'], 'tab' => 'Item form'],
        'W13c' => ['label' => 'You track a serial or IMEI on each item you sell.', 'area' => 'stock', 'when' => ['id.serial_owned'], 'modules' => ['serials'], 'tab' => 'Item form'],
        'W13d' => ['label' => 'You count by weight, length, volume or box size.', 'area' => 'stock', 'when' => ['any' => ['id.measured', 'id.pack_convert']], 'modules' => ['units_of_measure'], 'tab' => 'Item form'],
        'W13e' => ['label' => 'You scan barcodes or print labels.', 'area' => 'stock', 'when' => ['id.scan_labels'], 'modules' => ['barcodes_labels'], 'tab' => 'Item form'],

        'W14' => ['label' => 'You count stock separately in different places, so locations and transfers are included.', 'area' => 'stock',
            'when' => ['place.stock_counts=separate'],
            'modules' => ['multi_location', 'stock_transfers'], 'tab' => 'Locations'],

        'W15' => ['label' => 'A team will use VenQore, so roles can be set up.', 'area' => 'settings',
            'when' => ['any' => ['people.users=shared', 'people.users=roles']],
            'modules' => [], 'tab' => 'Users & roles'],

        'W16' => ['label' => 'You track staff shifts or attendance.', 'area' => 'team',
            'when' => ['any' => ['people.attendance=shifts', 'people.attendance=attendance', 'people.attendance=both']],
            'modules' => ['staff_attendance'], 'tab' => 'Attendance'],

        'W17' => ['label' => 'You charge tax or need tax reports, so tax setup is included.', 'area' => 'settings',
            'when' => ['any' => ['tax.mode=added', 'tax.mode=included', 'fin.tax_reports']],
            'modules' => ['tax_compliance'], 'tab' => 'Tax'],

        'W18' => ['label' => 'You want full books and accounts.', 'area' => 'accounts', 'when' => ['fin.books'], 'modules' => ['accounting_workspace'], 'tab' => 'Books'],
        'W19' => ['label' => 'You match bank statements.', 'area' => 'accounts', 'when' => ['fin.bank_match'], 'modules' => ['bank_accounts', 'bank_reconciliation'], 'tab' => 'Bank matching'],
        'W20a' => ['label' => 'You track equipment value over time.', 'area' => 'accounts', 'when' => ['fin.assets'], 'modules' => ['fixed_assets'], 'tab' => 'Assets'],
        'W20b' => ['label' => 'You track business loans and repayments.', 'area' => 'accounts', 'when' => ['fin.loans'], 'modules' => ['loans'], 'tab' => 'Loans'],

        'W21' => ['label' => 'Some customers get different prices.', 'area' => 'sell', 'when' => ['repeat.group_prices'], 'modules' => ['pricing_tiers'], 'tab' => 'Price groups'],
        'W22' => ['label' => 'You reward regulars or sell gift cards.', 'area' => 'customers', 'when' => ['any' => ['repeat.rewards', 'repeat.gift_cards']], 'modules' => ['loyalty_gift'], 'tab' => 'Rewards'],
        // Enabled only. No schedule is ever created from this answer.
        'W23' => ['label' => 'You send repeat bills. Nothing is scheduled until you set it up.', 'area' => 'invoices', 'when' => ['repeat.auto_invoices'], 'modules' => ['recurring_invoices'], 'tab' => 'Repeat bills'],

        // Written offers. The CapabilityGate drops these while the modules are
        // building/unverified and records the need as a "coming soon" gap.
        'W27' => ['label' => 'Customers ask for an estimate first.', 'area' => 'invoices', 'when' => ['offer.estimate'], 'modules' => ['quotations'], 'tab' => 'Estimates'],
        'W28' => ['label' => 'Customers ask for a detailed proposal or tender.', 'area' => 'invoices', 'when' => ['offer.formal_proposal'], 'modules' => ['b2b_proposals'], 'tab' => 'Proposals'],

        // Bank accounts: where money lands. Not a decision on its own.
        'Wb'  => ['label' => 'You are paid by transfer or card, so bank accounts are included.', 'area' => 'money',
            'when' => ['any' => ['sale.bill', 'work.bill', 'money.customer_later', 'money.advances', 'fin.bank_match', 'neg:money.cash_till']],
            'modules' => ['bank_accounts'], 'tab' => 'Accounts'],

        // Gifts: added only by an active choice. Always created unpublished.
        'W24' => ['label' => 'Added by you: an online shop (not published until you publish it).', 'area' => 'online',
            'when' => ['any' => ['channel.new_online_shop', 'owner.added.online_store']],
            'modules' => ['online_store'], 'tab' => 'Online shop'],
        'W25' => ['label' => 'Added by you: a QR menu or catalogue (not published until you publish it).', 'area' => 'online',
            'when' => ['any' => ['channel.qr_menu', 'owner.added.onsite_catalogue']],
            'modules' => ['onsite_catalogue'], 'tab' => 'QR menu'],

        'W26a' => ['label' => 'You have a website to connect (not connected until you do it).', 'area' => 'integrations',
            'when' => ['all' => ['channel.existing_site', 'cap:woocommerce']],
            'modules' => ['marketplace_sync'], 'tab' => 'Integrations'],
        'W26b' => ['label' => 'You sell on a marketplace we can connect (not connected until you do it).', 'area' => 'integrations',
            'when' => ['all' => ['channel.marketplace', 'cap:marketplace_provider_selected']],
            'modules' => ['marketplace_sync'], 'tab' => 'Integrations'],

        // ── Needs we cannot meet yet — kept, shown as "Coming soon — notify me" ──
        'G1' => ['gap' => 'hire', 'label' => 'Hiring items out with availability and returns', 'when' => ['activity.hire']],
        'G4' => ['gap' => 'marketplace', 'label' => 'Selling on an online marketplace', 'when' => ['all' => ['channel.marketplace', '!cap:marketplace_provider_selected']]],
        'G5' => ['gap' => 'existing_site', 'label' => 'Connecting your existing website', 'when' => ['all' => ['channel.existing_site', '!cap:woocommerce']]],
    ],
];
