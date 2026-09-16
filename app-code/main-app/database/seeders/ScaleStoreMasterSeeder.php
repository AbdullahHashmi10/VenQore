<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Tenant;
use App\Models\Account;
use App\Models\Warehouse;

class ScaleStoreMasterSeeder extends Seeder
{
    public array $stats = [];

    public function run(): void
    {
        $tenant = Tenant::where('slug', 'scale-store')->first();
        if (!$tenant) {
            echo "Tenant 'scale-store' not found.\n";
            return;
        }

        $tenantId = $tenant->id;
        echo "=================================================================\n";
        echo "MASTER SEEDER: Running for Tenant '{$tenant->name}' (ID: {$tenantId})\n";
        echo "=================================================================\n";

        // ─────────────────────────────────────────────────────────────────
        // 1. CLEAN RESET OF PREVIOUS TENANT DATA
        // ─────────────────────────────────────────────────────────────────
        echo "1. Cleaning previous operational and financial records for tenant {$tenantId}...\n";
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $tablesToClean = [
            'sale_items',
            'sales',
            'payments',
            'purchase_items',
            'purchases',
            'inventory_batches',
            'expenses',
            'stocks',
            'stock_movements',
            'products',
            'categories',
            'customers',
            'suppliers',
            'parties',
            'journal_items',
            'journal_entries',
            'bank_accounts',
            'tenant_modules',
            'staff_attendances',
            'quotations',
            'quotation_items',
            'sales_orders',
            'sales_order_items',
            'purchase_orders',
            'purchase_order_items',
        ];

        foreach ($tablesToClean as $table) {
            if (\Illuminate\Support\Facades\Schema::hasTable($table) && \Illuminate\Support\Facades\Schema::hasColumn($table, 'tenant_id')) {
                DB::table($table)->where('tenant_id', $tenantId)->delete();
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        Cache::flush();
        echo "   - Cleanup complete.\n";

        // ─────────────────────────────────────────────────────────────────
        // 2. ALLOT ALL 46 MODULES TO TENANT 116
        // ─────────────────────────────────────────────────────────────────
        echo "2. Allotting all 46 modules in tenant_modules...\n";
        $modulesConfig = config('modules', []);
        $moduleInserts = [];
        $now = Carbon::now();
        foreach (array_keys($modulesConfig) as $modKey) {
            $moduleInserts[] = [
                'tenant_id'  => $tenantId,
                'module_key' => $modKey,
                'enabled'    => 1,
                'source'     => 'plan',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('tenant_modules')->insert($moduleInserts);
        echo "   - Alloted " . count($moduleInserts) . " modules.\n";

        // ─────────────────────────────────────────────────────────────────
        // 3. CHART OF ACCOUNTS VERIFICATION
        // ─────────────────────────────────────────────────────────────────
        echo "3. Verifying Chart of Accounts...\n";
        $requiredAccounts = [
            '1000' => ['name' => 'Cash in Hand', 'type' => 'asset'],
            '1010' => ['name' => 'Bank Account', 'type' => 'asset'],
            '1100' => ['name' => 'Inventory Asset', 'type' => 'asset'],
            '1200' => ['name' => 'Accounts Receivable', 'type' => 'asset'],
            '1500' => ['name' => 'Fixed Assets', 'type' => 'asset'],
            '2000' => ['name' => 'Accounts Payable', 'type' => 'liability'],
            '2100' => ['name' => 'Sales Tax Payable', 'type' => 'liability'],
            '3000' => ['name' => "Owner's Capital", 'type' => 'equity'],
            '3100' => ['name' => 'Retained Earnings', 'type' => 'equity'],
            '4000' => ['name' => 'Sales Revenue', 'type' => 'income'],
            '4100' => ['name' => 'Other Income', 'type' => 'income'],
            '5000' => ['name' => 'Cost of Goods Sold', 'type' => 'expense'],
            '5100' => ['name' => 'Salaries & Wages', 'type' => 'expense'],
            '5200' => ['name' => 'Rent Expense', 'type' => 'expense'],
            '5300' => ['name' => 'Utilities', 'type' => 'expense'],
            '6000' => ['name' => 'Operating Expenses', 'type' => 'expense'],
        ];

        $accountMap = [];
        foreach ($requiredAccounts as $code => $info) {
            $acct = Account::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->where('code', $code)
                ->first();
            if (!$acct) {
                $acct = Account::create([
                    'tenant_id' => $tenantId,
                    'code'      => $code,
                    'name'      => $info['name'],
                    'type'      => $info['type'],
                ]);
            }
            $accountMap[$code] = $acct->id;
        }

        // Helper to post double-entry balanced journal entry
        $postJournal = function(string $date, string $ref, string $refType, string $desc, array $lines) use ($tenantId) {
            $sumDebit = round(array_sum(array_column($lines, 'debit')), 2);
            $sumCredit = round(array_sum(array_column($lines, 'credit')), 2);

            if (abs($sumDebit - $sumCredit) > 0.01) {
                throw new \RuntimeException("UNBALANCED JOURNAL: {$ref} - Debit: {$sumDebit}, Credit: {$sumCredit}");
            }

            $entryId = (string) Str::uuid();
            $dt = Carbon::parse($date);

            DB::table('journal_entries')->insert([
                'id'             => $entryId,
                'tenant_id'      => $tenantId,
                'date'           => $dt->toDateString(),
                'reference'      => $ref,
                'reference_type' => $refType,
                'description'    => $desc,
                'narration'      => $desc,
                'is_reversed'    => 0,
                'user_id'        => 12,
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
                    'debit'            => $deb,
                    'credit'           => $crd,
                    'description'      => $line['desc'] ?? $desc,
                    'created_at'       => $dt,
                    'updated_at'       => $dt,
                ]);
            }

            return $entryId;
        };

        // ─────────────────────────────────────────────────────────────────
        // 4. BANK ACCOUNTS
        // ─────────────────────────────────────────────────────────────────
        echo "4. Setting up Bank Accounts...\n";
        $bankCashId = (string) Str::uuid();
        DB::table('bank_accounts')->insert([
            'id'              => $bankCashId,
            'tenant_id'       => $tenantId,
            'name'            => 'Cash in Drawer',
            'bank_name'       => 'Cash Register',
            'account_number'  => 'CASH-DRAWER-01',
            'type'            => 'cash',
            'account_type'    => 'cash',
            'opening_balance' => 60000.00,
            'current_balance' => 60000.00,
            'created_at'      => Carbon::parse('2024-01-01 08:00:00'),
            'updated_at'      => Carbon::parse('2024-01-01 08:00:00'),
        ]);

        $bankMeezanId = (string) Str::uuid();
        DB::table('bank_accounts')->insert([
            'id'              => $bankMeezanId,
            'tenant_id'       => $tenantId,
            'name'            => 'Meezan Bank Operating',
            'bank_name'       => 'Meezan Bank',
            'account_number'  => 'PK00MEZN00123456789012',
            'type'            => 'bank',
            'account_type'    => 'checking',
            'opening_balance' => 3000000.00,
            'current_balance' => 3000000.00,
            'created_at'      => Carbon::parse('2024-01-01 08:00:00'),
            'updated_at'      => Carbon::parse('2024-01-01 08:00:00'),
        ]);

        $bankStandardId = (string) Str::uuid();
        DB::table('bank_accounts')->insert([
            'id'              => $bankStandardId,
            'tenant_id'       => $tenantId,
            'name'            => 'Standard Chartered Reserve',
            'bank_name'       => 'Standard Chartered',
            'account_number'  => 'PK00SCBL00987654321098',
            'type'            => 'bank',
            'account_type'    => 'savings',
            'opening_balance' => 250000.00,
            'current_balance' => 250000.00,
            'created_at'      => Carbon::parse('2024-01-01 08:00:00'),
            'updated_at'      => Carbon::parse('2024-01-01 08:00:00'),
        ]);

        // ─────────────────────────────────────────────────────────────────
        // 5. WAREHOUSE
        // ─────────────────────────────────────────────────────────────────
        $warehouse = DB::table('warehouses')->where('tenant_id', $tenantId)->first();
        if (!$warehouse) {
            $warehouseId = (string) Str::uuid();
            DB::table('warehouses')->insert([
                'id'         => $warehouseId,
                'tenant_id'  => $tenantId,
                'name'       => 'Main Store & Warehouse',
                'location'   => 'Lahore Commercial Hub',
                'is_active'  => 1,
                'is_default' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $warehouseId = $warehouse->id;
        }

        // ─────────────────────────────────────────────────────────────────
        // 6. CATEGORIES & PRODUCTS
        // ─────────────────────────────────────────────────────────────────
        echo "5. Creating Categories and Products...\n";
        $categoryData = [
            'staples'     => 'Staples & Gourmet Foods',
            'beverages'   => 'Cold Drinks & Beverages',
            'snacks'      => 'Snacks & Confectionery',
            'electronics' => 'Electronics & Gadgets',
            'personal'    => 'Personal Care & Hygiene',
        ];

        $categoryMap = [];
        foreach ($categoryData as $key => $name) {
            $catId = (string) Str::uuid();
            DB::table('categories')->insert([
                'id'         => $catId,
                'tenant_id'  => $tenantId,
                'name'       => $name,
                'code'       => strtoupper(substr($key, 0, 4)),
                'created_at' => Carbon::parse('2024-01-01 09:00:00'),
                'updated_at' => Carbon::parse('2024-01-01 09:00:00'),
            ]);
            $categoryMap[$key] = $catId;
        }

        $productsDef = [
            ['code' => 'P01', 'name' => 'Premium Roast Coffee 500g',      'cat' => 'staples',     'price' => 1800.0, 'cost' => 1200.0, 'stock' => 150, 'min' => 20],
            ['code' => 'P02', 'name' => 'Organic Green Tea 100pk',         'cat' => 'staples',     'price' => 850.0,  'cost' => 550.0,  'stock' => 180, 'min' => 25],
            ['code' => 'P03', 'name' => 'Artisan Chocolate Box 250g',      'cat' => 'snacks',      'price' => 1250.0, 'cost' => 750.0,  'stock' => 90,  'min' => 15],
            ['code' => 'P04', 'name' => 'Roasted Almonds 500g',            'cat' => 'snacks',      'price' => 1600.0, 'cost' => 1100.0, 'stock' => 85,  'min' => 15],
            ['code' => 'P05', 'name' => 'Natural Sparkling Water 1L',      'cat' => 'beverages',   'price' => 250.0,  'cost' => 140.0,  'stock' => 300, 'min' => 40],
            ['code' => 'P06', 'name' => 'Fresh Orange Juice 1L',           'cat' => 'beverages',   'price' => 420.0,  'cost' => 260.0,  'stock' => 140, 'min' => 25],
            ['code' => 'P07', 'name' => 'Basmati Rice Super Kernel 5kg',   'cat' => 'staples',     'price' => 2400.0, 'cost' => 1750.0, 'stock' => 200, 'min' => 30],
            ['code' => 'P08', 'name' => 'Extra Virgin Olive Oil 750ml',    'cat' => 'staples',     'price' => 3200.0, 'cost' => 2200.0, 'stock' => 75,  'min' => 15],
            ['code' => 'P09', 'name' => 'Fast Charging USB-C Cable 2m',    'cat' => 'electronics', 'price' => 950.0,  'cost' => 400.0,  'stock' => 160, 'min' => 20],
            ['code' => 'P10', 'name' => 'Wireless Bluetooth Earbuds Pro',  'cat' => 'electronics', 'price' => 4800.0, 'cost' => 2900.0, 'stock' => 50,  'min' => 10],
            ['code' => 'P11', 'name' => 'Portable Power Bank 20000mAh',    'cat' => 'electronics', 'price' => 5500.0, 'cost' => 3400.0, 'stock' => 40,  'min' => 10],
            ['code' => 'P12', 'name' => 'Handmade Herbal Soap Bar',        'cat' => 'personal',    'price' => 380.0,  'cost' => 190.0,  'stock' => 250, 'min' => 35],
            ['code' => 'P13', 'name' => 'Natural Lavender Shampoo 400ml',   'cat' => 'personal',    'price' => 1100.0, 'cost' => 680.0,  'stock' => 95,  'min' => 20],
            ['code' => 'P14', 'name' => 'Multi-Surface Disinfectant 1L',   'cat' => 'personal',    'price' => 650.0,  'cost' => 380.0,  'stock' => 4,   'min' => 15],
            ['code' => 'P15', 'name' => 'Whole Wheat Pasta 500g',          'cat' => 'staples',     'price' => 480.0,  'cost' => 290.0,  'stock' => 3,   'min' => 10],
        ];

        $productMap = [];
        $totalOpeningStockVal = 0.0;
        foreach ($productsDef as $p) {
            $pId = (string) Str::uuid();
            DB::table('products')->insert([
                'id'              => $pId,
                'tenant_id'       => $tenantId,
                'category_id'     => $categoryMap[$p['cat']],
                'name'            => $p['name'],
                'sku'             => 'SKU-' . $p['code'],
                'type'            => 'product',
                'price'           => $p['price'],
                'cost_price'      => $p['cost'],
                'quantity'        => $p['stock'],
                'stock_quantity'  => $p['stock'],
                'min_stock_alert' => $p['min'],
                'alert_quantity'  => $p['min'],
                'is_active'       => 1,
                'created_at'      => Carbon::parse('2024-01-01 09:30:00'),
                'updated_at'      => Carbon::parse('2024-01-01 09:30:00'),
            ]);

            // Create stock record
            DB::table('stocks')->insert([
                'id'                => (string) Str::uuid(),
                'tenant_id'         => $tenantId,
                'product_id'        => $pId,
                'warehouse_id'      => $warehouseId,
                'quantity'          => $p['stock'],
                'reserved_quantity' => 0,
                'status'            => 'in_stock',
                'created_at'        => Carbon::parse('2024-01-01 09:30:00'),
                'updated_at'        => Carbon::parse('2024-01-01 09:30:00'),
            ]);

            // Create inventory batch record so FinancialReportingService::getInventoryValue() works
            DB::table('inventory_batches')->insert([
                'id'            => (string) Str::uuid(),
                'tenant_id'     => $tenantId,
                'product_id'    => $pId,
                'warehouse_id'  => $warehouseId,
                'batch_type'    => 'opening_balance',
                'initial_qty'   => $p['stock'],
                'original_qty'  => $p['stock'],
                'remaining_qty' => $p['stock'],
                'unit_cost'     => $p['cost'],
                'created_at'    => Carbon::parse('2024-01-01 09:30:00'),
                'updated_at'    => Carbon::parse('2024-01-01 09:30:00'),
            ]);

            $totalOpeningStockVal += ($p['cost'] * $p['stock']);
            $productMap[$p['code']] = [
                'id'    => $pId,
                'name'  => $p['name'],
                'price' => $p['price'],
                'cost'  => $p['cost'],
            ];
        }

        // ─────────────────────────────────────────────────────────────────
        // 7. PARTIES (CUSTOMERS & SUPPLIERS)
        // ─────────────────────────────────────────────────────────────────
        echo "6. Creating Customers and Suppliers...\n";
        $customerList = [
            ['name' => 'Tariq Mahmood',                   'phone' => '+92 300 1122334', 'email' => 'tariq@gmail.com',     'type' => 'customer', 'bal' => 0],
            ['name' => 'Ayesha Siddiqui',                 'phone' => '+92 321 2233445', 'email' => 'ayesha.s@yahoo.com',  'type' => 'customer', 'bal' => 0],
            ['name' => 'Apex Tech Solutions (Bilal Ahmed)','phone' => '+92 333 3344556', 'email' => 'bilal@apextech.pk',   'type' => 'customer', 'bal' => 18500.0],
            ['name' => 'Farhan Enterprise',               'phone' => '+92 345 4455667', 'email' => 'farhan@enterprise.pk','type' => 'customer', 'bal' => 24000.0],
            ['name' => 'Zainab Fatima',                   'phone' => '+92 312 5566778', 'email' => 'zainab.f@gmail.com',  'type' => 'customer', 'bal' => 0],
            ['name' => 'Hassan Raza',                     'phone' => '+92 302 6677889', 'email' => 'hassan.raza@live.com', 'type' => 'customer', 'bal' => 0],
            ['name' => 'Crescent Academy (Kamran Shah)',   'phone' => '+92 315 7788990', 'email' => 'admin@crescent.edu.pk','type' => 'customer', 'bal' => 15000.0],
            ['name' => 'Maryam Nawaz',                    'phone' => '+92 301 8899001', 'email' => 'maryam.n@gmail.com',   'type' => 'customer', 'bal' => 0],
        ];

        $customerMap = [];
        foreach ($customerList as $idx => $c) {
            $cId = (string) Str::uuid();
            DB::table('parties')->insert([
                'id'              => $cId,
                'tenant_id'       => $tenantId,
                'name'            => $c['name'],
                'phone'           => $c['phone'],
                'email'           => $c['email'],
                'type'            => 'customer',
                'credit_limit'    => 100000.0,
                'current_balance' => $c['bal'],
                'is_active'       => 1,
                'created_at'      => Carbon::parse('2024-01-01 10:00:00'),
                'updated_at'      => Carbon::parse('2024-01-01 10:00:00'),
            ]);
            DB::table('customers')->insert([
                'id'           => $cId,
                'tenant_id'    => $tenantId,
                'party_id'     => $cId,
                'name'         => $c['name'],
                'phone'        => $c['phone'],
                'email'        => $c['email'],
                'type'         => 'regular',
                'credit_limit' => 100000.0,
                'created_at'   => Carbon::parse('2024-01-01 10:00:00'),
                'updated_at'   => Carbon::parse('2024-01-01 10:00:00'),
            ]);
            $customerMap['C' . ($idx + 1)] = ['id' => $cId, 'name' => $c['name']];
        }

        $supplierList = [
            ['name' => 'National Food Distributors',    'phone' => '+92 42 35789001', 'email' => 'orders@nationalfoods.com.pk'],
            ['name' => 'Indus Beverage Supply Co.',      'phone' => '+92 42 35789002', 'email' => 'sales@indusbeverages.pk'],
            ['name' => 'Prime Electronics Logistics',   'phone' => '+92 21 34567890', 'email' => 'wholesale@primeelec.com'],
            ['name' => 'Organic Valley Farms',          'phone' => '+92 51 2345678',  'email' => 'info@organicvalley.pk'],
            ['name' => 'PureCare Hygiene Supplies',     'phone' => '+92 42 37890123', 'email' => 'supply@purecare.com.pk'],
        ];

        $supplierMap = [];
        foreach ($supplierList as $idx => $s) {
            $sId = (string) Str::uuid();
            DB::table('parties')->insert([
                'id'              => $sId,
                'tenant_id'       => $tenantId,
                'name'            => $s['name'],
                'phone'           => $s['phone'],
                'email'           => $s['email'],
                'type'            => 'supplier',
                'current_balance' => 0.0,
                'is_active'       => 1,
                'created_at'      => Carbon::parse('2024-01-01 10:00:00'),
                'updated_at'      => Carbon::parse('2024-01-01 10:00:00'),
            ]);
            DB::table('suppliers')->insert([
                'id'             => $sId,
                'tenant_id'      => $tenantId,
                'party_id'       => $sId,
                'name'           => $s['name'],
                'contact_person' => $s['name'],
                'phone'          => $s['phone'],
                'email'          => $s['email'],
                'created_at'     => Carbon::parse('2024-01-01 10:00:00'),
                'updated_at'     => Carbon::parse('2024-01-01 10:00:00'),
            ]);
            $supplierMap['S' . ($idx + 1)] = ['id' => $sId, 'name' => $s['name']];
        }

        // ─────────────────────────────────────────────────────────────────
        // 8. OPENING CAPITAL JOURNAL ENTRY
        // ─────────────────────────────────────────────────────────────────
        echo "7. Posting Opening Capital Entry...\n";
        $totalOpeningBank = 3000000.00 + 250000.00;
        $totalOpeningEquity = 60000.00 + $totalOpeningBank + $totalOpeningStockVal;
        $postJournal('2024-01-01 10:00:00', 'OB-2024-001', 'opening_balance', 'Opening Capital, Bank, Cash & Inventory', [
            ['account_id' => $accountMap['1000'], 'debit' => 60000.00,             'credit' => 0.0, 'desc' => 'Cash in Drawer Opening'],
            ['account_id' => $accountMap['1010'], 'debit' => $totalOpeningBank,     'credit' => 0.0, 'desc' => 'Bank Accounts Opening (Meezan & Standard Chartered)'],
            ['account_id' => $accountMap['1100'], 'debit' => $totalOpeningStockVal, 'credit' => 0.0, 'desc' => 'Opening Inventory at Cost'],
            ['account_id' => $accountMap['3000'], 'debit' => 0.0,                  'credit' => $totalOpeningEquity, 'desc' => "Owner's Initial Capital Contribution"],
        ]);

        // Helper to post Sale with operational records and double-entry ledger
        $saleSeq = 1;
        $postSale = function(string $dtStr, array $itemsData, string $paymentMethod, ?string $customerId = null) use (
            $tenantId, $warehouseId, $accountMap, $postJournal, $bankCashId, $bankMeezanId, &$saleSeq
        ) {
            $dt = Carbon::parse($dtStr);
            $saleId = (string) Str::uuid();
            $invNum = sprintf('INV-%s-%04d', $dt->format('ymd'), $saleSeq++);

            $subtotalGross = 0.0;
            $cogsTotal = 0.0;
            $saleItemsToInsert = [];

            foreach ($itemsData as $item) {
                $qty = (float) $item['qty'];
                $price = (float) $item['price'];
                $cost = (float) $item['cost'];
                $gross = round($qty * $price, 2);
                $cogs = round($qty * $cost, 2);

                $subtotalGross += $gross;
                $cogsTotal += $cogs;

                $saleItemsToInsert[] = [
                    'id'              => (string) Str::uuid(),
                    'tenant_id'       => $tenantId,
                    'sale_id'         => $saleId,
                    'product_id'      => $item['id'],
                    'quantity'        => $qty,
                    'unit_price'      => $price,
                    'cost_price'      => $cost,
                    'gross_amount'    => $gross,
                    'discount_amount' => 0.0,
                    'net_amount'      => $gross,
                    'tax_rate'        => 0.0,
                    'tax_amount'      => 0.0,
                    'line_total'      => $gross,
                    'subtotal'        => $gross,
                    'created_at'      => $dt,
                    'updated_at'      => $dt,
                ];
            }

            $netSales = $subtotalGross;
            $totalAmount = $subtotalGross;

            // Determine accounts for ledger posting
            $debitAccount = match ($paymentMethod) {
                'cash' => $accountMap['1000'],
                'card', 'bank_transfer' => $accountMap['1010'],
                'credit', 'khata' => $accountMap['1200'],
                default => $accountMap['1000'],
            };

            // Insert Sale Header
            DB::table('sales')->insert([
                'id'                   => $saleId,
                'tenant_id'            => $tenantId,
                'reference_number'     => $invNum,
                'customer_id'          => $customerId,
                'party_id'             => $customerId,
                'user_id'              => 12,
                'warehouse_id'         => $warehouseId,
                'subtotal'             => $subtotalGross,
                'subtotal_gross'       => $subtotalGross,
                'total_item_discounts' => 0.0,
                'global_discount'      => 0.0,
                'net_sales'            => $netSales,
                'total_tax'            => 0.0,
                'invoice_total'        => $totalAmount,
                'total'                => $totalAmount,
                'tendered_amount'      => $totalAmount,
                'change_return'        => 0.0,
                'status'               => 'posted',
                'posted_at'            => $dt,
                'payment_status'       => ($paymentMethod === 'credit' || $paymentMethod === 'khata') ? 'unpaid' : 'paid',
                'payment_method'       => $paymentMethod,
                'created_at'           => $dt,
                'updated_at'           => $dt,
            ]);

            // Insert Sale Lines
            DB::table('sale_items')->insert($saleItemsToInsert);

            // Insert Payment if collected immediately
            if ($paymentMethod !== 'credit' && $paymentMethod !== 'khata') {
                $bankAccId = ($paymentMethod === 'cash') ? $bankCashId : $bankMeezanId;
                DB::table('payments')->insert([
                    'id'              => (string) Str::uuid(),
                    'tenant_id'       => $tenantId,
                    'sale_id'         => $saleId,
                    'party_id'        => $customerId,
                    'amount'          => $totalAmount,
                    'method'          => $paymentMethod,
                    'type'            => 'in',
                    'date'            => $dt->toDateString(),
                    'bank_account_id' => $bankAccId,
                    'reference'       => $invNum,
                    'created_at'      => $dt,
                    'updated_at'      => $dt,
                ]);
            }

            // Post double-entry journal for Sale (Revenue & COGS)
            $postJournal($dt->toDateTimeString(), $invNum, 'sale', "Sale {$invNum} ({$paymentMethod})", [
                ['account_id' => $debitAccount,         'debit' => $totalAmount, 'credit' => 0.0,          'desc' => "Payment In ({$paymentMethod})"],
                ['account_id' => $accountMap['4000'],   'debit' => 0.0,          'credit' => $netSales,    'desc' => "Sales Revenue"],
                ['account_id' => $accountMap['5000'],   'debit' => $cogsTotal,   'credit' => 0.0,          'desc' => "Cost of Goods Sold"],
                ['account_id' => $accountMap['1100'],   'debit' => 0.0,          'credit' => $cogsTotal,   'desc' => "Inventory Reduction"],
            ]);

            return [
                'id'             => $saleId,
                'inv_num'        => $invNum,
                'total'          => $totalAmount,
                'cogs'           => $cogsTotal,
                'payment_method' => $paymentMethod,
                'date'           => $dtStr,
            ];
        };

        // Helper to post Operating Expense
        $expSeq = 1;
        $postExpense = function(string $dtStr, string $category, float $amount, string $paymentMethod, string $desc) use (
            $tenantId, $accountMap, $postJournal, $bankCashId, $bankMeezanId, &$expSeq
        ) {
            $dt = Carbon::parse($dtStr);
            $expId = (string) Str::uuid();
            $ref = sprintf('EXP-%s-%04d', $dt->format('ymd'), $expSeq++);

            $accountCode = match (strtolower($category)) {
                'salaries', 'salary' => '5100',
                'rent' => '5200',
                'utilities', 'utility' => '5300',
                default => '6000',
            };

            $creditAccount = ($paymentMethod === 'cash') ? $accountMap['1000'] : $accountMap['1010'];
            $bankAccId = ($paymentMethod === 'cash') ? $bankCashId : $bankMeezanId;

            DB::table('expenses')->insert([
                'id'             => $expId,
                'tenant_id'      => $tenantId,
                'category'       => $category,
                'amount'         => $amount,
                'amount_paid'    => $amount,
                'grand_total'    => $amount,
                'payment_method' => $paymentMethod,
                'date'           => $dt->toDateString(),
                'bank_account_id'=> $bankAccId,
                'reference'      => $ref,
                'description'    => $desc,
                'created_at'     => $dt,
                'updated_at'     => $dt,
            ]);

            $postJournal($dt->toDateTimeString(), $ref, 'expense', $desc, [
                ['account_id' => $accountMap[$accountCode], 'debit' => $amount, 'credit' => 0.0,    'desc' => $desc],
                ['account_id' => $creditAccount,           'debit' => 0.0,    'credit' => $amount, 'desc' => "Payment via {$paymentMethod}"],
            ]);

            return [
                'id'             => $expId,
                'ref'            => $ref,
                'amount'         => $amount,
                'category'       => $category,
                'payment_method' => $paymentMethod,
                'date'           => $dtStr,
            ];
        };

        // ─────────────────────────────────────────────────────────────────
        // 9. HISTORICAL SEEDING (2024, 2025, Jan-Aug 2026)
        // ─────────────────────────────────────────────────────────────────
        echo "8. Seeding multi-year history (2024, 2025, 2026 Q1-Q3)...\n";

        // 2024 Monthly Recurring
        for ($m = 1; $m <= 12; $m++) {
            $mStr = sprintf('2024-%02d', $m);
            $postExpense("{$mStr}-01 09:00:00", 'Rent', 25000.00, 'bank_transfer', "Monthly Rent - {$mStr}");
            $postExpense("{$mStr}-15 11:00:00", 'Utilities', 7500.00, 'bank_transfer', "Commercial Utilities - {$mStr}");
            $postExpense("{$mStr}-28 17:00:00", 'Salaries', 40000.00, 'bank_transfer', "Staff Payroll - {$mStr}");
            $postExpense("{$mStr}-20 14:00:00", 'Supplies', 3500.00, 'cash', "Store Supplies & Packing - {$mStr}");

            for ($s = 1; $s <= 8; $s++) {
                $day = rand(2, 27);
                $p = $productMap['P0' . rand(1, 9)];
                $qty = rand(3, 8);
                $postSale("{$mStr}-{$day} 14:30:00", [
                    ['id' => $p['id'], 'qty' => $qty, 'price' => $p['price'], 'cost' => $p['cost']]
                ], ($s % 2 === 0 ? 'cash' : 'card'), $customerMap['C' . rand(1, 8)]['id']);
            }
        }

        // 2025 Monthly Recurring
        for ($m = 1; $m <= 12; $m++) {
            $mStr = sprintf('2025-%02d', $m);
            $postExpense("{$mStr}-01 09:00:00", 'Rent', 28000.00, 'bank_transfer', "Monthly Rent - {$mStr}");
            $postExpense("{$mStr}-15 11:00:00", 'Utilities', 8500.00, 'bank_transfer', "Commercial Utilities - {$mStr}");
            $postExpense("{$mStr}-28 17:00:00", 'Salaries', 45000.00, 'bank_transfer', "Staff Payroll - {$mStr}");
            $postExpense("{$mStr}-10 12:00:00", 'Marketing', 5000.00, 'bank_transfer', "Digital Marketing Ads - {$mStr}");
            $postExpense("{$mStr}-22 14:00:00", 'Supplies', 4000.00, 'cash', "Store Consumables - {$mStr}");

            for ($s = 1; $s <= 10; $s++) {
                $day = rand(2, 27);
                $p1 = $productMap['P0' . rand(1, 9)];
                $p2 = $productMap['P' . rand(10, 15)];
                $postSale("{$mStr}-{$day} 16:15:00", [
                    ['id' => $p1['id'], 'qty' => rand(2, 5), 'price' => $p1['price'], 'cost' => $p1['cost']],
                    ['id' => $p2['id'], 'qty' => rand(1, 3), 'price' => $p2['price'], 'cost' => $p2['cost']],
                ], (['cash', 'card', 'bank_transfer'][$s % 3]), $customerMap['C' . rand(1, 8)]['id']);
            }
        }

        // 2026 Jan - Aug Recurring
        for ($m = 1; $m <= 8; $m++) {
            $mStr = sprintf('2026-%02d', $m);
            $postExpense("{$mStr}-01 09:00:00", 'Rent', 30000.00, 'bank_transfer', "Monthly Rent - {$mStr}");
            $postExpense("{$mStr}-15 11:00:00", 'Utilities', 9200.00, 'bank_transfer', "Commercial Utilities - {$mStr}");
            $postExpense("{$mStr}-28 17:00:00", 'Salaries', 48000.00, 'bank_transfer', "Staff Payroll - {$mStr}");
            $postExpense("{$mStr}-10 12:00:00", 'Marketing', 6000.00, 'bank_transfer', "Marketing Campaign - {$mStr}");
            $postExpense("{$mStr}-22 14:00:00", 'Supplies', 4500.00, 'cash', "Packaging & Receipt rolls - {$mStr}");

            for ($s = 1; $s <= 12; $s++) {
                $day = rand(2, 28);
                $p1 = $productMap['P0' . rand(1, 9)];
                $p2 = $productMap['P' . rand(10, 15)];
                $postSale("{$mStr}-{$day} 13:45:00", [
                    ['id' => $p1['id'], 'qty' => rand(2, 6), 'price' => $p1['price'], 'cost' => $p1['cost']],
                    ['id' => $p2['id'], 'qty' => rand(1, 4), 'price' => $p2['price'], 'cost' => $p2['cost']],
                ], (['cash', 'card', 'bank_transfer', 'credit'][$s % 4]), $customerMap['C' . rand(1, 8)]['id']);
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 10. CURRENT MONTH (September 1 - 14, 2026)
        // ─────────────────────────────────────────────────────────────────
        echo "9. Seeding Current Month (September 1 to 14, 2026)...\n";
        $postExpense('2026-09-01 09:00:00', 'Rent', 30000.00, 'bank_transfer', 'Monthly Rent - September 2026');
        $postExpense('2026-09-05 11:30:00', 'Marketing', 6500.00, 'bank_transfer', 'Digital Ads September Boost');
        $postExpense('2026-09-10 14:00:00', 'Utilities', 9800.00, 'bank_transfer', 'High-Speed Commercial Power & Net');
        $postExpense('2026-09-12 16:20:00', 'Supplies', 4200.00, 'cash', 'Packaging, Bags & Labels');
        $postExpense('2026-09-14 18:00:00', 'Salaries', 20000.00, 'bank_transfer', 'Staff Mid-Month Payroll Advance');

        // Sales for Sept 1 to Sept 14
        for ($day = 1; $day <= 14; $day++) {
            $dStr = sprintf('2026-09-%02d', $day);
            $pA = $productMap['P0' . (($day % 9) + 1)];
            $pB = $productMap['P' . (($day % 6) + 10)];
            $postSale("{$dStr} 11:15:00", [
                ['id' => $pA['id'], 'qty' => 3, 'price' => $pA['price'], 'cost' => $pA['cost']],
            ], ($day % 2 === 0 ? 'cash' : 'card'), $customerMap['C' . (($day % 8) + 1)]['id']);

            $postSale("{$dStr} 17:40:00", [
                ['id' => $pB['id'], 'qty' => 2, 'price' => $pB['price'], 'cost' => $pB['cost']],
            ], ($day % 3 === 0 ? 'bank_transfer' : ($day % 3 === 1 ? 'cash' : 'card')), $customerMap['C' . ((($day + 3) % 8) + 1)]['id']);
        }

        // ─────────────────────────────────────────────────────────────────
        // 10. PURCHASES (SEPTEMBER 2026)
        // ─────────────────────────────────────────────────────────────────
        echo "9. Seeding September 2026 Purchases...\n";
        $purchaseSeq = 1;
        $postPurchase = function(string $dtStr, string $supplierId, array $items, string $workflowStatus = 'received') use (
            $tenantId, $warehouseId, $accountMap, $postJournal, $bankMeezanId, &$purchaseSeq
        ) {
            $dt = Carbon::parse($dtStr);
            $poId = (string) Str::uuid();
            $invNum = sprintf('PO-%s-%04d', $dt->format('ymd'), $purchaseSeq++);
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
                'workflow_status' => $workflowStatus,
                'payment_method'  => 'bank_transfer',
                'created_at'      => $dt,
                'updated_at'      => $dt,
            ]);

            DB::table('purchase_items')->insert($poItems);

            // Double Entry: Debit Inventory Asset (1100), Credit Bank Account (1010)
            $postJournal($dtStr, $invNum, 'purchase', "Purchase {$invNum} from Supplier", [
                ['account_id' => $accountMap['1100'], 'debit' => $subtotal, 'credit' => 0.0,       'desc' => "Inventory received {$invNum}"],
                ['account_id' => $accountMap['1010'], 'debit' => 0.0,       'credit' => $subtotal, 'desc' => "Payment via Meezan Bank for {$invNum}"],
            ]);

            return ['id' => $poId, 'inv' => $invNum, 'total' => $subtotal];
        };

        // Purchase 1: National Food Distributors (Sept 03)
        $postPurchase('2026-09-03 11:00:00', $supplierMap['S1']['id'], [
            ['id' => $productMap['P07']['id'], 'qty' => 50, 'cost' => 1750.0],
            ['id' => $productMap['P08']['id'], 'qty' => 20, 'cost' => 2200.0],
        ]);

        // Purchase 2: Indus Beverage Supply Co. (Sept 08)
        $postPurchase('2026-09-08 14:00:00', $supplierMap['S2']['id'], [
            ['id' => $productMap['P05']['id'], 'qty' => 100, 'cost' => 140.0],
            ['id' => $productMap['P06']['id'], 'qty' => 50,  'cost' => 260.0],
        ]);

        // Purchase 3: Prime Electronics Logistics (Sept 12)
        $postPurchase('2026-09-12 10:30:00', $supplierMap['S3']['id'], [
            ['id' => $productMap['P09']['id'], 'qty' => 40, 'cost' => 400.0],
            ['id' => $productMap['P10']['id'], 'qty' => 15, 'cost' => 2900.0],
        ]);

        $now = Carbon::now();
        $startOfToday = Carbon::today();
        $minutesSinceMidnight = $startOfToday->diffInMinutes($now);
        $availableMinutes = max(15, intval($minutesSinceMidnight) - 2);

        // Calculate chronological timestamps for today (strictly in past, strictly on today)
        $todayTimestamp = function(int $stepIndex, int $totalSteps = 11) use ($now, $availableMinutes) {
            $minsAgo = intval($availableMinutes * (1 - (($stepIndex + 1) / ($totalSteps + 1)))) + 2;
            return $now->copy()->subMinutes($minsAgo)->format('Y-m-d H:i:s');
        };

        // Purchase 4: Organic Valley Farms (Sept 16 - Today)
        $todayPoTime = $todayTimestamp(4, 11);
        $postPurchase($todayPoTime, $supplierMap['S4']['id'], [
            ['id' => $productMap['P01']['id'], 'qty' => 25, 'cost' => 1200.0],
            ['id' => $productMap['P02']['id'], 'qty' => 30, 'cost' => 550.0],
        ]);

        // ─────────────────────────────────────────────────────────────────
        // 11. TODAY TRANSACTIONS (2026-09-15 & 2026-09-16)
        // ─────────────────────────────────────────────────────────────────
        echo "10. Seeding TODAY transactions with exact known metrics...\n";

        $seedDayTransactions = function(string $dateStr) use ($productMap, $customerMap, $postSale, $postExpense, $todayTimestamp) {
            $isToday = ($dateStr === Carbon::today()->toDateString());

            if ($isToday) {
                $tSales = [
                    $todayTimestamp(0, 11),  // Sale 1
                    $todayTimestamp(1, 11),  // Sale 2
                    $todayTimestamp(2, 11),  // Sale 3
                    $todayTimestamp(5, 11),  // Sale 4
                    $todayTimestamp(6, 11),  // Sale 5
                    $todayTimestamp(8, 11),  // Sale 6
                    $todayTimestamp(9, 11),  // Sale 7
                    $todayTimestamp(10, 11), // Sale 8 (most recent)
                ];
                $tExp1 = $todayTimestamp(3, 11); // Expense 1
                $tExp2 = $todayTimestamp(7, 11); // Expense 2
            } else {
                $tSales = [
                    "{$dateStr} 09:15:00",
                    "{$dateStr} 10:30:00",
                    "{$dateStr} 12:15:00",
                    "{$dateStr} 14:00:00",
                    "{$dateStr} 15:45:00",
                    "{$dateStr} 17:20:00",
                    "{$dateStr} 18:50:00",
                    "{$dateStr} 20:10:00",
                ];
                $tExp1 = "{$dateStr} 13:00:00";
                $tExp2 = "{$dateStr} 16:30:00";
            }

            $todaySales = [];
            // Sale 1: Coffee (2x 1800) + Green Tea (1x 850) = Rs 4,450.00 (Cash)
            $todaySales[] = $postSale($tSales[0], [
                ['id' => $productMap['P01']['id'], 'qty' => 2, 'price' => 1800.0, 'cost' => 1200.0],
                ['id' => $productMap['P02']['id'], 'qty' => 1, 'price' => 850.0,  'cost' => 550.0],
            ], 'cash', $customerMap['C1']['id']);

            // Sale 2: Chocolate (3x 1250) + Almonds (1x 1600) = Rs 5,350.00 (Card)
            $todaySales[] = $postSale($tSales[1], [
                ['id' => $productMap['P03']['id'], 'qty' => 3, 'price' => 1250.0, 'cost' => 750.0],
                ['id' => $productMap['P04']['id'], 'qty' => 1, 'price' => 1600.0, 'cost' => 1100.0],
            ], 'card', $customerMap['C2']['id']);

            // Sale 3: Earbuds (1x 4800) + USB-C Cable (2x 950) = Rs 6,700.00 (Bank)
            $todaySales[] = $postSale($tSales[2], [
                ['id' => $productMap['P10']['id'], 'qty' => 1, 'price' => 4800.0, 'cost' => 2900.0],
                ['id' => $productMap['P09']['id'], 'qty' => 2, 'price' => 950.0,  'cost' => 400.0],
            ], 'bank_transfer', $customerMap['C3']['id']);

            // Sale 4: Power Bank (1x 5500) = Rs 5,500.00 (Card)
            $todaySales[] = $postSale($tSales[3], [
                ['id' => $productMap['P11']['id'], 'qty' => 1, 'price' => 5500.0, 'cost' => 3400.0],
            ], 'card', $customerMap['C4']['id']);

            // Sale 5: Basmati Rice (2x 2400) + Olive Oil (1x 3200) + Pasta (2x 480) = Rs 8,960.00 (Cash)
            $todaySales[] = $postSale($tSales[4], [
                ['id' => $productMap['P07']['id'], 'qty' => 2, 'price' => 2400.0, 'cost' => 1750.0],
                ['id' => $productMap['P08']['id'], 'qty' => 1, 'price' => 3200.0, 'cost' => 2200.0],
                ['id' => $productMap['P15']['id'], 'qty' => 2, 'price' => 480.0,  'cost' => 290.0],
            ], 'cash', $customerMap['C5']['id']);

            // Sale 6: Water (6x 250) + Juice (4x 420) + Soap (3x 380) = Rs 4,320.00 (Cash)
            $todaySales[] = $postSale($tSales[5], [
                ['id' => $productMap['P05']['id'], 'qty' => 6, 'price' => 250.0, 'cost' => 140.0],
                ['id' => $productMap['P06']['id'], 'qty' => 4, 'price' => 420.0, 'cost' => 260.0],
                ['id' => $productMap['P12']['id'], 'qty' => 3, 'price' => 380.0, 'cost' => 190.0],
            ], 'cash', $customerMap['C6']['id']);

            // Sale 7: Almonds (2x 1600) + Coffee (1x 1800) + Shampoo (2x 1100) = Rs 7,200.00 (Khata / Credit)
            $todaySales[] = $postSale($tSales[6], [
                ['id' => $productMap['P04']['id'], 'qty' => 2, 'price' => 1600.0, 'cost' => 1100.0],
                ['id' => $productMap['P01']['id'], 'qty' => 1, 'price' => 1800.0, 'cost' => 1200.0],
                ['id' => $productMap['P13']['id'], 'qty' => 2, 'price' => 1100.0, 'cost' => 680.0],
            ], 'khata', $customerMap['C4']['id']);

            // Sale 8: Earbuds (2x 4800) + Chocolate (2x 1250) = Rs 12,100.00 (Card - Largest Sale)
            $todaySales[] = $postSale($tSales[7], [
                ['id' => $productMap['P10']['id'], 'qty' => 2, 'price' => 4800.0, 'cost' => 2900.0],
                ['id' => $productMap['P03']['id'], 'qty' => 2, 'price' => 1250.0, 'cost' => 750.0],
            ], 'card', $customerMap['C7']['id']);

            // Today's Expenses
            $todayExpenses = [];
            $todayExpenses[] = $postExpense($tExp1, 'Supplies', 850.00, 'cash', "Store Refreshment & Daily Tea ({$dateStr})");
            $todayExpenses[] = $postExpense($tExp2, 'Miscellaneous', 1200.00, 'cash', "Courier & Local Dispatch ({$dateStr})");

            return ['sales' => $todaySales, 'expenses' => $todayExpenses];
        };

        $day15 = $seedDayTransactions('2026-09-15');
        $day16 = $seedDayTransactions('2026-09-16');

        // Staff attendance
        DB::table('staff_attendances')->insert([
            [
                'id'                => (string) Str::uuid(),
                'tenant_id'         => $tenantId,
                'user_id'           => 12,
                'check_in'          => Carbon::parse('2026-09-15 08:55:00'),
                'last_active_at'    => Carbon::parse('2026-09-15 18:00:00'),
                'check_out'         => null,
                'total_gap_minutes' => 0,
                'status'            => 'present',
                'created_at'        => Carbon::parse('2026-09-15 08:55:00'),
                'updated_at'        => Carbon::parse('2026-09-15 18:00:00'),
            ],
            [
                'id'                => (string) Str::uuid(),
                'tenant_id'         => $tenantId,
                'user_id'           => 12,
                'check_in'          => Carbon::parse('2026-09-16 08:50:00'),
                'last_active_at'    => Carbon::parse('2026-09-16 14:00:00'),
                'check_out'         => null,
                'total_gap_minutes' => 0,
                'status'            => 'present',
                'created_at'        => Carbon::parse('2026-09-16 08:50:00'),
                'updated_at'        => Carbon::parse('2026-09-16 14:00:00'),
            ],
        ]);

        echo "=================================================================\n";
        echo "SEEDING COMPLETE! COMPILING VERIFICATION METRICS...\n";
        echo "=================================================================\n";

        $todayStr = today()->toDateString();
        $thisMonthStart = Carbon::now()->startOfMonth()->toDateString();
        $thisMonthEnd   = Carbon::now()->endOfMonth()->toDateString();
        $thisYearStart  = Carbon::now()->startOfYear()->toDateString();
        $thisYearEnd    = Carbon::now()->endOfYear()->toDateString();

        $frs = app(\App\Services\FinancialReportingService::class);
        $plToday = $frs->getProfitAndLoss($todayStr, $todayStr, $tenantId);
        $plMonth = $frs->getProfitAndLoss($thisMonthStart, $thisMonthEnd, $tenantId);
        $plYear  = $frs->getProfitAndLoss($thisYearStart, $thisYearEnd, $tenantId);

        $salesCountToday = DB::table('sales')->where('tenant_id', $tenantId)->whereDate('posted_at', $todayStr)->count();
        $salesSumToday   = (float) DB::table('sales')->where('tenant_id', $tenantId)->whereDate('posted_at', $todayStr)->sum('net_sales');
        $maxSaleToday    = (float) DB::table('sales')->where('tenant_id', $tenantId)->whereDate('posted_at', $todayStr)->max('net_sales');

        $breakdownToday = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereDate('posted_at', $todayStr)
            ->select('payment_method', DB::raw('SUM(net_sales) as total'))
            ->groupBy('payment_method')
            ->get();

        echo "\n--- TODAY ({$todayStr}) METRICS ---\n";
        echo "Sales Count: {$salesCountToday}\n";
        echo "Revenue (net_sales): Rs " . number_format($salesSumToday, 2) . "\n";
        echo "P&L Revenue: Rs " . number_format($plToday['revenue'], 2) . "\n";
        echo "COGS: Rs " . number_format($plToday['cogs'], 2) . "\n";
        echo "Gross Profit: Rs " . number_format($plToday['gross_profit'], 2) . "\n";
        echo "Operating Expenses: Rs " . number_format($plToday['total_expenses'], 2) . "\n";
        echo "Net Profit: Rs " . number_format($plToday['net_profit'], 2) . "\n";
        echo "Largest Sale: Rs " . number_format($maxSaleToday, 2) . "\n";
        echo "Payment Breakdown:\n";
        foreach ($breakdownToday as $b) {
            echo "  - {$b->payment_method}: Rs " . number_format($b->total, 2) . "\n";
        }

        echo "\n--- THIS MONTH (September 2026) METRICS ---\n";
        echo "P&L Revenue: Rs " . number_format($plMonth['revenue'], 2) . "\n";
        echo "COGS: Rs " . number_format($plMonth['cogs'], 2) . "\n";
        echo "Gross Profit: Rs " . number_format($plMonth['gross_profit'], 2) . "\n";
        echo "Total Expenses: Rs " . number_format($plMonth['total_expenses'], 2) . "\n";
        echo "Net Profit: Rs " . number_format($plMonth['net_profit'], 2) . "\n";

        echo "\n--- THIS YEAR (2026 YTD) METRICS ---\n";
        echo "P&L Revenue: Rs " . number_format($plYear['revenue'], 2) . "\n";
        echo "COGS: Rs " . number_format($plYear['cogs'], 2) . "\n";
        echo "Gross Profit: Rs " . number_format($plYear['gross_profit'], 2) . "\n";
        echo "Total Expenses: Rs " . number_format($plYear['total_expenses'], 2) . "\n";
        echo "Net Profit: Rs " . number_format($plYear['net_profit'], 2) . "\n";

        // Check trial balance invariant
        $totalDebits = (float) DB::table('journal_items')->where('tenant_id', $tenantId)->sum('debit');
        $totalCredits = (float) DB::table('journal_items')->where('tenant_id', $tenantId)->sum('credit');
        $diff = abs($totalDebits - $totalCredits);
        echo "\n--- LEDGER INTEGRITY CHECK ---\n";
        echo "Total Debits: Rs " . number_format($totalDebits, 2) . "\n";
        echo "Total Credits: Rs " . number_format($totalCredits, 2) . "\n";
        echo "Difference: " . number_format($diff, 4) . " (" . ($diff < 0.01 ? "BALANCED OK" : "UNBALANCED ERROR") . ")\n";
    }
}
