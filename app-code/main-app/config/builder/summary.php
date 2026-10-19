<?php

/*
|--------------------------------------------------------------------------
| Builder summary fragments (BUILDER_FINAL_PLAN.md §8)
|--------------------------------------------------------------------------
| The "Is this you?" paragraph is built from CONFIRMED facts only. Assumptions
| are listed separately and never woven in. Fragments are joined in order with
| commas; the last is joined with "and". {type} is the picked type's noun
| (type label, lower-cased) or the generic word after `|`.
|
|   when   condition DSL; evaluated on CONFIRMED facts only
|   text   fragment; **bold** marks the tappable fact chip
|   fact   the fact key the chip edits (ReadBack "Change" target)
*/

return [
    'fragments' => [
        ['when' => 'activity.goods',     'fact' => 'activity.goods',    'text' => 'You sell **{type|goods}**'],
        ['when' => ['all' => ['activity.services', ['not' => 'activity.goods']]], 'fact' => 'activity.services', 'text' => 'You do **{type|service work}**'],
        ['when' => ['all' => ['activity.services', 'activity.goods']], 'fact' => 'activity.services', 'text' => 'you also do **service work**'],
        ['when' => ['all' => ['activity.making', ['not' => 'activity.goods']]], 'fact' => 'activity.making', 'text' => 'You **make things yourself**'],
        ['when' => ['all' => ['activity.making', 'activity.goods']], 'fact' => 'activity.making', 'text' => 'you **make some of it yourself**'],

        ['when' => 'place.stock_counts=one',      'fact' => 'place.stock_counts', 'text' => 'from **one place**'],
        ['when' => 'place.stock_counts=separate', 'fact' => 'place.stock_counts', 'text' => 'from **separately counted places**'],

        ['when' => 'sale.counter',     'fact' => 'sale.counter',     'text' => 'customers **pay at the counter**'],
        ['when' => 'sale.bill',        'fact' => 'sale.bill',        'text' => 'you **send bills**'],
        ['when' => 'work.bill',        'fact' => 'work.bill',        'text' => 'you **send bills for your work**'],
        ['when' => 'sale.order_later', 'fact' => 'sale.order_later', 'text' => 'customers **order and you supply later**'],
        ['when' => 'work.booking',     'fact' => 'work.booking',     'text' => 'customers **book times**'],
        ['when' => 'work.job_tracked', 'fact' => 'work.job_tracked', 'text' => 'you **track each job to the end**'],
        ['when' => 'sale.tables',      'fact' => 'sale.tables',      'text' => 'customers are **served at tables**'],

        ['when' => ['all' => ['d.procures', 'items.resale_stock']],   'fact' => 'items.resale_stock', 'text' => 'you **buy stock from suppliers**'],
        ['when' => ['all' => ['d.procures', ['not' => 'items.resale_stock']]], 'fact' => 'items.work_materials', 'text' => 'you **buy parts or materials**'],
        ['when' => 'money.supplier_later', 'fact' => 'money.supplier_later', 'text' => 'you **pay suppliers later**'],
        ['when' => 'items.supplied_by_other', 'fact' => 'items.supplied_by_other', 'text' => 'your **stock is sent to you**'],

        ['when' => 'money.customer_later', 'fact' => 'money.customer_later', 'text' => 'some **customers pay later**'],
        ['when' => 'money.advances',       'fact' => 'money.advances',       'text' => 'you **take advance payments**'],

        ['when' => 'tax.mode=included', 'fact' => 'tax.mode', 'text' => '**prices include tax**'],
        ['when' => 'tax.mode=added',    'fact' => 'tax.mode', 'text' => '**tax is added** to prices'],

        ['when' => 'id.batch_expiry',  'fact' => 'id.batch_expiry',  'text' => 'you **track expiry dates**'],
        ['when' => 'id.variants',      'fact' => 'id.variants',      'text' => 'you **track sizes and colours**'],
        ['when' => 'id.serial_owned',  'fact' => 'id.serial_owned',  'text' => 'you **track serial numbers**'],

        ['when' => 'people.users=solo',  'fact' => 'people.users', 'text' => '**just you** will use it'],
        ['when' => ['any' => ['people.users=shared', 'people.users=roles']], 'fact' => 'people.users', 'text' => 'a **team** will use it'],
    ],

    // "Not included" one-line reasons by fact (an explicit negative) — §8 example.
    'negative_reasons' => [
        'id.batch_expiry' => 'expiry tracking (you said you don\'t need it)',
        'id.variants'     => 'sizes and colours (you said you don\'t need them)',
        'id.serial_owned' => 'serial numbers (you said you don\'t need them)',
    ],

    // Preview paragraph: one short, friendly phrase per area, in area order (completes "You'll be able to …").
    'area_phrases' => [
        'items'      => 'keep a record of your items',
        'stock'      => 'always know what you have in stock',
        'purchasing' => 'order from suppliers and handle returns',
        'sell'       => 'sell quickly and take payments',
        'invoices'   => 'send invoices and get paid',
        'customers'  => 'look after your regular customers',
        'jobs'       => 'follow each job from start to finish',
        'production' => 'track what you make and what it costs',
        'foh'        => 'serve tables and send orders to the kitchen',
        'online'     => 'take orders online',
        'accounts'   => 'keep proper accounts',
        'money'      => 'see where your money goes',
        'team'       => 'give your team their own access',
    ],

    'labels' => [
        'ready'       => 'Ready for what you described',
        'assumptions' => 'Starting setup with assumptions',
        'gaps'        => 'Part of what you need isn\'t available yet',
    ],

    // "We assumed …" copy for §5.6 defaults.
    'assumptions' => [
        'place.stock_counts' => 'We assumed one stock count.',
        'people.users'       => 'We assumed only you will use it.',
        'tax.mode'           => 'Tax is off — switch it on in Settings.',
        'id'                 => 'We didn\'t turn on sizes, expiry or serial numbers.',
        'template'           => 'Starting setup for {type}.',
    ],
];
