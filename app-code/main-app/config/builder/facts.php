<?php

/*
|--------------------------------------------------------------------------
| Builder facts — the schema (BUILDER_FINAL_PLAN.md §2)
|--------------------------------------------------------------------------
| Every answer, every phrase of owner text and every owner edit becomes ONE of
| these facts. Workflows (config/builder/workflows.php) read facts and nothing
| else. A fact key that is not listed here is rejected by FactStore, so a typo
| in questions.php fails the PolicyCoverage test instead of silently doing
| nothing.
|
| type   bool | enum | string
| values (enum only) the allowed values
|
| Fact record (runtime, see FactStore):
|   key, value, status, source, evidence, question_id, turn, revision
|   status  confirmed | negative | unknown | not_applicable | conflict
|   source  owner_text | answer | readback_edit | owner_override | template_assumption
|
| Trade priors are NOT facts. They live in config/builder/type_hints.php.
*/

$bool = fn (string $group) => ['type' => 'bool', 'group' => $group];
$enum = fn (string $group, array $values) => ['type' => 'enum', 'group' => $group, 'values' => $values];

return [

    'statuses' => ['confirmed', 'negative', 'unknown', 'not_applicable', 'conflict'],
    'sources'  => ['owner_text', 'answer', 'readback_edit', 'owner_override', 'template_assumption'],

    // Higher wins (§2 precedence). template_assumption never beats anything.
    'source_rank' => [
        'readback_edit'       => 5,
        'owner_override'      => 5,
        'answer'              => 4,
        'owner_text'          => 3,
        'template_assumption' => 1,
    ],

    'facts' => [
        // Activity
        'activity.goods'      => $bool('activity'),
        'activity.services'   => $bool('activity'),
        'activity.making'     => $bool('activity'),
        'activity.hire'       => $bool('activity'),
        'activity.other_text' => ['type' => 'string', 'group' => 'activity'],

        // Sale (goods)
        'sale.counter'     => $bool('sale'),
        'sale.bill'        => $bool('sale'),
        'sale.order_later' => $bool('sale'),
        'sale.tables'      => $bool('sale'),

        // Work (services)
        'work.on_the_spot'  => $bool('work'),
        'work.bill'         => $bool('work'),
        'work.booking'      => $bool('work'),
        'work.job_tracked'  => $bool('work'),

        // Items
        'items.resale_stock'     => $bool('items'),
        'items.work_materials'   => $bool('items'),
        'items.counted_supplies' => $bool('items'),
        'items.supplied_by_other'=> $bool('items'),
        'items.buy_to_order'     => $bool('items'),
        'items.none'             => $bool('items'),

        // Money
        'money.customer_later' => $bool('money'),
        'money.supplier_later' => $bool('money'),
        'money.advances'       => $bool('money'),
        'money.paid_in_full'   => $bool('money'),
        'money.cash_till'      => $bool('money'),
        // Owner said accounts are "tiered" without saying whether tiers set prices, credit terms or both (C2 asks).
        'money.tiered_accounts' => $bool('money'),

        // Item identity
        'id.variants'         => $bool('id'),
        'id.batch_expiry'     => $bool('id'),
        'id.serial_owned'     => $bool('id'),
        'id.customer_item_id' => $bool('id'),
        'id.measured'         => $bool('id'),
        'id.pack_convert'     => $bool('id'),
        'id.scan_labels'      => $bool('id'),
        'id.quantity_only'    => $bool('id'),

        // Places / people
        'place.stock_counts' => $enum('place', ['one', 'separate', 'none']),
        'people.users'       => $enum('people', ['solo', 'shared', 'roles']),
        'people.attendance'  => $enum('people', ['none', 'shifts', 'attendance', 'both']),

        // Tax
        'tax.mode' => $enum('tax', ['added', 'included', 'none', 'unsure']),

        // Finance
        'fin.books'       => $bool('fin'),
        'fin.bank_match'  => $bool('fin'),
        'fin.assets'      => $bool('fin'),
        'fin.loans'       => $bool('fin'),
        'fin.tax_reports' => $bool('fin'),

        // Making
        'make.costing'            => $bool('make'),
        'make.runs'               => $bool('make'),
        'make.sell_finished_only' => $bool('make'),
        'make.made_elsewhere'     => $bool('make'),

        // Food
        'food.counter_takeaway' => $bool('food'),
        'food.tables'           => $bool('food'),
        'food.delivery'         => $bool('food'),

        // Channels
        'channel.new_online_shop' => $bool('channel'),
        'channel.qr_menu'         => $bool('channel'),
        'channel.existing_site'   => $bool('channel'),
        'channel.marketplace'     => $bool('channel'),
        'channel.marketplace_provider' => ['type' => 'string', 'group' => 'channel'],
        'channel.messages'        => $bool('channel'),

        // Repeat customers / prices
        'repeat.group_prices'  => $bool('repeat'),
        'repeat.rewards'       => $bool('repeat'),
        'repeat.gift_cards'    => $bool('repeat'),
        'repeat.auto_invoices' => $bool('repeat'),

        // Written offers
        'offer.estimate'        => $bool('offer'),
        'offer.formal_proposal' => $bool('offer'),

        // Job detail
        'job.parts_used'       => $bool('job'),
        'job.progress'         => $bool('job'),
        'job.goods_set_aside'  => $bool('job'),
        'job.delivery_details' => $bool('job'),
    ],

    // Dynamic key families: owner.added.{module}, owner.removed.{module}, gap.{need}
    'dynamic_prefixes' => ['owner.added.', 'owner.removed.', 'gap.'],

    // Derived facts are computed by FactStore::derived(); never stored as answers.
    'derived' => ['d.procures', 'd.tracks_qty', 'd.sells_goods_at_counter'],
];
