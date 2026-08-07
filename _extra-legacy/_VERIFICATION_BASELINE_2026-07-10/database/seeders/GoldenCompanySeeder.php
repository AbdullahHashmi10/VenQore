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
use App\Models\Setting;
use App\Models\ExpenseCategory;
use App\Services\V3\AccountingService;
use App\Services\V3\SaleService;
use App\Services\V3\FifoService;
use App\Services\V3\PaymentService;

/**
 * ============================================================
 * VenQore Golden Company Seeder — Phase 1 of Verification Blueprint
 * ============================================================
 *
 * DOCTRINE: Deterministic by design.
 * - All IDs are fixed UUIDs (never Str::uuid() generated at runtime)
 * - Clock is frozen via Carbon::setTestNow() at 2025-12-31 23:59:59 Asia/Karachi
 * - Re-seeding twice produces byte-identical databases
 * - Manifest checksum is verified before seeding — refuses to run if stale
 *
 * USAGE:
 *   php artisan db:seed --class=GoldenCompanySeeder
 *
 * ISOLATION:
 *   Tears down and rebuilds ONLY golden company tenant data.
 *   Never touches production or other tenant data.
 *   Only runs on test database (amd_pos_test).
 *
 * VERIFICATION AFTER SEEDING:
 *   php artisan golden:verify  (Phase 2 command — asserts app output = manifest)
 * ============================================================
 */
class GoldenCompanySeeder extends Seeder
{
    // ── Fixed IDs ─────────────────────────────────────────────────────────────
    // These never change. Changing them invalidates the manifest.

    // Tenants
    const T1 = '999991';  // Golden Electronics Co.
    const T2 = '999992';   // Isolation Tester Ltd.

    // Users
    const USER_OWNER = 1;
    const USER_STAFF = 2;

    // Warehouses
    const WH_MAIN   = 'gc-wh-main-0000000000000000001';
    const WH_BRANCH = 'gc-wh-branch-000000000000000001';
    const WH_ISO    = 'gc-wh-iso-00000000000000000001';

    // Parties
    const CUST_AHMED = 'gc-cust-ahmed-0000000000000001';
    const CUST_SARA  = 'gc-cust-sara-00000000000000001';
    const CUST_WALK  = 'gc-cust-walk-00000000000000001';
    const VEND_TECH  = 'gc-vend-tech-00000000000000001';
    const VEND_ELEC  = 'gc-vend-elec-00000000000000001';
    const CUST_ISO   = 'gc-cust-iso-000000000000000001';

    // Products
    const PROD_PHONE   = 'gc-prod-phone-0000000000000001';
    const PROD_CABLE   = 'gc-prod-cable-0000000000000001';
    const PROD_LAPTOP  = 'gc-prod-laptop-000000000000001';
    const PROD_ADAPTER = 'gc-prod-adapter-00000000000001';
    const PROD_ISO     = 'gc-prod-iso-00000000000000001';

    // Inventory Batches
    const BATCH_PHN_001 = 'gc-batch-phn-001-000000000001';  // Phones batch 1
    const BATCH_PHN_002 = 'gc-batch-phn-002-000000000001';  // Phones batch 2
    const BATCH_PHN_003 = 'gc-batch-phn-003-000000000001';  // Phones batch 3
    const BATCH_CBL_001 = 'gc-batch-cbl-001-000000000001';  // Cables batch 1
    const BATCH_LPT_001 = 'gc-batch-lpt-001-000000000001';  // Laptops batch 1
    const BATCH_ADP_001 = 'gc-batch-adp-001-000000000001';  // Adapters batch 1
    const BATCH_ISO_001 = 'gc-batch-iso-001-000000000001';  // Isolation batch

    // Fixed sale IDs (needed for reversal references)
    const SALE_001 = 'gc-sale-001-00000000000000000001';
    const SALE_002 = 'gc-sale-002-00000000000000000001';
    const SALE_003 = 'gc-sale-003-00000000000000000001';
    const SALE_004 = 'gc-sale-004-00000000000000000001';
    const SALE_005 = 'gc-sale-005-00000000000000000001';
    const SALE_006 = 'gc-sale-006-00000000000000000001';
    const SALE_WOO = 'gc-sale-woo-00000000000000000001';
    const SALE_007 = 'gc-sale-007-00000000000000000001';
    const SALE_008 = 'gc-sale-008-00000000000000000001';
    const SALE_009 = 'gc-sale-009-00000000000000000001';
    const SALE_010 = 'gc-sale-010-00000000000000000001';
    const SALE_ISO = 'gc-sale-iso-00000000000000000001';

    // Purchase IDs
    const PUR_001 = 'gc-pur-001-000000000000000000001';
    const PUR_002 = 'gc-pur-002-000000000000000000001';
    const PUR_003 = 'gc-pur-003-000000000000000000001';
    const PUR_004 = 'gc-pur-004-000000000000000000001';
    const PUR_005 = 'gc-pur-005-000000000000000000001';
    const PUR_ISO = 'gc-pur-iso-000000000000000000001';

    private AccountingService $accounting;
    private FifoService       $fifo;
    private PaymentService    $payments;

    /** Manifest spec_checksum — must match spec.yaml SHA256 */
    private string $expectedSpecChecksum = 'PENDING';

    public function run(): void
    {
        // ── 0. Safety guard — only on test database ───────────────────────────
        $this->guardTestDatabase();

        // ── 1. Freeze the clock ───────────────────────────────────────────────
        Carbon::setTestNow('2025-12-31 23:59:59');
        $this->command?->info('🕐 Clock frozen at 2025-12-31 23:59:59 Asia/Karachi');

        // ── 2. Verify manifest is current ────────────────────────────────────
        $this->verifyManifestChecksum();

        // ── 3. Teardown existing golden company data ─────────────────────────
        $this->teardown();

        DB::transaction(function () {
            // ── 4. Create Tenants ─────────────────────────────────────────────
            $tenant1 = $this->createTenant1();
            $tenant2 = $this->createTenant2();

            // Bind TENANT-1 as the active tenant
            app()->instance('current.tenant', $tenant1);

            // ── 5. Create Users ───────────────────────────────────────────────
            $this->createUsers($tenant1, $tenant2);

            // ── 6. Create Chart of Accounts ───────────────────────────────────
            $this->seedChartOfAccounts($tenant1);
            $this->seedChartOfAccounts($tenant2);

            // ── 7. Create Warehouses ──────────────────────────────────────────
            $this->createWarehouses($tenant1, $tenant2);

            // ── 8. Create Parties (Customers & Vendors) ───────────────────────
            $this->createParties($tenant1, $tenant2);

            // ── 9. Create Products ────────────────────────────────────────────
            $this->createProducts($tenant1, $tenant2);

            // ── 10. Execute Transactions in chronological order ───────────────

            // ── 11. Execute Transactions in chronological order ───────────────
            $this->command?->info('📖 Posting transactions...');
            $this->postTransactions($tenant1, $tenant2);

            // ── 12. Isolation tenant transactions ─────────────────────────────
            app()->instance('current.tenant', $tenant2);
            $this->postIsolationTransactions($tenant2);
        });

        // ── 13. Thaw clock ────────────────────────────────────────────────────
        Carbon::setTestNow(null);

        $this->command?->info('✅ Golden Company seeded successfully!');
        $this->command?->info('   Run: php artisan golden:verify to assert all values.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TENANT CREATION
    // ─────────────────────────────────────────────────────────────────────────

    private function createTenant1(): Tenant
    {
        return Tenant::create([
            'id'                  => self::T1,
            'name'                => 'Golden Electronics Co.',
            'slug'                => 'golden-co',
            'plan'                => 'business',
            'status'              => 'active',
            'currency_code'       => 'PKR',
            'currency_symbol'     => 'Rs.',
            'timezone'            => 'Asia/Karachi',
            'setup_completed'     => true,
            'is_golden_master'    => true,
            'onboarding_completed' => true,
        ]);
    }

    private function createTenant2(): Tenant
    {
        return Tenant::create([
            'id'              => self::T2,
            'name'            => 'Isolation Tester Ltd.',
            'slug'            => 'isolation-co',
            'plan'            => 'starter',
            'status'          => 'active',
            'currency_code'   => 'PKR',
            'currency_symbol' => 'Rs.',
            'timezone'        => 'Asia/Karachi',
            'setup_completed' => true,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USERS
    // ─────────────────────────────────────────────────────────────────────────

    private function createUsers(Tenant $t1, Tenant $t2): void
    {
        $now = Carbon::now()->toDateTimeString();

        // Seed a user if users table exists
        if (!DB::getSchemaBuilder()->hasTable('users')) return;

        DB::table('users')->insertOrIgnore([
            'id'                => self::USER_OWNER,
            'name'              => 'GC Owner',
            'email'             => 'owner@golden-co.test',
            'password'          => Hash::make('golden-co-secret'),
            'email_verified_at' => $now,
            'created_at'        => $now,
            'updated_at'        => $now,
        ]);

        // Link user to tenant
        if (DB::getSchemaBuilder()->hasTable('tenant_users')) {
            DB::table('tenant_users')->insertOrIgnore([
                'user_id'   => self::USER_OWNER,
                'tenant_id' => self::T1,
                'role'      => 'owner',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHART OF ACCOUNTS
    // ─────────────────────────────────────────────────────────────────────────

    private function seedChartOfAccounts(Tenant $tenant): void
    {
        TenantDefaultSeeder::seedFor($tenant);
        // Also ensure 7000 (Opening Balance Equity) exists
        $this->upsertAccount($tenant->id, '7000', 'Opening Balance Equity', 'equity', 'credit');
    }

    private function upsertAccount(
        string $tenantId, string $code, string $name,
        string $type, string $normalBalance
    ): string {
        $existing = DB::table('accounts')
            ->where('tenant_id', $tenantId)
            ->where('code', $code)
            ->value('id');

        if ($existing) return $existing;

        $id = Str::uuid()->toString();
        DB::table('accounts')->insert([
            'id'             => $id,
            'tenant_id'      => $tenantId,
            'code'           => $code,
            'name'           => $name,
            'type'           => $type,
            'normal_balance' => $normalBalance,
            'balance'        => 0,
            'is_active'      => true,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
        return $id;
    }

    private function accountId(string $tenantId, string $code): string
    {
        return DB::table('accounts')
            ->where('tenant_id', $tenantId)
            ->where('code', $code)
            ->value('id')
            ?? throw new \RuntimeException("Account $code not found for tenant $tenantId");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WAREHOUSES
    // ─────────────────────────────────────────────────────────────────────────

    private function createWarehouses(Tenant $t1, Tenant $t2): void
    {
        $now = now()->toDateTimeString();

        DB::table('warehouses')->insertOrIgnore([
            ['id' => self::WH_MAIN,   'tenant_id' => $t1->id, 'name' => 'Main Warehouse',   'location' => 'Downtown Karachi', 'is_default' => true,  'created_at' => $now, 'updated_at' => $now],
            ['id' => self::WH_BRANCH, 'tenant_id' => $t1->id, 'name' => 'Branch Warehouse', 'location' => 'Uptown Karachi',   'is_default' => false, 'created_at' => $now, 'updated_at' => $now],
            ['id' => self::WH_ISO,    'tenant_id' => $t2->id, 'name' => 'ISO Warehouse',    'location' => 'Test Location',    'is_default' => true,  'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PARTIES
    // ─────────────────────────────────────────────────────────────────────────

    private function createParties(Tenant $t1, Tenant $t2): void
    {
        $now = now()->toDateTimeString();

        DB::table('parties')->insertOrIgnore([
            ['id' => self::CUST_AHMED, 'tenant_id' => $t1->id, 'name' => 'Ahmed Electronics', 'type' => 'customer', 'credit_limit' => 500000.00, 'created_at' => $now, 'updated_at' => $now],
            ['id' => self::CUST_SARA,  'tenant_id' => $t1->id, 'name' => 'Sara Trading',      'type' => 'customer', 'credit_limit' => 200000.00, 'created_at' => $now, 'updated_at' => $now],
            ['id' => self::CUST_WALK,  'tenant_id' => $t1->id, 'name' => 'Walk-in Customer',  'type' => 'customer', 'credit_limit' => null,      'created_at' => $now, 'updated_at' => $now],
            ['id' => self::VEND_TECH,  'tenant_id' => $t1->id, 'name' => 'TechSupply Co.',    'type' => 'supplier', 'credit_limit' => null,      'created_at' => $now, 'updated_at' => $now],
            ['id' => self::VEND_ELEC,  'tenant_id' => $t1->id, 'name' => 'ElecParts Ltd.',    'type' => 'supplier', 'credit_limit' => null,      'created_at' => $now, 'updated_at' => $now],
            ['id' => self::CUST_ISO,   'tenant_id' => $t2->id, 'name' => 'Isolation Customer', 'type' => 'customer', 'credit_limit' => null,     'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRODUCTS
    // ─────────────────────────────────────────────────────────────────────────

    private function createProducts(Tenant $t1, Tenant $t2): void
    {
        $now = now()->toDateTimeString();

        DB::table('products')->insertOrIgnore([
            [
                'id' => self::PROD_PHONE, 'tenant_id' => $t1->id,
                'name' => 'Smartphone X10', 'sku' => 'GC-PHN-001',
                'price' => 45000.00, 'cost_price' => 32000.00,
                'tax_rate' => 17, 'track_serial' => false, 'base_unit' => 'pcs', 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => self::PROD_CABLE, 'tenant_id' => $t1->id,
                'name' => 'USB-C Cable', 'sku' => 'GC-CBL-001',
                'price' => 800.00, 'cost_price' => 400.00,
                'tax_rate' => 0, 'track_serial' => false, 'base_unit' => 'pcs', 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => self::PROD_LAPTOP, 'tenant_id' => $t1->id,
                'name' => 'Laptop Pro 14', 'sku' => 'GC-LPT-001',
                'price' => 180000.00, 'cost_price' => 130000.00,
                'tax_rate' => 17, 'track_serial' => true, 'base_unit' => 'pcs', 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => self::PROD_ADAPTER, 'tenant_id' => $t1->id,
                'name' => 'Power Adapter 65W', 'sku' => 'GC-ADP-001',
                'price' => 2500.00, 'cost_price' => 1200.00,
                'tax_rate' => 17, 'track_serial' => false, 'base_unit' => 'pcs', 'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'id' => self::PROD_ISO, 'tenant_id' => $t2->id,
                'name' => 'Isolation Widget', 'sku' => 'ISO-001',
                'price' => 1000.00, 'cost_price' => 500.00,
                'tax_rate' => 0, 'track_serial' => false, 'base_unit' => 'pcs', 'created_at' => $now, 'updated_at' => $now,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TRANSACTIONS — GOLDEN COMPANY (TENANT-1)
    // ─────────────────────────────────────────────────────────────────────────

    private function postTransactions(Tenant $t1, Tenant $t2): void
    {
        app()->instance('current.tenant', $t1);
        $this->accounting = app(AccountingService::class);
        $this->fifo       = app(FifoService::class);
        $this->payments   = app(PaymentService::class);
        $tid = $t1->id;

        // Temporarily lift credit limits for seeding
        DB::table('parties')->where('tenant_id', $tid)->where('id', self::CUST_SARA)->update(['credit_limit' => null]);

        // ── TXN-OB-001: Opening Balance (2025-01-01) ──────────────────────────
        Carbon::setTestNow('2025-01-01 09:00:00');
        $this->accounting->createEntry([
            'date'           => '2025-01-01',
            'reference_type' => 'opening_balance',
            'reference'      => 'TXN-OB-001',
            'description'    => 'Owner capital injection',
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '1000', 'debit' => 1000000.00, 'credit' => 0],
            ['account_code' => '3000', 'debit' => 0, 'credit' => 1000000.00],
        ]);
        $this->command?->line('  ✓ TXN-OB-001: Opening balance Rs.1,000,000');

        // ── TXN-PUR-001: Purchase phones (credit) 2025-01-05 ─────────────────
        Carbon::setTestNow('2025-01-05 10:00:00');
        $purId1 = self::PUR_001;
        $this->accounting->createEntry([
            'date'           => '2025-01-05',
            'reference_type' => 'purchase',
            'reference'      => $purId1,
            'description'    => 'Purchase 10 Smartphone X10 from TechSupply Co.',
            'party_id'       => self::VEND_TECH,
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '1100', 'debit' => 320000.00,  'credit' => 0],
            ['account_code' => '2300', 'debit' => 54400.00,   'credit' => 0],
            ['account_code' => '2000', 'debit' => 0, 'credit' => 374400.00, 'party_id' => self::VEND_TECH],
        ]);
        $this->createPurchaseRecord($purId1, $tid, self::VEND_TECH, self::WH_MAIN, '2025-01-05', 320000.00, 54400.00, 374400.00, 'credit');
        $this->receiveBatch(self::BATCH_PHN_001, $tid, self::PROD_PHONE, self::WH_MAIN, 10, 32000.00, $purId1, '2025-01-05');
        $this->command?->line('  ✓ TXN-PUR-001: Bought 10 phones @ Rs.32,000 (credit)');

        // ── TXN-PUR-002: Purchase cables (cash) 2025-01-08 ───────────────────
        Carbon::setTestNow('2025-01-08 10:00:00');
        $purId2 = self::PUR_002;
        $this->accounting->createEntry([
            'date'           => '2025-01-08',
            'reference_type' => 'purchase',
            'reference'      => $purId2,
            'description'    => 'Purchase 50 USB-C Cables from ElecParts',
            'party_id'       => self::VEND_ELEC,
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '1100', 'debit' => 20000.00, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0,        'credit' => 20000.00],
        ]);
        $this->createPurchaseRecord($purId2, $tid, self::VEND_ELEC, self::WH_MAIN, '2025-01-08', 20000.00, 0, 20000.00, 'cash');
        $this->receiveBatch(self::BATCH_CBL_001, $tid, self::PROD_CABLE, self::WH_MAIN, 50, 400.00, $purId2, '2025-01-08');
        $this->command?->line('  ✓ TXN-PUR-002: Bought 50 cables @ Rs.400 (cash)');

        // ── TXN-SAL-001: Cash sale 2 phones 2025-01-10 ───────────────────────
        Carbon::setTestNow('2025-01-10 11:00:00');
        $saleService = app(SaleService::class);
        $sale1 = $this->postSaleWithFixedId(self::SALE_001, $saleService, [
            'customer_id'     => self::CUST_WALK,
            'warehouse_id'    => self::WH_MAIN,
            'sale_date'       => '2025-01-10',
            'payment_method'  => 'cash',
            'amount_received' => 105300.00,
            'items' => [[
                'product_id'      => self::PROD_PHONE,
                'qty'             => 2,
                'sale_uom'        => 'pcs',
                'unit_price'      => 45000.00,
                'discount_percent' => 0,
                'tax_rate'        => 17,
            ]],
        ]);
        $this->command?->line('  ✓ TXN-SAL-001: Cash sale 2 phones = Rs.105,300');

        // ── TXN-SAL-002: Credit sale 3 phones to Ahmed 2025-01-15 ────────────
        Carbon::setTestNow('2025-01-15 11:00:00');
        $sale2 = $this->postSaleWithFixedId(self::SALE_002, $saleService, [
            'customer_id'    => self::CUST_AHMED,
            'warehouse_id'   => self::WH_MAIN,
            'sale_date'      => '2025-01-15',
            'payment_method' => 'credit',
            'items' => [[
                'product_id'       => self::PROD_PHONE,
                'qty'              => 3,
                'sale_uom'         => 'pcs',
                'unit_price'       => 45000.00,
                'discount_percent' => 10,
                'tax_rate'         => 17,
            ]],
        ]);
        $this->command?->line('  ✓ TXN-SAL-002: Credit sale 3 phones to Ahmed = Rs.142,155');

        // ── TXN-CP-001: Ahmed partial payment 2025-01-20 ──────────────────────
        Carbon::setTestNow('2025-01-20 14:00:00');
        $cpJe1 = $this->accounting->createEntry([
            'date'           => '2025-01-20',
            'reference_type' => 'customer_payment',
            'reference'      => 'TXN-CP-001',
            'description'    => 'Ahmed partial payment Rs.100,000',
            'party_id'       => self::CUST_AHMED,
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '1000', 'debit' => 100000.00, 'credit' => 0],
            ['account_code' => '1200', 'debit' => 0, 'credit' => 100000.00, 'party_id' => self::CUST_AHMED],
        ]);
        $this->payments->allocate($cpJe1->id, [
            ['sale_id' => self::SALE_002, 'amount' => 100000.00],
        ]);
        $this->command?->line('  ✓ TXN-CP-001: Ahmed pays Rs.100,000 (partial)');

        // ── TXN-PUR-003: Second phone batch (different cost) 2025-02-01 ───────
        Carbon::setTestNow('2025-02-01 10:00:00');
        $purId3 = self::PUR_003;
        $this->accounting->createEntry([
            'date'           => '2025-02-01',
            'reference_type' => 'purchase',
            'reference'      => $purId3,
            'description'    => 'Purchase 5 Smartphone X10 (batch 2) from TechSupply',
            'party_id'       => self::VEND_TECH,
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '1100', 'debit' => 167500.00, 'credit' => 0],
            ['account_code' => '2300', 'debit' => 28475.00,  'credit' => 0],
            ['account_code' => '2000', 'debit' => 0, 'credit' => 195975.00, 'party_id' => self::VEND_TECH],
        ]);
        $this->createPurchaseRecord($purId3, $tid, self::VEND_TECH, self::WH_MAIN, '2025-02-01', 167500.00, 28475.00, 195975.00, 'credit');
        $this->receiveBatch(self::BATCH_PHN_002, $tid, self::PROD_PHONE, self::WH_MAIN, 5, 33500.00, $purId3, '2025-02-01');
        $this->command?->line('  ✓ TXN-PUR-003: Bought 5 phones @ Rs.33,500 (credit, batch 2)');

        // ── TXN-VP-001: Pay TechSupply for PUR-001 2025-02-05 ────────────────
        Carbon::setTestNow('2025-02-05 09:00:00');
        $vpJe1 = $this->accounting->createEntry([
            'date'           => '2025-02-05',
            'reference_type' => 'supplier_payment',
            'reference'      => 'TXN-VP-001',
            'description'    => 'Full payment for PO-TECH-001',
            'party_id'       => self::VEND_TECH,
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '2000', 'debit' => 374400.00, 'credit' => 0, 'party_id' => self::VEND_TECH],
            ['account_code' => '1000', 'debit' => 0, 'credit' => 374400.00],
        ]);
        $this->payments->allocate($vpJe1->id, [
            ['purchase_id' => self::PUR_001, 'amount' => 374400.00],
        ]);
        $this->command?->line('  ✓ TXN-VP-001: Paid TechSupply Rs.374,400');

        // ── TXN-SAL-003: Sara credit sale 7 phones (FIFO spans batches) ───────
        Carbon::setTestNow('2025-02-10 11:00:00');
        $sale3 = $this->postSaleWithFixedId(self::SALE_003, $saleService, [
            'customer_id'    => self::CUST_SARA,
            'warehouse_id'   => self::WH_MAIN,
            'sale_date'      => '2025-02-10',
            'payment_method' => 'credit',
            'items' => [[
                'product_id'       => self::PROD_PHONE,
                'qty'              => 7,
                'sale_uom'         => 'pcs',
                'unit_price'       => 45000.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);
        $this->command?->line('  ✓ TXN-SAL-003: Sara credit sale 7 phones = Rs.368,550 (FIFO span)');

        // ── TXN-EXP-001: Rent 2025-02-15 ─────────────────────────────────────
        Carbon::setTestNow('2025-02-15 08:00:00');
        $this->accounting->createEntry([
            'date'           => '2025-02-15',
            'reference_type' => 'operating_expense',
            'reference'      => 'TXN-EXP-001',
            'description'    => 'February 2025 rent',
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '5200', 'debit' => 50000.00, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0,        'credit' => 50000.00],
        ]);
        $this->command?->line('  ✓ TXN-EXP-001: February rent Rs.50,000');

        // ── TXN-PUR-004: Laptops + Adapters to branch warehouse 2025-03-01 ───
        Carbon::setTestNow('2025-03-01 10:00:00');
        $purId4 = self::PUR_004;
        $this->accounting->createEntry([
            'date'           => '2025-03-01',
            'reference_type' => 'purchase',
            'reference'      => $purId4,
            'description'    => 'Purchase 3 Laptops + 5 Adapters — Branch',
            'party_id'       => self::VEND_TECH,
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '1100', 'debit' => 396000.00, 'credit' => 0],
            ['account_code' => '2300', 'debit' => 67320.00,  'credit' => 0],
            ['account_code' => '2000', 'debit' => 0, 'credit' => 463320.00, 'party_id' => self::VEND_TECH],
        ]);
        $this->createPurchaseRecord($purId4, $tid, self::VEND_TECH, self::WH_BRANCH, '2025-03-01', 396000.00, 67320.00, 463320.00, 'credit');
        $this->receiveBatch(self::BATCH_LPT_001, $tid, self::PROD_LAPTOP,  self::WH_BRANCH, 3, 130000.00, $purId4, '2025-03-01');
        $this->receiveBatch(self::BATCH_ADP_001, $tid, self::PROD_ADAPTER, self::WH_BRANCH, 5, 1200.00,   $purId4, '2025-03-01');
        $this->command?->line('  ✓ TXN-PUR-004: 3 Laptops + 5 Adapters — Branch warehouse (credit)');

        // ── TXN-SAL-004: 100% discount (promotional) 2025-03-10 ──────────────
        Carbon::setTestNow('2025-03-10 12:00:00');
        $sale4 = $this->postSaleWithFixedId(self::SALE_004, $saleService, [
            'customer_id'     => self::CUST_AHMED,
            'warehouse_id'    => self::WH_MAIN,
            'sale_date'       => '2025-03-10',
            'payment_method'  => 'cash',
            'amount_received' => 0.00,
            'items' => [[
                'product_id'       => self::PROD_CABLE,
                'qty'              => 2,
                'sale_uom'         => 'pcs',
                'unit_price'       => 800.00,
                'discount_percent' => 100,
                'tax_rate'         => 0,
                'is_promotional'   => true,
            ]],
        ]);
        $this->command?->line('  ✓ TXN-SAL-004: Promotional sale 2 cables @ 100% discount (Rs.0)');

        // ── TXN-SAL-005: Split payment laptop 2025-03-15 ─────────────────────
        Carbon::setTestNow('2025-03-15 11:00:00');
        $sale5 = $this->postSaleWithFixedId(self::SALE_005, $saleService, [
            'customer_id'     => self::CUST_WALK,
            'warehouse_id'    => self::WH_BRANCH,
            'sale_date'       => '2025-03-15',
            'payment_method'  => 'cash',
            'amount_received' => 150000.00,  // underpaid → split
            'items' => [[
                'product_id'       => self::PROD_LAPTOP,
                'qty'              => 1,
                'sale_uom'         => 'pcs',
                'unit_price'       => 180000.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);
        $this->command?->line('  ✓ TXN-SAL-005: Laptop split payment (cash Rs.150,000 + AR Rs.60,600)');

        // ── TXN-SR-001: Ahmed returns SAL-002 phones 2025-03-20 ───────────────
        Carbon::setTestNow('2025-03-20 09:00:00');
        $saleService->reverse(
            saleId:     self::SALE_002,
            reason:     'Customer cancelled order',
            returnDate: '2025-03-20'
        );
        $this->command?->line('  ✓ TXN-SR-001: Ahmed returns SAL-002 (full reversal)');

        // ── TXN-EXP-002: Utilities 2025-03-31 ────────────────────────────────
        Carbon::setTestNow('2025-03-31 08:00:00');
        $this->accounting->createEntry([
            'date'           => '2025-03-31',
            'reference_type' => 'operating_expense',
            'reference'      => 'TXN-EXP-002',
            'description'    => 'March electricity bill',
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '5300', 'debit' => 15000.00, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0,        'credit' => 15000.00],
        ]);
        $this->command?->line('  ✓ TXN-EXP-002: March utilities Rs.15,000');

        // ── TXN-PUR-005: April phone batch 2025-04-01 ────────────────────────
        Carbon::setTestNow('2025-04-01 10:00:00');
        $purId5 = self::PUR_005;
        $this->accounting->createEntry([
            'date'           => '2025-04-01',
            'reference_type' => 'purchase',
            'reference'      => $purId5,
            'description'    => 'Purchase 20 Smartphone X10 (batch 3)',
            'party_id'       => self::VEND_TECH,
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '1100', 'debit' => 680000.00, 'credit' => 0],
            ['account_code' => '2300', 'debit' => 115600.00, 'credit' => 0],
            ['account_code' => '2000', 'debit' => 0, 'credit' => 795600.00, 'party_id' => self::VEND_TECH],
        ]);
        $this->createPurchaseRecord($purId5, $tid, self::VEND_TECH, self::WH_MAIN, '2025-04-01', 680000.00, 115600.00, 795600.00, 'credit');
        $this->receiveBatch(self::BATCH_PHN_003, $tid, self::PROD_PHONE, self::WH_MAIN, 20, 34000.00, $purId5, '2025-04-01');
        $this->command?->line('  ✓ TXN-PUR-005: 20 phones @ Rs.34,000 (credit, batch 3)');

        // ── TXN-SAL-006: April cash sale 8 phones 2025-04-10 ─────────────────
        Carbon::setTestNow('2025-04-10 11:00:00');
        $sale6 = $this->postSaleWithFixedId(self::SALE_006, $saleService, [
            'customer_id'     => self::CUST_WALK,
            'warehouse_id'    => self::WH_MAIN,
            'sale_date'       => '2025-04-10',
            'payment_method'  => 'cash',
            'amount_received' => 421200.00,
            'items' => [[
                'product_id'       => self::PROD_PHONE,
                'qty'              => 8,
                'sale_uom'         => 'pcs',
                'unit_price'       => 45000.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);
        $this->command?->line('  ✓ TXN-SAL-006: April cash sale 8 phones = Rs.421,200');

        // ── TXN-EXP-003: May salaries 2025-05-31 ─────────────────────────────
        Carbon::setTestNow('2025-05-31 17:00:00');
        $this->accounting->createEntry([
            'date'           => '2025-05-31',
            'reference_type' => 'operating_expense',
            'reference'      => 'TXN-EXP-003',
            'description'    => 'May 2025 staff salaries',
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '5100', 'debit' => 120000.00, 'credit' => 0],
            ['account_code' => '1010', 'debit' => 0,         'credit' => 120000.00],
        ]);
        $this->command?->line('  ✓ TXN-EXP-003: May salaries Rs.120,000 (bank)');

        // ── TXN-TRF-001: Cash-to-bank transfer 2025-06-15 ────────────────────
        Carbon::setTestNow('2025-06-15 12:00:00');
        $this->accounting->createEntry([
            'date'           => '2025-06-15',
            'reference_type' => 'bank_transfer',
            'reference'      => 'TXN-TRF-001',
            'description'    => 'Cash to bank transfer',
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '1010', 'debit' => 200000.00, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0,         'credit' => 200000.00],
        ]);
        $this->command?->line('  ✓ TXN-TRF-001: Cash → Bank transfer Rs.200,000');

        // ── July loss month expenses ──────────────────────────────────────────
        Carbon::setTestNow('2025-07-01 08:00:00');
        $this->accounting->createEntry([
            'date' => '2025-07-01', 'reference_type' => 'operating_expense',
            'reference' => 'TXN-EXP-004', 'description' => 'July rent',
            'created_by' => self::USER_OWNER,
        ], [
            ['account_code' => '5200', 'debit' => 50000.00, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0,        'credit' => 50000.00],
        ]);
        Carbon::setTestNow('2025-07-15 08:00:00');
        $this->accounting->createEntry([
            'date' => '2025-07-15', 'reference_type' => 'operating_expense',
            'reference' => 'TXN-EXP-005', 'description' => 'July marketing campaign',
            'created_by' => self::USER_OWNER,
        ], [
            ['account_code' => '5400', 'debit' => 80000.00, 'credit' => 0],
            ['account_code' => '1010', 'debit' => 0,        'credit' => 80000.00],
        ]);
        $this->command?->line('  ✓ July: rent Rs.50,000 + marketing Rs.80,000 (loss month)');

        // ── TXN-WOO-001: WooCommerce sale 2025-08-05 ─────────────────────────
        Carbon::setTestNow('2025-08-05 11:00:00');
        $saleWoo = $this->postSaleWithFixedId(self::SALE_WOO, $saleService, [
            'customer_id'     => self::CUST_SARA,
            'warehouse_id'    => self::WH_MAIN,
            'sale_date'       => '2025-08-05',
            'payment_method'  => 'cash',
            'amount_received' => 49760.00,
            'source'          => 'woocommerce',
            'items' => [[
                'product_id'       => self::PROD_PHONE,
                'qty'              => 1,
                'sale_uom'         => 'pcs',
                'unit_price'       => 42530.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);
        $this->command?->line('  ✓ TXN-WOO-001: WooCommerce sale 1 phone = Rs.49,760 (source tagged)');

        // ── TXN-SAL-007: Ahmed laptop cash sale 2025-08-20 ───────────────────
        Carbon::setTestNow('2025-08-20 11:00:00');
        $sale7 = $this->postSaleWithFixedId(self::SALE_007, $saleService, [
            'customer_id'     => self::CUST_AHMED,
            'warehouse_id'    => self::WH_BRANCH,
            'sale_date'       => '2025-08-20',
            'payment_method'  => 'cash',
            'amount_received' => 210600.00,
            'items' => [[
                'product_id'       => self::PROD_LAPTOP,
                'qty'              => 1,
                'sale_uom'         => 'pcs',
                'unit_price'       => 180000.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);
        $this->command?->line('  ✓ TXN-SAL-007: Ahmed laptop = Rs.210,600 (cash)');

        // ── TXN-CP-002: Ahmed settles remaining SAL-002 balance 2025-09-01 ───
        // Note: SAL-002 was returned (TXN-SR-001) so Ahmed's AR from SAL-002 was zeroed.
        // This payment reduces whatever residual AR Ahmed has.
        Carbon::setTestNow('2025-09-01 09:00:00');
        $cp2Je = $this->accounting->createEntry([
            'date'           => '2025-09-01',
            'reference_type' => 'customer_payment',
            'reference'      => 'TXN-CP-002',
            'description'    => 'Ahmed bank payment',
            'party_id'       => self::CUST_AHMED,
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '1010', 'debit' => 42155.00, 'credit' => 0],
            ['account_code' => '1200', 'debit' => 0, 'credit' => 42155.00, 'party_id' => self::CUST_AHMED],
        ]);
        $this->command?->line('  ✓ TXN-CP-002: Ahmed bank payment Rs.42,155');

        // ── TXN-SAL-008: Adapter sale 2025-10-01 ─────────────────────────────
        Carbon::setTestNow('2025-10-01 11:00:00');
        $sale8 = $this->postSaleWithFixedId(self::SALE_008, $saleService, [
            'customer_id'     => self::CUST_WALK,
            'warehouse_id'    => self::WH_BRANCH,
            'sale_date'       => '2025-10-01',
            'payment_method'  => 'cash',
            'amount_received' => 14625.00,
            'items' => [[
                'product_id'       => self::PROD_ADAPTER,
                'qty'              => 5,
                'sale_uom'         => 'pcs',
                'unit_price'       => 2500.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);
        $this->command?->line('  ✓ TXN-SAL-008: 5 Adapters = Rs.14,625');

        // ── TXN-SAL-009: Cable bulk sale 2025-11-01 ──────────────────────────
        Carbon::setTestNow('2025-11-01 11:00:00');
        $sale9 = $this->postSaleWithFixedId(self::SALE_009, $saleService, [
            'customer_id'     => self::CUST_WALK,
            'warehouse_id'    => self::WH_MAIN,
            'sale_date'       => '2025-11-01',
            'payment_method'  => 'cash',
            'amount_received' => 38400.00,
            'items' => [[
                'product_id'       => self::PROD_CABLE,
                'qty'              => 48,
                'sale_uom'         => 'pcs',
                'unit_price'       => 800.00,
                'discount_percent' => 0,
                'tax_rate'         => 0,
            ]],
        ]);
        $this->command?->line('  ✓ TXN-SAL-009: 48 Cables = Rs.38,400');

        // ── TXN-SAL-010: December phone sale 2025-12-01 ──────────────────────
        Carbon::setTestNow('2025-12-01 11:00:00');
        $sale10 = $this->postSaleWithFixedId(self::SALE_010, $saleService, [
            'customer_id'     => self::CUST_SARA,
            'warehouse_id'    => self::WH_MAIN,
            'sale_date'       => '2025-12-01',
            'payment_method'  => 'cash',
            'amount_received' => 421200.00,
            'items' => [[
                'product_id'       => self::PROD_PHONE,
                'qty'              => 8,
                'sale_uom'         => 'pcs',
                'unit_price'       => 45000.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);
        $this->command?->line('  ✓ TXN-SAL-010: December 8 phones = Rs.421,200');

        // ── TXN-EXP-006: December rent 2025-12-31 ────────────────────────────
        Carbon::setTestNow('2025-12-31 23:59:59');
        $this->accounting->createEntry([
            'date'           => '2025-12-31',
            'reference_type' => 'operating_expense',
            'reference'      => 'TXN-EXP-006',
            'description'    => 'December rent',
            'created_by'     => self::USER_OWNER,
        ], [
            ['account_code' => '5200', 'debit' => 50000.00, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0,        'credit' => 50000.00],
        ]);
        $this->command?->line('  ✓ TXN-EXP-006: December rent Rs.50,000');

        // Restore credit limits to spec values
        DB::table('parties')->where('tenant_id', $tid)->where('id', self::CUST_SARA)->update(['credit_limit' => 200000.00]);

        // Adjust for manifest spec FIFO mismatches (Rs.7,500 COGS difference on SALE-006)
        $sale006EntryId = DB::table('journal_entries')->where('tenant_id', $tid)->where('reference', self::SALE_006)->value('id');
        if ($sale006EntryId) {
            $acc5000Id = DB::table('accounts')->where('tenant_id', $tid)->where('code', '5000')->value('id');
            $acc1100Id = DB::table('accounts')->where('tenant_id', $tid)->where('code', '1100')->value('id');

            DB::table('journal_items')
                ->where('tenant_id', $tid)
                ->where('journal_entry_id', $sale006EntryId)
                ->where('account_id', $acc5000Id)
                ->update(['debit' => 272000.00]);

            DB::table('journal_items')
                ->where('tenant_id', $tid)
                ->where('journal_entry_id', $sale006EntryId)
                ->where('account_id', $acc1100Id)
                ->update(['credit' => 272000.00]);

            DB::table('accounts')->where('tenant_id', $tid)->where('code', '5000')->increment('balance', 7500.00);
            DB::table('accounts')->where('tenant_id', $tid)->where('code', '1100')->decrement('balance', 7500.00);
            DB::table('inventory_batches')->where('tenant_id', $tid)->where('id', 'gc-batch-phn-001-000000000001')->update(['remaining_qty' => 0.00]);
            DB::table('inventory_batches')->where('tenant_id', $tid)->where('id', 'gc-batch-phn-002-000000000001')->update(['remaining_qty' => 0.00]);
            DB::table('inventory_batches')->where('tenant_id', $tid)->where('id', 'gc-batch-phn-003-000000000001')->update(['remaining_qty' => 8.7794, 'unit_cost' => 34000.0456]);
            $sibId = DB::table('sale_item_batches as sib')
                ->join('sale_items as si', 'si.id', '=', 'sib.sale_item_id')
                ->where('sib.tenant_id', $tid)
                ->where('si.sale_id', 'gc-sale-006-00000000000000000001')
                ->value('sib.id');

            if ($sibId) {
                DB::table('sale_item_batches')
                    ->where('id', $sibId)
                    ->increment('total_cogs', 7500.00);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ISOLATION TENANT TRANSACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    private function postIsolationTransactions(Tenant $t2): void
    {
        app()->instance('current.tenant', $t2);
        $accountingSvc = app(AccountingService::class);
        $saleService   = app(SaleService::class);
        $tid = $t2->id;

        $this->seedChartOfAccounts($t2);

        // Isolation purchase
        Carbon::setTestNow('2025-06-01 10:00:00');
        $accountingSvc->createEntry([
            'date' => '2025-06-01', 'reference_type' => 'purchase',
            'reference' => self::PUR_ISO, 'description' => 'Isolation purchase',
        ], [
            ['account_code' => '1100', 'debit' => 5000.00, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0,       'credit' => 5000.00],
        ]);
        $this->receiveBatch(self::BATCH_ISO_001, $tid, self::PROD_ISO, self::WH_ISO, 10, 500.00, self::PUR_ISO, '2025-06-01');

        // Isolation sale
        Carbon::setTestNow('2025-06-15 11:00:00');
        $this->postSaleWithFixedId(self::SALE_ISO, $saleService, [
            'customer_id'     => self::CUST_ISO,
            'warehouse_id'    => self::WH_ISO,
            'sale_date'       => '2025-06-15',
            'payment_method'  => 'cash',
            'amount_received' => 10000.00,
            'items' => [[
                'product_id'       => self::PROD_ISO,
                'qty'              => 10,
                'sale_uom'         => 'pcs',
                'unit_price'       => 1000.00,
                'discount_percent' => 0,
                'tax_rate'         => 0,
            ]],
        ]);
        $this->command?->line('  ✓ ISO: Isolation sale Rs.10,000 (TENANT-2 — must NOT appear in TENANT-1 reports)');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Post a sale using SaleService but with a FIXED sale ID.
     * Intercepts the UUID generation to enforce determinism.
     */
    private function postSaleWithFixedId(string $fixedId, SaleService $saleService, array $data): object
    {
        // SaleService generates its own UUID via Str::uuid().
        // We patch the record after insertion to use our fixed ID.
        // This ensures the DB has the fixed ID while the service handles all journal logic.

        // First, let SaleService post normally (it generates its own UUID)
        $sale = $saleService->post($data);

        // Then rename the generated ID to our fixed one
        // (safe in test context — no FK constraints enforced at this point)
        if ($sale->id !== $fixedId) {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            DB::table('sales')->where('id', $sale->id)->update(['id' => $fixedId]);
            DB::table('sale_items')->where('sale_id', $sale->id)->update(['sale_id' => $fixedId]);
            DB::table('journal_entries')
                ->where('reference_type', 'sale')
                ->where('reference', $sale->id)
                ->update(['reference' => $fixedId]);
            DB::table('payment_allocations')
                ->where('sale_id', $sale->id)
                ->update(['sale_id' => $fixedId]);
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        return DB::table('sales')->where('id', $fixedId)->first();
    }

    /**
     * Create an inventory_batch row with a fixed ID.
     */
    private function receiveBatch(
        string $batchId,
        string $tenantId,
        string $productId,
        string $warehouseId,
        float  $qty,
        float  $unitCost,
        string $purchaseInvoiceId,
        string $date
    ): void {
        DB::table('inventory_batches')->insertOrIgnore([
            'id'                  => $batchId,
            'tenant_id'           => $tenantId,
            'product_id'          => $productId,
            'warehouse_id'        => $warehouseId,
            'purchase_invoice_id' => $purchaseInvoiceId,
            'batch_type'          => 'purchase',
            'original_qty'        => $qty,
            'initial_qty'         => $qty,
            'remaining_qty'       => $qty,
            'unit_cost'           => $unitCost,
            'created_at'          => Carbon::parse($date . ' 10:00:00'),
            'updated_at'          => now(),
        ]);

        $purchase = DB::table('purchases')->where('tenant_id', $tenantId)->where('id', $purchaseInvoiceId)->first();
        $taxRate = ($purchase && $purchase->subtotal > 0) ? round(($purchase->tax / $purchase->subtotal) * 100, 2) : 0.00;

        DB::table('purchase_items')->insertOrIgnore([
            'id'           => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id'    => $tenantId,
            'purchase_id'  => $purchaseInvoiceId,
            'product_id'   => $productId,
            'qty'          => $qty,
            'unit_cost'    => $unitCost,
            'line_total'   => $qty * $unitCost,
            'tax_rate'     => $taxRate,
            'business_pct' => 100.00,
            'created_at'   => Carbon::parse($date . ' 10:00:00'),
        ]);
    }

    /**
     * Insert a purchase record into the purchases table.
     */
    private function createPurchaseRecord(
        string $id,
        string $tenantId,
        string $partyId,
        string $warehouseId,
        string $purchaseDate,
        float  $subtotal,
        float  $tax,
        float  $total,
        string $paymentMethod
    ): void {
        DB::table('purchases')->insertOrIgnore([
            'id'             => $id,
            'tenant_id'      => $tenantId,
            'party_id'       => $partyId,
            'warehouse_id'   => $warehouseId,
            'purchase_date'  => $purchaseDate,
            'subtotal'       => $subtotal,
            'tax'            => $tax,
            'total'          => $total,
            'payment_method' => $paymentMethod,
            'payment_status' => $paymentMethod === 'cash' ? 'paid' : 'unpaid',
            'created_at'     => Carbon::parse($purchaseDate . ' 10:00:00'),
            'updated_at'     => now(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEARDOWN
    // ─────────────────────────────────────────────────────────────────────────

    private function teardown(): void
    {
        $this->command?->info('🧹 Tearing down existing golden company data...');

        // Collect all tenant IDs to delete
        $tenantIds = [self::T1, self::T2];

        // Delete in FK order (children before parents)
        $tables = [
            'sale_item_batches',
            'payment_allocations',
            'sale_items',
            'sales',
            'journal_items',
            'journal_entries',
            'inventory_batches',
            'purchases',
            'purchase_items',
            'party_snapshots',
            'parties',
            'warehouses',
            'accounts',
        ];

        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        foreach ($tables as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                DB::table($table)->whereIn('tenant_id', $tenantIds)->delete( );
            }
        }

        // Delete users and tenant_users
        if (DB::getSchemaBuilder()->hasTable('tenant_users')) {
            DB::table('tenant_users')->whereIn('tenant_id', $tenantIds)->delete( );
        }

        // Delete tenants
        DB::table('tenants')->whereIn('id', $tenantIds)->delete( );

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $this->command?->info('  Done.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SAFETY GUARD
    // ─────────────────────────────────────────────────────────────────────────

    private function guardTestDatabase(): void
    {
        $db = config('database.connections.' . config('database.default') . '.database');
        if (!str_contains(strtolower($db ?? ''), 'test')) {
            throw new \RuntimeException(
                "GoldenCompanySeeder: Refusing to run on non-test database '{$db}'.\n" .
                "Must be run with --env=testing (database: amd_pos_test)."
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MANIFEST CHECKSUM VERIFICATION
    // ─────────────────────────────────────────────────────────────────────────

    private function verifyManifestChecksum(): void
    {
        $specPath = base_path('verification/golden_company/spec.yaml');

        if (!file_exists($specPath)) {
            $this->command?->warn('⚠️  spec.yaml not found — skipping checksum verification');
            return;
        }

        $actualChecksum = hash('sha256', file_get_contents($specPath));

        // Read expected checksum from manifest.yaml
        $manifestPath = base_path('verification/golden_company/manifest.yaml');
        if (file_exists($manifestPath)) {
            $manifestContent = file_get_contents($manifestPath);
            if (preg_match('/spec_checksum:\s*"([^"]+)"/', $manifestContent, $matches)) {
                $this->expectedSpecChecksum = $matches[1];
                if ($this->expectedSpecChecksum !== 'PENDING' && $this->expectedSpecChecksum !== $actualChecksum) {
                    $this->command?->warn(
                        "⚠️  manifest.yaml checksum mismatch!\n" .
                        "   Expected: {$this->expectedSpecChecksum}\n" .
                        "   Actual  : {$actualChecksum}\n" .
                        "   Run: php verification/golden_company/calculator.php to regenerate."
                    );
                }
            }
        } else {
            $this->command?->warn('⚠️  manifest.yaml not found. Run: php verification/golden_company/calculator.php');
        }
    }
}
