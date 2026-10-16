<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\Warehouse;
use App\Models\BankAccount;
use App\Models\Setting;
use App\Models\ExpenseCategory;
use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * TenantDefaultSeeder — Unified Phase 2.2
 *
 * Seeds every new tenant with sane defaults so they land on a
 * working system, not a blank slate.
 */
class TenantDefaultSeeder
{
    public static function seedFor(Tenant $tenant): void
    {
        // Bind tenant so HasTenant global scope works if models are used
        app()->instance('current.tenant', $tenant);

        static::seedChartOfAccounts($tenant);
        static::seedDefaultSettings($tenant);
        static::seedDefaultWarehouse($tenant);
        static::seedExpenseCategories($tenant);
        static::seedCategories($tenant);
        static::seedInitialCashAccount($tenant);
        static::seedAiSettings($tenant);
        static::seedDefaultDashboards($tenant);
        static::seedTemplateBuildingBlocks($tenant);
    }

    private static function seedDefaultDashboards(Tenant $tenant): void
    {
        $now = now();
        $dashboards = [
            [
                'id' => (string) Str::uuid(),
                'name' => 'Owner Overview',
                'slug' => 'owner-overview',
                'is_default' => true,
                'for_role' => 'owner',
                'is_locked' => false,
                'position' => 0,
                'cards' => [
                    [
                        'reading_key' => 'sales.revenue',
                        'period' => 'this_month',
                        'chart' => 'stat',
                        'size' => '4x4',
                        'x' => 0, 'y' => 0, 'w' => 4, 'h' => 4
                    ],
                    [
                        'reading_key' => 'finance.net_profit',
                        'period' => 'this_month',
                        'chart' => 'stat',
                        'size' => '4x4',
                        'x' => 4, 'y' => 0, 'w' => 4, 'h' => 4
                    ],
                    [
                        'reading_key' => 'sales.top_products',
                        'period' => 'this_month',
                        'chart' => 'bar',
                        'size' => '4x8',
                        'x' => 8, 'y' => 0, 'w' => 4, 'h' => 8
                    ],
                    [
                        'reading_key' => 'sales.revenue_trend',
                        'period' => 'this_month',
                        'chart' => 'line',
                        'size' => '8x4',
                        'x' => 0, 'y' => 4, 'w' => 8, 'h' => 4
                    ],
                ]
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Accountant Hub',
                'slug' => 'accountant-hub',
                'is_default' => false,
                'for_role' => 'accountant',
                'is_locked' => false,
                'position' => 1,
                'cards' => [
                    [
                        'reading_key' => 'finance.net_profit',
                        'period' => 'this_month',
                        'chart' => 'stat',
                        'size' => '4x4',
                        'x' => 0, 'y' => 0, 'w' => 4, 'h' => 4
                    ],
                    [
                        'reading_key' => 'finance.balance_sheet_ok',
                        'period' => 'live',
                        'chart' => 'status',
                        'size' => '4x4',
                        'x' => 4, 'y' => 0, 'w' => 4, 'h' => 4
                    ],
                    [
                        'reading_key' => 'inventory.stock_value',
                        'period' => 'live',
                        'chart' => 'stat',
                        'size' => '4x4',
                        'x' => 8, 'y' => 0, 'w' => 4, 'h' => 4
                    ],
                    [
                        'reading_key' => 'finance.expenses_by_category',
                        'period' => 'this_month',
                        'chart' => 'ring',
                        'size' => '8x6',
                        'x' => 0, 'y' => 4, 'w' => 8, 'h' => 6
                    ],
                ]
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Cashier Station',
                'slug' => 'cashier-station',
                'is_default' => false,
                'for_role' => 'cashier',
                'is_locked' => true,
                'position' => 2,
                'cards' => [
                    [
                        'reading_key' => 'sales.revenue',
                        'period' => 'today',
                        'chart' => 'stat',
                        'size' => '4x4',
                        'x' => 0, 'y' => 0, 'w' => 4, 'h' => 4
                    ],
                    [
                        'reading_key' => 'sales.payment_breakdown',
                        'period' => 'today',
                        'chart' => 'pie',
                        'size' => '4x4',
                        'x' => 0, 'y' => 4, 'w' => 4, 'h' => 4
                    ],
                    [
                        'reading_key' => 'sales.live_feed',
                        'period' => 'live',
                        'chart' => 'feed',
                        'size' => '8x8',
                        'x' => 4, 'y' => 0, 'w' => 8, 'h' => 8
                    ],
                ]
            ]
        ];

        $readingModuleMap = [
            'sales.top_products'        => 'products',
            'inventory.stock_value'     => 'inventory',
            'inventory.low_stock_count' => 'inventory',
        ];

        foreach ($dashboards as $d) {
            DB::table('dashboards')->updateOrInsert(
                ['tenant_id' => $tenant->id, 'slug' => $d['slug']],
                [
                    'id' => $d['id'],
                    'name' => $d['name'],
                    'is_default' => $d['is_default'],
                    'for_role' => $d['for_role'],
                    'is_locked' => $d['is_locked'],
                    'position' => $d['position'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            // Re-seed cards
            DB::table('dashboard_cards')->where('dashboard_id', $d['id'])->delete();

            $cards = array_values(array_filter($d['cards'], function ($c) use ($tenant, $readingModuleMap) {
                $requiredModule = $readingModuleMap[$c['reading_key']] ?? null;
                if (!$requiredModule) {
                    return true;
                }
                return \App\Services\ModuleService::enabled($tenant, $requiredModule);
            }));

            foreach ($cards as $c) {
                DB::table('dashboard_cards')->insert([
                    'id' => (string) Str::uuid(),
                    'tenant_id' => $tenant->id,
                    'dashboard_id' => $d['id'],
                    'reading_key' => $c['reading_key'],
                    'period' => $c['period'],
                    'chart' => $c['chart'],
                    'size' => $c['size'],
                    'x' => $c['x'],
                    'y' => $c['y'],
                    'w' => $c['w'],
                    'h' => $c['h'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    private static function seedChartOfAccounts(Tenant $tenant): void
    {
        $accounts = [
            // Assets (1xxx) — aligned with SaleController::postSaleJournal() codes
            ['code' => '1000', 'name' => 'Cash in Hand',             'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit',  'role' => 'cash',                     'is_current' => true],
            ['code' => '1010', 'name' => 'Bank Account',             'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit',  'role' => 'bank',                     'is_current' => true],
            ['code' => '1100', 'name' => 'Inventory Asset',          'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit',  'role' => 'inventory',                'is_current' => true],
            ['code' => '1200', 'name' => 'Accounts Receivable',      'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit',  'role' => 'ar',                       'is_current' => true],
            ['code' => '1205', 'name' => 'Marketplace Clearing',      'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit',  'role' => 'marketplace_clearing',     'is_current' => true],
            ['code' => '1300', 'name' => 'Prepaid Expenses',         'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit',  'role' => 'prepaid',                  'is_current' => true],
            ['code' => '1500', 'name' => 'Fixed Assets',             'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit',  'role' => 'fixed_asset',              'is_current' => false],

            // Liabilities (2xxx)
            ['code' => '2000', 'name' => 'Accounts Payable',         'type' => 'liability', 'balance' => 0, 'normal_balance' => 'credit', 'role' => 'ap',                       'is_current' => true],
            ['code' => '2050', 'name' => 'Customer Credit Balances', 'type' => 'liability', 'balance' => 0, 'normal_balance' => 'credit', 'role' => 'customer_credit',          'is_current' => true],
            ['code' => '2100', 'name' => 'Sales Tax Payable',        'type' => 'liability', 'balance' => 0, 'normal_balance' => 'credit', 'role' => 'tax_output',               'is_current' => true],
            // Tips are collected FOR the staff, so they are owed on from the moment
            // they are taken. Never income — see SaleController::postSaleJournal().
            ['code' => '2150', 'name' => 'Tips Payable',             'type' => 'liability', 'balance' => 0, 'normal_balance' => 'credit', 'role' => 'tips',                     'is_current' => true],
            ['code' => '2200', 'name' => 'Loans Payable',            'type' => 'liability', 'balance' => 0, 'normal_balance' => 'credit', 'role' => 'loan',                     'is_current' => false],
            ['code' => '2300', 'name' => 'Input Tax Recoverable',    'type' => 'asset',     'balance' => 0, 'normal_balance' => 'debit',  'role' => 'tax_input',                'is_current' => true],

            // Equity (3xxx)
            ['code' => '3000', 'name' => "Owner's Capital",          'type' => 'equity',    'balance' => 0, 'normal_balance' => 'credit', 'role' => 'equity',                   'is_current' => false],
            ['code' => '3100', 'name' => 'Retained Earnings',        'type' => 'equity',    'balance' => 0, 'normal_balance' => 'credit', 'role' => 'equity',                   'is_current' => false],
            ['code' => '3999', 'name' => 'Historical Variance',      'type' => 'equity',    'balance' => 0, 'normal_balance' => 'credit', 'role' => 'equity',                   'is_current' => false],
            ['code' => '7000', 'name' => 'Opening Balance Equity',   'type' => 'equity',    'balance' => 0, 'normal_balance' => 'credit', 'role' => 'equity',                   'is_current' => false],

            // Revenue (4xxx) — credit-normal: positive balance = credit > debit
            ['code' => '4000', 'name' => 'Sales Revenue',            'type' => 'income',    'balance' => 0, 'normal_balance' => 'credit', 'role' => 'sales_revenue',             'is_current' => true],
            ['code' => '4100', 'name' => 'Other Income',             'type' => 'income',    'balance' => 0, 'normal_balance' => 'credit', 'role' => 'other_income',              'is_current' => true],
            ['code' => '4200', 'name' => 'Stock Adjustment Gain',    'type' => 'income',    'balance' => 0, 'normal_balance' => 'credit', 'role' => 'other_income',              'is_current' => true],
            ['code' => '4900', 'name' => 'Round Off Income',         'type' => 'income',    'balance' => 0, 'normal_balance' => 'credit', 'role' => 'other_income',              'is_current' => true],

            // Expenses (5xxx) — debit-normal: positive balance = debit > credit
            ['code' => '5000', 'name' => 'Cost of Goods Sold',       'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit',  'role' => 'cogs',                     'is_current' => true],
            ['code' => '5100', 'name' => 'Salaries & Wages',         'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit',  'role' => 'opex',                     'is_current' => true],
            ['code' => '5200', 'name' => 'Rent Expense',             'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit',  'role' => 'opex',                     'is_current' => true],
            ['code' => '5300', 'name' => 'Utilities',                'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit',  'role' => 'opex',                     'is_current' => true],
            ['code' => '5400', 'name' => 'Marketplace & Gateway Fees', 'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit',  'role' => 'opex',                     'is_current' => true],
            ['code' => '5410', 'name' => 'Marketplace Fee Variance',  'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit',  'role' => 'opex',                     'is_current' => true],
            ['code' => '5900', 'name' => 'Round Off Expense',        'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit',  'role' => 'opex',                     'is_current' => true],
            ['code' => '6000', 'name' => 'Operating Expenses',       'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit',  'role' => 'opex',                     'is_current' => true],
            ['code' => '6300', 'name' => 'Stock Adjustment Loss',    'type' => 'expense',   'balance' => 0, 'normal_balance' => 'debit',  'role' => 'opex',                     'is_current' => true],
        ];

        $now = now();
        $hasRole = \Illuminate\Support\Facades\Schema::hasColumn('accounts', 'role');
        $hasIsCurrent = \Illuminate\Support\Facades\Schema::hasColumn('accounts', 'is_current');

        foreach ($accounts as $account) {
            $data = [
                'id'             => (string) Str::uuid(),
                'name'           => $account['name'],
                'type'           => $account['type'],
                'balance'        => $account['balance'],
                'normal_balance' => $account['normal_balance'],
                'is_active'      => true,
                'created_at'     => $now,
                'updated_at'     => $now,
            ];
            if ($hasRole) {
                $data['role'] = $account['role'];
            }
            if ($hasIsCurrent) {
                $data['is_current'] = $account['is_current'];
            }

            DB::table('accounts')->updateOrInsert(
                ['tenant_id' => $tenant->id, 'code' => $account['code']],
                $data
            );
        }
    }

    private static function seedDefaultSettings(Tenant $tenant): void
    {
        $defaults = [
            'store_name'           => $tenant->name,
            'currency_symbol'      => $tenant->currency_symbol ?: '$',
            'currency_code'        => $tenant->currency_code ?: 'USD',
            'decimal_places'       => '2',
            'tax_rate'             => '0',
            'timezone'             => $tenant->timezone ?: 'UTC',
            'invoice_prefix'       => 'INV-',
            'receipt_footer'       => 'Thank you for your business!',
            'setup_completed'      => '0',
            'approval_admin_enabled' => '0',
        ];

        foreach ($defaults as $key => $value) {
            Setting::updateOrCreate(
                ['tenant_id' => $tenant->id, 'key' => $key],
                ['value' => (string) $value]
            );
        }
    }

    private static function seedDefaultWarehouse(Tenant $tenant): void
    {
        Warehouse::updateOrCreate(
            ['tenant_id' => $tenant->id, 'name' => 'Main Warehouse'],
            ['location' => 'Main Location', 'is_default' => true]
        );
    }

    private static function seedExpenseCategories(Tenant $tenant): void
    {
        $categories = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Miscellaneous'];
        foreach ($categories as $name) {
            ExpenseCategory::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $name],
                ['is_active' => true]
            );
        }
    }

    /**
     * Seeds base product & service categories tailored to the tenant's business type.
     * Users can keep them, rename them, or delete them anytime.
     */
    public static function seedCategories(Tenant $tenant): void
    {
        // If the tenant already has categories created, do not overwrite/duplicate
        if (Category::withoutGlobalScopes()->where('tenant_id', $tenant->id)->exists()) {
            return;
        }

        $businessType = $tenant->business_type;
        $categoryNames = [];

        // 1. Direct business_type category mapping
        $typeCategoryMap = [
            // Services & Trades
            'phone_repair'       => ['Screen Replacements', 'Batteries & Charging', 'Repair Services', 'Accessories & Cables', 'Tempered Glass'],
            'computer_repair'    => ['Hardware Upgrades', 'Diagnostic & Software', 'Laptop Parts', 'Networking', 'Accessories'],
            'auto_repair'        => ['Mechanical Repairs', 'Oil & Lubricants', 'Brake Systems', 'Engine Tuning', 'Electrical & Battery'],
            'appliance_repair'   => ['Spare Parts', 'Inspection & Labour', 'Compressors & Motors', 'Maintenance Kits'],
            'bike_service'       => ['Tuning & Overhaul', 'Chain & Sprockets', 'Brake Pads & Cables', 'Tyres & Tubes', 'Engine Oil'],
            'salon_barber'       => ['Haircuts & Styling', 'Beard Grooming', 'Facials & Skincare', 'Hair Treatments', 'Retail Products'],
            'nail_spa'           => ['Manicure & Pedicure', 'Nail Art & Extensions', 'Polish & Gel', 'Hand & Foot Care'],
            'pet_care'           => ['Grooming & Wash', 'Veterinary Consultation', 'Pet Boarding', 'Vaccinations'],
            'freelance_creative' => ['Design & Branding', 'Copywriting & Content', 'Consultation', 'Revisions & Retainers'],
            'marketing_agency'   => ['Digital Marketing', 'SEO & Analytics', 'Social Media Management', 'Campaign Strategy'],
            'consultant'         => ['Advisory Sessions', 'Auditing & Review', 'Implementation Support', 'Strategy Retainers'],
            'accounting_firm'    => ['Bookkeeping Services', 'Tax Filing & Prep', 'Auditing Services', 'Payroll Processing'],
            'law_firm'           => ['Legal Consultation', 'Contract Drafting', 'Dispute Resolution', 'Retainer Services'],
            'architect_interior' => ['Architectural Drawings', 'Interior Design Concepts', 'Site Supervision', '3D Visualisation'],
            'photo_video'        => ['Event Photography', 'Video Production', 'Portrait Sessions', 'Editing & Retouching'],
            'electrician'        => ['Wiring & Installation', 'Repairs & Troubleshooting', 'Lighting Fixtures', 'Breakers & Panels'],
            'plumber'            => ['Leak Repair & Piping', 'Sanitary Fittings', 'Drain Cleaning', 'Water Heaters & Pumps'],
            'carpenter'          => ['Custom Woodwork', 'Furniture Repair', 'Cabinetry & Shelving', 'Door & Window Fitting'],
            'painter_renovation' => ['Interior Painting', 'Exterior Painting', 'Wall Putty & Prep', 'Waterproofing'],
            'cleaning'           => ['Deep Cleaning', 'Office & Commercial', 'Carpet & Sofa Cleaning', 'Janitorial Supplies'],
            'hvac'               => ['AC Installation', 'AC Servicing & Gas', 'Duct Cleaning', 'Heating Maintenance'],
            'pest_control'       => ['Termite Treatment', 'General Fumigation', 'Rodent Control', 'Preventative Sprays'],
            'equipment_rental'   => ['Power Tools', 'Heavy Machinery', 'Ladders & Scaffolding', 'Generators'],
            'event_hire'         => ['Tents & Canopies', 'Sound & Stage', 'Tables & Chairs', 'Lighting & Decor'],
            'gym_fitness'        => ['Monthly Memberships', 'Personal Training', 'Day Passes', 'Supplements & Drinks'],
            'tuition_academy'    => ['Subject Courses', 'Exam Prep Coaching', 'Private Tutoring', 'Study Material & Notes'],

            // Retail & Merchandising
            'grocery'             => ['Fresh Produce', 'Dairy & Eggs', 'Beverages', 'Snacks & Confectionery', 'Staples & Grains', 'Household Cleaners'],
            'supermarket'         => ['Bakery', 'Frozen Foods', 'Personal Care', 'Dairy & Drinks', 'Household Essentials', 'Canned Goods'],
            'pharmacy'            => ['Prescription Medicine', 'OTC & Pain Relief', 'Vitamins & Supplements', 'First Aid & Surgical', 'Personal Hygiene', 'Baby Care'],
            'surgical_supplies'   => ['Surgical Instruments', 'Disposable Supplies', 'Diagnostic Devices', 'Orthopedic Supports', 'Hospital Consumables', 'Sterilization & PPE'],
            'mobile_retail'       => ['Smartphones', 'Tablets', 'Chargers & Cables', 'Cases & Protectors', 'Earphones & Audio', 'Power Banks'],
            'electronics'         => ['Televisions & Home Video', 'Laptops & Computers', 'Home Appliances', 'Audio & Speakers', 'Cables & Accessories'],
            'fashion'             => ["Men's Wear", "Women's Wear", "Kids Wear", 'Footwear', 'Accessories & Bags'],
            'footwear'            => ['Casual Shoes', 'Formal Shoes', 'Sports & Running', 'Sandals & Slippers', 'Shoe Care Accessories'],
            'jewellery'           => ['Rings', 'Necklaces & Chains', 'Earrings', 'Bracelets & Bangles', 'Gold & Silver Coins', 'Gemstones'],
            'cosmetics'           => ['Makeup & Face', 'Skincare', 'Hair Care', 'Fragrances & Perfumes', 'Brushes & Tools', 'Bath & Body'],
            'hardware'            => ['Hand Tools', 'Power Tools', 'Fasteners & Screws', 'Electrical & Wiring', 'Plumbing & Pipes', 'Paints & Finishes'],
            'sanitary_supply'     => ['Faucets & Mixers', 'Sanitary Ware & Basins', 'Shower Fittings', 'PVC & PPRC Pipes', 'Tile Adhesives'],
            'building_materials'  => ['Cement & Concrete', 'Steel & Rebar', 'Bricks & Blocks', 'Aggregates & Sand', 'Waterproofing'],
            'furniture_store'     => ['Living Room Sofas', 'Beds & Mattresses', 'Dining Sets', 'Office Desks & Chairs', 'Storage & Wardrobes'],
            'books_stationery'    => ['Fiction & Literature', 'Academic & Textbooks', 'Notebooks & Registers', 'Pens & Writing', 'Art & Craft Supplies', 'Office Supplies'],
            'toys'                => ['Action Figures & Dolls', 'Educational & STEM', 'Board Games & Puzzles', 'Outdoor & Ride-ons', 'Baby & Toddler Toys'],
            'pet_supply'          => ['Dog Food', 'Cat Food', 'Treats & Chews', 'Toys & Training', 'Grooming & Shampoo', 'Leashes & Collars'],
            'auto_parts'          => ['Engine Components', 'Brake Pads & Rotors', 'Suspension & Steering', 'Filters & Plugs', 'Oils & Lubricants', 'Lighting & Bulbs'],
            'tyre_battery'        => ['Car Tyres', 'Motorcycle Tyres', 'Batteries', 'Alloy Rims', 'Tire Repair & Tubes'],
            'optical'             => ['Eyeglass Frames', 'Sunglasses', 'Prescription Lenses', 'Contact Lenses', 'Cases & Lens Cleaning'],
            'gift_flower'         => ['Fresh Bouquets', 'Gift Hampers', 'Greeting Cards', 'Perfume Gifts', 'Custom Keepsakes'],
            'vape_tobacco'        => ['E-Liquids & Juices', 'Vape Devices & Pods', 'Coils & Cartridges', 'Cigars & Accessories'],
            'sports'              => ['Cricket & Football Gear', 'Fitness & Gym Gear', 'Racquets & Balls', 'Sportswear & Jerseys', 'Water Bottles & Accessories'],
            'electrical_lighting' => ['LED Bulbs & Tubes', 'Chandeliers & Lamps', 'Switches & Sockets', 'Wires & Cables', 'Circuit Breakers'],
            'kitchenware'         => ['Cookware & Pots', 'Tableware & Plates', 'Cutlery & Utensils', 'Kitchen Appliances', 'Storage Jars & Containers'],

            // Food, Beverage & Hospitality
            'restaurant'    => ['Appetizers & Starters', 'Main Courses', 'BBQ & Grills', 'Sides & Salads', 'Beverages', 'Desserts'],
            'cafe'          => ['Hot Coffees & Espresso', 'Iced Drinks & Frappes', 'Tea & Infusions', 'Bakery & Sandwiches', 'Breakfast Specials'],
            'tea_shop'      => ['Karak & Chai', 'Green & Herbal Teas', 'Biscuits & Snacks', 'Cold Beverages'],
            'bakery'        => ['Fresh Breads & Buns', 'Cakes & Pastries', 'Cookies & Biscuits', 'Savouries & Patties', 'Custom Order Cakes'],
            'fast_food'     => ['Burgers & Wraps', 'Fried Chicken', 'Pizzas', 'Fries & Sides', 'Cold Drinks & Shakes'],
            'dessert'       => ['Ice Cream & Gelato', 'Waffles & Crepes', 'Puddings & Custards', 'Chocolates & Brownies'],
            'juice_bar'     => ['Fresh Fruit Juices', 'Smoothies & Shakes', 'Detox Blends', 'Fruit Bowls & Chaat'],
            'food_truck'    => ['Signature Specials', 'Quick Bites & Rolls', 'Combo Meals', 'Drinks & Cans'],
            'sweets'        => ['Traditional Mithai', 'Halwas & Ladoos', 'Barfi & Milk Sweets', 'Dry Fruit Treats'],
            'catering'      => ['Buffet Packages', 'Corporate Lunch Boxes', 'Wedding Menus', 'Live Cooking Stations'],
            'cloud_kitchen' => ['Combo Platters', 'Bowls & Rice', 'Wraps & Sandwiches', 'Beverages & Desserts'],
            'pub_lounge'    => ['Mocktails & Drinks', 'Bar Snacks & Platters', 'Sliders & Wings', 'Main Entrees'],

            // Wholesale, Trade & B2B Distribution
            'fmcg_wholesale'        => ['Bulk Staples & Rice', 'Edible Oils & Ghee', 'Beverages & Soft Drinks', 'Packaged Confectionery', 'Cleaning Detergents'],
            'grain_commodities'     => ['Wheat & Flour', 'Rice Varieties', 'Pulses & Lentils', 'Sugar & Salt', 'Animal Feed'],
            'fabric_stockist'       => ['Cotton & Lawn', 'Silk & Chiffon', 'Linen & Blends', 'Wool & Winter Fabrics', 'Printed Rolls'],
            'hardware_wholesale'    => ['Bulk Fasteners', 'Hand Tools Cartons', 'Plumbing Supplies', 'Abrasives & Cutting Wheels'],
            'electrical_wholesale'  => ['Cable Drums', 'Distribution Boards', 'Conduit Pipes & Fittings', 'Switchgear & Breakers'],
            'pharma_wholesale'      => ['Tablets & Capsules (Cartons)', 'Syrups & Suspensions', 'Injectables', 'Surgical Disposables Bulk'],
            'tech_distributor'      => ['Laptops & Desktops Bulk', 'Peripherals & Cables', 'Printers & Cartridges', 'Network Switches & APs'],
            'auto_parts_distributor'=> ['Fast Moving Filters', 'Brake Friction Bulk', 'Suspension Units', 'Engine Lubricants (Drums)'],
            'packaging'             => ['Corrugated Cartons', 'Plastic Bags & Pouches', 'Tapes & Shrink Film', 'Disposable Containers'],
            'office_supplies'       => ['A4 Paper Reams', 'Stationery Bundles', 'Cartridges & Toners', 'Filing & Folders'],
            'chemicals'             => ['Industrial Cleaning Agents', 'Solvents & Thinners', 'Agricultural Fertilizers', 'Raw Chemical Compounds'],
            'import_export'         => ['General Merchandise', 'Raw Commodities', 'Packaged Goods', 'Clearance Lots'],

            // Light Manufacturing & Assembly
            'commercial_bakery' => ['Breads & Loaves', 'Buns & Rolls', 'Packaged Cakes', 'Bulk Pastry Sheets'],
            'tailoring'         => ['Stitching Services', 'Alterations', 'Custom Suits', 'Traditional Wear', 'Fabric & Linings'],
            'furniture_maker'   => ['Beds & Headboards', 'Dining Tables', 'Wardrobes & Cabinets', 'Custom Joinery'],
            'coffee_spice'      => ['Roasted Coffee Beans', 'Ground Spices', 'Whole Spices', 'Specialty Blends'],
            'signage_print'     => ['Banners & Flex Printing', 'Acrylic & 3D Letters', 'Stickers & Labels', 'Digital Signage Panels'],
            'soap_candle'       => ['Handmade Soaps', 'Scented Candles', 'Wax Melts & Diffusers', 'Body Care Products'],
            'kit_assembly'      => ['Assembled Toolkits', 'Hardware Kits', 'Electronic Starter Packs', 'Packing Supplies'],
            'aluminium_glass'   => ['Aluminium Windows', 'Glass Partitions', 'Doors & Entrances', 'Curtain Wall Fittings'],
            'leather_goods'     => ['Leather Wallets', 'Bags & Backpacks', 'Belts & Accessories', 'Jackets & Wearables'],
            'custom_merch'      => ['Printed T-Shirts', 'Customised Mugs', 'Corporate Gifts', 'Keychains & Promotional'],
        ];

        if ($businessType && isset($typeCategoryMap[$businessType])) {
            $categoryNames = $typeCategoryMap[$businessType];
        } else {
            // 2. Fallback to industries.php lookup
            $industryKey = $tenant->industry ?? 'Retail';
            $allIndustries = (array) config('industries', []);
            $matchedKey = collect(array_keys($allIndustries))->first(fn ($k) => strtolower($k) === strtolower((string)$industryKey));
            if ($matchedKey && !empty($allIndustries[$matchedKey]['categories'])) {
                $categoryNames = array_keys($allIndustries[$matchedKey]['categories']);
            }
        }

        // 3. Fallback to basic retail categories if none matched
        if (empty($categoryNames)) {
            $categoryNames = ['General Products', 'Fast Moving Items', 'Special Items', 'Accessories'];
        }

        foreach ($categoryNames as $name) {
            Category::firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'name'      => $name,
                ],
                [
                    'id'   => (string) Str::uuid(),
                    'code' => strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $name), 0, 4)) ?: 'CAT',
                ]
            );
        }
    }

    private static function seedInitialCashAccount(Tenant $tenant): void
    {
        // ONE single Cash Account record linked to the tenant
        BankAccount::updateOrCreate(
            ['tenant_id' => $tenant->id, 'type' => 'cash'],
            [
                'name'            => 'Cash in Hand',
                'current_balance' => 0,
                'account_type'    => 'Default',
            ]
        );
    }

    /**
     * Growth Engine defaults. Added 2026-08-02 to close a gap: the values here
     * were originally inserted only via two one-off migrations —
     * 2026_01_08_181305_create_growth_engine_tables (global rows, no
     * tenant_id) and 2026_06_07_000000_add_tenant_id_to_ai_settings_table
     * (backfilled these SAME values for every tenant that existed at the time
     * that migration ran). Neither migration re-runs for tenants created
     * afterward, so every tenant provisioned after 2026-06-07 has had NO
     * ai_settings rows at all — GrowthEngineController::settings() then falls
     * back to its own hardcoded $defaults array, which uses DIFFERENT values
     * for several keys (most visibly regular_customer_min_orders: '2' in the
     * controller vs '3' here). Same product, two different Growth Engine
     * behaviours, depending only on when the store signed up.
     *
     * The values below are the migration's values — the deliberately-chosen
     * product defaults that were backfilled for existing tenants — NOT the
     * controller's divergent fallback. If GrowthEngineController::settings()
     * is ever changed, its $defaults array must match this list exactly.
     */
    private static function seedAiSettings(Tenant $tenant): void
    {
        $defaults = [
            'regular_customer_min_orders'    => '3',
            'regular_customer_period_days'   => '60',
            'min_order_value_filter'         => '5000',
            'lookahead_days'                 => '7',
            'loyalty_points_per_amount'      => '100',
            'loyalty_points_earned_per_unit' => '1',
            'loyalty_redemption_rate'        => '10',
        ];

        $now = now();
        foreach ($defaults as $key => $value) {
            DB::table('ai_settings')->updateOrInsert(
                ['tenant_id' => $tenant->id, 'key' => $key],
                [
                    'id'         => (string) Str::uuid(),
                    'value'      => $value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    private static function seedTemplateBuildingBlocks(Tenant $tenant): void
    {
        $rawKey = $tenant->industry_type ?? $tenant->business_type ?? $tenant->industry ?? 'retail_store';
        $templateKey = \Database\Seeders\BusinessTemplatesSeeder::mapToTemplateKey((string) $rawKey);

        $templates = \Database\Seeders\BusinessTemplatesSeeder::getTemplates();
        $selectedTemplate = $templates[$templateKey] ?? $templates['retail_store'];

        // 1. Seed capabilities into tenant_plan_overrides
        foreach ($selectedTemplate['capabilities'] as $capKey) {
            DB::table('tenant_plan_overrides')->updateOrInsert(
                ['tenant_id' => $tenant->id, 'override_key' => $capKey],
                [
                    'override_value' => '1',
                    'applied_by'     => 'system_template',
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]
            );
        }

        // 2. Seed terminology into tenant_terminology — only for stores that
        // are NOT one of the 85 catalogue types. Those get their words from
        // config/business_types.php via StoreProvisioner (one source).
        $isCatalogueType = \App\Support\BusinessTypes::exists((string) ($tenant->business_type ?? ''));
        foreach ($isCatalogueType ? [] : $selectedTemplate['terminology'] as $termKey => $terms) {
            DB::table('tenant_terminology')->updateOrInsert(
                ['tenant_id' => $tenant->id, 'term_key' => $termKey],
                [
                    'singular'   => $terms['singular'],
                    'plural'     => $terms['plural'],
                    'updated_at' => now(),
                ]
            );
        }
    }
}
