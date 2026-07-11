<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\Tenant;
use App\Models\Warehouse;
use App\Models\BankAccount;
use App\Models\Product;
use App\Models\Party;
use App\Services\V3\AccountingService;
use App\Services\V3\SaleService;
use App\Services\V3\FifoService;
use App\Services\V3\PaymentService;
use App\Services\V3\PurchaseService;
use App\Services\V3\InventoryService;

class GoldenAuditSeeder extends Seeder
{
    // Deterministic numeric IDs and constants
    const TENANT_ID = 999998;
    const ISO_TENANT_ID = 999999;

    const USER_OWNER = 10001;
    const WH_MAIN = 'ga-wh-main-000000000000000000000001';
    const WH_SEC = 'ga-wh-sec-0000000000000000000000002';

    private AccountingService $accounting;
    private SaleService $saleService;
    private PurchaseService $purchaseService;
    private FifoService $fifo;
    private PaymentService $payments;
    private InventoryService $inventory;

    public function run(): void
    {
        // 1. Guard test database
        $db = config('database.connections.' . config('database.default') . '.database');
        if (!str_contains(strtolower($db ?? ''), 'test')) {
            throw new \RuntimeException("GoldenAuditSeeder: Only allowed on test database.");
        }

        // 2. Clear old data
        $this->teardown();

        // 3. Initialize Determinism
        srand(12345); // Seed the PHP random number generator
        Carbon::setTestNow('2025-01-01 00:00:00');

        DB::transaction(function () {
            $now = Carbon::now()->toDateTimeString();

            // Create Tenants
            $tenant = Tenant::create([
                'id' => self::TENANT_ID,
                'name' => 'Golden Audit Store',
                'slug' => 'golden-audit',
                'plan' => 'business',
                'status' => 'active',
                'currency_code' => 'PKR',
                'currency_symbol' => 'Rs.',
                'timezone' => 'Asia/Karachi',
                'setup_completed' => true,
                'is_golden_master' => true,
                'onboarding_completed' => true,
            ]);

            $isoTenant = Tenant::create([
                'id' => self::ISO_TENANT_ID,
                'name' => 'Isolation Audit Store',
                'slug' => 'isolation-audit',
                'plan' => 'starter',
                'status' => 'active',
                'currency_code' => 'PKR',
                'currency_symbol' => 'Rs.',
                'timezone' => 'Asia/Karachi',
                'setup_completed' => true,
            ]);

            // Bind Tenant
            app()->instance('current.tenant', $tenant);

            // Create Owner User
            DB::table('users')->insertOrIgnore([
                'id' => self::USER_OWNER,
                'name' => 'Golden Owner',
                'email' => 'owner@golden-audit.test',
                'password' => Hash::make('golden-audit-secret'),
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('tenant_users')->insertOrIgnore([
                'user_id' => self::USER_OWNER,
                'tenant_id' => self::TENANT_ID,
                'role' => 'owner',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Seed default chart of accounts and warehouses
            TenantDefaultSeeder::seedFor($tenant);
            TenantDefaultSeeder::seedFor($isoTenant);

            // Re-bind main tenant
            app()->instance('current.tenant', $tenant);

            // Create Warehouses
            DB::table('warehouses')->insertOrIgnore([
                ['id' => self::WH_MAIN, 'tenant_id' => self::TENANT_ID, 'name' => 'Main Warehouse', 'location' => 'Karachi Central', 'is_default' => true, 'created_at' => $now, 'updated_at' => $now],
                ['id' => self::WH_SEC, 'tenant_id' => self::TENANT_ID, 'name' => 'Secondary Warehouse', 'location' => 'Karachi East', 'is_default' => false, 'created_at' => $now, 'updated_at' => $now],
            ]);

            // Instantiate Services
            $this->accounting = app(AccountingService::class);
            $this->saleService = app(SaleService::class);
            $this->purchaseService = app(PurchaseService::class);
            $this->fifo = app(FifoService::class);
            $this->payments = app(PaymentService::class);
            $this->inventory = app(InventoryService::class);

            // Seed Products
            $products = $this->createProducts();

            // Seed Parties
            $parties = $this->createParties();

            // Seed Bank Accounts
            $bankAccounts = $this->createBankAccounts();

            // Initial cash / bank opening balances via Ledger
            $this->postOpeningBalances($bankAccounts);

            // Chronological monthly loops (Jan 2025 to Jul 2026)
            $start = Carbon::parse('2025-01-01 09:00:00');
            $end = Carbon::parse('2026-07-10 17:00:00');

            $current = $start->copy();
            while ($current->lte($end)) {
                Carbon::setTestNow($current);
                $this->seedMonthlyTransactions($current, $products, $parties, $bankAccounts);
                $current->addDay();
            }

            // Seed mock records to resolve missing parameter 404s in audit scans
            Carbon::setTestNow(Carbon::parse('2025-01-01 09:00:00'));
            $nowStr = now()->toDateTimeString();
            $customerId = array_values(array_filter($parties, fn($p) => $p['type'] === 'customer'))[0]['id'] ?? '1';
            $supplierId = array_values(array_filter($parties, fn($p) => $p['type'] === 'supplier'))[0]['id'] ?? '1';
            $productId = $products[0]['id'];



            // Seed one opening balance for account 7000 to test the Opening Balance Status page
            $this->accounting->createEntry([
                'date' => '2025-01-01',
                'reference_type' => 'opening_balance',
                'reference' => '1000',
                'description' => 'Opening balance setup',
                'created_by' => self::USER_OWNER,
            ], [
                ['account_code' => '1000', 'debit' => 10000.00, 'credit' => 0],
                ['account_code' => '7000', 'debit' => 0, 'credit' => 10000.00],
            ]);

            DB::table('parked_sales')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => self::TENANT_ID,
                'cart_data' => json_encode([['product_id' => $productId, 'quantity' => 1, 'price' => 100]]),
                'user_id' => self::USER_OWNER,
                'customer_name' => 'Walk-In Customer',
                'expires_at' => '2035-01-01 09:00:00',
                'created_at' => $nowStr,
                'updated_at' => $nowStr
            ]);

            DB::table('stock_transfers')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => self::TENANT_ID,
                'reference_number' => 'ST-202501-001',
                'from_warehouse_id' => self::WH_MAIN,
                'to_warehouse_id' => self::WH_SEC,
                'transfer_date' => '2025-01-15',
                'status' => 'completed',
                'notes' => 'Internal transfer',
                'created_by' => self::USER_OWNER,
                'created_at' => $nowStr,
                'updated_at' => $nowStr
            ]);

            DB::table('stock_takes')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => self::TENANT_ID,
                'reference_number' => 'STK-202501-001',
                'warehouse_id' => self::WH_MAIN,
                'date' => '2025-01-20',
                'status' => 'completed',
                'notes' => 'Monthly count',
                'created_by' => self::USER_OWNER,
                'created_at' => $nowStr,
                'updated_at' => $nowStr
            ]);

            $poId = (string) \Illuminate\Support\Str::uuid();
            DB::table('purchase_orders')->insert([
                'id' => $poId,
                'tenant_id' => self::TENANT_ID,
                'supplier_id' => $supplierId,
                'warehouse_id' => self::WH_MAIN,
                'reference_number' => 'PO-202501-001',
                'status' => 'pending',
                'order_date' => '2025-01-10',
                'total_amount' => 5000.00,
                'user_id' => self::USER_OWNER,
                'created_at' => $nowStr,
                'updated_at' => $nowStr
            ]);

            DB::table('debit_notes')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => self::TENANT_ID,
                'reference_number' => 'DN-202501-001',
                'supplier_id' => $supplierId,
                'purchase_id' => $poId,
                'date' => '2025-01-22',
                'amount' => 500.00,
                'reason' => 'Damaged goods',
                'status' => 'posted',
                'created_by' => self::USER_OWNER,
                'created_at' => $nowStr,
                'updated_at' => $nowStr
            ]);

            DB::table('batches')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => self::TENANT_ID,
                'product_id' => $productId,
                'batch_number' => 'B01',
                'expiry_date' => now()->addYear()->toDateString(),
                'mfg_date' => now()->subMonth()->toDateString(),
                'mrp' => $products[0]['price'],
                'quantity' => 100,
                'created_at' => $nowStr,
                'updated_at' => $nowStr
            ]);

            DB::table('product_serials')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => self::TENANT_ID,
                'product_id' => $productId,
                'serial_number' => 'SR-000001',
                'status' => 'available',
                'warehouse_id' => self::WH_MAIN,
                'notes' => 'Initial stock',
                'created_at' => $nowStr,
                'updated_at' => $nowStr
            ]);

            DB::table('recurring_invoices')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => self::TENANT_ID,
                'customer_id' => $customerId,
                'warehouse_id' => self::WH_MAIN,
                'frequency' => 'monthly',
                'items' => json_encode([['product_id' => $productId, 'quantity' => 1, 'price' => 100]]),
                'next_run_date' => now()->addMonth()->toDateString(),
                'status' => 'active',
                'created_at' => $nowStr,
                'updated_at' => $nowStr
            ]);

            DB::table('recipes')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => self::TENANT_ID,
                'name' => 'Cream Formula A',
                'description' => 'Standard mixing recipe',
                'product_id' => $productId,
                'yield_quantity' => 1.00,
                'yield_unit' => 'pcs',
                'labor_cost' => 10.00,
                'overhead_cost' => 5.00,
                'estimated_cost' => 15.00,
                'is_active' => true,
                'created_at' => $nowStr,
                'updated_at' => $nowStr
            ]);

            $soId = (string) \Illuminate\Support\Str::uuid();
            DB::table('sales_orders')->insert([
                'id' => $soId,
                'tenant_id' => self::TENANT_ID,
                'customer_id' => $customerId,
                'order_number' => 'SO-202501-001',
                'order_date' => now()->toDateString(),
                'status' => 'pending',
                'total_amount' => 1000.00,
                'user_id' => self::USER_OWNER,
                'created_at' => $nowStr,
                'updated_at' => $nowStr
            ]);

            // Seed sales_order_items so store.reports.sale-order-items shows non-zero subtotals
            DB::table('sales_order_items')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => self::TENANT_ID,
                'sales_order_id' => $soId,
                'product_id' => $productId,
                'name' => 'Basmati Rice 5kg',
                'quantity_requested' => 5,
                'qty' => 5,
                'unit_price' => 850.00,
                'subtotal' => 4250.00,
                'line_total' => 4250.00,
                'created_at' => $nowStr,
                'updated_at' => $nowStr,
            ]);

            // Seed owner_pulse_setup_status as 'disabled' so the PIN gate is bypassed in audit
            DB::table('settings')->insertOrIgnore([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'key' => 'owner_pulse_setup_status_' . self::TENANT_ID,
                'value' => 'disabled',
                'tenant_id' => self::TENANT_ID,
                'created_at' => $nowStr,
                'updated_at' => $nowStr,
            ]);

            DB::table('proposals')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => self::TENANT_ID,
                'customer_id' => $customerId,
                'reference_number' => 'PROP-202501-001',
                'status' => 'sent',
                'total_amount' => 5000.00,
                'user_id' => self::USER_OWNER,
                'created_at' => $nowStr,
                'updated_at' => $nowStr
            ]);

            DB::table('staff_attendances')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => self::TENANT_ID,
                'user_id' => self::USER_OWNER,
                'check_in' => now()->subHours(8)->toDateTimeString(),
                'last_active_at' => now()->toDateTimeString(),
                'status' => 'present',
                'created_at' => $nowStr,
                'updated_at' => $nowStr
            ]);

            // Seed one returned sale
            $origSale = DB::table('sales')->where('tenant_id', self::TENANT_ID)->first();
            if ($origSale) {
                $retSaleId = 'RET-' . substr($origSale->id, 4);
                DB::table('sales')->insert([
                    'id' => $retSaleId,
                    'tenant_id' => self::TENANT_ID,
                    'party_id' => $origSale->party_id,
                    'warehouse_id' => $origSale->warehouse_id,
                    'user_id' => $origSale->user_id,
                    'reference_number' => $retSaleId,
                    'subtotal' => $origSale->subtotal,
                    'net_sales' => $origSale->net_sales,
                    'total_tax' => $origSale->total_tax,
                    'invoice_total' => $origSale->invoice_total,
                    'payment_method' => $origSale->payment_method,
                    'payment_status' => $origSale->payment_status,
                    'status' => 'returned',
                    'posted_at' => $origSale->posted_at,
                    'created_at' => $nowStr,
                    'updated_at' => $nowStr,
                ]);
            }
        });

        Carbon::setTestNow(null);
    }

    private function createProducts(): array
    {
        $now = now()->toDateTimeString();

        // Seed Categories
        $categories = [
            ['id' => 'cat-groceries', 'tenant_id' => self::TENANT_ID, 'name' => 'Groceries', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'cat-stationery', 'tenant_id' => self::TENANT_ID, 'name' => 'Stationery', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'cat-jewelry', 'tenant_id' => self::TENANT_ID, 'name' => 'Jewelry', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 'cat-electronics', 'tenant_id' => self::TENANT_ID, 'name' => 'Electronics', 'created_at' => $now, 'updated_at' => $now],
        ];
        DB::table('categories')->insertOrIgnore($categories);

        $productsData = [
            ['id' => 'p-rice-5kg-00000000000000000000001', 'name' => 'Basmati Rice 5kg', 'sku' => 'RICE-5KG', 'price' => 850.4532, 'cost_price' => 620.1250, 'base_unit' => 'pcs', 'category_id' => 'cat-groceries'],
            ['id' => 'p-oil-5l-0000000000000000000000002', 'name' => 'Cooking Oil 5L', 'sku' => 'OIL-5L', 'price' => 2100.8520, 'cost_price' => 1650.4000, 'base_unit' => 'pcs', 'category_id' => 'cat-groceries'],
            ['id' => 'p-sugar-10kg-0000000000000000000003', 'name' => 'Sugar 10kg', 'sku' => 'SUG-10KG', 'price' => 1200.2500, 'cost_price' => 980.5000, 'base_unit' => 'pcs', 'category_id' => 'cat-groceries'],
            ['id' => 'p-flour-10kg-000000000000000000004', 'name' => 'Wheat Flour 10kg', 'sku' => 'FLR-10KG', 'price' => 780.9999, 'cost_price' => 590.2500, 'base_unit' => 'pcs', 'category_id' => 'cat-groceries'],
            ['id' => 'p-tea-950g-0000000000000000000005', 'name' => 'Tea 950g', 'sku' => 'TEA-950G', 'price' => 1650.5000, 'cost_price' => 1200.7500, 'base_unit' => 'pcs', 'category_id' => 'cat-groceries'],
            ['id' => 'p-milk-1l-000000000000000000000006', 'name' => 'Milk Carton 1L', 'sku' => 'MLK-1L', 'price' => 280.1500, 'cost_price' => 210.0500, 'base_unit' => 'pcs', 'category_id' => 'cat-groceries'],
            ['id' => 'p-deter-1kg-000000000000000000007', 'name' => 'Detergent 1kg', 'sku' => 'DET-1KG', 'price' => 550.0000, 'cost_price' => 380.0000, 'base_unit' => 'pcs', 'category_id' => 'cat-groceries'],
            ['id' => 'p-soap-pk-00000000000000000000008', 'name' => 'Soap Bar Pack', 'sku' => 'SOP-PK', 'price' => 320.4500, 'cost_price' => 220.3000, 'base_unit' => 'pcs', 'category_id' => 'cat-groceries'],
            ['id' => 'p-note-a4-000000000000000000000009', 'name' => 'Notebook A4', 'sku' => 'NTB-A4', 'price' => 150.0000, 'cost_price' => 90.0000, 'base_unit' => 'pcs', 'category_id' => 'cat-stationery'],
            ['id' => 'p-pen-10-00000000000000000000000010', 'name' => 'Pen Pack 10s', 'sku' => 'PEN-10', 'price' => 250.0000, 'cost_price' => 140.0000, 'base_unit' => 'pcs', 'category_id' => 'cat-stationery'],
            ['id' => 'p-gold-22k-00000000000000000000011', 'name' => 'Gold Ring 22k', 'sku' => 'GLD-22K', 'price' => 85000.7500, 'cost_price' => 72000.5000, 'base_unit' => 'pcs', 'category_id' => 'cat-jewelry'],
            ['id' => 'p-silver-br-0000000000000000000012', 'name' => 'Silver Bracelet', 'sku' => 'SLV-BR', 'price' => 12500.5000, 'cost_price' => 9800.2500, 'base_unit' => 'pcs', 'category_id' => 'cat-jewelry'],
            ['id' => 'p-laptop-std-000000000000000000013', 'name' => 'Laptop Stand', 'sku' => 'LPT-STD', 'price' => 4500.0000, 'cost_price' => 3200.0000, 'base_unit' => 'pcs', 'category_id' => 'cat-electronics'],
            ['id' => 'p-usb-c-00000000000000000000000014', 'name' => 'USB Cable', 'sku' => 'USB-C', 'price' => 650.0000, 'cost_price' => 350.0000, 'base_unit' => 'pcs', 'category_id' => 'cat-electronics'],
            ['id' => 'p-cream-50ml-000000000000000000015', 'name' => 'Face Cream 50ml', 'sku' => 'CRM-50', 'price' => 890.3500, 'cost_price' => 520.1500, 'base_unit' => 'pcs', 'category_id' => 'cat-groceries'],
        ];

        foreach ($productsData as &$p) {
            $p['tenant_id'] = self::TENANT_ID;
            $p['tax_rate'] = 17.00;
            $p['created_at'] = $now;
            $p['updated_at'] = $now;
            DB::table('products')->insert($p);

            // Seed stocks row
            DB::table('stocks')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => self::TENANT_ID,
                'product_id' => $p['id'],
                'warehouse_id' => self::WH_MAIN,
                'quantity' => 100.00,
                'created_at' => $now,
                'updated_at' => $now
            ]);
        }

        return $productsData;
    }

    private function createParties(): array
    {
        $now = now()->toDateTimeString();
        $partiesData = [
            // Customers
            ['id' => 'c-sara-00000000000000000000000001', 'name' => 'Sara Enterprise', 'type' => 'customer', 'credit_limit' => 2000000.00],
            ['id' => 'c-kashif-000000000000000000000002', 'name' => 'Kashif General Store', 'type' => 'customer', 'credit_limit' => 500000.00],
            ['id' => 'c-fatima-000000000000000000000003', 'name' => 'Fatima Boutique', 'type' => 'customer', 'credit_limit' => 100000.00],
            ['id' => 'c-ali-00000000000000000000000004', 'name' => 'Ali Hardware', 'type' => 'customer', 'credit_limit' => 300000.00],
            ['id' => 'c-walkin-000000000000000000000005', 'name' => 'Walk-In Customer', 'type' => 'customer', 'credit_limit' => null],
            ['id' => 'c-hamza-000000000000000000000006', 'name' => 'Hamza Trading', 'type' => 'customer', 'credit_limit' => 50000.00],
            ['id' => 'c-noor-00000000000000000000000007', 'name' => 'Noor Cosmetics', 'type' => 'customer', 'credit_limit' => 150000.00],
            ['id' => 'c-bilal-000000000000000000000008', 'name' => 'Bilal Electronics', 'type' => 'customer', 'credit_limit' => 100000.00],

            // Suppliers
            ['id' => 's-mills-0000000000000000000000001', 'name' => 'Pakistan Rice Mills', 'type' => 'supplier', 'credit_limit' => null],
            ['id' => 's-national-000000000000000000002', 'name' => 'National Foods Ltd', 'type' => 'supplier', 'credit_limit' => null],
            ['id' => 's-karachi-000000000000000000003', 'name' => 'Karachi Wholesale', 'type' => 'supplier', 'credit_limit' => null],
            ['id' => 's-punjab-0000000000000000000004', 'name' => 'Punjab Oil Corp', 'type' => 'supplier', 'credit_limit' => null],
            ['id' => 's-refinery-00000000000000000005', 'name' => 'Gold Refinery Intl', 'type' => 'supplier', 'credit_limit' => null],
            ['id' => 's-imports-000000000000000000006', 'name' => 'Tech Imports Co', 'type' => 'supplier', 'credit_limit' => null],
        ];

        foreach ($partiesData as &$party) {
            $party['tenant_id'] = self::TENANT_ID;
            $party['created_at'] = $now;
            $party['updated_at'] = $now;
            DB::table('parties')->insert($party);

            if ($party['type'] === 'customer') {
                DB::table('customers')->insertOrIgnore([
                    'id' => $party['id'],
                    'tenant_id' => self::TENANT_ID,
                    'party_id' => $party['id'],
                    'name' => $party['name'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            } else {
                DB::table('suppliers')->insertOrIgnore([
                    'id' => $party['id'],
                    'tenant_id' => self::TENANT_ID,
                    'party_id' => $party['id'],
                    'name' => $party['name'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        return $partiesData;
    }

    private function createBankAccounts(): array
    {
        $now = now()->toDateTimeString();
        $bankAccounts = [
            ['id' => 'ba-cash-00000000000000000000000001', 'name' => 'Main Cash Register', 'type' => 'cash', 'account_type' => 'cash', 'opening_balance' => 500000.0000, 'current_balance' => 500000.0000],
            ['id' => 'ba-hbl-00000000000000000000000002', 'name' => 'HBL Business Account', 'type' => 'bank', 'account_type' => 'current', 'opening_balance' => 1500000.0000, 'current_balance' => 1500000.0000],
            ['id' => 'ba-meezan-000000000000000000000003', 'name' => 'Meezan Islamic Account', 'type' => 'bank', 'account_type' => 'savings', 'opening_balance' => 2000000.0000, 'current_balance' => 2000000.0000],
        ];

        foreach ($bankAccounts as &$ba) {
            $ba['tenant_id'] = self::TENANT_ID;
            $ba['created_at'] = $now;
            $ba['updated_at'] = $now;
            DB::table('bank_accounts')->insert($ba);
        }

        return $bankAccounts;
    }

    private function postOpeningBalances(array $bankAccounts): void
    {
        foreach ($bankAccounts as $ba) {
            $this->accounting->createEntry([
                'date' => '2025-01-01',
                'reference_type' => 'opening_balance_migration',
                'reference' => 'OB-' . strtoupper($ba['type']) . '-' . substr($ba['id'], -4),
                'description' => 'Opening Balance for ' . $ba['name'],
                'created_by' => self::USER_OWNER,
            ], [
                ['account_code' => $ba['type'] === 'cash' ? '1000' : '1010', 'debit' => $ba['opening_balance'], 'credit' => 0],
                ['account_code' => '3000', 'debit' => 0, 'credit' => $ba['opening_balance']],
            ]);
        }
    }

    private function seedMonthlyTransactions(Carbon $date, array $products, array $parties, array $bankAccounts): void
    {
        $day = $date->day;

        // Deterministic transaction trigger patterns based on day of the month
        // 1st of month: Purchase stock from suppliers
        if ($day === 1) {
            $this->seedPurchases($date, $products, $parties);
        }

        // Daily: Sales
        if ($day % 2 === 0) {
            $this->seedSales($date, $products, $parties);
        }

        // 15th of month: Pay some suppliers & receive customer payments
        if ($day === 15) {
            $this->seedPayments($date, $parties);
        }

        // 28th of month: Operating expenses
        if ($day === 28) {
            $this->seedExpenses($date);
        }
    }

    private function seedPurchases(Carbon $date, array $products, array $parties): void
    {
        $suppliers = array_filter($parties, fn($p) => $p['type'] === 'supplier');
        $supplier = $suppliers[array_rand($suppliers)];

        $items = [];
        $subtotal = 0;
        $tax = 0;

        // Choose 2-4 products to purchase
        $selectedKeys = (array) array_rand($products, rand(2, 4));
        foreach ($selectedKeys as $key) {
            $prod = $products[$key];
            $qty = rand(20, 50);
            $cost = round($prod['cost_price'] * (1 - (rand(0, 5) / 100)), 2);
            $lineTotal = round($qty * $cost, 2);
            $lineTax = round($lineTotal * 0.17, 2);

            $items[] = [
                'product_id' => $prod['id'],
                'qty' => $qty,
                'unit_cost' => $cost,
                'tax_rate' => 17.00,
                'line_total' => $lineTotal,
            ];

            $subtotal += $lineTotal;
            $tax += $lineTax;
        }

        $subtotal = round($subtotal, 2);
        $tax = round($tax, 2);
        $total = round($subtotal + $tax, 2);
        $purId = 'PUR-' . $date->format('Ym') . '-' . rand(100, 999);

        // DR 1100 (Inventory Asset), DR 2300 (Input Tax Recoverable), CR 2000 (Accounts Payable)
        $entry = $this->accounting->createEntry([
            'date' => $date->toDateString(),
            'reference_type' => 'purchase',
            'reference' => $purId,
            'description' => 'Monthly purchase from ' . $supplier['name'],
            'party_id' => $supplier['id'],
            'created_by' => self::USER_OWNER,
        ], [
            ['account_code' => '1100', 'debit' => $subtotal, 'credit' => 0],
            ['account_code' => '2300', 'debit' => $tax, 'credit' => 0],
            ['account_code' => '2000', 'debit' => 0, 'credit' => $total, 'party_id' => $supplier['id']],
        ]);

        // Insert into purchases/purchase_items and create FIFO batches
        DB::table('purchases')->insert([
            'id' => $purId,
            'tenant_id' => self::TENANT_ID,
            'party_id' => $supplier['id'],
            'warehouse_id' => self::WH_MAIN,
            'purchase_date' => $date->toDateString(),
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
            'payment_method' => 'credit',
            'payment_status' => 'unpaid',
            'journal_entry_id' => $entry->id,
            'created_at' => $date->toDateTimeString(),
            'updated_at' => $date->toDateTimeString(),
        ]);

        DB::table('invoices')->insert([
            'id' => $purId,
            'tenant_id' => self::TENANT_ID,
            'invoice_number' => $purId,
            'date' => $date->toDateString(),
            'party_id' => $supplier['id'],
            'type' => 'purchase',
            'status' => 'unpaid',
            'subtotal' => $subtotal,
            'discount_amount' => 0,
            'tax_amount' => $tax,
            'total_amount' => $total,
            'paid_amount' => 0,
            'user_id' => self::USER_OWNER,
            'created_at' => $date->toDateTimeString(),
            'updated_at' => $date->toDateTimeString()
        ]);

        foreach ($items as $item) {
            $piId = (string) Str::uuid();
            DB::table('purchase_items')->insert([
                'id' => $piId,
                'tenant_id' => self::TENANT_ID,
                'purchase_id' => $purId,
                'product_id' => $item['product_id'],
                'qty' => $item['qty'],
                'unit_cost' => $item['unit_cost'],
                'tax_rate' => $item['tax_rate'],
                'line_total' => $item['line_total'],
                'business_pct' => 100.00,
                'created_at' => $date->toDateTimeString(),
            ]);

            // FIFO Batch
            DB::table('inventory_batches')->insert([
                'id' => 'b-' . substr($piId, -12),
                'tenant_id' => self::TENANT_ID,
                'product_id' => $item['product_id'],
                'warehouse_id' => self::WH_MAIN,
                'purchase_invoice_id' => $purId,
                'batch_type' => 'purchase',
                'original_qty' => $item['qty'],
                'initial_qty' => $item['qty'],
                'remaining_qty' => $item['qty'],
                'unit_cost' => $item['unit_cost'],
                'created_at' => $date->toDateTimeString(),
                'updated_at' => $date->toDateTimeString(),
            ]);
        }
    }

    private function seedSales(Carbon $date, array $products, array $parties): void
    {
        $customers = array_filter($parties, fn($p) => $p['type'] === 'customer');
        $customer = $customers[array_rand($customers)];

        $items = [];
        $subtotal = 0;
        $tax = 0;
        $cogs = 0;
        $totalDiscount = 0;

        // Choose 1-3 products
        $selectedKeys = (array) array_rand($products, rand(1, 3));
        foreach ($selectedKeys as $key) {
            $prod = $products[$key];
            $qty = rand(1, 5);
            $price = $prod['price'];
            $disc = rand(0, 10); // discount percent
            $gross = $qty * $price;
            $discAmt = round($gross * ($disc / 100), 2);
            $net = round($gross - $discAmt, 2);
            $lineTax = round($net * 0.17, 2);

            // Simple average inventory/cogs deduction
            $lineCogs = round($qty * $prod['cost_price'], 2);
            $totalDiscount += $discAmt;

            $items[] = [
                'product_id' => $prod['id'],
                'qty' => $qty,
                'unit_price' => $price,
                'discount_amount' => $discAmt,
                'net_amount' => $net,
                'tax_rate' => 17.00,
                'tax_amount' => $lineTax,
                'line_total' => round($net + $lineTax, 2),
                'cogs' => $lineCogs,
            ];

            $subtotal += $net;
            $tax += $lineTax;
            $cogs += $lineCogs;
        }

        $subtotal = round($subtotal, 2);
        $tax = round($tax, 2);
        $total = round($subtotal + $tax, 2);
        $cogs = round($cogs, 2);
        $totalDiscount = round($totalDiscount, 2);

        $saleId = 'SAL-' . $date->format('Ym') . '-' . rand(1000, 9999);
        $method = rand(0, 1) ? 'cash' : 'credit';

        // Journal Entry
        // DR Cash (1000) or AR (1200), CR Revenue (4000), CR Tax (2100)
        // DR COGS (5000), CR Inventory (1100)
        $lines = [
            ['account_code' => '4000', 'debit' => 0, 'credit' => $subtotal],
            ['account_code' => '2100', 'debit' => 0, 'credit' => $tax],
            ['account_code' => '5000', 'debit' => $cogs, 'credit' => 0],
            ['account_code' => '1100', 'debit' => 0, 'credit' => $cogs],
        ];

        if ($method === 'cash') {
            $lines[] = ['account_code' => '1000', 'debit' => $total, 'credit' => 0];
        } else {
            $lines[] = ['account_code' => '1200', 'debit' => $total, 'credit' => 0, 'party_id' => $customer['id']];
        }

        $this->accounting->createEntry([
            'date' => $date->toDateString(),
            'reference_type' => 'sale',
            'reference' => $saleId,
            'description' => 'Store sale to ' . $customer['name'],
            'party_id' => $customer['id'],
            'created_by' => self::USER_OWNER,
        ], $lines);

        DB::table('sales')->insert([
            'id' => $saleId,
            'tenant_id' => self::TENANT_ID,
            'party_id' => $customer['id'],
            'warehouse_id' => self::WH_MAIN,
            'user_id' => self::USER_OWNER,
            'reference_number' => $saleId,
            'subtotal' => $subtotal + $tax,
            'total_item_discounts' => $totalDiscount,
            'net_sales' => $subtotal,
            'total_tax' => $tax,
            'invoice_total' => $total,
            'payment_method' => $method,
            'payment_status' => $method === 'cash' ? 'paid' : 'unpaid',
            'status' => 'posted',
            'posted_at' => $date->toDateTimeString(),
            'created_at' => $date->toDateTimeString(),
            'updated_at' => $date->toDateTimeString(),
        ]);

        DB::table('invoices')->insert([
            'id' => $saleId,
            'tenant_id' => self::TENANT_ID,
            'invoice_number' => $saleId,
            'date' => $date->toDateString(),
            'party_id' => $customer['id'],
            'type' => 'sale',
            'status' => $method === 'cash' ? 'paid' : 'unpaid',
            'subtotal' => $subtotal,
            'discount_amount' => 0,
            'tax_amount' => $tax,
            'total_amount' => $total,
            'paid_amount' => $method === 'cash' ? $total : 0,
            'user_id' => self::USER_OWNER,
            'created_at' => $date->toDateTimeString(),
            'updated_at' => $date->toDateTimeString()
        ]);

        foreach ($items as $item) {
            $siId = (string) Str::uuid();
            DB::table('sale_items')->insert([
                'id' => $siId,
                'tenant_id' => self::TENANT_ID,
                'sale_id' => $saleId,
                'product_id' => $item['product_id'],
                'quantity' => $item['qty'],
                'unit_price' => $item['unit_price'],
                'discount_amount' => $item['discount_amount'],
                'net_amount' => $item['net_amount'],
                'tax_rate' => $item['tax_rate'],
                'tax_amount' => $item['tax_amount'],
                'line_total' => $item['line_total'],
                'created_at' => $date->toDateTimeString(),
            ]);

            // Seed sale_item_batches for COGS report verification
            $batchId = DB::table('inventory_batches')
                ->where('tenant_id', self::TENANT_ID)
                ->where('product_id', $item['product_id'])
                ->value('id');

            if ($batchId) {
                DB::table('sale_item_batches')->insert([
                    'id' => (string) Str::uuid(),
                    'tenant_id' => self::TENANT_ID,
                    'sale_item_id' => $siId,
                    'inventory_batch_id' => $batchId,
                    'qty_deducted' => $item['qty'],
                    'unit_cost' => $item['unit_price'] * 0.75, // approximate cost price
                    'total_cogs' => $item['qty'] * ($item['unit_price'] * 0.75),
                    'is_reversed' => 0,
                    'created_at' => $date->toDateTimeString(),
                    'updated_at' => $date->toDateTimeString(),
                ]);
            }
        }
    }

    private function seedPayments(Carbon $date, array $parties): void
    {
        // Pick a customer with hypothetical AR and process payment
        $customers = array_filter($parties, fn($p) => $p['type'] === 'customer');
        $customer = $customers[array_rand($customers)];

        $recvAmt = round(rand(5000, 25000) + (rand(0, 99) / 100), 2);
        
        $refIn = 'PAY-RCV-' . $date->format('Ym') . '-' . rand(10, 99);
        DB::table('payments')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'tenant_id' => self::TENANT_ID,
            'party_id' => $customer['id'],
            'amount' => $recvAmt,
            'date' => $date->toDateString(),
            'type' => 'in',
            'method' => 'cash',
            'reference' => $refIn,
            'created_at' => $date->toDateTimeString(),
            'updated_at' => $date->toDateTimeString()
        ]);

        // DR Cash (1000), CR AR (1200)
        $this->accounting->createEntry([
            'date' => $date->toDateString(),
            'reference_type' => 'customer_payment',
            'reference' => $refIn,
            'description' => 'Received payment from ' . $customer['name'],
            'party_id' => $customer['id'],
            'created_by' => self::USER_OWNER,
        ], [
            ['account_code' => '1000', 'debit' => $recvAmt, 'credit' => 0],
            ['account_code' => '1200', 'debit' => 0, 'credit' => $recvAmt, 'party_id' => $customer['id']],
        ]);

        // Pick a supplier and pay them
        $suppliers = array_filter($parties, fn($p) => $p['type'] === 'supplier');
        $supplier = $suppliers[array_rand($suppliers)];

        $payAmt = round(rand(10000, 45000) + (rand(0, 99) / 100), 2);
        
        $refOut = 'PAY-OUT-' . $date->format('Ym') . '-' . rand(10, 99);
        DB::table('payments')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'tenant_id' => self::TENANT_ID,
            'party_id' => $supplier['id'],
            'amount' => $payAmt,
            'date' => $date->toDateString(),
            'type' => 'out',
            'method' => 'bank_transfer',
            'reference' => $refOut,
            'created_at' => $date->toDateTimeString(),
            'updated_at' => $date->toDateTimeString()
        ]);

        // DR AP (2000), CR Bank (1010)
        $this->accounting->createEntry([
            'date' => $date->toDateString(),
            'reference_type' => 'supplier_payment',
            'reference' => $refOut,
            'description' => 'Supplier payment to ' . $supplier['name'],
            'party_id' => $supplier['id'],
            'created_by' => self::USER_OWNER,
        ], [
            ['account_code' => '2000', 'debit' => $payAmt, 'credit' => 0, 'party_id' => $supplier['id']],
            ['account_code' => '1010', 'debit' => 0, 'credit' => $payAmt],
        ]);
    }

    private function seedExpenses(Carbon $date): void
    {
        // Regular monthly operating opex (utilities / rent / salaries)
        $rent = 60000.00;
        $utils = round(12000.00 + (rand(0, 5000) / 100), 2);
        
        // Insert physical expense records for reports
        $expId1 = (string) \Illuminate\Support\Str::uuid();
        $expId2 = (string) \Illuminate\Support\Str::uuid();
        DB::table('expenses')->insert([
            ['id' => $expId1, 'tenant_id' => self::TENANT_ID, 'date' => $date->toDateString(), 'category' => 'Rent', 'amount' => $rent, 'reference' => 'EXP-RNT-' . $date->format('Ym'), 'description' => 'Office rent', 'created_at' => $date->toDateTimeString(), 'updated_at' => $date->toDateTimeString()],
            ['id' => $expId2, 'tenant_id' => self::TENANT_ID, 'date' => $date->toDateString(), 'category' => 'Utilities', 'amount' => $utils, 'reference' => 'EXP-UTL-' . $date->format('Ym'), 'description' => 'Utility bills', 'created_at' => $date->toDateTimeString(), 'updated_at' => $date->toDateTimeString()]
        ]);

        // Rent: DR 5200, CR 1010
        $this->accounting->createEntry([
            'date' => $date->toDateString(),
            'reference_type' => 'operating_expense',
            'reference' => 'EXP-RNT-' . $date->format('Ym'),
            'description' => 'Office rent',
            'created_by' => self::USER_OWNER,
        ], [
            ['account_code' => '5200', 'debit' => $rent, 'credit' => 0],
            ['account_code' => '1010', 'debit' => 0, 'credit' => $rent],
        ]);

        // Utilities: DR 5300, CR 1000
        $this->accounting->createEntry([
            'date' => $date->toDateString(),
            'reference_type' => 'operating_expense',
            'reference' => 'EXP-UTL-' . $date->format('Ym'),
            'description' => 'Electricity and water bills',
            'created_by' => self::USER_OWNER,
        ], [
            ['account_code' => '5300', 'debit' => $utils, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0, 'credit' => $utils],
        ]);
    }

    private function teardown(): void
    {
        $tenantIds = [self::TENANT_ID, self::ISO_TENANT_ID];
        $tables = [
            'sale_items', 'sales',
            'journal_items', 'journal_entries', 'inventory_batches', 'purchases',
            'purchase_items', 'party_snapshots', 'parties', 'products', 'warehouses',
            'bank_accounts', 'accounts', 'parked_sales', 'stock_transfers',
            'stock_takes', 'debit_notes', 'batches', 'product_serials',
            'recurring_invoices', 'recipes', 'staff_attendances', 'purchase_orders',
            'suppliers', 'customers', 'invoices',
            'sales_orders', 'proposals', 'expenses', 'payments',
            'daily_snapshots', 'settings', 'stocks',
        ];

        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        if (DB::getSchemaBuilder()->hasTable('sale_item_batches')) {
            DB::table('sale_item_batches')->whereIn('tenant_id', $tenantIds)->delete();
        }
        if (DB::getSchemaBuilder()->hasTable('payment_allocations')) {
            DB::table('payment_allocations')->whereIn('tenant_id', $tenantIds)->delete();
        }
        if (DB::getSchemaBuilder()->hasTable('sales_order_items')) {
            DB::table('sales_order_items')->whereIn('tenant_id', $tenantIds)->delete();
        }
        if (DB::getSchemaBuilder()->hasTable('categories')) {
            DB::table('categories')->whereIn('tenant_id', $tenantIds)->delete();
        }

        foreach ($tables as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                DB::table($table)->whereIn('tenant_id', $tenantIds)->delete();
            }
        }
        if (DB::getSchemaBuilder()->hasTable('tenant_users')) {
            DB::table('tenant_users')->whereIn('tenant_id', $tenantIds)->delete();
        }
        DB::table('tenants')->whereIn('id', $tenantIds)->delete();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }
}
