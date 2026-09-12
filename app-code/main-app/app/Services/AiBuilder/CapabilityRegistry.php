<?php

namespace App\Services\AiBuilder;

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  CapabilityRegistry — The VenQore Business Capability Graph & Hierarchy   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Full multi-level hierarchy:
 *   DOMAINS -> CAPABILITIES -> CONFIGURATION CONSEQUENCES & MODULE MAPPINGS
 *
 * The system determines WHAT to ask through impact scores & trade affinity filtering.
 * Gemini determines HOW to phrase it naturally in the merchant's native tongue.
 */
class CapabilityRegistry
{
    /**
     * Trade Affinity and Domain Compatibility Matrix.
     * Guarantees that the discovery engine never asks out-of-domain questions
     * (e.g., asking a Pharmacy about repair tickets or restaurant dining tables).
     */
    public function tradeMatrix(): array
    {
        return [
            'pharmacy' => [
                'allowed_domains'   => ['inventory_supply', 'wholesale_b2b', 'retail_operations'],
                'forbidden_domains' => ['service_repairs', 'hospitality_dining', 'manufacturing_production', 'services_appointments'],
                'priority_caps'     => ['batch_expiry_tracking', 'multi_branch_warehouses', 'customer_khata_credit', 'supplier_purchasing'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'table_and_kot_management', 'food_delivery_dispatch', 'recipe_and_bom', 'appointment_scheduling', 'product_variants', 'serial_imei_tracking'],
            ],
            'grocery' => [
                'allowed_domains'   => ['inventory_supply', 'wholesale_b2b', 'retail_operations'],
                'forbidden_domains' => ['service_repairs', 'hospitality_dining', 'manufacturing_production', 'services_appointments'],
                'priority_caps'     => ['multi_branch_warehouses', 'customer_khata_credit', 'batch_expiry_tracking'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'table_and_kot_management', 'food_delivery_dispatch', 'appointment_scheduling', 'serial_imei_tracking'],
            ],
            'clothing' => [
                'allowed_domains'   => ['inventory_supply', 'retail_operations', 'wholesale_b2b'],
                'forbidden_domains' => ['service_repairs', 'hospitality_dining', 'manufacturing_production', 'services_appointments'],
                'priority_caps'     => ['product_variants', 'multi_branch_warehouses', 'customer_khata_credit'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'table_and_kot_management', 'food_delivery_dispatch', 'recipe_and_bom', 'appointment_scheduling', 'batch_expiry_tracking', 'serial_imei_tracking'],
            ],
            'electronics' => [
                'allowed_domains'   => ['inventory_supply', 'service_repairs', 'retail_operations', 'wholesale_b2b'],
                'forbidden_domains' => ['hospitality_dining', 'manufacturing_production', 'services_appointments'],
                'priority_caps'     => ['serial_imei_tracking', 'repair_job_tracking', 'customer_khata_credit'],
                'auto_reject'       => ['table_and_kot_management', 'food_delivery_dispatch', 'recipe_and_bom', 'appointment_scheduling', 'batch_expiry_tracking'],
            ],
            'repairs' => [
                'allowed_domains'   => ['service_repairs', 'inventory_supply', 'retail_operations'],
                'forbidden_domains' => ['hospitality_dining', 'manufacturing_production', 'services_appointments', 'wholesale_b2b'],
                'priority_caps'     => ['repair_job_tracking', 'spare_parts_and_labour'],
                'auto_reject'       => ['table_and_kot_management', 'food_delivery_dispatch', 'recipe_and_bom', 'appointment_scheduling', 'batch_expiry_tracking', 'product_variants'],
            ],
            'restaurant' => [
                'allowed_domains'   => ['hospitality_dining', 'inventory_supply', 'manufacturing_production'],
                'forbidden_domains' => ['service_repairs', 'services_appointments', 'wholesale_b2b'],
                'priority_caps'     => ['table_and_kot_management', 'food_delivery_dispatch', 'recipe_and_bom'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'appointment_scheduling', 'serial_imei_tracking', 'product_variants', 'customer_khata_credit'],
            ],
            'bakery' => [
                'allowed_domains'   => ['manufacturing_production', 'inventory_supply', 'hospitality_dining', 'retail_operations'],
                'forbidden_domains' => ['service_repairs', 'services_appointments'],
                'priority_caps'     => ['recipe_and_bom', 'batch_expiry_tracking', 'multi_branch_warehouses'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'appointment_scheduling', 'serial_imei_tracking'],
            ],
            'salon' => [
                'allowed_domains'   => ['services_appointments', 'inventory_supply', 'retail_operations'],
                'forbidden_domains' => ['service_repairs', 'hospitality_dining', 'manufacturing_production', 'wholesale_b2b'],
                'priority_caps'     => ['appointment_scheduling', 'product_variants'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'table_and_kot_management', 'food_delivery_dispatch', 'recipe_and_bom', 'batch_expiry_tracking', 'serial_imei_tracking'],
            ],
            'wholesale' => [
                'allowed_domains'   => ['wholesale_b2b', 'inventory_supply'],
                'forbidden_domains' => ['service_repairs', 'hospitality_dining', 'services_appointments'],
                'priority_caps'     => ['customer_khata_credit', 'quotations_and_orders', 'multi_branch_warehouses'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'table_and_kot_management', 'food_delivery_dispatch', 'appointment_scheduling'],
            ],
        ];
    }

    /**
     * Complete domain & capability graph.
     *
     * @return array<string, array<string, array{name: string, impact: int, triggers: string[], requires_caps: string[], implies_modules: string[], consequences: string[], question_template: string, options: array<array{key: string, label: string, implies: string}>}>>
     */
    public function catalog(): array
    {
        return [
            'service_repairs' => [
                'repair_job_tracking' => [
                    'name'              => 'Repair & Job Status Tracking',
                    'short'             => 'A list of your jobs',
                    'impact'            => 100,
                    'triggers'          => ['repair', 'fixing', 'workshop', 'technician', 'service', 'phone fix', 'mobile repair', 'auto repair', 'مرمت', 'ورکشاپ'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['services', 'pos', 'customers'],
                    'consequences'      => ['You get a simple job list. Each job shows who it is for, what needs doing, and whether it is booked, started or done.'],
                    'question_template' => 'Do you want a list of every job you take on, so you can see what is booked, what you are working on and what is finished?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, keep a job list', 'desc' => 'Every job in one place, from booked to finished.', 'implies' => 'repair_job_tracking'],
                        ['key' => 'no', 'label' => 'No, just record what I sell', 'desc' => 'No job list — you only record the sale.', 'implies' => 'sales_only'],
                        ['key' => 'custom', 'label' => 'Let me explain', 'desc' => 'Tell us how you work and we will fit it.', 'implies' => 'custom'],
                    ],
                ],
                'spare_parts_and_labour' => [
                    'name'              => 'Spare Parts & Service Labour Billing',
                    'short'             => 'Charging parts and time',
                    'impact'            => 85,
                    'triggers'          => ['repair', 'technician', 'parts', 'labour', 'service charges', 'اسپیئر پارٹس'],
                    'requires_caps'     => ['repair_job_tracking'],
                    'implies_modules'   => ['services', 'inventory', 'expenses'],
                    'consequences'      => ['Your bill shows parts and labour on their own lines, and any part you use comes off your stock by itself.'],
                    'question_template' => 'When a job is done, do you charge for parts and for your time as separate things?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, parts and my time', 'desc' => 'Both on the bill, parts taken off stock.', 'implies' => 'spare_parts_and_labour'],
                        ['key' => 'parts_only', 'label' => 'One price for the job', 'desc' => 'A single charge, with no separate parts line.', 'implies' => 'flat_repair_fee'],
                        ['key' => 'no', 'label' => 'Only my time', 'desc' => 'You charge for the work, never for parts.', 'implies' => 'labour_only'],
                    ],
                ],
            ],

            /*
            | Added because a visitor who went through the flow was never asked
            | any of it: not whether anyone works for him, not whether he needs
            | a counter, not whether trade customers expect a quote first. The
            | conversation had thirteen questions reaching twenty-three of the
            | forty-three live modules, so two thirds of this product could
            | never come up. These five close the gap on the things people are
            | most often asked about in a first conversation.
            |
            | Wording deliberately mirrors config/ai_builder.discovery, which
            | asks the same things on the manual path — the two sets should say
            | the same sentence, and eventually should BE the same set.
            */
            'operations_scale' => [
                'team_and_attendance' => [
                    'name'              => 'Staff Accounts & Attendance',
                    'short'             => 'People working with you',
                    'impact'            => 88,
                    'triggers'          => ['staff', 'employees', 'workers', 'team', 'cashier', 'shifts', 'عملہ', 'ملازم'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['staff_attendance'],
                    'consequences'      => ['Everyone gets their own login, and you can see who worked when without keeping a paper register.'],
                    'question_template' => 'Does anyone work with you, or is it just you?',
                    'options'           => [
                        ['key' => 'solo', 'label' => 'Just me', 'desc' => 'One login, nothing to track.', 'implies' => 'solo_operator'],
                        ['key' => 'yes', 'label' => 'Yes, a few of us', 'desc' => 'Separate logins and a record of who worked when.', 'implies' => 'team_and_attendance'],
                        ['key' => 'yes_shifts', 'label' => 'Yes, on shifts', 'desc' => 'Shift hours and attendance you can check later.', 'implies' => 'team_and_attendance'],
                    ],
                ],
                'counter_checkout' => [
                    'name'              => 'Over-the-Counter Checkout',
                    'short'             => 'Getting paid on the spot',
                    'impact'            => 92,
                    'triggers'          => ['counter', 'till', 'cash register', 'walk in', 'shop floor', 'کاؤنٹر'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['pos', 'products'],
                    'consequences'      => ['A fast till screen for serving someone standing in front of you, with a receipt at the end.'],
                    'question_template' => 'Do people come to you and pay on the spot, or do you bill them afterwards?',
                    'options'           => [
                        ['key' => 'counter', 'label' => 'They pay on the spot', 'desc' => 'A till screen for serving people in person.', 'implies' => 'counter_checkout'],
                        ['key' => 'invoice', 'label' => 'I bill them afterwards', 'desc' => 'No till — you send a bill for the work.', 'implies' => 'invoice_only'],
                        ['key' => 'both', 'label' => 'Both, depending', 'desc' => 'A till for walk-ins and bills for the rest.', 'implies' => 'counter_checkout'],
                    ],
                ],
                'trade_pricing' => [
                    'name'              => 'Trade & Wholesale Pricing',
                    'short'             => 'Special prices for some buyers',
                    'impact'            => 80,
                    'triggers'          => ['wholesale', 'trade price', 'bulk', 'b2b', 'distributor', 'تھوک'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['pricing_tiers', 'customers'],
                    'consequences'      => ['Some customers see their own agreed price instead of the shelf price, without you working it out each time.'],
                    'question_template' => 'Does anyone buy from you in bulk, or at a price you agreed with them?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, trade prices', 'desc' => 'Agreed prices per customer, applied for you.', 'implies' => 'trade_pricing'],
                        ['key' => 'no', 'label' => 'No, one price for all', 'desc' => 'Everyone pays what is on the shelf.', 'implies' => 'single_price'],
                    ],
                ],
                'stock_volume' => [
                    'name'              => 'How Much Stock There Is To Track',
                    'short'             => 'Keeping track of stock',
                    'impact'            => 84,
                    'triggers'          => ['stock', 'sku', 'items', 'warehouse', 'shelves', 'اسٹاک'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['inventory', 'products', 'stock_takes'],
                    'consequences'      => ['Counts that stay right on their own, and a way to check the shelf against the system when they drift.'],
                    'question_template' => 'How much stock do you have to keep track of?',
                    'options'           => [
                        ['key' => 'none', 'label' => 'None really', 'desc' => 'Nothing sitting on a shelf waiting to be sold.', 'implies' => 'no_stock'],
                        ['key' => 'handful', 'label' => 'A handful of things', 'desc' => 'Simple counts, no stock-taking routine.', 'implies' => 'light_stock'],
                        ['key' => 'lots', 'label' => 'Hundreds or more', 'desc' => 'Proper counts, plus a way to check them.', 'implies' => 'stock_volume'],
                    ],
                ],
            ],

            'inventory_supply' => [
                'multi_branch_warehouses' => [
                    'name'              => 'Multi-Branch & Inter-Store Transfers',
                    'short'             => 'More than one place',
                    'impact'            => 95,
                    'triggers'          => ['branches', 'outlets', 'stores', 'locations', 'warehouses', 'chain', 'برانچ', 'گودام'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['multi_location', 'stock_transfers', 'inventory'],
                    'consequences'      => ['Each place keeps its own stock and its own figures, and you can move items between them.'],
                    'question_template' => 'Do you work out of more than one shop, branch or storeroom?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, more than one', 'desc' => 'Separate stock and figures for each place.', 'implies' => 'multi_branch_warehouses'],
                        ['key' => 'no', 'label' => 'Just the one', 'desc' => 'One set of stock, one set of figures.', 'implies' => 'single_location'],
                        ['key' => 'planning', 'label' => 'Opening another soon', 'desc' => 'Set it up now so it is ready when you are.', 'implies' => 'multi_branch_warehouses'],
                    ],
                ],
                'batch_expiry_tracking' => [
                    'name'              => 'Batch Numbers & Expiry Date Management',
                    'short'             => 'Expiry dates or batches',
                    'impact'            => 95,
                    'triggers'          => ['pharmacy', 'medicine', 'drugstore', 'food', 'bakery', 'cosmetics', 'perishables', 'dairy', 'meat', 'فارمیسی', 'میڈیکل'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['batches_expiry', 'inventory'],
                    'consequences'      => ['You are warned before anything expires, and whatever expires soonest is always sold first.'],
                    'question_template' => 'Do the things you sell have expiry dates or batch numbers you need to keep an eye on?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, they expire', 'desc' => 'Get warned before stock goes out of date.', 'implies' => 'batch_expiry_tracking'],
                        ['key' => 'no', 'label' => 'No, nothing expires', 'desc' => 'Nothing you sell has a date on it.', 'implies' => 'no_expiry'],
                        ['key' => 'some', 'label' => 'Only some of them', 'desc' => 'Watch dates on the items that need it.', 'implies' => 'batch_expiry_tracking'],
                    ],
                ],
                'supplier_purchasing' => [
                    'name'              => 'Supplier Purchase Orders & Low Stock Reordering',
                    'short'             => 'Buying from suppliers',
                    'impact'            => 85,
                    'triggers'          => ['suppliers', 'distributors', 'vendors', 'purchases', 'restock', 'reorder', 'سپلائر', 'ڈسٹری بیوٹر'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['purchases', 'suppliers', 'inventory'],
                    'consequences'      => ['You keep a record of what you ordered, what it cost and what you still owe, and get told when stock is running low.'],
                    'question_template' => 'Do you buy from suppliers, and do you want their bills and your reordering kept track of?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, I order from suppliers', 'desc' => 'Track their bills and what you still owe.', 'implies' => 'supplier_purchasing'],
                        ['key' => 'cash_only', 'label' => 'I just buy as I go', 'desc' => 'Pay on the spot, no supplier accounts.', 'implies' => 'cash_purchases'],
                    ],
                ],
                'serial_imei_tracking' => [
                    'name'              => 'Individual Serial / IMEI Device Tracking',
                    'short'             => 'Serial or IMEI numbers',
                    'impact'            => 90,
                    'triggers'          => ['electronics', 'mobile', 'phones', 'computers', 'hardware', 'appliances', 'machinery', 'موبائل', 'الیکٹرانکس'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['serials', 'inventory'],
                    'consequences'      => ['Every unit is followed one by one, so you can look up where any single item came from and who bought it.'],
                    'question_template' => 'Do you need to record a serial or IMEI number for each individual item you buy and sell?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, every unit', 'desc' => 'Look up any item by its serial or IMEI.', 'implies' => 'serial_imei_tracking'],
                        ['key' => 'no', 'label' => 'No, just count them', 'desc' => 'You track how many you have, not which one.', 'implies' => 'standard_inventory'],
                        ['key' => 'custom', 'label' => 'Only the costly ones', 'desc' => 'Serial numbers on the expensive items only.', 'implies' => 'serial_imei_tracking'],
                    ],
                ],
                'product_variants' => [
                    'name'              => 'Size, Color & Style Matrix (Variants)',
                    'short'             => 'Sizes and colours',
                    'impact'            => 75,
                    'triggers'          => ['clothing', 'apparel', 'garments', 'fashion', 'shoes', 'boutique', 'fabric', 'textiles', 'کپڑے', 'گارمنٹس'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['variants', 'products', 'inventory'],
                    'consequences'      => ['One item with many versions — each size or colour keeps its own stock count.'],
                    'question_template' => 'Do your items come in different sizes or colours that you need to count separately?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, sizes and colours', 'desc' => 'Each size and colour counted on its own.', 'implies' => 'product_variants'],
                        ['key' => 'no', 'label' => 'No, one version each', 'desc' => 'One item, one stock count.', 'implies' => 'simple_products'],
                    ],
                ],
            ],

            'hospitality_dining' => [
                'table_and_kot_management' => [
                    'name'              => 'Dine-In Table Layout & Kitchen Printing (KOT)',
                    'short'             => 'People eating in',
                    'impact'            => 95,
                    'triggers'          => ['restaurant', 'cafe', 'food', 'dining', 'bistro', 'eatery', 'bar', 'pizzeria', 'ریسٹورنٹ', 'کھانا'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['table_service', 'park_recall', 'pos'],
                    'consequences'      => ['You get a table plan, orders sent straight to the kitchen, and bills you can split between people.'],
                    'question_template' => 'Do people sit down and eat in, with their orders going through to your kitchen?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, people eat in', 'desc' => 'Tables, kitchen orders and split bills.', 'implies' => 'table_and_kot_management'],
                        ['key' => 'counter_only', 'label' => 'Counter and takeaway', 'desc' => 'They order at the counter and take it away.', 'implies' => 'counter_dining'],
                        ['key' => 'delivery_only', 'label' => 'Delivery only', 'desc' => 'No dining area — everything goes out.', 'implies' => 'delivery_management'],
                    ],
                ],
                'food_delivery_dispatch' => [
                    'name'              => 'Home Delivery & Rider Dispatch',
                    'short'             => 'Your own delivery riders',
                    'impact'            => 70,
                    'triggers'          => ['delivery', 'riders', 'dispatch', 'home delivery', 'ڈلیوری', 'رائڈر'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['sales_orders', 'pos'],
                    'consequences'      => ['You give each order to a rider and can see what is out for delivery and what has arrived.'],
                    'question_template' => 'Do you deliver to people yourself, with your own riders?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, my own riders', 'desc' => 'Hand orders to riders and follow them out.', 'implies' => 'food_delivery_dispatch'],
                        ['key' => 'no', 'label' => 'No, they come to me', 'desc' => 'Nothing leaves the shop.', 'implies' => 'no_delivery'],
                    ],
                ],
            ],

            'wholesale_b2b' => [
                'customer_khata_credit' => [
                    'name'              => 'Customer Khata, Credit Ledger & Terms',
                    'short'             => 'Customers who pay later',
                    'impact'            => 85,
                    'triggers'          => ['wholesale', 'distribution', 'credit', 'khata', 'terms', 'installments', 'pharmacy', 'grocery', 'کھاتہ', 'ادھار', 'ہول سیل'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['khata_credit', 'customers', 'sales_orders'],
                    'consequences'      => ['Each customer gets a running balance, so you can see who owes you what, for how long, and remind them.'],
                    'question_template' => 'Do any of your customers take things now and pay you later?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, they pay later', 'desc' => 'A running balance for every customer.', 'implies' => 'customer_khata_credit'],
                        ['key' => 'cash_only', 'label' => 'No, always paid up front', 'desc' => 'Every sale settled on the spot.', 'implies' => 'cash_only'],
                        ['key' => 'some', 'label' => 'Only people I know well', 'desc' => 'Credit for regulars, cash for the rest.', 'implies' => 'customer_khata_credit'],
                    ],
                ],
                'quotations_and_orders' => [
                    'name'              => 'Formal Quotations & B2B Sales Orders',
                    'short'             => 'Sending a price first',
                    'impact'            => 70,
                    'triggers'          => ['quotations', 'estimates', 'b2b', 'corporate', 'purchase orders', 'کوٹیشن'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['b2b_proposals', 'sales_orders', 'customers'],
                    'consequences'      => ['You send a price, and when they say yes it becomes the bill — nothing gets typed twice.'],
                    'question_template' => 'Do you send a price first and only start the work once they agree to it?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, I quote first', 'desc' => 'Send a price, turn it into the bill later.', 'implies' => 'quotations_and_orders'],
                        ['key' => 'no', 'label' => 'No, I charge on the spot', 'desc' => 'Straight to the sale, no quote first.', 'implies' => 'pos_only'],
                    ],
                ],
            ],

            'manufacturing_production' => [
                'recipe_and_bom' => [
                    'name'              => 'Recipes, Bill of Materials & Production',
                    'short'             => 'Making what you sell',
                    'impact'            => 85,
                    'triggers'          => ['bakery', 'manufacturing', 'assembly', 'production', 'recipe', 'crafting', 'raw materials', 'پروڈکشن', 'بیکری'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['cookbook', 'production_runs', 'inventory'],
                    'consequences'      => ['You write down what goes into each thing you make, and those ingredients come off your stock as you make it.'],
                    'question_template' => 'Do you make what you sell out of raw materials or ingredients?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, I make it myself', 'desc' => 'Ingredients come off stock as you produce.', 'implies' => 'recipe_and_bom'],
                        ['key' => 'no', 'label' => 'No, I buy it ready-made', 'desc' => 'You sell it exactly as you bought it.', 'implies' => 'trading_only'],
                    ],
                ],
            ],

            'services_appointments' => [
                'appointment_scheduling' => [
                    'name'              => 'Staff Booking & Client Appointments',
                    'short'             => 'Booked appointments',
                    'impact'            => 85,
                    'triggers'          => ['salon', 'spa', 'clinic', 'barber', 'consultant', 'appointments', 'سلیون', 'بکنگ'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['services', 'sales_orders', 'customers'],
                    'consequences'      => ['You get a diary of who is coming and when, so the same slot never goes to two people.'],
                    'question_template' => 'Do people book a time with you in advance?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, they book ahead', 'desc' => 'A booking diary of times and people.', 'implies' => 'appointment_scheduling'],
                        ['key' => 'walkin', 'label' => 'No, they just turn up', 'desc' => 'First come, first served.', 'implies' => 'walkins_only'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Flattens all capabilities into a key-indexed list.
     *
     * @return array<string, array{domain: string, name: string, impact: int, triggers: string[], requires_caps: string[], implies_modules: string[], consequences: string[], question_template: string, options: array}>
     */
    public function allCapabilities(): array
    {
        $flattened = [];
        foreach ($this->catalog() as $domain => $caps) {
            foreach ($caps as $key => $cap) {
                $flattened[$key] = array_merge($cap, ['domain' => $domain]);
            }
        }

        return $flattened;
    }

    /**
     * Fast 0-Token Deterministic Fact Extractor.
     *
     * @return array{facts: array<string, array{value: mixed, confidence: float, source: string, evidence: string}>, detected_preset: ?string}
     */
    public function detectStructuredFacts(string $text): array
    {
        $normalized = strtolower($text);
        $facts = [];
        $detectedPreset = null;

        // 1. Branch Count — matches "2 branches", "2 برانچز", "2 برانچ", "دو برانچ" etc.
        // The Urdu plural 'برانچز' has extra 'ز' — use partial match with 'برانچ' prefix
        $branchPatterns = [
            '/(\d+)\s*(branches|branch|stores?|outlets?|locations?|shops?)/iu',
            '/(\d+)\s*(برانچ\w*|دکانیں|شاخیں|لوکیشن)/u',
        ];
        $branchMatched = false;
        foreach ($branchPatterns as $bp) {
            if (preg_match($bp, $text, $m)) {
                $count = (int) $m[1];
                $facts['branches'] = [
                    'value'      => $count,
                    'confidence' => 1.0,
                    'source'     => 'user_explicit',
                    'evidence'   => $m[0],
                ];
                $facts['multi_branch'] = [
                    'value'      => $count > 1,
                    'confidence' => 1.0,
                    'source'     => 'user_explicit',
                    'evidence'   => $m[0],
                ];
                $branchMatched = true;
                break;
            }
        }

        if (!$branchMatched) {
            // Written number variants
            $twoAliases = ['two branch', '2 branch', 'دو برانچ', '2 برانچ', 'two stores', 'two shops'];
            foreach ($twoAliases as $alias) {
                if (str_contains($normalized, $alias)) {
                    $facts['branches']    = ['value' => 2, 'confidence' => 1.0, 'source' => 'user_explicit', 'evidence' => $alias];
                    $facts['multi_branch'] = ['value' => true, 'confidence' => 1.0, 'source' => 'user_explicit', 'evidence' => $alias];
                    break;
                }
            }
        }

        // 1b. Working alone. Stated plainly by a lot of one-person
        // businesses and, until now, heard by nothing: a solo plumber who
        // wrote "I work alone" was still handed staff attendance before he
        // answered a question. A fact the visitor volunteered has to outrank
        // the trade's default shape — see contradictedModules().
        $soloPatterns = [
            'i work alone', 'work alone', 'working alone', 'i am alone', 'by myself',
            'on my own', 'just me', 'only me', 'just myself', 'one man', 'one-man',
            'one person', 'single person', 'sole proprietor', 'solo', 'freelance',
            'freelancer', 'self employed', 'self-employed', 'no staff', 'no employees',
            'no workers', 'no team', 'without staff', 'اکیلا', 'اکیلے', 'تنہا', 'بغیر عملہ',
            'وحدي', 'بمفردي',
        ];
        foreach ($soloPatterns as $needle) {
            if (preg_match('/(?:\b|^)' . preg_quote($needle, '/') . '(?:\b|$)/iu', $normalized)) {
                $facts['solo'] = [
                    'value'      => true,
                    'confidence' => 1.0,
                    'source'     => 'user_explicit',
                    'evidence'   => $needle,
                ];
                break;
            }
        }

        // 2. Domain & Trade Triggers
        $domainKeywords = [
            'pharmacy'    => ['pharmacy', 'medicine', 'drugstore', 'میڈیکل', 'فارمیسی', 'chemist', 'medical store', 'دوا', 'صيدلية', 'أدوية'],
            'repairs'     => ['repair', 'fixing', 'مرمت', 'technician', 'phone fix', 'mobile repair', 'workshop'],
            'clothing'    => ['clothing', 'garment', 'apparel', 'boutique', 'کپڑے', 'fashion', 'shoes', 'بوتیک'],
            'restaurant'  => ['restaurant', 'cafe', 'food', 'dining', 'کھانا', 'bistro', 'burger', 'pizza', 'ریسٹورنٹ', 'ہوٹل'],
            'bakery'      => ['bakery', 'bread', 'cakes', 'pastry', 'بیکری'],
            'grocery'     => ['grocery', 'supermarket', 'mart', 'کرانہ', 'جنرل اسٹور'],
            'wholesale'   => ['wholesale', 'distributor', 'ہول سیل', 'bulk supply'],
            'salon'       => ['salon', 'spa', 'beauty', 'سلیون', 'barber', 'haircut', 'پارلر'],
            'electronics' => ['electronics', 'mobile shop', 'computers', 'موبائل شاپ', 'موبائل کی دکان', 'الیکٹرانکس'],
        ];

        foreach ($domainKeywords as $trade => $keywords) {
            foreach ($keywords as $kw) {
                $pattern = '/(?:\b|^)' . preg_quote($kw, '/') . '(?:\b|$)/iu';
                if (preg_match($pattern, $normalized)) {
                    // Check for negation: "no repairs", "not a pharmacy", "without repairs"
                    $negationPattern = '/\b(?:no|not|never|without|don\'?t\s+(?:do|have|offer|need))\s+' . preg_quote($kw, '/') . '\b/iu';
                    if (preg_match($negationPattern, $normalized)) {
                        continue;
                    }

                    $facts["trade:{$trade}"] = [
                        'value'      => true,
                        'confidence' => 0.95,
                        'source'     => 'user_keyword',
                        'evidence'   => $kw,
                    ];
                    $detectedPreset = $trade;
                    break;
                }
            }
        }

        return [
            'facts'           => $facts,
            'detected_preset' => $detectedPreset,
        ];
    }

    /**
     * DETERMINISTIC QUESTION SELECTION ENGINE.
     * The system decides WHAT candidate question to ask based on highest impact score,
     * trade affinity filtering, satisfied prerequisites, and contextual domain relevance.
     *
     * @param array<string, array> $knownFacts
     * @param string[] $confirmedCaps
     * @param string[] $rejectedCaps
     * @return array{key: string, name: string, impact: int, consequences: string[], question_template: string, options: array}|null
     */
    public function selectNextCandidateQuestion(array $knownFacts, array $confirmedCaps, array $rejectedCaps, array $skippedCaps = []): ?array
    {
        $all = $this->allCapabilities();
        $tradeMatrix = $this->tradeMatrix();
        $candidates = [];

        // Combined profile of every trade in the known facts
        $tradeConfig = $this->combinedTradeConfig($knownFacts, $tradeMatrix);

        // Build context string from all known facts
        $factKeys = array_keys($knownFacts);
        $contextString = strtolower(implode(' ', $factKeys));

        foreach ($all as $key => $cap) {
            // Already resolved? Skip
            if (in_array($key, $confirmedCaps, true) || in_array($key, $rejectedCaps, true)) {
                continue;
            }

            // Asked and declined. A skipped capability is neither confirmed nor
            // rejected, so without this it stays the top unresolved candidate
            // and gets re-selected on the very next turn — the visitor skips a
            // question and is handed the same question back.
            if (in_array($key, $skippedCaps, true)) {
                continue;
            }

            // Prerequisite capabilities satisfied?
            foreach ($cap['requires_caps'] as $req) {
                if (!in_array($req, $confirmedCaps, true)) {
                    continue 2; // prerequisite not confirmed yet
                }
            }

            // Trade domain affinity filtering
            if ($tradeConfig) {
                // If capability is forbidden for this trade and was not explicitly mentioned by user, reject it
                if (in_array($cap['domain'], $tradeConfig['forbidden_domains'] ?? [], true)) {
                    $hasExplicitTrigger = false;
                    foreach ($cap['triggers'] as $t) {
                        if (str_contains($contextString, $t)) {
                            $hasExplicitTrigger = true;
                            break;
                        }
                    }
                    if (!$hasExplicitTrigger) {
                        continue;
                    }
                }

                // If capability is explicitly in auto_reject for this trade, skip
                if (in_array($key, $tradeConfig['auto_reject'] ?? [], true)) {
                    continue;
                }
            }

            // Calculate relevance score boost
            $relevanceBoost = 0;
            if ($tradeConfig && in_array($key, $tradeConfig['priority_caps'] ?? [], true)) {
                $relevanceBoost += 60;
            }

            foreach ($cap['triggers'] as $trigger) {
                if (str_contains($contextString, $trigger)) {
                    $relevanceBoost += 40;
                }
            }

            $score = $cap['impact'] + $relevanceBoost;

            $candidates[] = [
                'key'               => $key,
                'name'              => $cap['name'],
                // The plain label a tick list shows. Carried through the
                // projection explicitly: leaving it out is why the first tick
                // list rendered internal names like "Customer Khata, Credit
                // Ledger & Terms" at a visitor.
                'short'             => $cap['short'] ?? null,
                'impact'            => $score,
                'consequences'      => $cap['consequences'],
                'question_template' => $cap['question_template'],
                'options'           => $cap['options'],
            ];
        }

        if (empty($candidates)) {
            return null;
        }

        // Sort descending by calculated priority score
        usort($candidates, fn ($a, $b) => $b['impact'] <=> $a['impact']);

        return $candidates[0];
    }

    /**
     * Every trade the owner described counts (a phone shop that also does
     * repairs is both): priority questions are the UNION of those trades',
     * and a domain or capability is ruled out only when EVERY detected trade
     * rules it out. Before 2026-09-10 only the first trade was used, so the
     * second trade's priority questions were never asked or counted.
     *
     * @return array{priority_caps: string[], forbidden_domains: string[], auto_reject: string[]}|null
     */
    private function combinedTradeConfig(array $facts, array $tradeMatrix): ?array
    {
        $trades = [];
        foreach ($facts as $factKey => $fact) {
            if (!str_starts_with((string) $factKey, 'trade:')) {
                continue;
            }
            if (is_array($fact) && array_key_exists('value', $fact) && !$fact['value']) {
                continue;
            }
            $trade = substr((string) $factKey, 6);
            if (isset($tradeMatrix[$trade])) {
                $trades[] = $tradeMatrix[$trade];
            }
        }

        if (!$trades) {
            return null;
        }

        $pick = fn (string $field) => array_map(fn ($t) => $t[$field] ?? [], $trades);
        $intersect = fn (array $lists) => count($lists) === 1 ? $lists[0] : array_values(array_intersect(...$lists));

        return [
            'priority_caps'     => array_values(array_unique(array_merge(...$pick('priority_caps')))),
            'forbidden_domains' => $intersect($pick('forbidden_domains')),
            'auto_reject'       => $intersect($pick('auto_reject')),
        ];
    }

    /**
     * CALCULATES SYSTEM READINESS CONFIDENCE (Deterministic).
     *
     * @param array<string, array> $facts
     * @param string[] $confirmedCaps
     * @param string[] $rejectedCaps
     * @return float 0.0 to 1.0
     */
    public function calculateReadinessConfidence(array $facts, array $confirmedCaps, array $rejectedCaps): float
    {
        if (empty($facts)) {
            return 0.2;
        }

        $all = $this->allCapabilities();
        $tradeMatrix = $this->tradeMatrix();

        $tradeConfig = $this->combinedTradeConfig($facts, $tradeMatrix);

        $totalHighImpactPoints = 0;
        $resolvedHighImpactPoints = 0;
        $factKeys = strtolower(implode(' ', array_keys($facts)));

        foreach ($all as $key => $cap) {
            // If trade config exists, evaluate only allowed domain / priority capabilities
            if ($tradeConfig) {
                if (in_array($cap['domain'], $tradeConfig['forbidden_domains'] ?? [], true)) {
                    continue;
                }
                if (in_array($key, $tradeConfig['auto_reject'] ?? [], true)) {
                    continue;
                }
                $isPriority = in_array($key, $tradeConfig['priority_caps'] ?? [], true);
                if ($isPriority) {
                    $totalHighImpactPoints += $cap['impact'];
                    if (in_array($key, $confirmedCaps, true) || in_array($key, $rejectedCaps, true)) {
                        $resolvedHighImpactPoints += $cap['impact'];
                    }
                }
            } else {
                $isRelevant = false;
                foreach ($cap['triggers'] as $trigger) {
                    if (str_contains($factKeys, $trigger)) {
                        $isRelevant = true;
                        break;
                    }
                }

                if ($isRelevant || $cap['impact'] >= 90) {
                    $totalHighImpactPoints += $cap['impact'];
                    if (in_array($key, $confirmedCaps, true) || in_array($key, $rejectedCaps, true)) {
                        $resolvedHighImpactPoints += $cap['impact'];
                    }
                }
            }
        }

        if ($totalHighImpactPoints === 0) {
            return count($confirmedCaps) > 0 ? 0.90 : 0.60;
        }

        $resolutionRatio = $resolvedHighImpactPoints / $totalHighImpactPoints;
        $baseConfidence = 0.55 + ($resolutionRatio * 0.40);

        return round(min(0.98, $baseConfidence), 2);
    }

    /**
     * Final live module resolver.
     *
     * @param string[] $confirmedCaps
     * @param string|null $presetKey
     * @return string[]
     */
    /**
     * What a preset ships before anything has been confirmed.
     *
     * `core` is the honest floor for a trade — never the full `modules` list,
     * which is everything the trade COULD want. A preset with no `core` yet
     * falls back to its full list, so an unconverted preset degrades to the
     * old behaviour rather than to nothing.
     */
    public function coreModules(?string $presetKey): array
    {
        $preset = $presetKey ? config("ai_builder.presets.{$presetKey}", []) : [];
        $core = (array) ($preset['core'] ?? $preset['modules'] ?? []);

        // An unknown or misspelt preset key must not hand someone an empty
        // workspace — a lean starting point is the goal, nothing at all is a
        // broken page. Fall back to the smallest shop that still works.
        if ($core === []) {
            $core = (array) config('ai_builder.presets.retail_shop.core', ['products', 'pos', 'expenses', 'reports']);
        }

        return $core;
    }

    /**
     * Modules the visitor's own words rule out.
     *
     * Only ever driven by something they stated outright — never by a guess
     * about their size or their trade. Saying "I work alone" and still being
     * handed staff attendance is the single most obvious way for this builder
     * to prove it was not listening.
     *
     * @return string[] module keys to remove
     */
    public function contradictedModules(array $facts): array
    {
        $out = [];

        if (!empty($facts['solo']['value'])) {
            // One person has no attendance to take.
            $out = array_merge($out, ['staff_attendance']);
        }

        return array_values(array_unique($out));
    }

    /**
     * Capabilities that must not be asked about at all, given what was stated.
     * Fed to selectNextCandidateQuestion as rejections so a solo operator is
     * never asked to choose between rotas.
     *
     * @return string[] capability keys
     */
    public function contradictedCapabilities(array $facts): array
    {
        $contradicted = $this->contradictedModules($facts);
        if ($contradicted === []) {
            return [];
        }

        $out = [];
        foreach ($this->allCapabilities() as $key => $cap) {
            $implied = (array) ($cap['implies_modules'] ?? []);
            // Only when EVERY module it would add is ruled out. A capability
            // that also brings something still wanted stays askable.
            if ($implied !== [] && array_diff($implied, $contradicted) === []) {
                $out[] = $key;
            }
        }

        return $out;
    }

    /** Marks a composed multi-answer question rather than a single capability. */
    public const BUNDLE_KEY = '__bundle__';
    public const BUNDLE_MIN = 3;
    public const BUNDLE_MAX = 5;

    /**
     * One question that settles several unknowns at once.
     *
     * ── Why this exists ───────────────────────────────────────────────────
     * One capability per question is honest but arithmetically hopeless: with
     * eighteen capabilities, covering what this product can do takes a dozen
     * questions, and nobody describing their business to a website answers a
     * dozen questions. The manual path has the same problem in a longer form —
     * twenty-five of them — which is why neither has ever covered the product.
     *
     * A tick list fixes the arithmetic, because it answers in BOTH directions.
     * Five options ticked or left alone is five capabilities resolved in one
     * screen: ticked is a yes, and unticked is a real no, not an unknown. Four
     * of these cover more ground than twenty single questions, and they read
     * as one glance rather than an interrogation.
     *
     * The system still chooses what goes on the list — highest impact first,
     * with everything ruled out already removed — and the model still only
     * rewrites the wording. Neither brain does the other's job.
     *
     * @return array|null null when there is not enough left to be worth bundling.
     */
    public function composeBundleQuestion(
        array $knownFacts,
        array $confirmedCaps,
        array $rejectedCaps,
        array $skippedCaps = []
    ): ?array {
        $members = [];
        $seen = array_merge($confirmedCaps, $rejectedCaps, $skippedCaps);

        // Reuse the scorer so a bundle is the same ranking, taken several at a
        // time — never a second opinion about what matters.
        for ($i = 0; $i < self::BUNDLE_MAX; $i++) {
            $next = $this->selectNextCandidateQuestion($knownFacts, $confirmedCaps, $seen, $skippedCaps);
            if ($next === null) {
                break;
            }
            $members[] = $next;
            $seen[] = $next['key'];
        }

        if (count($members) < self::BUNDLE_MIN) {
            return null;
        }

        $options = [];
        foreach ($members as $cap) {
            $options[] = [
                'key'   => 'cap:' . $cap['key'],
                'label' => $this->bundleLabel($cap),
                'desc'  => $this->bundleDesc($cap),
            ];
        }

        return [
            'key'               => self::BUNDLE_KEY,
            'is_multi'          => true,
            'members'           => array_column($members, 'key'),
            'name'              => 'Several at once',
            'impact'            => 100,
            'domain'            => 'bundle',
            'triggers'          => [],
            'requires_caps'     => [],
            'implies_modules'   => [],
            'consequences'      => ['Tick whatever applies. Anything you leave unticked we leave out — and you can add it later in one tap.'],
            'question_template' => 'Which of these are part of how you work?',
            'options'           => $options,
        ];
    }

    /** A few words for a tick list — not the question that would have been asked. */
    private function bundleLabel(array $cap): string
    {
        // `short` is written for a person; `name` is the internal one and reads
        // like it ("Customer Khata, Credit Ledger & Terms"). A tick list is the
        // first place these were ever shown to anyone, so the plain one wins
        // and `name` is only the fallback.
        $label = trim((string) ($cap['short'] ?? $cap['name'] ?? $cap['key']));

        return mb_strlen($label) > 40 ? rtrim(mb_substr($label, 0, 39)) . '…' : $label;
    }

    private function bundleDesc(array $cap): string
    {
        $first = $cap['consequences'][0] ?? '';
        $first = is_array($first) ? ($first[0] ?? '') : $first;
        $first = trim((string) $first);

        return mb_strlen($first) > 110 ? rtrim(mb_substr($first, 0, 109)) . '…' : $first;
    }

    /**
     * Capabilities not worth spending a question on, given what we read.
     *
     * Distinct from contradictedCapabilities(), which is about something the
     * visitor RULED OUT ("I work alone"). This is softer: a services business
     * probably has no batches or dine-in tables, and with only a handful of
     * questions available, asking anyway is how a plumber ends up being asked
     * about kitchen tickets. Nothing here is disabled — it is one tap away on
     * the reveal, and still reachable if they raise it themselves.
     *
     * @return string[] capability keys
     */
    public function irrelevantCapabilities(array $facts): array
    {
        $sells = $facts['sells']['value'] ?? null;
        if (!is_string($sells)) {
            return [];
        }

        $rules = (array) config("ai_builder.relevance.{$sells}", []);
        if ($rules === []) {
            return [];
        }

        $domains = (array) ($rules['exclude_domains'] ?? []);
        $out = array_values(array_filter(
            (array) ($rules['exclude_caps'] ?? []),
            fn ($k) => is_string($k)
        ));

        if ($domains !== []) {
            foreach ($this->allCapabilities() as $key => $cap) {
                if (in_array($cap['domain'] ?? null, $domains, true)) {
                    $out[] = $key;
                }
            }
        }

        return array_values(array_unique($out));
    }

    public function resolveModules(array $confirmedCaps, ?string $presetKey = null, array $facts = []): array
    {
        $all = $this->allCapabilities();

        // The preset's core, not a universal baseline. The old hardcoded list
        // ('products', 'pos', 'inventory', 'sales_orders', 'customers',
        // 'suppliers', ...) was bolted onto every proposal in every trade, so
        // even a conversation that correctly concluded "one person, no stock,
        // just invoices and expenses" still finished by handing over a
        // supplier network and a stock ledger.
        $modules = $this->coreModules($presetKey);

        foreach ($confirmedCaps as $capKey) {
            if (isset($all[$capKey]['implies_modules'])) {
                $modules = array_merge($modules, $all[$capKey]['implies_modules']);
            }
        }

        $modules = array_diff($modules, $this->contradictedModules($facts));

        // Intersect strictly with live modules in config/modules.php
        $liveRegistry = array_keys(array_filter(config('modules', []), fn ($m) => ($m['status'] ?? null) === 'live'));

        return array_values(array_unique(array_intersect($modules, $liveRegistry)));
    }
}
