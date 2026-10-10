<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Tenant;
use App\Models\User;
use App\Models\TenantUser;
use App\Models\Warehouse;
use App\Models\Account;
use App\Models\BankAccount;
use App\Models\Setting;
use App\Models\Product;
use App\Models\Category;
use App\Models\Stock;
use App\Models\Position;
use App\Models\Occupancy;
use App\Models\Register;
use App\Models\RegisterShift;
use Database\Seeders\TenantDefaultSeeder;

class InternationalStoresSeeder extends Seeder
{
    public function run(): void
    {
        echo "=================================================================\n";
        echo "INTERNATIONAL STORES & MULTI-YEAR COMPREHENSIVE DATA SEEDER\n";
        echo "=================================================================\n";

        // Store 1: International Normal Retail Emporium
        $retailConfig = [
            'owner' => [
                'name'     => 'Alexander Vance',
                'email'    => 'alexander.vance@meridian-lux.com',
                'password' => 'Password@2026!',
                'pin'      => '123456',
                'pos_pin'  => '1234',
            ],
            'tenant' => [
                'name'          => 'Meridian Global Emporium',
                'slug'          => 'meridian-global',
                'business_type' => 'general_mega_store',
                'type'          => 'retail',
            ],
            'categories' => [
                'Horology'    => 'Luxury Watches & Horology',
                'Apparel'     => 'Designer Apparel & Outerwear',
                'Leather'     => 'Fine Leather Goods & Luggage',
                'Electronics' => 'Audio & Smart Electronics',
                'Lifestyle'   => 'Fragrance & Living',
            ],
            'products' => [
                ['sku' => 'HOR-001', 'name' => 'Geneva Chronograph Automatic 42mm', 'cat' => 'Horology',    'price' => 2450.00, 'cost' => 1400.00, 'init' => 20],
                ['sku' => 'HOR-002', 'name' => 'Monaco Heritage Steel Diver 300m',    'cat' => 'Horology',    'price' => 1850.00, 'cost' => 980.00,  'init' => 25],
                ['sku' => 'HOR-003', 'name' => 'Bauhaus Minimalist Titanium Watch',   'cat' => 'Horology',    'price' => 890.00,  'cost' => 420.00,  'init' => 30],
                ['sku' => 'APP-001', 'name' => 'Italian Cashmere Overcoat (Charcoal)', 'cat' => 'Apparel',     'price' => 1150.00, 'cost' => 520.00,  'init' => 35],
                ['sku' => 'APP-002', 'name' => 'Tailored Velvet Evening Blazer',       'cat' => 'Apparel',     'price' => 680.00,  'cost' => 290.00,  'init' => 40],
                ['sku' => 'APP-003', 'name' => 'Merino Wool Turtleneck Sweater',      'cat' => 'Apparel',     'price' => 260.00,  'cost' => 95.00,   'init' => 60],
                ['sku' => 'APP-004', 'name' => 'Japanese Selvedge Denim Trouser',     'cat' => 'Apparel',     'price' => 220.00,  'cost' => 85.00,   'init' => 50],
                ['sku' => 'LEA-001', 'name' => 'Florence Full-Grain Leather Briefcase', 'cat' => 'Leather',     'price' => 540.00,  'cost' => 240.00,  'init' => 30],
                ['sku' => 'LEA-002', 'name' => 'Weekend Travel Duffel Bag (Cognac)',   'cat' => 'Leather',     'price' => 490.00,  'cost' => 210.00,  'init' => 35],
                ['sku' => 'LEA-003', 'name' => 'Minimalist Bi-Fold Card Wallet',       'cat' => 'Leather',     'price' => 110.00,  'cost' => 38.00,   'init' => 80],
                ['sku' => 'ELE-001', 'name' => 'Acoustic Master ANC Headphones',       'cat' => 'Electronics', 'price' => 380.00,  'cost' => 180.00,  'init' => 45],
                ['sku' => 'ELE-002', 'name' => 'Hi-Fi Wireless Bookshelf Monitor',     'cat' => 'Electronics', 'price' => 520.00,  'cost' => 260.00,  'init' => 30],
                ['sku' => 'ELE-003', 'name' => 'Titanium Smart Activity Tracker',      'cat' => 'Electronics', 'price' => 290.00,  'cost' => 140.00,  'init' => 50],
                ['sku' => 'LIF-001', 'name' => 'Sandalwood & Amber Botanical Candle',  'cat' => 'Lifestyle',   'price' => 68.00,   'cost' => 22.00,   'init' => 90],
                ['sku' => 'LIF-002', 'name' => 'Artisanal Ceramic Ultrasonic Diffuser','cat' => 'Lifestyle',   'price' => 135.00,  'cost' => 48.00,   'init' => 50],
            ],
            'suppliers' => [
                ['name' => 'Vanguard Global Supply Co.',    'city' => 'Zurich',        'email' => 'orders@vanguard-supply.ch', 'phone' => '+41 44 211 4000'],
                ['name' => 'Sterling & Co. Wholesale',      'city' => 'New York',      'email' => 'sales@sterlingwholesale.us', 'phone' => '+1 212 555 0199'],
                ['name' => 'Lumina Acoustic & Sound Corp.', 'city' => 'San Francisco', 'email' => 'b2b@luminasound.io',        'phone' => '+1 415 555 0142'],
                ['name' => 'Atelier Heritage Textiles',     'city' => 'Milan',         'email' => 'supply@atelierheritage.it', 'phone' => '+39 02 8765 4321'],
            ],
            'customers' => [
                ['name' => 'Marcus Sterling',     'city' => 'London',    'email' => 'm.sterling@uk-finance.co.uk', 'phone' => '+44 20 7946 0912'],
                ['name' => 'Sophia Dubois',       'city' => 'Paris',     'email' => 'sophia.dubois@luxstyle.fr',   'phone' => '+33 1 42 68 55 00'],
                ['name' => 'Liam O\'Connor',      'city' => 'Dublin',    'email' => 'liam.oconnor@techventure.ie', 'phone' => '+353 1 496 0123'],
                ['name' => 'Isabella Rossi',      'city' => 'Milan',     'email' => 'isabella.rossi@designstudio.it','phone'=> '+39 02 9876 5432'],
                ['name' => 'Oliver Zhang',        'city' => 'Singapore', 'email' => 'oliver.zhang@singaporecap.sg','phone'=> '+65 6789 0123'],
                ['name' => 'Victoria Lindqvist',  'city' => 'Stockholm', 'email' => 'victoria@nordicconsult.se',   'phone' => '+46 8 123 4567'],
                ['name' => 'Julian Al-Mansoor',   'city' => 'Dubai',     'email' => 'julian@emiratesholdings.ae',  'phone' => '+971 4 321 0000'],
                ['name' => 'Elena Rostova',       'city' => 'Geneva',    'email' => 'elena.rostova@genevaprivate.ch','phone'=> '+41 22 710 0000'],
            ],
            'monthly_expenses' => [
                ['cat' => 'Rent Expense',        'code' => '5200', 'amt' => 4500.00, 'method' => 'bank', 'desc' => 'Flagship Boutique Commercial Lease'],
                ['cat' => 'Utilities',           'code' => '5300', 'amt' => 680.00,  'method' => 'bank', 'desc' => 'Commercial Power, HVAC & Fiber Internet'],
                ['cat' => 'Salaries & Wages',    'code' => '5100', 'amt' => 9200.00, 'method' => 'bank', 'desc' => 'Staff Payroll & Store Associates'],
                ['cat' => 'Operating Expenses',  'code' => '6000', 'amt' => 1200.00, 'method' => 'bank', 'desc' => 'Global Digital Marketing & PR Campaign'],
                ['cat' => 'Operating Expenses',  'code' => '6000', 'amt' => 450.00,  'method' => 'cash', 'desc' => 'Luxury Packaging & Gift Wrap Consumables'],
            ],
        ];

        // Store 2: International Gourmet Restaurant & Bistro
        $restaurantConfig = [
            'owner' => [
                'name'     => 'Sebastian Laurent',
                'email'    => 'sebastian.laurent@le-ciel-dining.com',
                'password' => 'Password@2026!',
                'pin'      => '123456',
                'pos_pin'  => '1234',
            ],
            'tenant' => [
                'name'          => 'Le Ciel Gourmet Bistro & Bar',
                'slug'          => 'le-ciel-bistro',
                'business_type' => 'restaurant',
                'type'          => 'restaurant',
            ],
            'categories' => [
                'Starters'  => 'Starters & Hors d\'œuvres',
                'Mains'     => 'Chef\'s Prime Cuts & Grills',
                'Pasta'     => 'Artisanal Pasta & Risotto',
                'Seafood'   => 'Fresh Seafood & Ocean Catch',
                'Beverages' => 'Signature Cocktails & Fine Wine',
                'Desserts'  => 'Patisserie & Artisan Coffee',
            ],
            'products' => [
                ['sku' => 'DSH-001', 'name' => 'Wagyu Ribeye Steak A5 (10oz)',          'cat' => 'Mains',     'price' => 74.00, 'cost' => 29.00, 'init' => 60],
                ['sku' => 'DSH-002', 'name' => 'Roasted Australian Rack of Lamb',       'cat' => 'Mains',     'price' => 54.00, 'cost' => 22.00, 'init' => 50],
                ['sku' => 'DSH-003', 'name' => 'Duck Confit with Cherry Port Glaze',    'cat' => 'Mains',     'price' => 42.00, 'cost' => 16.00, 'init' => 50],
                ['sku' => 'SEA-001', 'name' => 'Pan-Seared Chilean Sea Bass',           'cat' => 'Seafood',   'price' => 48.00, 'cost' => 19.50, 'init' => 50],
                ['sku' => 'SEA-002', 'name' => 'Lobster Thermidor & Brioche Toast',     'cat' => 'Seafood',   'price' => 58.00, 'cost' => 24.00, 'init' => 40],
                ['sku' => 'PAS-001', 'name' => 'Black Truffle & Porcini Tagliolini',    'cat' => 'Pasta',     'price' => 36.00, 'cost' => 11.50, 'init' => 70],
                ['sku' => 'PAS-002', 'name' => 'Saffron Risotto with Jumbo Scallops',   'cat' => 'Pasta',     'price' => 38.00, 'cost' => 13.00, 'init' => 60],
                ['sku' => 'STR-001', 'name' => 'French Onion Soup Gratinée',            'cat' => 'Starters',  'price' => 18.00, 'cost' => 5.20,  'init' => 90],
                ['sku' => 'STR-002', 'name' => 'Artisanal Charcuterie & Cheese Board',  'cat' => 'Starters',  'price' => 34.00, 'cost' => 13.50, 'init' => 60],
                ['sku' => 'STR-003', 'name' => 'Burrata Pugliese & Heirloom Tomato',    'cat' => 'Starters',  'price' => 22.00, 'cost' => 7.80,  'init' => 80],
                ['sku' => 'BEV-001', 'name' => 'Smoked Barrel Bourbon Old Fashioned',    'cat' => 'Beverages', 'price' => 19.00, 'cost' => 4.20,  'init' => 120],
                ['sku' => 'BEV-002', 'name' => 'French 75 Vintage Champagne Cocktail',  'cat' => 'Beverages', 'price' => 21.00, 'cost' => 5.00,  'init' => 100],
                ['sku' => 'BEV-003', 'name' => 'Château Margaux Grand Cru Glass',       'cat' => 'Beverages', 'price' => 32.00, 'cost' => 11.00, 'init' => 80],
                ['sku' => 'BEV-004', 'name' => 'Acqua Panna Still Mineral 750ml',       'cat' => 'Beverages', 'price' => 8.50,  'cost' => 2.10,  'init' => 150],
                ['sku' => 'DST-001', 'name' => 'Classic Tahitian Vanilla Crème Brûlée', 'cat' => 'Desserts',  'price' => 16.00, 'cost' => 3.80,  'init' => 90],
                ['sku' => 'DST-002', 'name' => 'Warm Valrhona Chocolate Lava Fondant',  'cat' => 'Desserts',  'price' => 18.00, 'cost' => 4.50,  'init' => 80],
                ['sku' => 'DST-003', 'name' => 'Italian Double Espresso Solo',          'cat' => 'Desserts',  'price' => 6.50,  'cost' => 1.20,  'init' => 200],
            ],
            'suppliers' => [
                ['name' => 'Gourmet Artisan Provisions',    'city' => 'Paris',         'email' => 'contact@gourmetprovisions.fr', 'phone' => '+33 1 40 20 50 00'],
                ['name' => 'Heritage Prime Meat Wholesalers','city' => 'Chicago',      'email' => 'sales@heritageprimemeats.com', 'phone' => '+1 312 555 0188'],
                ['name' => 'Pacific Catch Ocean Fresh',     'city' => 'Boston',        'email' => 'orders@pacificcatchfresh.com', 'phone' => '+1 617 555 0192'],
                ['name' => 'Grand Cru Wine & Spirits Import','city' => 'Bordeaux',     'email' => 'b2b@grandcruimports.eu',       'phone' => '+33 5 56 00 00 00'],
            ],
            'customers' => [
                ['name' => 'Eleanor Vance',       'city' => 'New York',  'email' => 'eleanor.vance@vancemedia.com',  'phone' => '+1 212 555 0177'],
                ['name' => 'Charlotte Laurent',   'city' => 'Paris',     'email' => 'charlotte.l@luxurytravel.fr',   'phone' => '+33 1 45 67 89 00'],
                ['name' => 'Lucas Moreau',        'city' => 'Brussels',  'email' => 'lucas.moreau@eurodialogue.be',  'phone' => '+32 2 511 00 00'],
                ['name' => 'Sophia Dubois',       'city' => 'Paris',     'email' => 'sophia.dubois@luxstyle.fr',     'phone' => '+33 1 42 68 55 00'],
                ['name' => 'Liam O\'Connor',      'city' => 'Dublin',    'email' => 'liam.oconnor@techventure.ie',   'phone' => '+353 1 496 0123'],
                ['name' => 'Julian Al-Mansoor',   'city' => 'Dubai',     'email' => 'julian@emiratesholdings.ae',    'phone' => '+971 4 321 0000'],
                ['name' => 'Elena Rostova',       'city' => 'Geneva',    'email' => 'elena.rostova@genevaprivate.ch','phone'=> '+41 22 710 0000'],
                ['name' => 'Marcus Sterling',     'city' => 'London',    'email' => 'm.sterling@uk-finance.co.uk',   'phone' => '+44 20 7946 0912'],
            ],
            'monthly_expenses' => [
                ['cat' => 'Rent Expense',        'code' => '5200', 'amt' => 3800.00,  'method' => 'bank', 'desc' => 'Bistro Restaurant & Terrace Commercial Lease'],
                ['cat' => 'Utilities',           'code' => '5300', 'amt' => 850.00,   'method' => 'bank', 'desc' => 'Commercial Gas, High-Wattage Power & Water'],
                ['cat' => 'Salaries & Wages',    'code' => '5100', 'amt' => 6800.00,  'method' => 'bank', 'desc' => 'Kitchen Brigade, Waitstaff & Sommelier Payroll'],
                ['cat' => 'Operating Expenses',  'code' => '6000', 'amt' => 750.00,   'method' => 'bank', 'desc' => 'Gastronomy PR, Reservations Software & Social Ads'],
                ['cat' => 'Operating Expenses',  'code' => '6000', 'amt' => 450.00,   'method' => 'cash', 'desc' => 'Laundry, Table Linens & Kitchen Sanitation Supplies'],
            ],
        ];

        $this->seedStore($retailConfig);
        $this->seedStore($restaurantConfig);

        echo "\n=================================================================\n";
        echo "ALL SEEDING COMPLETED SUCCESSFULLY!\n";
        echo "=================================================================\n";
    }

    private function seedStore(array $config): void
    {
        $ownerData  = $config['owner'];
        $tenantData = $config['tenant'];
        $isRestaurant = ($tenantData['type'] === 'restaurant');

        echo "\n>>> INITIALIZING STORE: {$tenantData['name']} ({$tenantData['slug']}) <<<\n";

        // 1. Create or Update Owner User
        $user = User::updateOrCreate(
            ['email' => $ownerData['email']],
            [
                'name'              => $ownerData['name'],
                'password'          => Hash::make($ownerData['password']),
                'role'              => 'owner',
                'email_verified_at' => Carbon::parse('2025-10-01 08:00:00'),
                'passcode'          => $ownerData['pin'],
                'created_at'        => Carbon::parse('2025-10-01 08:00:00'),
                'updated_at'        => now(),
            ]
        );
        $userId = $user->id;

        // 2. Create or Find Tenant
        $tenant = Tenant::where('slug', $tenantData['slug'])->first();
        if (!$tenant) {
            $tenant = Tenant::create([
                'name'                 => $tenantData['name'],
                'slug'                 => $tenantData['slug'],
                'business_type'        => $tenantData['business_type'],
                'currency_code'        => 'USD',
                'currency_symbol'      => '$',
                'country_code'         => 'US',
                'timezone'             => 'America/New_York',
                'plan'                 => 'scale',
                'status'               => 'active',
                'setup_completed'      => true,
                'onboarding_completed' => true,
                'onboarding_step'      => 'completed',
                'terms_accepted_at'    => Carbon::parse('2025-10-01 08:00:00'),
                'terms_version'        => 'v4.0',
                'created_at'           => Carbon::parse('2025-10-01 08:00:00'),
                'updated_at'           => now(),
            ]);
        } else {
            $tenant->update([
                'name'                 => $tenantData['name'],
                'business_type'        => $tenantData['business_type'],
                'currency_code'        => 'USD',
                'currency_symbol'      => '$',
                'country_code'         => 'US',
                'timezone'             => 'America/New_York',
                'plan'                 => 'scale',
                'status'               => 'active',
                'setup_completed'      => true,
                'onboarding_completed' => true,
                'onboarding_step'      => 'completed',
            ]);
        }
        $tenantId = $tenant->id;
        $user->update(['last_store_id' => $tenantId]);

        // 3. Link Membership in tenant_users
        TenantUser::updateOrCreate(
            ['tenant_id' => $tenantId, 'user_id' => $userId],
            [
                'role'            => 'owner',
                'membership_type' => 'full',
                'status'          => 'active',
                'display_name'    => $ownerData['name'],
                'security_pin'    => Hash::make($ownerData['pin']),
                'pos_pin'         => Hash::make($ownerData['pos_pin']),
                'joined_at'       => Carbon::parse('2025-10-01 08:00:00'),
                'created_at'      => Carbon::parse('2025-10-01 08:00:00'),
                'updated_at'      => now(),
            ]
        );

        // Bind current.tenant for global scopes
        app()->instance('current.tenant', $tenant);

        // 4. Clean previous operational records for this tenant
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        $tablesToClean = [
            'sale_items', 'sales', 'payments', 'purchase_items', 'purchases',
            'inventory_batches', 'expenses', 'stocks', 'stock_movements',
            'products', 'categories', 'customers', 'suppliers', 'parties',
            'journal_items', 'journal_entries', 'bank_accounts', 'tenant_modules',
            'registers', 'register_shifts', 'shift_cash_movements', 'positions',
            'occupancies', 'debit_notes', 'debit_note_items', 'fund_transactions',
            'activities'
        ];
        foreach ($tablesToClean as $tbl) {
            if (\Illuminate\Support\Facades\Schema::hasTable($tbl) && \Illuminate\Support\Facades\Schema::hasColumn($tbl, 'tenant_id')) {
                DB::table($tbl)->where('tenant_id', $tenantId)->delete();
            }
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 5. Seed default chart of accounts, warehouse, and dashboards
        TenantDefaultSeeder::seedFor($tenant);

        // 6. Enable all modules
        $modules = config('modules', []);
        $excludedForRetail = ['table_service', 'cookbook', 'production_runs', 'composite_items'];
        foreach ($modules as $modKey => $modDef) {
            if (!$isRestaurant && in_array($modKey, $excludedForRetail, true)) continue;
            DB::table('tenant_modules')->insert([
                'tenant_id'  => $tenantId,
                'module_key' => $modKey,
                'enabled'    => 1,
                'source'     => 'preset',
                'created_at' => Carbon::parse('2025-10-01 08:00:00'),
                'updated_at' => Carbon::parse('2025-10-01 08:00:00'),
            ]);
        }

        // 7. Store Settings
        $settingsToSet = [
            'currency'                => 'USD',
            'currency_code'           => 'USD',
            'currency_symbol'         => '$',
            'receipt_currency_symbol' => '$',
            'store_phone'             => '+1 212 555 ' . rand(1000, 9999),
            'store_country'           => 'US',
            'tax_rate'                => '0',
        ];
        if ($isRestaurant) {
            $settingsToSet['foh_tables']         = '1';
            $settingsToSet['foh_takeaway']       = '1';
            $settingsToSet['foh_delivery']       = '1';
            $settingsToSet['service_mode']       = 'both';
            $settingsToSet['prepares_orders']    = '1';
            $settingsToSet['foh_stock']          = 'per_item';
            $settingsToSet['foh_takeaway_flow']  = 'fire_first';
            $settingsToSet['lane_takeaway']      = '1';
            $settingsToSet['lane_delivery']      = '1';
        }
        foreach ($settingsToSet as $k => $v) {
            Setting::updateOrCreate(
                ['tenant_id' => $tenantId, 'key' => $k],
                ['value' => $v]
            );
        }

        // 8. Bank Accounts
        $bankCashId = (string) Str::uuid();
        DB::table('bank_accounts')->insert([
            'id'              => $bankCashId,
            'tenant_id'       => $tenantId,
            'name'            => 'Cash in Drawer',
            'bank_name'       => 'Cash Register Till',
            'account_number'  => 'CASH-DRAWER-01',
            'type'            => 'cash',
            'account_type'    => 'cash',
            'opening_balance' => 0.00,
            'current_balance' => 0.00,
            'created_at'      => Carbon::parse('2025-10-01 08:00:00'),
            'updated_at'      => Carbon::parse('2025-10-01 08:00:00'),
        ]);

        $bankChaseId = (string) Str::uuid();
        DB::table('bank_accounts')->insert([
            'id'              => $bankChaseId,
            'tenant_id'       => $tenantId,
            'name'            => 'JPMorgan Chase Business Checking',
            'bank_name'       => 'JPMorgan Chase',
            'account_number'  => 'US89CHAS00918273645',
            'type'            => 'bank',
            'account_type'    => 'checking',
            'opening_balance' => 0.00,
            'current_balance' => 0.00,
            'created_at'      => Carbon::parse('2025-10-01 08:00:00'),
            'updated_at'      => Carbon::parse('2025-10-01 08:00:00'),
        ]);

        $bankStripeId = (string) Str::uuid();
        DB::table('bank_accounts')->insert([
            'id'              => $bankStripeId,
            'tenant_id'       => $tenantId,
            'name'            => 'Stripe POS Merchant Account',
            'bank_name'       => 'Stripe Terminal',
            'account_number'  => 'STRIPE-USD-MERCHANT',
            'type'            => 'bank',
            'account_type'    => 'checking',
            'opening_balance' => 0.00,
            'current_balance' => 0.00,
            'created_at'      => Carbon::parse('2025-10-01 08:00:00'),
            'updated_at'      => Carbon::parse('2025-10-01 08:00:00'),
        ]);

        $bankHsbcId = (string) Str::uuid();
        DB::table('bank_accounts')->insert([
            'id'              => $bankHsbcId,
            'tenant_id'       => $tenantId,
            'name'            => 'HSBC Commercial Reserve',
            'bank_name'       => 'HSBC Bank USA',
            'account_number'  => 'US12HSBC00445566778',
            'type'            => 'bank',
            'account_type'    => 'savings',
            'opening_balance' => 0.00,
            'current_balance' => 0.00,
            'created_at'      => Carbon::parse('2025-10-01 08:00:00'),
            'updated_at'      => Carbon::parse('2025-10-01 08:00:00'),
        ]);

        // 9. Warehouse
        $warehouse = DB::table('warehouses')->where('tenant_id', $tenantId)->first();
        if (!$warehouse) {
            $warehouseId = (string) Str::uuid();
            DB::table('warehouses')->insert([
                'id'         => $warehouseId,
                'tenant_id'  => $tenantId,
                'name'       => $isRestaurant ? 'Main Kitchen & Cellar' : 'Main Retail Store & Hub',
                'location'   => '5th Avenue Commercial District, New York',
                'is_active'  => 1,
                'is_default' => 1,
                'created_at' => Carbon::parse('2025-10-01 08:00:00'),
                'updated_at' => Carbon::parse('2025-10-01 08:00:00'),
            ]);
        } else {
            $warehouseId = $warehouse->id;
        }

        // 10. Register & Shifts
        $registerId = DB::table('registers')->insertGetId([
            'tenant_id'    => $tenantId,
            'name'         => 'Front Counter POS Terminal 1',
            'code'         => 'REG-01',
            'location_id'  => $warehouseId,
            'is_active'    => 1,
            'last_seen_at' => now(),
            'created_at'   => Carbon::parse('2025-10-01 08:00:00'),
            'updated_at'   => now(),
        ]);

        // Today's open shift
        $todayShiftId = DB::table('register_shifts')->insertGetId([
            'tenant_id'     => $tenantId,
            'register_id'   => (string) $registerId,
            'shift_mode'    => 'cash_drawer',
            'opened_by'     => $userId,
            'opened_at'     => Carbon::today()->setTime(8, 30),
            'opening_float' => 350.00,
            'status'        => 'open',
            'created_at'    => Carbon::today()->setTime(8, 30),
            'updated_at'    => Carbon::today()->setTime(8, 30),
        ]);

        // 11. Restaurant Positions / Floor Plan (if restaurant)
        $positionIds = [];
        if ($isRestaurant) {
            $zones = [
                ['zone' => 'Main Dining',    'code' => 'T-01', 'label' => 'Table 1 (Window)',   'cap' => 4, 'x' => 10, 'y' => 20],
                ['zone' => 'Main Dining',    'code' => 'T-02', 'label' => 'Table 2 (Center)',   'cap' => 4, 'x' => 50, 'y' => 20],
                ['zone' => 'Main Dining',    'code' => 'T-03', 'label' => 'Table 3 (Booth)',    'cap' => 6, 'x' => 90, 'y' => 20],
                ['zone' => 'Main Dining',    'code' => 'T-04', 'label' => 'Table 4 (Center)',   'cap' => 2, 'x' => 10, 'y' => 60],
                ['zone' => 'Main Dining',    'code' => 'T-05', 'label' => 'Table 5 (Booth)',    'cap' => 4, 'x' => 50, 'y' => 60],
                ['zone' => 'Terrace Garden', 'code' => 'T-06', 'label' => 'Patio Table 6',      'cap' => 4, 'x' => 10, 'y' => 100],
                ['zone' => 'Terrace Garden', 'code' => 'T-07', 'label' => 'Patio Table 7',      'cap' => 4, 'x' => 50, 'y' => 100],
                ['zone' => 'VIP Lounge',     'code' => 'VIP-1','label' => 'Private Salon A',    'cap' => 8, 'x' => 10, 'y' => 140],
                ['zone' => 'Bar Counter',    'code' => 'BAR-1','label' => 'Bar Seat 1',         'cap' => 1, 'x' => 10, 'y' => 180],
                ['zone' => 'Bar Counter',    'code' => 'BAR-2','label' => 'Bar Seat 2',         'cap' => 1, 'x' => 30, 'y' => 180],
            ];
            foreach ($zones as $z) {
                $posId = DB::table('positions')->insertGetId([
                    'tenant_id'  => $tenantId,
                    'zone'       => $z['zone'],
                    'code'       => $z['code'],
                    'label'      => $z['label'],
                    'capacity'   => $z['cap'],
                    'status'     => 'available',
                    'sort_order' => 1,
                    'pos_x'      => $z['x'],
                    'pos_y'      => $z['y'],
                    'pos_w'      => 60,
                    'pos_h'      => 60,
                    'shape'      => 'square',
                    'created_at' => Carbon::parse('2025-10-01 08:00:00'),
                    'updated_at' => Carbon::parse('2025-10-01 08:00:00'),
                ]);
                $positionIds[] = $posId;
            }
        }

        // 12. Chart of Accounts Mapping
        $accountMap = [];
        $requiredCodes = [
            '1000' => ['Cash in Hand', 'asset'],
            '1010' => ['Bank Account', 'asset'],
            '1100' => ['Inventory Asset', 'asset'],
            '1200' => ['Accounts Receivable', 'asset'],
            '2000' => ['Accounts Payable', 'liability'],
            '3000' => ["Owner's Capital", 'equity'],
            '3100' => ["Owner's Drawings", 'equity'],
            '4000' => ['Sales Revenue', 'income'],
            '5000' => ['Cost of Goods Sold', 'expense'],
            '5100' => ['Salaries & Wages', 'expense'],
            '5200' => ['Rent Expense', 'expense'],
            '5300' => ['Utilities', 'expense'],
            '6000' => ['Operating Expenses', 'expense'],
        ];

        foreach ($requiredCodes as $code => [$name, $type]) {
            $acct = Account::withoutGlobalScopes()->where('tenant_id', $tenantId)->where('code', $code)->first();
            if (!$acct) {
                $acctId = (string) Str::uuid();
                DB::table('accounts')->insert([
                    'id'             => $acctId,
                    'tenant_id'      => $tenantId,
                    'code'           => $code,
                    'name'           => $name,
                    'type'           => $type,
                    'balance'        => 0.0,
                    'normal_balance' => in_array($type, ['asset', 'expense']) ? 'debit' : 'credit',
                    'is_active'      => 1,
                    'created_at'     => Carbon::parse('2025-10-01 08:00:00'),
                    'updated_at'     => Carbon::parse('2025-10-01 08:00:00'),
                ]);
                $accountMap[$code] = $acctId;
            } else {
                $accountMap[$code] = $acct->id;
            }
        }

        // Double-entry posting closure
        $postJournal = function(string $dtStr, string $ref, string $refType, string $desc, array $lines) use ($tenantId, $userId) {
            $dt = Carbon::parse($dtStr);
            $entryId = (string) Str::uuid();

            DB::table('journal_entries')->insert([
                'id'             => $entryId,
                'tenant_id'      => $tenantId,
                'date'           => $dt->toDateString(),
                'reference'      => $ref,
                'reference_type' => $refType,
                'description'    => $desc,
                'narration'      => $desc,
                'is_reversed'    => 0,
                'user_id'        => $userId,
                'created_at'     => $dt,
                'updated_at'     => $dt,
            ]);

            foreach ($lines as $line) {
                $deb = round((float) ($line['debit'] ?? 0), 2);
                $crd = round((float) ($line['credit'] ?? 0), 2);
                if ($deb == 0 && $crd == 0) continue;

                DB::table('journal_items')->insert([
                    'id'               => (string) Str::uuid(),
                    'tenant_id'        => $tenantId,
                    'journal_entry_id' => $entryId,
                    'account_id'       => $line['account_id'],
                    'party_id'         => $line['party_id'] ?? null,
                    'bank_account_id'  => $line['bank_account_id'] ?? null,
                    'debit'            => $deb,
                    'credit'           => $crd,
                    'description'      => $line['desc'] ?? $desc,
                    'created_at'       => $dt,
                    'updated_at'       => $dt,
                ]);
            }
            return $entryId;
        };

        // 13. Categories & Products
        $catMap = [];
        foreach ($config['categories'] as $key => $name) {
            $catId = (string) Str::uuid();
            DB::table('categories')->insert([
                'id'         => $catId,
                'tenant_id'  => $tenantId,
                'name'       => $name,
                'created_at' => Carbon::parse('2025-10-01 08:00:00'),
                'updated_at' => Carbon::parse('2025-10-01 08:00:00'),
            ]);
            $catMap[$key] = $catId;
        }

        $prodMap = [];
        foreach ($config['products'] as $p) {
            $pId = (string) Str::uuid();
            $catId = $catMap[$p['cat']];

            DB::table('products')->insert([
                'id'             => $pId,
                'tenant_id'      => $tenantId,
                'category_id'    => $catId,
                'sku'            => $p['sku'],
                'name'           => $p['name'],
                'type'           => 'standard',
                'price'          => $p['price'],
                'cost_price'     => $p['cost'],
                'base_unit'      => 'pcs',
                'unit'           => 'pcs',
                'quantity'       => 0,
                'stock_quantity' => 0,
                'is_active'      => 1,
                'track_stock'    => 1,
                'created_at'     => Carbon::parse('2025-10-01 08:00:00'),
                'updated_at'     => Carbon::parse('2025-10-01 08:00:00'),
            ]);

            DB::table('stocks')->insert([
                'id'                => (string) Str::uuid(),
                'tenant_id'         => $tenantId,
                'product_id'        => $pId,
                'warehouse_id'      => $warehouseId,
                'quantity'          => 0,
                'reserved_quantity' => 0,
                'status'            => 'available',
                'created_at'        => Carbon::parse('2025-10-01 08:00:00'),
                'updated_at'        => Carbon::parse('2025-10-01 08:00:00'),
            ]);

            $prodMap[$p['sku']] = [
                'id'    => $pId,
                'sku'   => $p['sku'],
                'name'  => $p['name'],
                'price' => $p['price'],
                'cost'  => $p['cost'],
            ];
        }

        // 14. Suppliers & Customers
        $supplierList = [];
        foreach ($config['suppliers'] as $s) {
            $sId = (string) Str::uuid();
            DB::table('parties')->insert([
                'id'              => $sId,
                'tenant_id'       => $tenantId,
                'name'            => $s['name'],
                'phone'           => $s['phone'],
                'email'           => $s['email'],
                'type'            => 'supplier',
                'city'            => $s['city'],
                'current_balance' => 0.0,
                'is_active'       => 1,
                'created_at'      => Carbon::parse('2025-10-01 08:00:00'),
                'updated_at'      => Carbon::parse('2025-10-01 08:00:00'),
            ]);
            DB::table('suppliers')->insert([
                'id'             => $sId,
                'tenant_id'      => $tenantId,
                'party_id'       => $sId,
                'name'           => $s['name'],
                'contact_person' => $s['name'],
                'phone'          => $s['phone'],
                'email'          => $s['email'],
                'created_at'     => Carbon::parse('2025-10-01 08:00:00'),
                'updated_at'     => Carbon::parse('2025-10-01 08:00:00'),
            ]);
            $supplierList[] = ['id' => $sId, 'name' => $s['name']];
        }

        $customerList = [];
        foreach ($config['customers'] as $c) {
            $cId = (string) Str::uuid();
            DB::table('parties')->insert([
                'id'              => $cId,
                'tenant_id'       => $tenantId,
                'name'            => $c['name'],
                'phone'           => $c['phone'],
                'email'           => $c['email'],
                'type'            => 'customer',
                'city'            => $c['city'],
                'credit_limit'    => 25000.0,
                'current_balance' => 0.0,
                'is_active'       => 1,
                'created_at'      => Carbon::parse('2025-10-01 08:00:00'),
                'updated_at'      => Carbon::parse('2025-10-01 08:00:00'),
            ]);
            DB::table('customers')->insert([
                'id'           => $cId,
                'tenant_id'    => $tenantId,
                'party_id'     => $cId,
                'name'         => $c['name'],
                'phone'        => $c['phone'],
                'email'        => $c['email'],
                'type'         => 'regular',
                'credit_limit' => 25000.0,
                'created_at'   => Carbon::parse('2025-10-01 08:00:00'),
                'updated_at'   => Carbon::parse('2025-10-01 08:00:00'),
            ]);
            $customerList[] = ['id' => $cId, 'name' => $c['name']];
        }

        // =================================================================
        // TRANSACTION HELPER CLOSURES
        // =================================================================

        $storeCode = $isRestaurant ? 'RES' : 'RTL';

        // Helper: Post Purchase Order
        $poSeq = 1;
        $postPurchase = function(string $dtStr, string $supplierId, array $items) use (
            $tenantId, $warehouseId, $accountMap, $postJournal, $bankChaseId, &$poSeq, $storeCode
        ) {
            $dt = Carbon::parse($dtStr);
            $poId = (string) Str::uuid();
            $invNum = sprintf('PO-%s-%s-%04d', $storeCode, $dt->format('ymd'), $poSeq++);
            $subtotal = 0.0;
            $poItems = [];

            foreach ($items as $item) {
                $qty = (float) $item['qty'];
                $cost = (float) $item['cost'];
                $lineTotal = round($qty * $cost, 2);
                $subtotal += $lineTotal;

                $batchId = (string) Str::uuid();
                DB::table('inventory_batches')->insert([
                    'id'                  => $batchId,
                    'tenant_id'           => $tenantId,
                    'product_id'          => $item['id'],
                    'purchase_invoice_id' => $poId,
                    'warehouse_id'        => $warehouseId,
                    'batch_type'          => 'purchase',
                    'initial_qty'         => $qty,
                    'original_qty'        => $qty,
                    'remaining_qty'       => $qty,
                    'unit_cost'           => $cost,
                    'created_at'          => $dt,
                    'updated_at'          => $dt,
                ]);

                DB::table('stocks')->where('tenant_id', $tenantId)->where('product_id', $item['id'])->increment('quantity', $qty);
                DB::table('products')->where('tenant_id', $tenantId)->where('id', $item['id'])->increment('quantity', $qty);
                DB::table('products')->where('tenant_id', $tenantId)->where('id', $item['id'])->increment('stock_quantity', $qty);

                $poItems[] = [
                    'id'                 => (string) Str::uuid(),
                    'tenant_id'          => $tenantId,
                    'purchase_id'        => $poId,
                    'product_id'         => $item['id'],
                    'qty'                => $qty,
                    'received_qty'       => $qty,
                    'unit_cost'          => $cost,
                    'discount_amount'    => 0,
                    'tax_rate'           => 0,
                    'business_pct'       => 100,
                    'line_total'         => $lineTotal,
                    'inventory_batch_id' => $batchId,
                    'created_at'         => $dt,
                    'updated_at'         => $dt,
                ];
            }

            DB::table('purchases')->insert([
                'id'              => $poId,
                'tenant_id'       => $tenantId,
                'party_id'        => $supplierId,
                'warehouse_id'    => $warehouseId,
                'invoice_number'  => $invNum,
                'reference'       => 'REF-' . $invNum,
                'purchase_date'   => $dt->toDateString(),
                'subtotal'        => $subtotal,
                'tax'             => 0,
                'discount'        => 0,
                'round_off'       => 0,
                'total'           => $subtotal,
                'payment_status'  => 'paid',
                'workflow_status' => 'received',
                'payment_method'  => 'bank_transfer',
                'created_at'      => $dt,
                'updated_at'      => $dt,
            ]);

            DB::table('purchase_items')->insert($poItems);

            // Journal: Debit Inventory Asset (1100), Credit Bank (1010)
            $postJournal($dtStr, $invNum, 'purchase', "Vendor Restock Purchase Invoice {$invNum}", [
                ['account_id' => $accountMap['1100'], 'debit' => $subtotal, 'credit' => 0.0, 'desc' => "Inventory received {$invNum}"],
                ['account_id' => $accountMap['1010'], 'debit' => 0.0, 'credit' => $subtotal, 'desc' => "Wire transfer via Chase Checking", 'bank_account_id' => $bankChaseId],
            ]);

            return ['id' => $poId, 'inv' => $invNum, 'items' => $items, 'total' => $subtotal, 'supplier_id' => $supplierId];
        };

        // Helper: Post Purchase Return (Debit Note)
        $dnSeq = 1;
        $postPurchaseReturn = function(string $dtStr, array $purchaseInfo, array $returnItems, string $reason) use (
            $tenantId, $userId, $warehouseId, $accountMap, $postJournal, $bankChaseId, &$dnSeq, $storeCode
        ) {
            $dt = Carbon::parse($dtStr);
            $dnId = (string) Str::uuid();
            $refNum = sprintf('DN-%s-%s-%04d', $storeCode, $dt->format('ymd'), $dnSeq++);
            $totalAmount = 0.0;
            $dnItems = [];

            foreach ($returnItems as $item) {
                $qty = (float) $item['qty'];
                $cost = (float) $item['cost'];
                $lineTotal = round($qty * $cost, 2);
                $totalAmount += $lineTotal;

                // Decrement stock and latest batches
                DB::table('stocks')->where('tenant_id', $tenantId)->where('product_id', $item['id'])->decrement('quantity', $qty);
                DB::table('products')->where('tenant_id', $tenantId)->where('id', $item['id'])->decrement('quantity', $qty);
                DB::table('products')->where('tenant_id', $tenantId)->where('id', $item['id'])->decrement('stock_quantity', $qty);

                $batch = DB::table('inventory_batches')->where('tenant_id', $tenantId)
                    ->where('product_id', $item['id'])
                    ->where('remaining_qty', '>=', $qty)
                    ->latest('created_at')
                    ->first();
                if ($batch) {
                    DB::table('inventory_batches')->where('id', $batch->id)->decrement('remaining_qty', $qty);
                }

                $dnItems[] = [
                    'id'            => (string) Str::uuid(),
                    'tenant_id'     => $tenantId,
                    'debit_note_id' => $dnId,
                    'product_id'    => $item['id'],
                    'quantity'      => $qty,
                    'unit_price'    => $cost,
                    'subtotal'      => $lineTotal,
                    'created_at'    => $dt,
                    'updated_at'    => $dt,
                ];
            }

            // Journal Entry: Debit Bank / Cash (refund received), Credit Inventory Asset
            $jEntryId = $postJournal($dtStr, $refNum, 'debit_note', "Supplier Debit Note {$refNum} ({$reason})", [
                ['account_id' => $accountMap['1010'], 'debit' => $totalAmount, 'credit' => 0.0, 'desc' => "Refund to Chase Checking", 'bank_account_id' => $bankChaseId],
                ['account_id' => $accountMap['1100'], 'debit' => 0.0, 'credit' => $totalAmount, 'desc' => "Inventory returned to vendor"],
            ]);

            DB::table('debit_notes')->insert([
                'id'               => $dnId,
                'tenant_id'        => $tenantId,
                'reference_number' => $refNum,
                'supplier_id'      => $purchaseInfo['supplier_id'] ?? null,
                'purchase_id'      => $purchaseInfo['id'],
                'date'             => $dt->toDateString(),
                'amount'           => $totalAmount,
                'reason'           => $reason,
                'status'           => 'approved',
                'warehouse_id'     => $warehouseId,
                'returns_stock'    => 1,
                'journal_entry_id' => $jEntryId,
                'created_by'       => $userId,
                'created_at'       => $dt,
                'updated_at'       => $dt,
            ]);

            DB::table('debit_note_items')->insert($dnItems);

            return ['id' => $dnId, 'ref' => $refNum, 'total' => $totalAmount];
        };

        // Helper: Post Sale
        $saleSeq = 1;
        $postSale = function(string $dtStr, array $items, string $paymentMethod, ?string $customerId = null, ?string $orderType = null) use (
            $tenantId, $userId, $warehouseId, $accountMap, $postJournal, $bankCashId, $bankChaseId, $bankStripeId, &$saleSeq, $isRestaurant, $positionIds, $storeCode
        ) {
            $dt = Carbon::parse($dtStr);
            $saleId = (string) Str::uuid();
            $invNum = sprintf('SAL-%s-%s-%05d', $storeCode, $dt->format('ymd'), $saleSeq++);

            $subtotalGross = 0.0;
            $cogsTotal = 0.0;
            $saleItemsToInsert = [];

            foreach ($items as $item) {
                $qty = (float) $item['qty'];
                $unitPrice = (float) $item['price'];
                $cost = (float) $item['cost'];
                $lineTotal = round($qty * $unitPrice, 2);
                $lineCogs = round($qty * $cost, 2);

                $subtotalGross += $lineTotal;
                $cogsTotal += $lineCogs;

                // FIFO Batch deduction
                $remToDeduct = $qty;
                $batches = DB::table('inventory_batches')->where('tenant_id', $tenantId)
                    ->where('product_id', $item['id'])
                    ->where('remaining_qty', '>', 0)
                    ->orderBy('created_at', 'ASC')
                    ->get();

                foreach ($batches as $b) {
                    if ($remToDeduct <= 0) break;
                    $take = min((float) $b->remaining_qty, $remToDeduct);
                    DB::table('inventory_batches')->where('id', $b->id)->decrement('remaining_qty', $take);
                    $remToDeduct -= $take;
                }

                DB::table('stocks')->where('tenant_id', $tenantId)->where('product_id', $item['id'])->decrement('quantity', $qty);
                DB::table('products')->where('tenant_id', $tenantId)->where('id', $item['id'])->decrement('quantity', $qty);
                DB::table('products')->where('tenant_id', $tenantId)->where('id', $item['id'])->decrement('stock_quantity', $qty);

                $saleItemsToInsert[] = [
                    'id'             => (string) Str::uuid(),
                    'tenant_id'      => $tenantId,
                    'sale_id'        => $saleId,
                    'product_id'     => $item['id'],
                    'quantity'       => $qty,
                    'delivered_qty'  => $qty,
                    'sale_uom'       => 'pcs',
                    'sale_uom_qty'   => $qty,
                    'unit_price'     => $unitPrice,
                    'gross_amount'   => $lineTotal,
                    'discount_amount'=> 0.0,
                    'net_amount'     => $lineTotal,
                    'tax_rate'       => 0.0,
                    'tax_amount'     => 0.0,
                    'line_total'     => $lineTotal,
                    'cost_price'     => $cost,
                    'subtotal'       => $lineTotal,
                    'created_at'     => $dt,
                    'updated_at'     => $dt,
                ];
            }

            $occupancyId = null;
            if ($isRestaurant && $orderType === 'dine_in' && !empty($positionIds)) {
                $posId = $positionIds[array_rand($positionIds)];
                $occupancyId = DB::table('occupancies')->insertGetId([
                    'tenant_id'   => $tenantId,
                    'position_id' => $posId,
                    'label'       => 'Party at ' . $invNum,
                    'opened_by'   => $userId,
                    'opened_at'   => $dt->copy()->subMinutes(rand(30, 90)),
                    'closed_at'   => $dt,
                    'created_at'  => $dt,
                    'updated_at'  => $dt,
                ]);
            }

            // Determine Ledger Account
            $debitAccount = match ($paymentMethod) {
                'cash'                  => $accountMap['1000'],
                'card', 'stripe'        => $accountMap['1010'],
                'bank', 'bank_transfer' => $accountMap['1010'],
                'credit'                => $accountMap['1200'],
                default                 => $accountMap['1000'],
            };

            $bankAccId = match ($paymentMethod) {
                'cash'                  => $bankCashId,
                'card', 'stripe'        => $bankStripeId,
                'bank', 'bank_transfer' => $bankChaseId,
                default                 => null,
            };

            DB::table('sales')->insert([
                'id'                   => $saleId,
                'tenant_id'            => $tenantId,
                'reference_number'     => $invNum,
                'customer_id'          => $customerId,
                'party_id'             => $customerId,
                'user_id'              => $userId,
                'warehouse_id'         => $warehouseId,
                'subtotal'             => $subtotalGross,
                'subtotal_gross'       => $subtotalGross,
                'total_item_discounts' => 0.0,
                'global_discount'      => 0.0,
                'net_sales'            => $subtotalGross,
                'total_tax'            => 0.0,
                'invoice_total'        => $subtotalGross,
                'total'                => $subtotalGross,
                'tendered_amount'      => $subtotalGross,
                'change_return'        => 0.0,
                'status'               => 'posted',
                'posted_at'            => $dt,
                'payment_status'       => ($paymentMethod === 'credit') ? 'unpaid' : 'paid',
                'payment_method'       => $paymentMethod,
                'occupancy_id'         => $occupancyId,
                'order_type'           => $orderType ?? ($isRestaurant ? 'dine_in' : null),
                'created_at'           => $dt,
                'updated_at'           => $dt,
            ]);

            DB::table('sale_items')->insert($saleItemsToInsert);

            if ($paymentMethod !== 'credit') {
                DB::table('payments')->insert([
                    'id'              => (string) Str::uuid(),
                    'tenant_id'       => $tenantId,
                    'sale_id'         => $saleId,
                    'party_id'        => $customerId,
                    'amount'          => $subtotalGross,
                    'method'          => $paymentMethod,
                    'type'            => 'in',
                    'date'            => $dt->toDateString(),
                    'bank_account_id' => $bankAccId,
                    'reference'       => $invNum,
                    'created_at'      => $dt,
                    'updated_at'      => $dt,
                ]);
            }

            // Double Entry: Debit Asset (Cash/Bank/AR), Credit Sales Revenue (4000); Debit COGS (5000), Credit Inventory (1100)
            $postJournal($dtStr, $invNum, 'sale', "Sales Receipt {$invNum} ({$paymentMethod})", [
                [
                    'account_id'      => $debitAccount,
                    'debit'           => $subtotalGross,
                    'credit'          => 0.0,
                    'desc'            => "Collection via {$paymentMethod}",
                    'party_id'        => ($paymentMethod === 'credit' ? $customerId : null),
                    'bank_account_id' => $bankAccId,
                ],
                ['account_id' => $accountMap['4000'], 'debit' => 0.0, 'credit' => $subtotalGross, 'desc' => "Sales Revenue"],
                ['account_id' => $accountMap['5000'], 'debit' => $cogsTotal, 'credit' => 0.0, 'desc' => "Cost of Goods Sold"],
                ['account_id' => $accountMap['1100'], 'debit' => 0.0, 'credit' => $cogsTotal, 'desc' => "Inventory Reduction"],
            ]);

            return [
                'id'             => $saleId,
                'inv_num'        => $invNum,
                'items'          => $items,
                'total'          => $subtotalGross,
                'cogs'           => $cogsTotal,
                'payment_method' => $paymentMethod,
                'customer_id'    => $customerId,
                'date'           => $dtStr,
            ];
        };

        // Helper: Post Sales Return (Refund / Credit Note)
        $retSeq = 1;
        $postSaleReturn = function(string $dtStr, array $originalSale, string $reason) use (
            $tenantId, $userId, $warehouseId, $accountMap, $postJournal, $bankCashId, $bankChaseId, &$retSeq, $storeCode
        ) {
            $dt = Carbon::parse($dtStr);
            $retId = (string) Str::uuid();
            $retRef = sprintf('RET-%s-%s-%04d', $storeCode, $dt->format('ymd'), $retSeq++);
            $saleTotal = $originalSale['total'];
            $cogsTotal = $originalSale['cogs'];
            $refundMethod = $originalSale['payment_method'] === 'credit' ? 'credit' : 'cash';

            // Restock products and inventory batches
            foreach ($originalSale['items'] as $item) {
                $qty = (float) $item['qty'];
                $cost = (float) $item['cost'];
                DB::table('stocks')->where('tenant_id', $tenantId)->where('product_id', $item['id'])->increment('quantity', $qty);
                DB::table('products')->where('tenant_id', $tenantId)->where('id', $item['id'])->increment('quantity', $qty);
                DB::table('products')->where('tenant_id', $tenantId)->where('id', $item['id'])->increment('stock_quantity', $qty);

                DB::table('inventory_batches')->insert([
                    'id'                  => (string) Str::uuid(),
                    'tenant_id'           => $tenantId,
                    'product_id'          => $item['id'],
                    'purchase_invoice_id' => 'RESTOCK-' . $retRef,
                    'warehouse_id'        => $warehouseId,
                    'batch_type'          => 'return_restock',
                    'initial_qty'         => $qty,
                    'original_qty'        => $qty,
                    'remaining_qty'       => $qty,
                    'unit_cost'           => $cost,
                    'created_at'          => $dt,
                    'updated_at'          => $dt,
                ]);
            }

            // Insert negative return sale
            DB::table('sales')->insert([
                'id'                   => $retId,
                'original_sale_id'     => $originalSale['id'],
                'tenant_id'            => $tenantId,
                'reference_number'     => $retRef,
                'customer_id'          => $originalSale['customer_id'],
                'party_id'             => $originalSale['customer_id'],
                'user_id'              => $userId,
                'warehouse_id'         => $warehouseId,
                'subtotal'             => -$saleTotal,
                'subtotal_gross'       => -$saleTotal,
                'net_sales'            => -$saleTotal,
                'invoice_total'        => -$saleTotal,
                'total'                => -$saleTotal,
                'tendered_amount'      => -$saleTotal,
                'status'               => 'returned',
                'return_reason'        => $reason,
                'refund_reason'        => $reason,
                'posted_at'            => $dt,
                'payment_status'       => 'paid',
                'payment_method'       => $refundMethod,
                'created_at'           => $dt,
                'updated_at'           => $dt,
            ]);

            // Reversal Journal: Debit Sales Revenue (4000), Credit Cash/Bank/AR; Debit Inventory (1100), Credit COGS (5000)
            $refundAccount = ($refundMethod === 'credit') ? $accountMap['1200'] : $accountMap['1000'];
            $bankAccId = ($refundMethod === 'credit') ? null : $bankCashId;

            $postJournal($dtStr, $retRef, 'sale_return', "Sales Return Refund {$retRef} ({$reason})", [
                ['account_id' => $accountMap['4000'], 'debit' => $saleTotal, 'credit' => 0.0, 'desc' => "Sales Return reversal"],
                [
                    'account_id'      => $refundAccount,
                    'debit'           => 0.0,
                    'credit'          => $saleTotal,
                    'desc'            => "Customer refund via {$refundMethod}",
                    'bank_account_id' => $bankAccId,
                ],
                ['account_id' => $accountMap['1100'], 'debit' => $cogsTotal, 'credit' => 0.0, 'desc' => "Inventory restocked from return"],
                ['account_id' => $accountMap['5000'], 'debit' => 0.0, 'credit' => $cogsTotal, 'desc' => "COGS credit on return"],
            ]);

            return ['id' => $retId, 'ref' => $retRef, 'total' => -$saleTotal];
        };

        // Helper: Post Operating Expense
        $expSeq = 1;
        $postExpense = function(string $dtStr, string $cat, string $code, float $amt, string $method, string $desc) use (
            $tenantId, $accountMap, $postJournal, $bankCashId, $bankChaseId, &$expSeq, $storeCode
        ) {
            $dt = Carbon::parse($dtStr);
            $expId = (string) Str::uuid();
            $ref = sprintf('EXP-%s-%s-%04d', $storeCode, $dt->format('ymd'), $expSeq++);
            $creditAcc = ($method === 'cash') ? $accountMap['1000'] : $accountMap['1010'];
            $bankAccId = ($method === 'cash') ? $bankCashId : $bankChaseId;

            DB::table('expenses')->insert([
                'id'             => $expId,
                'tenant_id'      => $tenantId,
                'category'       => $cat,
                'amount'         => $amt,
                'amount_paid'    => $amt,
                'grand_total'    => $amt,
                'payment_method' => $method,
                'date'           => $dt->toDateString(),
                'bank_account_id'=> $bankAccId,
                'reference'      => $ref,
                'description'    => $desc,
                'created_at'     => $dt,
                'updated_at'     => $dt,
            ]);

            $postJournal($dtStr, $ref, 'expense', $desc, [
                ['account_id' => $accountMap[$code], 'debit' => $amt, 'credit' => 0.0, 'desc' => $desc],
                ['account_id' => $creditAcc, 'debit' => 0.0, 'credit' => $amt, 'desc' => "Payment via {$method}", 'bank_account_id' => $bankAccId],
            ]);
        };

        // Helper: Post Fund Transaction (Money In, Money Out, Transfer)
        $fundSeq = 1;
        $postFundTx = function(string $dtStr, string $type, ?string $fromAccId, ?string $toAccId, float $amt, string $reason) use (
            $tenantId, $userId, $accountMap, $postJournal, &$fundSeq, $storeCode
        ) {
            $dt = Carbon::parse($dtStr);
            $fundId = (string) Str::uuid();
            $ref = sprintf('FND-%s-%s-%04d', $storeCode, $dt->format('ymd'), $fundSeq++);

            DB::table('fund_transactions')->insert([
                'id'               => $fundId,
                'tenant_id'        => $tenantId,
                'type'             => $type,
                'from_account_id'  => $fromAccId,
                'to_account_id'    => $toAccId,
                'amount'           => $amt,
                'balance_before'   => 0.0,
                'balance_after'    => 0.0,
                'reason'           => $reason,
                'reference_number' => $ref,
                'notes'            => $reason,
                'performed_by'     => $userId,
                'created_at'       => $dt,
                'updated_at'       => $dt,
            ]);

            DB::table('activities')->insert([
                'id'             => (string) Str::uuid(),
                'tenant_id'      => $tenantId,
                'type'           => $type === 'add' ? 'capital_injection' : ($type === 'remove' ? 'owner_drawings' : 'inter_bank_transfer'),
                'description'    => "Fund {$type}: {$reason} (\${$amt})",
                'amount'         => $amt,
                'reference_id'   => $fundId,
                'reference_type' => 'fund_transaction',
                'user_id'        => $userId,
                'created_at'     => $dt,
                'updated_at'     => $dt,
            ]);

            // Ledger posting
            if ($type === 'add') {
                // Debit Bank/Cash, Credit 3000 Owner's Capital
                $postJournal($dtStr, $ref, 'fund_add', "Capital Addition — {$reason}", [
                    ['account_id' => $accountMap['1010'], 'debit' => $amt, 'credit' => 0.0, 'desc' => "Capital deposited", 'bank_account_id' => $toAccId],
                    ['account_id' => $accountMap['3000'], 'debit' => 0.0, 'credit' => $amt, 'desc' => "Owner's Equity"],
                ]);
            } elseif ($type === 'remove') {
                // Debit 3100 Owner Drawings, Credit Bank
                $postJournal($dtStr, $ref, 'fund_remove', "Owner Withdrawal — {$reason}", [
                    ['account_id' => $accountMap['3100'], 'debit' => $amt, 'credit' => 0.0, 'desc' => "Owner Drawings", 'bank_account_id' => null],
                    ['account_id' => $accountMap['1010'], 'debit' => 0.0, 'credit' => $amt, 'desc' => "Withdrawal from Checking", 'bank_account_id' => $fromAccId],
                ]);
            } elseif ($type === 'transfer') {
                // Debit To-Account, Credit From-Account
                $fromIsCash = ($fromAccId === 'cash');
                $toIsCash = ($toAccId === 'cash');
                $debitAcc = $toIsCash ? $accountMap['1000'] : $accountMap['1010'];
                $creditAcc = $fromIsCash ? $accountMap['1000'] : $accountMap['1010'];

                $postJournal($dtStr, $ref, 'fund_transfer', "Transfer: {$reason}", [
                    ['account_id' => $debitAcc, 'debit' => $amt, 'credit' => 0.0, 'desc' => "Deposit received", 'bank_account_id' => $toIsCash ? null : $toAccId],
                    ['account_id' => $creditAcc, 'debit' => 0.0, 'credit' => $amt, 'desc' => "Disbursement sent", 'bank_account_id' => $fromIsCash ? null : $fromAccId],
                ]);
            }
        };

        // =================================================================
        // FULL YEAR TRANSACTIONS GENERATION (Oct 2025 – Oct 2026)
        // =================================================================
        echo "   - Seeding Initial Capital & Opening Floats (October 1, 2025)...\n";
        // Step A: Initial Capital Injection
        $initCapital = $isRestaurant ? 150000.00 : 250000.00;
        $postFundTx('2025-10-01 09:00:00', 'add', null, $bankChaseId, $initCapital, 'Initial Owner Investment & Working Capital');
        $postFundTx('2025-10-01 10:00:00', 'transfer', $bankChaseId, $bankCashId, 2500.00, 'Initial Cash Register Till Float Sweep');

        // Mid-year expansion capital
        $postFundTx('2026-04-10 11:30:00', 'add', null, $bankChaseId, 35000.00, 'Q2 Seasonal Growth & Reserve Expansion Capital');

        // Step B: Initial Bulk Inventory Purchase
        echo "   - Seeding Initial Bulk Inventory Restock (October 2, 2025)...\n";
        $initialPurchaseItems = [];
        foreach ($config['products'] as $p) {
            $initialPurchaseItems[] = [
                'id'   => $prodMap[$p['sku']]['id'],
                'qty'  => $p['init'],
                'cost' => $p['cost'],
            ];
        }
        $firstPo = $postPurchase('2025-10-02 11:00:00', $supplierList[0]['id'], $initialPurchaseItems);

        // Step C: Regular Monthly Restocks (Every 2-3 weeks across the 12 months)
        echo "   - Seeding 12 Months of Purchases & Debit Notes...\n";
        $allPurchases = [$firstPo];

        $currentDate = Carbon::parse('2025-10-15');
        $endDate = Carbon::parse('2026-10-08');

        $purchaseDayCounter = 0;
        while ($currentDate <= $endDate) {
            // Purchase every ~18 days
            $purchaseDayCounter++;
            if ($purchaseDayCounter % 18 === 0) {
                $supp = $supplierList[array_rand($supplierList)];
                // Pick 4-6 random products to restock
                $prodsToRestock = array_slice($config['products'], rand(0, 5), rand(4, 7));
                $pItems = [];
                foreach ($prodsToRestock as $p) {
                    $pItems[] = [
                        'id'   => $prodMap[$p['sku']]['id'],
                        'qty'  => rand(15, 40),
                        'cost' => $p['cost'],
                    ];
                }
                $poInfo = $postPurchase($currentDate->copy()->setTime(10, rand(10, 45))->toDateTimeString(), $supp['id'], $pItems);
                $allPurchases[] = $poInfo;
            }
            $currentDate->addDay();
        }

        // Purchase Returns (Debit Notes) across the year (4 instances)
        $dnDates = [
            ['dt' => '2025-11-20 14:00:00', 'idx' => 1, 'reason' => 'Damaged outer transit packaging on high-value shipment'],
            ['dt' => '2026-02-14 15:30:00', 'idx' => 3, 'reason' => 'Incorrect grade specification received from supplier'],
            ['dt' => '2026-05-22 11:15:00', 'idx' => 5, 'reason' => 'Supplier credit issued for slight transit variance'],
            ['dt' => '2026-08-18 16:45:00', 'idx' => 7, 'reason' => 'Excess shipment returned per vendor agreement'],
        ];
        foreach ($dnDates as $d) {
            if (isset($allPurchases[$d['idx']])) {
                $poToReturn = $allPurchases[$d['idx']];
                $retLine = $poToReturn['items'][0];
                $postPurchaseReturn($d['dt'], $poToReturn, [
                    ['id' => $retLine['id'], 'qty' => 3, 'cost' => $retLine['cost']]
                ], $d['reason']);
            }
        }

        // Step D: Full Year of Daily / Weekly Sales
        echo "   - Seeding 365+ Days of Sales Transactions across all channels...\n";
        $salesHistory = [];
        $saleDate = Carbon::parse('2025-10-02');

        while ($saleDate < Carbon::today()) {
            $isWeekend = $saleDate->isWeekend();
            $month = $saleDate->month;
            // Daily sales count (1 to 3 sales per day)
            $dailyCount = rand(1, 2);
            if ($isWeekend) $dailyCount += rand(1, 2);
            if ($month === 12) $dailyCount += 1; // Holiday boost

            for ($s = 0; $s < $dailyCount; $s++) {
                $sTime = $saleDate->copy()->setTime(rand(10, 21), rand(5, 55));
                $cust = $customerList[array_rand($customerList)];
                $paymentMethod = ['cash', 'card', 'card', 'bank_transfer', 'credit'][rand(0, 4)];

                $orderType = null;
                if ($isRestaurant) {
                    $orderType = ['dine_in', 'dine_in', 'takeaway', 'delivery'][rand(0, 3)];
                }

                // Pick items for sale: Retail (1-3 items), Restaurant (2-5 items)
                $numItems = $isRestaurant ? rand(2, 5) : rand(1, 3);
                $saleItems = [];
                for ($it = 0; $it < $numItems; $it++) {
                    $pRaw = $config['products'][array_rand($config['products'])];
                    $pInfo = $prodMap[$pRaw['sku']];
                    $qty = rand(1, $isRestaurant ? 2 : 2);
                    $saleItems[] = [
                        'id'    => $pInfo['id'],
                        'price' => $pInfo['price'],
                        'cost'  => $pInfo['cost'],
                        'qty'   => $qty,
                    ];
                }

                $sInfo = $postSale($sTime->toDateTimeString(), $saleItems, $paymentMethod, $cust['id'], $orderType);
                $salesHistory[] = $sInfo;
            }

            $saleDate->addDay();
        }

        // Step E: Monthly Operating Expenses, Dynamic Sweeps & Drawings
        echo "   - Seeding 12 Months of Expenses, Dynamic Sweeps, and Drawings...\n";
        $expMonth = Carbon::parse('2025-10-01');
        while ($expMonth <= $endDate) {
            $mStr = $expMonth->format('Y-m');

            // Recurring Monthly Expenses
            foreach ($config['monthly_expenses'] as $expDef) {
                $day = match ($expDef['cat']) {
                    'Rent Expense'       => 1,
                    'Utilities'          => 12,
                    'Salaries & Wages'   => 28,
                    'Operating Expenses' => ($expDef['method'] === 'bank' ? 8 : 22),
                    default              => 15,
                };
                $tTime = Carbon::parse("{$mStr}-" . sprintf('%02d', min($day, $expMonth->daysInMonth)))->setTime(rand(9, 17), rand(10, 50));
                if ($tTime <= $endDate) {
                    $postExpense($tTime->toDateTimeString(), $expDef['cat'], $expDef['code'], $expDef['amt'], $expDef['method'], "{$expDef['desc']} ({$expMonth->format('M Y')})");
                }
            }

            // Calculate actual sales totals for this month
            $salesThisMonth = array_filter($salesHistory, fn($s) => str_starts_with($s['date'], $mStr));
            $cardSalesMonth = array_sum(array_map(fn($s) => in_array($s['payment_method'], ['card', 'stripe'], true) ? $s['total'] : 0, $salesThisMonth));
            $cashSalesMonth = array_sum(array_map(fn($s) => $s['payment_method'] === 'cash' ? $s['total'] : 0, $salesThisMonth));

            // Dynamic Stripe Settlement Auto-Payout to Chase Checking (85% of card collections)
            $stripeSweepAmt = round($cardSalesMonth * 0.85, 2);
            $stripeDate = Carbon::parse("{$mStr}-20 18:00:00");
            if ($stripeSweepAmt > 100 && $stripeDate <= $endDate) {
                $postFundTx($stripeDate->toDateTimeString(), 'transfer', $bankStripeId, $bankChaseId, $stripeSweepAmt, "Stripe POS Merchant Net Settlement Payout to Chase Checking");
            }

            // Dynamic Armored Cash Courier Sweep from Drawer to Chase Checking (70% of cash collections)
            $cashDropAmt = round($cashSalesMonth * 0.70, 2);
            $cashDate = Carbon::parse("{$mStr}-24 19:30:00");
            if ($cashDropAmt > 100 && $cashDate <= $endDate) {
                $postFundTx($cashDate->toDateTimeString(), 'transfer', $bankCashId, $bankChaseId, $cashDropAmt, "Armored Courier Cash Register Deposit to Chase Checking");
            }

            // Monthly Owner Drawings (Money Out)
            $drawDay = Carbon::parse("{$mStr}-15 17:00:00");
            if ($drawDay <= $endDate) {
                $drawAmt = $isRestaurant ? 2500.00 : 5000.00;
                $postFundTx($drawDay->toDateTimeString(), 'remove', $bankChaseId, null, $drawAmt, "Monthly Owner Equity Distribution — {$expMonth->format('M Y')}");
            }

            // Monthly Reserve Allocation (Chase Checking -> HSBC Reserve)
            $reserveDay = Carbon::parse("{$mStr}-27 15:00:00");
            if ($reserveDay <= $endDate) {
                $reserveAmt = $isRestaurant ? 1500.00 : 3500.00;
                $postFundTx($reserveDay->toDateTimeString(), 'transfer', $bankChaseId, $bankHsbcId, $reserveAmt, "Monthly Operational Surplus to HSBC Commercial Reserve");
            }

            $expMonth->addMonth();
        }

        // Step F: Sales Returns (10 returns throughout the year)
        echo "   - Seeding Sales Returns & Customer Refunds...\n";
        $returnReasons = [
            'Customer changed mind, wrong sizing/fit requested',
            'Slight cosmetic packaging defect noticed after purchase',
            'Order modified by patron prior to kitchen prep',
            'Exchange requested for alternate collection variant',
            'Complimentary customer satisfaction reversal',
            'Dining party table reservation adjustment',
            'Customer returned unopened gift item with receipt',
            'Item return processed under store 30-day guarantee',
        ];

        $sampleSalesToReturn = array_slice($salesHistory, 20, 10);
        $retIdx = 0;
        foreach ($sampleSalesToReturn as $origSale) {
            $retTime = Carbon::parse($origSale['date'])->addDays(rand(1, 5))->setTime(14, 20);
            if ($retTime <= $endDate) {
                $reason = $returnReasons[$retIdx % count($returnReasons)];
                $postSaleReturn($retTime->toDateTimeString(), $origSale, $reason);
                $retIdx++;
            }
        }

        // Step G: TODAY'S TRANSACTIONS (October 8, 2026)
        echo "   - Seeding Live Activity for TODAY (October 8, 2026)...\n";
        $todayTimes = [
            '09:15:00', '10:30:00', '11:45:00', '12:50:00', '14:10:00', '15:25:00', '16:40:00'
        ];
        foreach ($todayTimes as $idx => $t) {
            $tTime = Carbon::today()->setTimeFromTimeString($t);
            $cust = $customerList[array_rand($customerList)];
            $payMethod = ($idx % 2 === 0) ? 'card' : 'cash';
            $pRaw = $config['products'][$idx % count($config['products'])];
            $pInfo = $prodMap[$pRaw['sku']];

            $orderType = $isRestaurant ? (($idx % 2 === 0) ? 'dine_in' : 'takeaway') : null;

            $postSale($tTime->toDateTimeString(), [
                ['id' => $pInfo['id'], 'price' => $pInfo['price'], 'cost' => $pInfo['cost'], 'qty' => rand(1, 2)]
            ], $payMethod, $cust['id'], $orderType);
        }

        // Step H: Final Account Balances Reconciliation
        echo "   - Reconciling Bank & Cash Ledger Balances...\n";
        $cashJournalBal = (float) DB::table('journal_items')
            ->where('tenant_id', $tenantId)
            ->where('account_id', $accountMap['1000'])
            ->sum(DB::raw('debit - credit'));

        $chaseJournalBal = (float) DB::table('journal_items')
            ->where('tenant_id', $tenantId)
            ->where('bank_account_id', $bankChaseId)
            ->sum(DB::raw('debit - credit'));

        $stripeJournalBal = (float) DB::table('journal_items')
            ->where('tenant_id', $tenantId)
            ->where('bank_account_id', $bankStripeId)
            ->sum(DB::raw('debit - credit'));

        $hsbcJournalBal = (float) DB::table('journal_items')
            ->where('tenant_id', $tenantId)
            ->where('bank_account_id', $bankHsbcId)
            ->sum(DB::raw('debit - credit'));

        DB::table('bank_accounts')->where('id', $bankCashId)->update(['current_balance' => max(0, $cashJournalBal)]);
        DB::table('bank_accounts')->where('id', $bankChaseId)->update(['current_balance' => max(0, $chaseJournalBal)]);
        DB::table('bank_accounts')->where('id', $bankStripeId)->update(['current_balance' => max(0, $stripeJournalBal)]);
        DB::table('bank_accounts')->where('id', $bankHsbcId)->update(['current_balance' => max(0, $hsbcJournalBal)]);

        // Step I: Integrity Audit
        $totalDebits  = (float) DB::table('journal_items')->where('tenant_id', $tenantId)->sum('debit');
        $totalCredits = (float) DB::table('journal_items')->where('tenant_id', $tenantId)->sum('credit');
        $diff = abs($totalDebits - $totalCredits);

        $totalSalesCount = DB::table('sales')->where('tenant_id', $tenantId)->where('status', 'posted')->count();
        $totalSalesRevenue = (float) DB::table('sales')->where('tenant_id', $tenantId)->where('status', 'posted')->sum('net_sales');
        $totalPurchasesCount = DB::table('purchases')->where('tenant_id', $tenantId)->count();
        $totalPurchasesAmt = (float) DB::table('purchases')->where('tenant_id', $tenantId)->sum('total');
        $totalExpensesCount = DB::table('expenses')->where('tenant_id', $tenantId)->count();
        $totalFundTxs = DB::table('fund_transactions')->where('tenant_id', $tenantId)->count();
        $totalDebitNotes = DB::table('debit_notes')->where('tenant_id', $tenantId)->count();
        $totalSaleReturns = DB::table('sales')->where('tenant_id', $tenantId)->where('status', 'returned')->count();

        echo "\n=== STORE SEEDING SUMMARY: {$tenantData['name']} ===\n";
        echo "Total Sales: {$totalSalesCount} (Revenue: \${$totalSalesRevenue})\n";
        echo "Sales Returns: {$totalSaleReturns}\n";
        echo "Total Purchases: {$totalPurchasesCount} (Value: \${$totalPurchasesAmt})\n";
        echo "Purchase Returns (Debit Notes): {$totalDebitNotes}\n";
        echo "Operating Expenses: {$totalExpensesCount}\n";
        echo "Fund Transactions (Money In/Out/Transfers): {$totalFundTxs}\n";
        echo "Trial Balance Check: Debits=\${$totalDebits}, Credits=\${$totalCredits}, Diff=\${$diff} (" . ($diff < 0.05 ? "BALANCED OK" : "UNBALANCED") . ")\n";
        echo "Account Balances:\n";
        echo "  - Cash Drawer: \$" . number_format($cashJournalBal, 2) . "\n";
        echo "  - Chase Checking: \$" . number_format($chaseJournalBal, 2) . "\n";
        echo "  - Stripe Terminal: \$" . number_format($stripeJournalBal, 2) . "\n";
        echo "  - HSBC Reserve: \$" . number_format($hsbcJournalBal, 2) . "\n";
    }
}
