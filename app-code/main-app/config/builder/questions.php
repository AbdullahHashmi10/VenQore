<?php

/*
|--------------------------------------------------------------------------
| Builder question bank — exact owner-facing copy (BUILDER_FINAL_PLAN.md §3)
|--------------------------------------------------------------------------
| Nothing is worded by code. Every title, option, grey example and the fact each
| option writes lives here and only here.
|
| Panel keys
|   screen    panels sharing a `screen` id are shown together when both are
|             eligible at the same band (Q4+till, Q6). Default: the panel id.
|   band      §5.2 priority band, 1 (most urgent) to 6 (optional).
|   kind      multi | single
|   ask_when  condition DSL (see FactStore::test) — the panel is eligible only
|             when this holds AND at least one option could still change a
|             decision (its facts are not yet known).
|   options   id => [label, example, writes, exclusive?, when?]
|               writes  fact => value (true for bool facts)
|               when    visibility condition (default: shown while its facts are unknown)
|               exclusive  choosing it clears the others on the panel
|   none      label for the "none of these" outcome (multi panels): rejects only
|               the options that were shown.
|
| Condition DSL leaves
|   'fact.key'            confirmed true          '!fact.key'     not confirmed true
|   'unknown:fact.key'    no answer yet           'fact.key=val'  enum equals
|   'd.procures'          derived fact            'sector:food'   picked type's sector
|   'no_type'             no business type picked
|   ['any'=>[..]] ['all'=>[..]] ['not'=>x]
*/

$SUBTITLE = 'Choose everything that happens in your business.';

return [

    'subtitle_multi' => $SUBTITLE,

    'questions' => [

        // ── Band 1 — clarification of a contradiction ────────────────────
        'C1' => [
            'band' => 1, 'kind' => 'single', 'clarifies' => 'stock_source', 'show_all' => true,
            'title' => 'Where does the stuff you sell come from?',
            'ask_when' => ['all' => ['items.supplied_by_other', 'money.supplier_later', ['not' => 'items.resale_stock']]],
            'options' => [
                'bought' => [
                    'label' => 'We buy it from suppliers', 'example' => 'You place an order with a supplier and pay them for it.',
                    'writes' => ['items.resale_stock' => true, 'items.supplied_by_other' => false],
                ],
                'sent' => [
                    'label' => 'It is sent to us', 'example' => 'Head office or a supplier sends it, and you only pay once it sells.',
                    'writes' => ['items.supplied_by_other' => true, 'money.supplier_later' => false],
                ],
                'both' => [
                    'label' => 'A bit of both', 'example' => 'Some is sent to you, and some you buy yourself.',
                    'writes' => ['items.resale_stock' => true, 'items.supplied_by_other' => true],
                ],
            ],
        ],

        // "Tiered credit accounts": tiers can mean price levels, credit terms, or both. Ask once, narrowly.
        'C2' => [
            'band' => 1, 'kind' => 'single', 'clarifies' => 'account_tiers', 'show_all' => true,
            'title' => 'For your account customers, what do the tiers change?',
            'ask_when' => ['all' => ['money.tiered_accounts', 'unknown:repeat.group_prices']],
            'options' => [
                'prices' => [
                    'label' => 'The price they pay', 'example' => 'A bigger account gets a lower price on the same part.',
                    'writes' => ['repeat.group_prices' => true],
                ],
                'terms' => [
                    'label' => 'How much credit and how long to pay', 'example' => 'One shop can owe more, or gets 60 days instead of 30.',
                    'writes' => ['repeat.group_prices' => false, 'money.customer_later' => true],
                ],
                'both' => [
                    'label' => 'Both', 'example' => 'Better prices and more credit for bigger accounts.',
                    'writes' => ['repeat.group_prices' => true, 'money.customer_later' => true],
                ],
            ],
        ],

        // ── Band 2 — activity and how a sale / job happens ───────────────
        'Q1' => [
            'band' => 2, 'kind' => 'multi',
            'title' => 'What does your business do?',
            'ask_when' => ['all' => ['unknown:activity.goods', 'unknown:activity.services', 'unknown:activity.making', 'unknown:activity.hire']],
            'options' => [
                'goods' => ['label' => 'We sell products', 'example' => 'Things customers take away, like groceries, clothes, phones or spare parts.', 'writes' => ['activity.goods' => true]],
                'services' => ['label' => 'We do work for people', 'example' => 'A service you provide, like repairs, haircuts, cleaning or design.', 'writes' => ['activity.services' => true]],
                'making' => ['label' => 'We make things to sell', 'example' => 'You cook, build or produce what you sell, like meals, furniture or printed items.', 'writes' => ['activity.making' => true]],
                'hire' => ['label' => 'We rent things out', 'example' => 'Customers borrow items and give them back, like tools, event chairs or equipment.', 'writes' => ['activity.hire' => true]],
                'other' => ['label' => 'Something else — let me explain', 'example' => 'Tell us in your own words.', 'writes' => [], 'explain' => 'activity.other_text'],
            ],
        ],

        'Q2g' => [
            'band' => 2, 'kind' => 'multi', 'screen' => 'Q2',
            'title' => 'How do you usually get paid?',
            'ask_when' => ['any' => ['activity.goods', 'activity.making']],
            'options' => [
                'counter' => ['label' => 'The customer pays in the shop and takes it', 'example' => 'They hand over money at the counter and leave straight away.', 'writes' => ['sale.counter' => true]],
                'bill' => ['label' => 'I send the customer a bill', 'example' => 'You give them an invoice and they pay later or by bank transfer.', 'writes' => ['sale.bill' => true]],
                'order_later' => ['label' => 'The customer orders first, I deliver later', 'example' => 'Like deliveries, made-to-order items or big orders.', 'writes' => ['sale.order_later' => true]],
                'tables' => [
                    'label' => 'They sit at a table and we serve them', 'example' => 'Like a café or restaurant.',
                    'writes' => ['sale.tables' => true],
                    'when' => ['any' => ['sector:food', 'activity.making', 'no_type', 'sale.tables']],
                ],
                'other' => ['label' => 'Another way — let me explain', 'example' => 'Tell us in your own words.', 'writes' => [], 'explain' => 'activity.other_text'],
            ],
        ],

        'Q2s' => [
            'band' => 2, 'kind' => 'multi', 'screen' => 'Q2',
            'title' => 'How does your work usually go?',
            'ask_when' => ['activity.services'],
            'options' => [
                'on_the_spot' => ['label' => 'I do the work and get paid straight away', 'example' => 'Like a haircut or a quick fix.', 'writes' => ['work.on_the_spot' => true]],
                'bill' => ['label' => 'I send the customer a bill', 'example' => 'After the job is done, or once a month.', 'writes' => ['work.bill' => true]],
                'booking' => ['label' => 'Customers book a time slot', 'example' => 'Like appointments or sessions in a diary.', 'writes' => ['work.booking' => true]],
                'job_tracked' => ['label' => 'I follow each job from start to finish', 'example' => 'Like a repair or an installation that takes days or weeks.', 'writes' => ['work.job_tracked' => true]],
                'other' => ['label' => 'Another way — let me explain', 'example' => 'Tell us in your own words.', 'writes' => [], 'explain' => 'activity.other_text'],
            ],
        ],

        // ── Band 3 — items and money ─────────────────────────────────────
        'Q3' => [
            'band' => 3, 'kind' => 'multi',
            'title' => 'Do you keep a stock of anything?',
            'ask_when' => ['any' => ['activity.goods', 'activity.services', 'activity.making', 'activity.hire']],
            'none' => 'Nothing, I don\'t keep stock',
            'options' => [
                'resale_stock' => ['label' => 'Products I buy to sell again', 'example' => 'You buy items from suppliers and keep them on shelves until a customer buys them.', 'writes' => ['items.resale_stock' => true]],
                'work_materials' => ['label' => 'Materials I use to make things or do a job', 'example' => 'Raw materials and parts, like flour, wood, pipes or spare parts. Customers don\'t buy these directly.', 'writes' => ['items.work_materials' => true]],
                'counted_supplies' => ['label' => 'Everyday supplies I want to count', 'example' => 'Things you use up while working, like shampoo, cleaning liquid or packaging.', 'writes' => ['items.counted_supplies' => true]],
                'supplied_by_other' => ['label' => 'Products someone else sends me to sell', 'example' => 'Head office or a supplier sends them, and you pay only when they sell.', 'writes' => ['items.supplied_by_other' => true]],
                'buy_to_order' => ['label' => 'I only buy after a customer orders', 'example' => 'You order it from the supplier once the customer asks, so you keep nothing on the shelf.', 'writes' => ['items.buy_to_order' => true]],
                'none' => ['label' => 'Nothing, I don\'t keep stock', 'example' => 'No need to count items.', 'writes' => ['items.none' => true], 'exclusive' => true],
            ],
        ],

        'Q4' => [
            'band' => 3, 'kind' => 'multi', 'screen' => 'Q4',
            'title' => 'Does anyone pay you, or do you pay anyone, later?',
            'ask_when' => [],  // always eligible
            'keep_open' => true,  // customer credit in the description does not answer supplier credit
            'options' => [
                'customer_later' => ['label' => 'Some customers pay me later', 'example' => 'They take the goods now and pay later, or pay in instalments.', 'writes' => ['money.customer_later' => true]],
                'supplier_later' => [
                    'label' => 'I pay some suppliers later', 'example' => 'You take the goods now and pay within a few weeks, or in parts.',
                    'writes' => ['money.supplier_later' => true],
                    'when' => ['any' => ['d.procures', 'unknown:items.resale_stock', 'money.supplier_later']],
                ],
                'advances' => ['label' => 'Customers pay part of it in advance', 'example' => 'A deposit or booking fee before the work or delivery.', 'writes' => ['money.advances' => true]],
                'paid_in_full' => [
                    'label' => 'Everyone pays in full, straight away', 'example' => 'No one owes anyone anything.',
                    'writes' => ['money.paid_in_full' => true], 'exclusive' => true,
                    'when' => ['not' => 'money.customer_later'],
                ],
            ],
        ],

        'Q4till' => [
            'band' => 3, 'kind' => 'single', 'screen' => 'Q4',
            'title' => 'Do you take cash in the shop?',
            'ask_when' => ['sale.counter'],
            'options' => [
                'yes' => ['label' => 'Yes', 'example' => '', 'writes' => ['money.cash_till' => true]],
                'no' => ['label' => 'No, only cards or bank transfers', 'example' => '', 'writes' => ['money.cash_till' => false]],
            ],
        ],

        // ── Band 4 — consequential specialisation ────────────────────────
        'Q5' => [
            'band' => 4, 'kind' => 'multi',
            'title' => 'Do your products come in different kinds that you need to tell apart?',
            'ask_when' => ['d.tracks_qty'],
            'options' => [
                'variants' => ['label' => 'Different sizes or colours', 'example' => 'The same shirt in medium and large, or in red and blue.', 'writes' => ['id.variants' => true]],
                'batch_expiry' => ['label' => 'Expiry dates or batch numbers', 'example' => 'Medicines, food or chemicals that go out of date.', 'writes' => ['id.batch_expiry' => true]],
                'serial_owned' => ['label' => 'A serial number on each item I sell', 'example' => 'Phones and laptops, where every one has its own number (IMEI).', 'writes' => ['id.serial_owned' => true]],
                'customer_item_id' => [
                    'label' => 'The serial number of an item a customer brings me', 'example' => 'Like a phone brought in for repair.',
                    'writes' => ['id.customer_item_id' => true], 'when' => ['any' => ['activity.services', 'id.customer_item_id']],
                ],
                'measured' => ['label' => 'Sold by weight, length or amount', 'example' => 'Like kilos of rice, metres of cloth or litres of oil.', 'writes' => ['id.measured' => true]],
                'pack_convert' => ['label' => 'Bought in boxes, sold one by one', 'example' => 'A carton of 24 that you sell as single items.', 'writes' => ['id.pack_convert' => true]],
                'scan_labels' => ['label' => 'Barcodes or price stickers', 'example' => 'Scan items at the till, or print labels for the shelf.', 'writes' => ['id.scan_labels' => true]],
                'quantity_only' => ['label' => 'No, I only need to know how many I have', 'example' => 'Keep it simple.', 'writes' => ['id.quantity_only' => true], 'exclusive' => true],
            ],
        ],

        'Q7a' => [
            'band' => 4, 'kind' => 'single', 'screen' => 'Q7a',
            'title' => 'Do you charge sales tax (VAT or GST) on what you sell?',
            'ask_when' => ['any' => ['activity.goods', 'activity.services', 'activity.making', 'activity.hire']],
            'options' => [
                'added' => ['label' => 'Yes, I add it on top of my prices', 'example' => 'A $100 item becomes $110 at the till.', 'writes' => ['tax.mode' => 'added']],
                'included' => ['label' => 'Yes, it is already inside my prices', 'example' => 'The price on the tag is the price the customer pays.', 'writes' => ['tax.mode' => 'included']],
                'none' => ['label' => 'No, I don\'t charge tax', 'example' => '', 'writes' => ['tax.mode' => 'none']],
                'unsure' => ['label' => 'Not sure', 'example' => '', 'writes' => ['tax.mode' => 'unsure']],
            ],
        ],

        'Q8a' => [
            'band' => 4, 'kind' => 'multi',
            'title' => 'When you make things, what do you want to keep track of?',
            'ask_when' => ['activity.making'],
            'options' => [
                'costing' => ['label' => 'What goes into each item, and what it costs', 'example' => 'Like the ingredients in a dish, so you know your real cost.', 'writes' => ['make.costing' => true]],
                'runs' => ['label' => 'How much I made each day or batch', 'example' => 'And which materials were used up making it.', 'writes' => ['make.runs' => true]],
                'sell_finished_only' => ['label' => 'Just the sale of the finished item', 'example' => 'No need to track how it was made.', 'writes' => ['make.sell_finished_only' => true]],
                'made_elsewhere' => ['label' => 'Someone else makes it for me', 'example' => 'I only buy it and sell it.', 'writes' => ['make.made_elsewhere' => true]],
            ],
        ],

        'Q8b' => [
            'band' => 4, 'kind' => 'multi',
            'title' => 'How do your customers get their food?',
            'ask_when' => ['any' => ['sector:food', 'sale.tables', 'food.counter_takeaway', 'food.tables', 'food.delivery']],
            'options' => [
                'counter_takeaway' => ['label' => 'They collect it at the counter or take it away', 'example' => '', 'writes' => ['food.counter_takeaway' => true]],
                'tables' => ['label' => 'They sit at a table and the order goes to the kitchen', 'example' => '', 'writes' => ['food.tables' => true]],
                'delivery' => ['label' => 'We deliver it to them', 'example' => '', 'writes' => ['food.delivery' => true]],
            ],
        ],

        'Q8g' => [
            'band' => 4, 'kind' => 'multi',
            'title' => 'What do you need to note down for each job or order?',
            'ask_when' => ['any' => ['work.job_tracked', 'sale.order_later']],
            'options' => [
                'parts_used' => ['label' => 'Parts or materials used', 'example' => 'So you can charge for them.', 'writes' => ['job.parts_used' => true]],
                'progress' => ['label' => 'How far along it is', 'example' => 'Like waiting, in progress or done.', 'writes' => ['job.progress' => true]],
                'goods_set_aside' => ['label' => 'Items set aside for the customer', 'example' => 'Kept on hold until they collect them.', 'writes' => ['job.goods_set_aside' => true]],
                'delivery_details' => ['label' => 'Delivery address and details', 'example' => 'Where it goes and when.', 'writes' => ['job.delivery_details' => true]],
            ],
        ],

        // ── Band 5 — scale and access ────────────────────────────────────
        'Q6a' => [
            'band' => 5, 'kind' => 'single', 'screen' => 'Q6',
            'title' => 'Do you keep your stock in more than one place?',
            'ask_when' => ['d.tracks_qty'],
            'options' => [
                'one' => ['label' => 'No, it is all in one place', 'example' => 'One shop, even if you have a back room.', 'writes' => ['place.stock_counts' => 'one']],
                'separate' => ['label' => 'Yes, I count each place separately', 'example' => 'Like two shops, or a shop and a warehouse.', 'writes' => ['place.stock_counts' => 'separate']],
            ],
        ],

        'Q6b' => [
            'band' => 5, 'kind' => 'single', 'screen' => 'Q6',
            'title' => 'Who will use VenQore?',
            'ask_when' => [],
            'options' => [
                'solo' => ['label' => 'Only me', 'example' => '', 'writes' => ['people.users' => 'solo']],
                'shared' => ['label' => 'A few people, all able to do everything', 'example' => '', 'writes' => ['people.users' => 'shared']],
                'roles' => ['label' => 'A team where people can do different things', 'example' => 'A cashier can sell, but only the manager can see profits.', 'writes' => ['people.users' => 'roles']],
            ],
        ],

        // ── Band 6 — optional ────────────────────────────────────────────
        'Q7b' => [
            'band' => 6, 'kind' => 'multi',
            'title' => 'Do you want help with any of these money jobs?',
            'ask_when' => [],
            'none' => 'No, just the basics: sales, bills and expenses',
            'options' => [
                'books' => ['label' => 'Full accounts', 'example' => 'The books your accountant uses, including profit and loss.', 'writes' => ['fin.books' => true]],
                'bank_match' => ['label' => 'Checking my bank statement against my records', 'example' => 'So you can see every payment is accounted for.', 'writes' => ['fin.bank_match' => true]],
                'assets' => ['label' => 'Tracking what my equipment is worth', 'example' => 'Like vehicles or machines that lose value each year.', 'writes' => ['fin.assets' => true]],
                'loans' => ['label' => 'Business loans I am repaying', 'example' => 'Keep track of what you still owe the bank.', 'writes' => ['fin.loans' => true]],
                'tax_reports' => ['label' => 'Tax reports for the tax office', 'example' => 'Or sending invoices to them electronically.', 'writes' => ['fin.tax_reports' => true]],
                'basics' => ['label' => 'No, just the basics: sales, bills and expenses', 'example' => '', 'writes' => [], 'exclusive' => true],
            ],
        ],

        'Q8c' => [
            'band' => 6, 'kind' => 'multi',
            'title' => 'Besides the shop, where else should customers be able to order?',
            'ask_when' => ['any' => ['activity.goods', 'activity.making']],
            'none' => 'Nowhere else',
            'options' => [
                'new_online_shop' => ['label' => 'A free online shop', 'example' => 'A web page with a link you can share with customers.', 'gift' => true, 'writes' => ['channel.new_online_shop' => true]],
                'qr_menu' => ['label' => 'A QR code customers scan to see my menu or products', 'example' => 'Put it on a table, a window or a poster.', 'gift' => true, 'writes' => ['channel.qr_menu' => true]],
                'existing_site' => ['label' => 'My own website', 'example' => 'Like a WooCommerce or Shopify store you already have.', 'writes' => ['channel.existing_site' => true]],
                'marketplace' => ['label' => 'A marketplace like Amazon or Daraz', 'example' => '', 'writes' => ['channel.marketplace' => true], 'provider_picker' => true],
                'messages' => ['label' => 'Phone calls or WhatsApp messages', 'example' => '', 'writes' => ['channel.messages' => true]],
            ],
        ],

        'Q8d' => [
            'band' => 6, 'kind' => 'multi',
            'title' => 'Would any of these help you keep customers coming back?',
            'ask_when' => [],
            'none' => 'None of these',
            'options' => [
                'group_prices' => ['label' => 'Different prices for different customers', 'example' => 'Like a lower price for wholesale buyers or staff.', 'writes' => ['repeat.group_prices' => true]],
                'rewards' => ['label' => 'Points or rewards for regular customers', 'example' => '', 'writes' => ['repeat.rewards' => true]],
                'gift_cards' => ['label' => 'Gift cards or store credit', 'example' => 'A balance a customer can spend later.', 'writes' => ['repeat.gift_cards' => true]],
                'auto_invoices' => ['label' => 'Bills that are sent automatically every month', 'example' => 'For customers who pay a regular amount.', 'writes' => ['repeat.auto_invoices' => true]],
            ],
        ],

        'Q8e' => [
            'band' => 6, 'kind' => 'single',
            'title' => 'Do you want to keep track of when your staff work?',
            'ask_when' => ['any' => ['people.users=shared', 'people.users=roles']],
            'options' => [
                'shifts' => ['label' => 'Plan who works when', 'example' => 'A weekly schedule of shifts.', 'writes' => ['people.attendance' => 'shifts']],
                'attendance' => ['label' => 'Record who turned up', 'example' => 'Clock in and out each day.', 'writes' => ['people.attendance' => 'attendance']],
                'both' => ['label' => 'Both', 'example' => '', 'writes' => ['people.attendance' => 'both']],
                'none' => ['label' => 'No', 'example' => '', 'writes' => ['people.attendance' => 'none']],
            ],
        ],

        'Q8f' => [
            'band' => 6, 'kind' => 'multi',
            'title' => 'Do customers ask for a price before they decide?',
            'ask_when' => ['any' => ['sale.bill', 'sale.order_later', 'activity.services']],
            'none' => 'No',
            'options' => [
                'estimate' => ['label' => 'A quick estimate', 'example' => 'A rough price you give by message or on the spot.', 'writes' => ['offer.estimate' => true]],
                'formal_proposal' => ['label' => 'A detailed written quote or tender', 'example' => 'A formal document for bigger jobs.', 'writes' => ['offer.formal_proposal' => true]],
            ],
        ],
    ],
];
