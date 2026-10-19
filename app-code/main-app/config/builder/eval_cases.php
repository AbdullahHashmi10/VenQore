<?php

/*
|--------------------------------------------------------------------------
| Builder listening test set — `php artisan builder:eval [--live]`
|--------------------------------------------------------------------------
| Each case is something a real owner might type, the facts the builder must
| take from it (`expect`), facts it must NOT invent (`absent`), and screens that
| would prove it did not listen (`never_ask`). Written from what the owner said,
| not from what the rules happen to do. Add a case every time a real owner is
| misunderstood.
|
| Keys: t = text, expect = [fact => value], absent = [fact, …], never_ask = [panel, …]
*/

return [
    // ── the case that started this ─────────────────────────────────────
    ['t' => 'Auto parts distributor with 10,000 SKUs across two warehouses, counter sales for walk-ins, and tiered credit accounts for repair shops.',
        'expect' => ['activity.goods' => true, 'items.resale_stock' => true, 'place.stock_counts' => 'separate', 'sale.counter' => true, 'money.customer_later' => true],
        'absent' => ['activity.services'], 'never_ask' => ['Q1', 'Q2s', 'Q3', 'Q6a']],

    // ── owner vs customer ──────────────────────────────────────────────
    ['t' => 'We sell tyres and batteries to garages and mechanics, most of them pay at month end',
        'expect' => ['activity.goods' => true, 'money.customer_later' => true], 'absent' => ['activity.services'], 'never_ask' => ['Q1', 'Q2s']],
    ['t' => 'I run a phone repair shop and also sell covers and chargers',
        'expect' => ['activity.services' => true, 'activity.goods' => true], 'never_ask' => ['Q1']],
    ['t' => 'Supplying medicines to clinics and pharmacies in Lahore, we track batch and expiry',
        'expect' => ['activity.goods' => true, 'id.batch_expiry' => true], 'absent' => ['activity.services'], 'never_ask' => ['Q1']],
    ['t' => 'We provide cleaning chemicals to hotels and restaurants',
        'expect' => ['activity.goods' => true], 'absent' => ['sale.tables', 'activity.services'], 'never_ask' => ['Q1']],
    ['t' => 'Wholesale fabric for tailors, they buy on khata',
        'expect' => ['activity.goods' => true, 'money.customer_later' => true], 'absent' => ['activity.services'], 'never_ask' => ['Q1']],

    // ── retail ─────────────────────────────────────────────────────────
    ['t' => 'Kiryana store, one shop, some customers take udhaar',
        'expect' => ['activity.goods' => true, 'place.stock_counts' => 'one', 'money.customer_later' => true], 'never_ask' => ['Q1', 'Q6a']],
    ['t' => 'Clothing boutique with sizes and colours, two branches',
        'expect' => ['activity.goods' => true, 'id.variants' => true, 'place.stock_counts' => 'separate'], 'never_ask' => ['Q1', 'Q6a']],
    ['t' => 'Mobile phone shop, every phone has an IMEI',
        'expect' => ['activity.goods' => true, 'id.serial_owned' => true], 'never_ask' => ['Q1']],
    ['t' => 'Pharmacy, prices include GST, we scan barcodes',
        'expect' => ['activity.goods' => true, 'tax.mode' => 'included', 'id.scan_labels' => true], 'never_ask' => ['Q1', 'Q7a']],
    ['t' => 'Hardware store, we sell paint by the litre and pipes by the foot',
        'expect' => ['activity.goods' => true, 'id.measured' => true], 'never_ask' => ['Q1']],
    ['t' => 'Supermarket with 3 outlets and a central warehouse',
        'expect' => ['activity.goods' => true, 'place.stock_counts' => 'separate'], 'never_ask' => ['Q1', 'Q6a']],
    ['t' => 'I sell shoes online and from my shop',
        'expect' => ['activity.goods' => true], 'never_ask' => ['Q1']],
    ['t' => 'Book shop, just me running it',
        'expect' => ['activity.goods' => true, 'people.users' => 'solo'], 'never_ask' => ['Q1', 'Q6b']],

    // ── food ───────────────────────────────────────────────────────────
    ['t' => 'Restaurant with dine-in and home delivery',
        'expect' => ['sale.tables' => true], 'never_ask' => ['Q1']],
    ['t' => 'Small cafe, takeaway only, no tables, cash and card',
        'expect' => ['sale.counter' => true], 'absent' => ['sale.tables'], 'never_ask' => ['Q1']],
    ['t' => 'Bakery, we bake bread and cakes and sell from our counter',
        'expect' => ['activity.making' => true, 'sale.counter' => true], 'never_ask' => ['Q1']],

    // ── services ───────────────────────────────────────────────────────
    ['t' => 'Hair salon, customers book appointments',
        'expect' => ['activity.services' => true, 'work.booking' => true], 'absent' => ['activity.goods'], 'never_ask' => ['Q1']],
    ['t' => 'Car workshop, we repair cars and use spare parts from our stock',
        'expect' => ['activity.services' => true], 'never_ask' => ['Q1']],
    ['t' => 'Plumbing jobs at customers homes, I send a bill after the job',
        'expect' => ['activity.services' => true, 'work.bill' => true], 'never_ask' => ['Q1']],
    ['t' => 'I am a freelance designer, clients pay an advance',
        'expect' => ['activity.services' => true, 'money.advances' => true], 'absent' => ['items.resale_stock'], 'never_ask' => ['Q1']],
    ['t' => 'Tuition academy, monthly fees',
        'expect' => ['activity.services' => true], 'absent' => ['activity.goods'], 'never_ask' => ['Q1']],
    ['t' => 'Laptop repair centre, we track each job until the customer collects it',
        'expect' => ['activity.services' => true, 'work.job_tracked' => true], 'never_ask' => ['Q1']],

    // ── making ─────────────────────────────────────────────────────────
    ['t' => 'We manufacture furniture and sell to shops',
        'expect' => ['activity.making' => true], 'absent' => ['activity.services'], 'never_ask' => ['Q1']],
    ['t' => 'Spice factory, we grind and pack masala and want to know the cost per pack',
        'expect' => ['activity.making' => true, 'make.costing' => true], 'never_ask' => ['Q1']],
    ['t' => 'Printing press, customers order and we deliver later',
        'expect' => ['activity.making' => true, 'sale.order_later' => true], 'never_ask' => ['Q1']],

    // ── hire ───────────────────────────────────────────────────────────
    ['t' => 'We rent out tents and chairs for weddings',
        'expect' => ['activity.hire' => true], 'never_ask' => ['Q1']],
    ['t' => 'Car rental and we also sell used cars',
        'expect' => ['activity.hire' => true, 'activity.goods' => true], 'never_ask' => ['Q1']],

    // ── negatives ──────────────────────────────────────────────────────
    ["t" => "Grocery shop, we don't give credit to anyone",
        'expect' => ['activity.goods' => true, 'money.customer_later' => false], 'never_ask' => ['Q1']],
    ['t' => 'Electronics shop, no tax registration',
        'expect' => ['activity.goods' => true, 'tax.mode' => 'none'], 'never_ask' => ['Q1', 'Q7a']],
    ["t" => "Gift shop, we never keep expiry items",
        'expect' => ['activity.goods' => true], 'absent' => ['id.batch_expiry'], 'never_ask' => ['Q1']],

    // ── vague: must still ask, but must not guess ──────────────────────
    ['t' => 'I have a business', 'expect' => [], 'absent' => ['activity.goods', 'activity.services', 'activity.making', 'activity.hire']],
    ['t' => 'shop', 'expect' => [], 'absent' => ['activity.services']],
    ['t' => 'small business in Karachi', 'expect' => [], 'absent' => ['activity.goods', 'activity.services']],

    // ── Roman Urdu / mixed ─────────────────────────────────────────────
    ['t' => 'Meri karyana ki dukaan hai, log udhaar pe saman lete hain',
        'expect' => ['activity.goods' => true, 'money.customer_later' => true], 'never_ask' => ['Q1']],
    ['t' => 'Hum kapray ka wholesale karte hain, do godown hain',
        'expect' => ['activity.goods' => true, 'place.stock_counts' => 'separate'], 'never_ask' => ['Q1', 'Q6a']],

    // ── several things at once ─────────────────────────────────────────
    ['t' => 'Mobile shop that sells phones with IMEI, repairs screens, and lets regular customers pay in instalments',
        'expect' => ['activity.goods' => true, 'activity.services' => true, 'id.serial_owned' => true, 'money.customer_later' => true], 'never_ask' => ['Q1']],
    ['t' => 'Distributor of FMCG goods, we pay suppliers in 30 days and our retailers pay us in 15',
        'expect' => ['activity.goods' => true, 'money.supplier_later' => true, 'money.customer_later' => true], 'never_ask' => ['Q1']],
    ['t' => 'Building materials supplier, contractors get special prices and credit',
        'expect' => ['activity.goods' => true, 'repeat.group_prices' => true, 'money.customer_later' => true], 'absent' => ['activity.services'], 'never_ask' => ['Q1']],
    ['t' => 'Cosmetics retailer with a website and an Instagram page, we also sell on Daraz',
        'expect' => ['activity.goods' => true, 'channel.marketplace' => true], 'never_ask' => ['Q1']],
];
