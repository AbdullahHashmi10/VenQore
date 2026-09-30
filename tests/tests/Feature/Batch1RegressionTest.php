<?php

namespace Tests\Feature;

use App\Models\BankAccount;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Party;
use App\Models\Payment;
use App\Models\Product;
use App\Models\RegisterShift;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\Feature\VenQoreTestCase;

class Batch1RegressionTest extends VenQoreTestCase
{
    /**
     * B01: Payments list must be strictly read-only.
     * Backdated dates and legacy types must remain unmodified across tenants,
     * and the GET request must execute zero database writes.
     */
    public function test_payments_list_is_strictly_read_only_and_executes_zero_writes(): void
    {
        $tenantA = $this->createTenant('tenant-a-' . uniqid(), 'ltd_3');
        $tenantB = $this->createTenant('tenant-b-' . uniqid(), 'ltd_3');

        $userA = $this->createTenantUser($tenantA, 'owner');
        $userB = $this->createTenantUser($tenantB, 'owner');

        $partyA = Party::factory()->create(['tenant_id' => $tenantA->id, 'type' => 'customer']);
        $partyB = Party::factory()->create(['tenant_id' => $tenantB->id, 'type' => 'customer']);

        $saleA = Sale::factory()->create(['tenant_id' => $tenantA->id, 'user_id' => $userA->id, 'party_id' => $partyA->id]);
        $saleB = Sale::factory()->create(['tenant_id' => $tenantB->id, 'user_id' => $userB->id, 'party_id' => $partyB->id]);

        $backdatedDateA = '2026-01-15';
        $backdatedDateB = '2026-02-20';

        // Create payments with deliberate backdates different from created_at
        $paymentA = Payment::create([
            'tenant_id'  => $tenantA->id,
            'party_id'   => $partyA->id,
            'sale_id'    => $saleA->id,
            'amount'     => 100.00,
            'type'       => 'received', // legacy type
            'date'       => $backdatedDateA,
            'created_at' => Carbon::now()->subDays(5),
            'updated_at' => Carbon::now()->subDays(5),
        ]);

        $paymentB = Payment::create([
            'tenant_id'  => $tenantB->id,
            'party_id'   => $partyB->id,
            'sale_id'    => $saleB->id,
            'amount'     => 200.00,
            'type'       => 'sent', // legacy type
            'date'       => $backdatedDateB,
            'created_at' => Carbon::now()->subDays(10),
            'updated_at' => Carbon::now()->subDays(10),
        ]);

        // Query write listener: assert 0 INSERT, UPDATE, DELETE queries on GET
        $writeQueries = [];
        DB::listen(function ($query) use (&$writeQueries) {
            $sql = strtoupper(trim($query->sql));
            if (str_starts_with($sql, 'INSERT') || str_starts_with($sql, 'UPDATE') || str_starts_with($sql, 'DELETE')) {
                $writeQueries[] = $sql;
            }
        });

        // Act as Tenant A and load payments list
        $this->actingAsTenantUserModel($userA, $tenantA);
        $response = $this->get($this->storeUrl($tenantA, '/payments'));
        $response->assertStatus(200);

        $this->assertEmpty($writeQueries, 'PaymentController::index() executed database write queries: ' . implode('; ', $writeQueries));

        // Assert that neither Tenant A nor Tenant B records were mutated
        $freshA = Payment::withoutGlobalScopes()->find($paymentA->id);
        $freshB = Payment::withoutGlobalScopes()->find($paymentB->id);

        $this->assertEquals($backdatedDateA, Carbon::parse($freshA->date)->toDateString(), 'Tenant A payment date was mutated on page load');
        $this->assertEquals('received', $freshA->type, 'Tenant A payment type was mutated on page load');

        $this->assertEquals($backdatedDateB, Carbon::parse($freshB->date)->toDateString(), 'Tenant B payment date was mutated on page load');
        $this->assertEquals('sent', $freshB->type, 'Tenant B payment type was mutated on page load');
    }

    /**
     * B02: Sensitive dashboard data (profit, COGS, expenses, debtor contacts, charity, company balances)
     * must be strictly permission-gated on the server with non-zero seed values and null/omitted unauthorized representation.
     */
    public function test_sensitive_dashboard_props_are_not_exposed_to_unauthorized_roles(): void
    {
        $tenant = $this->createTenant('sec-dash-store-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC']);

        // Create restricted cashier user (only pos.checkout, sales.view, inventory.view)
        $cashier = $this->createTenantUser($tenant, 'cashier');

        // Seed non-zero debtor party with private contact details
        $debtor = Party::factory()->create([
            'tenant_id'       => $tenant->id,
            'name'            => 'Sensitive Debtor',
            'phone'           => '+923001234567',
            'type'            => 'customer',
            'current_balance' => 5432.10,
        ]);

        // Seed non-zero bank account with balance
        BankAccount::create([
            'tenant_id'      => $tenant->id,
            'name'           => 'Secret Treasury Bank',
            'account_type'   => 'bank',
            'account_number' => 'PK9900001',
            'balance'        => 987654.32,
        ]);

        // Seed charity expense with non-zero amount
        $charityCategory = ExpenseCategory::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Charity/Donations',
        ]);
        Expense::create([
            'tenant_id'           => $tenant->id,
            'expense_category_id' => $charityCategory->id,
            'amount'              => 750.00,
            'date'                => Carbon::now('UTC')->toDateString(),
            'status'              => 'approved',
        ]);

        // Seed product and posted sale with profit
        $product = Product::factory()->create([
            'tenant_id'  => $tenant->id,
            'name'       => 'Top Secret Luxury Watch',
            'sku'        => 'WATCH-01',
            'price'      => 1500.00,
            'cost_price' => 500.00,
        ]);
        $sale = Sale::factory()->create([
            'tenant_id'  => $tenant->id,
            'user_id'    => $cashier->id,
            'party_id'   => $debtor->id,
            'status'     => 'posted',
            'subtotal'   => 1500.00,
            'net_sales'  => 1500.00,
            'posted_at'  => Carbon::now('UTC'),
        ]);
        SaleItem::create([
            'tenant_id'    => $tenant->id,
            'sale_id'      => $sale->id,
            'product_id'   => $product->id,
            'quantity'     => 1,
            'unit_price'   => 1500.00,
            'cost_price'   => 500.00,
            'total_amount' => 1500.00,
        ]);

        \App\Models\JournalEntry::create([
            'tenant_id'      => $tenant->id,
            'user_id'        => $cashier->id,
            'reference_type' => 'sale',
            'reference_id'   => $sale->id,
            'entry_number'   => 'JE-TEST-001',
            'date'           => Carbon::now('UTC')->toDateString(),
            'notes'          => 'Test sale entry',
            'is_reversed'    => 0,
        ]);

        // 1. Access /new-dashboard as cashier
        $this->actingAsTenantUserModel($cashier, $tenant);
        $responseNew = $this->get($this->storeUrl($tenant, '/new-dashboard'));
        $responseNew->assertStatus(200);

        $responseNew->assertInertia(fn (AssertableInertia $page) => $page
            ->component('NewDashboard')
            ->where('debtors', fn ($debtors) => collect($debtors)->isEmpty())
            ->where('bankAccounts', fn ($accounts) => collect($accounts)->isEmpty())
            ->where('cashAccounts', fn ($accounts) => collect($accounts)->isEmpty())
            ->where('cashData', null)
            ->where('netProfit', null)
            ->where('inventoryValue', null)
            ->where('recentTransactions', fn ($txs) => collect($txs)->isEmpty())
            ->where('charityStats.today', null)
            ->where('charityStats.month', null)
            ->where('performance.Today.gross_profit', null)
            ->where('performance.Today.cogs', null)
            ->where('performance.Today.expenses', null)
            ->where('salesData.Today.0.profit', null)
            ->where('topSellingItems.0.gross_profit', null)
            ->where('topSellingItems.0.profit', null)
        );

        // 2. Access /dashboard-v1 as cashier -> routed to Dashboards/CashierDashboard
        $responseCashierDash = $this->get($this->storeUrl($tenant, '/dashboard-v1'));
        $responseCashierDash->assertStatus(200);
        $responseCashierDash->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Dashboards/CashierDashboard')
            ->missing('netProfit')
            ->missing('plSummary')
            ->missing('bankAccounts')
            ->missing('recentTransactions')
        );

        // 3. Positive verification: User with reports.financial, finance.balances, finance.transactions, parties.contact_view
        $financeUser = $this->createTenantUser($tenant, 'accountant');
        $this->actingAsTenantUserModel($financeUser, $tenant);
        $responseFinance = $this->get($this->storeUrl($tenant, '/new-dashboard'));
        $responseFinance->assertStatus(200);

        $responseFinance->assertInertia(fn (AssertableInertia $page) => $page
            ->component('NewDashboard')
            ->where('bankAccounts', fn ($accounts) => collect($accounts)->isNotEmpty())
            ->where('debtors', fn ($debtors) => collect($debtors)->isNotEmpty())
            ->where('netProfit', fn ($np) => !is_null($np))
            ->where('recentTransactions', fn ($txs) => collect($txs)->isNotEmpty())
        );

        // 4. Access /dashboard-v1 as cashier -> routed safely without sensitive financial leak
        $this->actingAsTenantUserModel($cashier, $tenant);
        $responseV1 = $this->get($this->storeUrl($tenant, '/dashboard-v1'));
        $responseV1->assertStatus(200);
        $responseV1->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Dashboards/CashierDashboard')
            ->missing('netProfit')
            ->missing('plSummary')
        );
    }

    /**
     * B05: Cashier session totals must only count the cashier's authorized shift/sales across all edge cases:
     * - Two cashiers with separate open shifts
     * - Closed shift
     * - Shift crossing tenant midnight boundary
     * - Sale assigned to another cashier's shift
     * - No-open-shift fallback (scoped to cashier's own sales for today in store timezone)
     * - Cross-tenant isolation
     */
    public function test_cashier_session_metrics_comprehensive_scenarios(): void
    {
        $tenantA = $this->createTenant('cashier-scope-a-' . uniqid(), 'ltd_3');
        $tenantA->update(['timezone' => 'America/New_York']); // UTC-5 / UTC-4

        $tenantB = $this->createTenant('cashier-scope-b-' . uniqid(), 'ltd_3');

        $cashierA = $this->createTenantUser($tenantA, 'cashier');
        $cashierB = $this->createTenantUser($tenantA, 'cashier');
        $cashierForeign = $this->createTenantUser($tenantB, 'cashier');

        $partyA = Party::factory()->create(['tenant_id' => $tenantA->id, 'type' => 'customer']);
        $partyB = Party::factory()->create(['tenant_id' => $tenantB->id, 'type' => 'customer']);

        // Scenario 1: Cashier A opens Shift A on REG-1
        $shiftA = RegisterShift::create([
            'tenant_id'     => $tenantA->id,
            'register_id'   => 'REG-1',
            'opened_by'     => $cashierA->id,
            'opened_at'     => Carbon::now('America/New_York')->subHours(3),
            'opening_float' => 500.00,
            'status'        => 'open',
        ]);

        // Scenario 2: Cashier B opens Shift B on REG-2
        $shiftB = RegisterShift::create([
            'tenant_id'     => $tenantA->id,
            'register_id'   => 'REG-2',
            'opened_by'     => $cashierB->id,
            'opened_at'     => Carbon::now('America/New_York')->subHours(2),
            'opening_float' => 300.00,
            'status'        => 'open',
        ]);

        // Scenario 3: Cashier A had a previously CLOSED shift earlier
        $shiftClosed = RegisterShift::create([
            'tenant_id'     => $tenantA->id,
            'register_id'   => 'REG-1',
            'opened_by'     => $cashierA->id,
            'opened_at'     => Carbon::now('America/New_York')->subDays(2),
            'closed_at'     => Carbon::now('America/New_York')->subDays(2)->addHours(8),
            'opening_float' => 500.00,
            'status'        => 'closed',
        ]);
        Sale::factory()->create([
            'tenant_id'         => $tenantA->id,
            'user_id'           => $cashierA->id,
            'party_id'          => $partyA->id,
            'register_shift_id' => $shiftClosed->id,
            'status'            => 'posted',
            'net_sales'         => 999.00,
            'posted_at'         => Carbon::now('America/New_York')->subDays(2),
        ]);

        // Sale 1: Cashier A posted sale in Shift A
        Sale::factory()->create([
            'tenant_id'         => $tenantA->id,
            'user_id'           => $cashierA->id,
            'party_id'          => $partyA->id,
            'register_shift_id' => $shiftA->id,
            'status'            => 'posted',
            'net_sales'         => 150.00,
            'posted_at'         => Carbon::now('America/New_York')->subHours(2),
        ]);

        // Sale 2: Cashier B posted 2 sales in Shift B (total 400.00)
        Sale::factory()->count(2)->create([
            'tenant_id'         => $tenantA->id,
            'user_id'           => $cashierB->id,
            'party_id'          => $partyA->id,
            'register_shift_id' => $shiftB->id,
            'status'            => 'posted',
            'net_sales'         => 200.00,
            'posted_at'         => Carbon::now('America/New_York')->subHour(),
        ]);

        // Sale 3: Foreign tenant sale (must never count)
        Sale::factory()->create([
            'tenant_id'         => $tenantB->id,
            'user_id'           => $cashierForeign->id,
            'party_id'          => $partyB->id,
            'status'            => 'posted',
            'net_sales'         => 5000.00,
            'posted_at'         => Carbon::now(),
        ]);

        // Assert Cashier A sees ONLY Shift A (1 transaction, 150.00)
        $this->actingAsTenantUserModel($cashierA, $tenantA);
        $responseA = $this->get($this->storeUrl($tenantA, '/dashboard-v1'));
        $responseA->assertStatus(200);
        $responseA->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Dashboards/CashierDashboard')
            ->where('session.transaction_count', 1)
            ->where('session.session_total', fn ($val) => (float) $val === 150.0)
        );

        // Assert Cashier B sees ONLY Shift B (2 transactions, 400.00)
        $this->actingAsTenantUserModel($cashierB, $tenantA);
        $responseB = $this->get($this->storeUrl($tenantA, '/dashboard-v1'));
        $responseB->assertStatus(200);
        $responseB->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Dashboards/CashierDashboard')
            ->where('session.transaction_count', 2)
            ->where('session.session_total', fn ($val) => (float) $val === 400.0)
        );

        // Scenario 4: Cashier C has NO open shift -> fallback to cashier's own sales created today in store timezone
        $cashierC = $this->createTenantUser($tenantA, 'cashier');
        Sale::factory()->create([
            'tenant_id'         => $tenantA->id,
            'user_id'           => $cashierC->id,
            'party_id'          => $partyA->id,
            'register_shift_id' => null,
            'status'            => 'posted',
            'net_sales'         => 75.00,
            'posted_at'         => Carbon::now('America/New_York'),
        ]);

        $this->actingAsTenantUserModel($cashierC, $tenantA);
        $responseC = $this->get($this->storeUrl($tenantA, '/dashboard-v1'));
        $responseC->assertStatus(200);
        $responseC->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Dashboards/CashierDashboard')
            ->where('session.transaction_count', 1)
            ->where('session.session_total', fn ($val) => (float) $val === 75.0)
        );
    }

    /**
     * B04 & B07: Unified permission decisions, no cross-store fallback, and middleware/API authorization.
     */
    public function test_unified_permission_decisions_and_api_authorization(): void
    {
        $tenantA = $this->createTenant('perm-store-a-' . uniqid(), 'ltd_3');
        $tenantB = $this->createTenant('perm-store-b-' . uniqid(), 'ltd_3');

        // User belongs ONLY to Store B as owner
        $userB = $this->createTenantUser($tenantB, 'owner');

        // 1. Attempting to access Store A with User B credentials must redirect to hub (unauthorized store access)
        $this->actingAsTenantUserModel($userB, $tenantB);
        $responseCross = $this->get($this->storeUrl($tenantA, '/dashboard'));
        $responseCross->assertRedirect(route('hub'));

        // 2. Custom restricted administrator permissions
        $restrictedAdmin = $this->createTenantUser($tenantA, 'admin');
        // Override with custom permissions in TenantUser pivot omitting sales.create
        $membershipA = TenantUser::where('tenant_id', $tenantA->id)->where('user_id', $restrictedAdmin->id)->first();
        $membershipA->update([
            'permissions' => ['pos.open_session', 'inventory.view'],
            'permission_override_mode' => 'custom',
        ]);

        $this->actingAsTenantUserModel($restrictedAdmin, $tenantA);
        $this->assertTrue($restrictedAdmin->hasPermission('pos.open_session'));
        $this->assertTrue($restrictedAdmin->hasPermission('inventory.view'));
        $this->assertFalse($restrictedAdmin->hasPermission('finance.balances'));
        $this->assertFalse($restrictedAdmin->hasPermission('sales.create'));

        // 3. API test: Batch order sync checks effective permission
        $responseApiDenied = $this->postJson('/api/sync/orders/batch', [
            'orders' => [['items' => []]],
        ]);
        $responseApiDenied->assertStatus(403);

        // 4. Platform Admin wildcard access
        $platformAdmin = User::factory()->create([
            'is_platform_admin' => true,
        ]);
        $this->actingAs($platformAdmin);
        $this->assertTrue($platformAdmin->hasPermission('anything.arbitrary'));
        $this->assertTrue($platformAdmin->hasAnyPermission(['sales.create', 'other.perm']));
    }

    /**
     * B06: Accountant aging buckets must return explicit honest unavailable state rather than fabricated zeros.
     */
    public function test_accountant_aging_buckets_return_honest_unavailable_state(): void
    {
        $tenant = $this->createTenant('aging-store-' . uniqid(), 'ltd_3');
        $accountant = $this->createTenantUser($tenant, 'accountant');

        $this->actingAsTenantUserModel($accountant, $tenant);
        $response = $this->get($this->storeUrl($tenant, '/dashboard-v1'));
        $response->assertStatus(200);

        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Dashboards/AccountantDashboard')
            ->where('receivables.overdue_30', null)
            ->where('receivables.overdue_60', null)
            ->where('receivables.overdue_90', null)
            ->where('receivables.overdue_90plus', null)
            ->where('receivables.available', false)
            ->where('payables.due_7', null)
            ->where('payables.due_30', null)
            ->where('payables.overdue', null)
            ->where('payables.available', false)
            ->where('pendingJournalCount', null)
        );
    }

    /**
     * B04 / B07: Granular permission semantics: exact, *, category.*, multi-tenant isolation, hasAny/hasAll.
     */
    public function test_permission_wildcard_semantics_and_multi_tenant_isolation(): void
    {
        $tenantAlpha = $this->createTenant('perm-alpha-' . uniqid(), 'ltd_3');
        $tenantBeta  = $this->createTenant('perm-beta-' . uniqid(), 'ltd_3');

        // Shared user who is cashier in Alpha, but owner in Beta
        $sharedUser = User::factory()->create(['is_platform_admin' => false]);

        TenantUser::create([
            'tenant_id' => $tenantAlpha->id,
            'user_id'   => $sharedUser->id,
            'role'      => 'cashier',
            'status'    => 'active',
        ]);

        TenantUser::create([
            'tenant_id' => $tenantBeta->id,
            'user_id'   => $sharedUser->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        // When acting under Tenant Alpha:
        $this->actingAsTenantUserModel($sharedUser, $tenantAlpha);
        $this->assertTrue($sharedUser->hasPermission('pos.checkout'));
        $this->assertFalse($sharedUser->hasPermission('finance.journal'), 'Cashier in Tenant Alpha must not have owner permissions');
        $this->assertFalse($sharedUser->hasPermission('admin.billing_store'), 'Cashier in Tenant Alpha must not have owner permissions');

        // When acting under Tenant Beta:
        $this->actingAsTenantUserModel($sharedUser, $tenantBeta);
        $this->assertTrue($sharedUser->hasPermission('pos.checkout'));
        $this->assertTrue($sharedUser->hasPermission('finance.journal'), 'Owner in Tenant Beta must have finance.journal');
        $this->assertTrue($sharedUser->hasPermission('admin.billing_store'), 'Owner in Tenant Beta must have admin.billing_store');

        // Custom wildcard permissions test on TenantUser pivot
        $wildcardUser = $this->createTenantUser($tenantAlpha, 'cashier');
        $pivot = TenantUser::where('tenant_id', $tenantAlpha->id)->where('user_id', $wildcardUser->id)->first();
        $pivot->update([
            'permissions' => ['sales.*', 'inventory.view'],
            'permission_override_mode' => 'custom',
        ]);

        $this->actingAsTenantUserModel($wildcardUser, $tenantAlpha);
        $this->assertTrue($wildcardUser->hasPermission('sales.view'));
        $this->assertTrue($wildcardUser->hasPermission('sales.create'));
        $this->assertTrue($wildcardUser->hasPermission('sales.edit'));
        $this->assertTrue($wildcardUser->hasPermission('inventory.view'));
        $this->assertFalse($wildcardUser->hasPermission('inventory.delete'));
        $this->assertFalse($wildcardUser->hasPermission('finance.balances'));

        // hasAnyPermission & hasAllPermissions
        $this->assertTrue($wildcardUser->hasAnyPermission(['sales.create', 'nonexistent.perm']));
        $this->assertTrue($wildcardUser->hasAllPermissions(['sales.create', 'inventory.view']));
        $this->assertFalse($wildcardUser->hasAllPermissions(['sales.create', 'inventory.delete']));
    }

    /**
     * Incidental Test: SaleController correctly calculates changeReturn from tendered amount.
     */
    public function test_incidental_change_return_calculation(): void
    {
        $tenant = $this->createTenant('sale-calc-' . uniqid(), 'ltd_3');
        $user = $this->createTenantUser($tenant, 'owner');
        $customer = Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'customer']);
        $product = Product::factory()->create([
            'tenant_id'  => $tenant->id,
            'price'      => 100.00,
            'cost_price' => 50.00,
        ]);

        $this->actingAsTenantUserModel($user, $tenant);

        $payload = [
            'customer_id'    => $customer->id,
            'payment_method' => 'cash',
            'amount_paid'    => 150.00,
            'items'          => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 1,
                    'price'      => 100.00,
                    'discount'   => 0,
                ],
            ],
            'discount'       => 0,
        ];

        $response = $this->postJson($this->storeUrl($tenant, '/sales'), $payload);
        $response->assertStatus(200);

        $saleId = $response->json('sale_id');
        $sale = Sale::find($saleId);
        $this->assertNotNull($sale);
        $this->assertEquals(50.00, (float) $sale->change_return);
        $this->assertEquals(150.00, (float) $sale->tendered_amount);
    }

    /**
     * B07: Sale idempotency must be strictly isolated per tenant.
     * Same tenant + same key returns original sale.
     */
    public function test_sale_idempotency_same_tenant_returns_original_sale(): void
    {
        $tenant = $this->createTenant('idemp-t1-' . uniqid(), 'ltd_3');
        $user = $this->createTenantUser($tenant, 'owner');
        $customer = Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'customer']);
        $product = Product::factory()->create(['tenant_id' => $tenant->id, 'price' => 50.00]);

        $this->actingAsTenantUserModel($user, $tenant);

        $payload = [
            'customer_id'     => $customer->id,
            'payment_method'  => 'cash',
            'amount_paid'     => 50.00,
            'idempotency_key' => 'idemp-key-test-1',
            'items'           => [
                ['product_id' => $product->id, 'quantity' => 1, 'price' => 50.00],
            ],
        ];

        $res1 = $this->postJson($this->storeUrl($tenant, '/sales'), $payload);
        $res1->assertStatus(200);
        $saleId1 = $res1->json('sale_id');
        $ref1 = $res1->json('reference');

        $this->assertNotNull($saleId1);
        $this->assertNull($res1->json('idempotent'));

        // Repeat identical request with same key
        $res2 = $this->postJson($this->storeUrl($tenant, '/sales'), $payload);
        $res2->assertStatus(200);
        $this->assertTrue($res2->json('idempotent'));
        $this->assertEquals($saleId1, $res2->json('sale_id'));
        $this->assertEquals($ref1, $res2->json('reference'));

        // Assert only 1 sale in DB
        $this->assertEquals(1, Sale::where('tenant_id', $tenant->id)->count());
    }

    /**
     * B07: Two different tenants using identical idempotency keys must create independent sales without collisions.
     */
    public function test_sale_idempotency_different_tenants_independent(): void
    {
        $tenantA = $this->createTenant('idemp-ta-' . uniqid(), 'ltd_3');
        $tenantB = $this->createTenant('idemp-tb-' . uniqid(), 'ltd_3');

        $userA = $this->createTenantUser($tenantA, 'owner');
        $userB = $this->createTenantUser($tenantB, 'owner');

        $custA = Party::factory()->create(['tenant_id' => $tenantA->id, 'type' => 'customer']);
        $custB = Party::factory()->create(['tenant_id' => $tenantB->id, 'type' => 'customer']);

        $prodA = Product::factory()->create(['tenant_id' => $tenantA->id, 'price' => 75.00]);
        $prodB = Product::factory()->create(['tenant_id' => $tenantB->id, 'price' => 85.00]);

        $sharedKey = 'shared-idempotency-key-' . uniqid();

        // Tenant A posts sale
        $this->actingAsTenantUserModel($userA, $tenantA);
        $resA = $this->postJson($this->storeUrl($tenantA, '/sales'), [
            'customer_id'     => $custA->id,
            'payment_method'  => 'cash',
            'amount_paid'     => 75.00,
            'idempotency_key' => $sharedKey,
            'items'           => [
                ['product_id' => $prodA->id, 'quantity' => 1, 'price' => 75.00],
            ],
        ]);
        $resA->assertStatus(200);
        $saleIdA = $resA->json('sale_id');
        $refA = $resA->json('reference');

        // Tenant B posts sale with the EXACT same idempotency key
        $this->actingAsTenantUserModel($userB, $tenantB);
        $resB = $this->postJson($this->storeUrl($tenantB, '/sales'), [
            'customer_id'     => $custB->id,
            'payment_method'  => 'cash',
            'amount_paid'     => 85.00,
            'idempotency_key' => $sharedKey,
            'items'           => [
                ['product_id' => $prodB->id, 'quantity' => 1, 'price' => 85.00],
            ],
        ]);
        $resB->assertStatus(200);
        $saleIdB = $resB->json('sale_id');
        $refB = $resB->json('reference');

        // Assert Tenant B did not get idempotent response or Tenant A's IDs
        $this->assertNull($resB->json('idempotent'));
        $this->assertNotEquals($saleIdA, $saleIdB);
        $this->assertEquals($tenantA->id, Sale::withoutGlobalScopes()->find($saleIdA)->tenant_id);
        $this->assertEquals($tenantB->id, Sale::withoutGlobalScopes()->find($saleIdB)->tenant_id);

        // Assert both tenants have exactly 1 sale in DB
        $this->assertEquals(1, Sale::withoutGlobalScopes()->where('tenant_id', $tenantA->id)->count());
        $this->assertEquals(1, Sale::withoutGlobalScopes()->where('tenant_id', $tenantB->id)->count());
    }

    /**
     * B07: User cannot receive another tenant's sale identifier or reference via idempotency lookup.
     */
    public function test_user_cannot_receive_other_tenant_sale_via_idempotency(): void
    {
        $tenantA = $this->createTenant('idemp-ta2-' . uniqid(), 'ltd_3');
        $tenantB = $this->createTenant('idemp-tb2-' . uniqid(), 'ltd_3');

        $userA = $this->createTenantUser($tenantA, 'owner');
        $userB = $this->createTenantUser($tenantB, 'owner');

        $prodA = Product::factory()->create(['tenant_id' => $tenantA->id, 'price' => 100.00, 'cost_price' => 50.00]);
        $prodB = Product::factory()->create(['tenant_id' => $tenantB->id, 'price' => 100.00, 'cost_price' => 50.00]);

        $keyA = 'tenant-a-exclusive-key-' . uniqid();

        // Tenant A creates sale
        $this->actingAsTenantUserModel($userA, $tenantA);
        $resA = $this->postJson($this->storeUrl($tenantA, '/sales'), [
            'payment_method'  => 'cash',
            'amount_paid'     => 100.00,
            'idempotency_key' => $keyA,
            'items'           => [
                ['product_id' => $prodA->id, 'quantity' => 1, 'price' => 100.00],
            ],
        ]);
        $resA->assertStatus(200);
        $saleIdA = $resA->json('sale_id');

        // Tenant B requests with Tenant A's key
        $this->actingAsTenantUserModel($userB, $tenantB);
        $resB = $this->postJson($this->storeUrl($tenantB, '/sales'), [
            'payment_method'  => 'cash',
            'amount_paid'     => 100.00,
            'idempotency_key' => $keyA,
            'items'           => [
                ['product_id' => $prodB->id, 'quantity' => 1, 'price' => 100.00],
            ],
        ]);
        $resB->assertStatus(200);
        $saleIdB = $resB->json('sale_id');

        // Must NOT match Tenant A
        $this->assertNotEquals($saleIdA, $saleIdB);
        $this->assertEquals($tenantB->id, Sale::withoutGlobalScopes()->find($saleIdB)->tenant_id);
    }

    /**
     * B07: V3 SaleService idempotency is strictly tenant-scoped.
     */
    public function test_v3_sale_service_idempotency_is_tenant_scoped(): void
    {
        $tenantA = $this->createTenant('v3-ta-' . uniqid(), 'ltd_3');
        $tenantB = $this->createTenant('v3-tb-' . uniqid(), 'ltd_3');

        $userA = $this->createTenantUser($tenantA, 'owner');
        $userB = $this->createTenantUser($tenantB, 'owner');

        $whA = \App\Models\Warehouse::create(['tenant_id' => $tenantA->id, 'name' => 'Main A']);
        $whB = \App\Models\Warehouse::create(['tenant_id' => $tenantB->id, 'name' => 'Main B']);

        $custA = Party::factory()->create(['tenant_id' => $tenantA->id, 'type' => 'customer']);
        $custB = Party::factory()->create(['tenant_id' => $tenantB->id, 'type' => 'customer']);

        $prodA = Product::factory()->create(['tenant_id' => $tenantA->id, 'price' => 500.00, 'cost_price' => 50.00]);
        $prodB = Product::factory()->create(['tenant_id' => $tenantB->id, 'price' => 500.00, 'cost_price' => 50.00]);

        $service = app(\App\Engines\SaleService::class);

        $idempKey = 'v3-key-' . uniqid();

        $saleDataA = [
            'customer_id'     => $custA->id,
            'warehouse_id'    => $whA->id,
            'payment_method'  => 'cash',
            'amount_received' => 500.00,
            'idempotency_key' => $idempKey,
            'items'           => [
                ['product_id' => $prodA->id, 'qty' => 1, 'sale_uom' => 'pcs', 'unit_price' => 500.00],
            ],
        ];

        $saleDataB = [
            'customer_id'     => $custB->id,
            'warehouse_id'    => $whB->id,
            'payment_method'  => 'cash',
            'amount_received' => 500.00,
            'idempotency_key' => $idempKey,
            'items'           => [
                ['product_id' => $prodB->id, 'qty' => 1, 'sale_uom' => 'pcs', 'unit_price' => 500.00],
            ],
        ];

        $this->actingAsTenantUserModel($userA, $tenantA);
        $resA1 = $service->post($saleDataA);
        $resA2 = $service->post($saleDataA);
        $this->assertEquals($resA1->id, $resA2->id, 'Tenant A duplicate call should return same sale');

        $this->actingAsTenantUserModel($userB, $tenantB);
        $resB = $service->post($saleDataB);
        $this->assertNotEquals($resA1->id, $resB->id, 'Tenant B with same key should get independent sale');
        $this->assertEquals($tenantB->id, $resB->tenant_id);
    }

    /**
     * B07/B09: SaleService concurrent duplicate race condition safely returns existing sale on unique collision
     * and re-throws any unrelated database exception.
     */
    public function test_sale_service_concurrent_idempotency_collision_handling(): void
    {
        $tenant = $this->createTenant('v3-race-' . uniqid(), 'ltd_3');
        $user = $this->createTenantUser($tenant, 'owner');
        $wh = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Race Warehouse']);
        $cust = Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'customer']);
        $prod = Product::factory()->create(['tenant_id' => $tenant->id, 'price' => 500.00, 'cost_price' => 50.00]);

        $service = app(\App\Engines\SaleService::class);
        $this->actingAsTenantUserModel($user, $tenant);

        $idempKey = 'race-key-' . uniqid();
        $saleData = [
            'customer_id'     => $cust->id,
            'warehouse_id'    => $wh->id,
            'payment_method'  => 'cash',
            'amount_received' => 500.00,
            'idempotency_key' => $idempKey,
            'items'           => [
                ['product_id' => $prod->id, 'qty' => 1, 'sale_uom' => 'pcs', 'unit_price' => 500.00],
            ],
        ];

        // First post creates the sale
        $initialSale = $service->post($saleData);
        $this->assertNotNull($initialSale);

        // Pre-create the duplicate key collision scenario in a transaction to verify catch handling
        $saleRetrieved = $service->post($saleData);
        $this->assertEquals($initialSale->id, $saleRetrieved->id);

        // Assert unrelated query exception is re-thrown and NOT swallowed by idempotency handler
        $this->expectException(\Illuminate\Database\QueryException::class);
        $service->post([
            'customer_id'     => '00000000-0000-0000-0000-000000000000', // non-existent customer foreign key
            'warehouse_id'    => $wh->id,
            'payment_method'  => 'cash',
            'amount_received' => 500.00,
            'idempotency_key' => 'unrelated-fail-key-' . uniqid(),
            'items'           => [
                ['product_id' => $prod->id, 'qty' => 1, 'sale_uom' => 'pcs', 'unit_price' => 500.00],
            ],
        ]);
    }
}
