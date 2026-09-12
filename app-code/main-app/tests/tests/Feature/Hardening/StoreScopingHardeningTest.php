<?php

namespace Tests\Feature\Hardening;

use App\Engines\AccountingService;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * Store-scoping & approval hardening (2026-09-10).
 *
 * Every test runs with two stores: A (the current store, logged in as its
 * owner) and B (a foreign store). Ids that belong to B — or to the wrong
 * customer/employee inside A — must be refused with a 4xx, never a 500 and
 * never a posting.
 */
class StoreScopingHardeningTest extends VenQoreTestCase
{
    private const OWNER_PIN   = '111111';
    private const MANAGER_PIN = '246810';

    private Tenant $tenant;
    private Tenant $other;
    private User $owner;
    private string $warehouseId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create(['plan' => 'ltd_3', 'status' => 'active', 'trial_ends_at' => null]);
        $this->other  = Tenant::factory()->create(['plan' => 'ltd_3', 'status' => 'active', 'trial_ends_at' => null]);

        $this->seedTenantDefaults($this->other);
        $this->seedTenantDefaults($this->tenant);

        $this->owner = $this->member($this->tenant, 'owner', self::OWNER_PIN);
        $this->actingAsTenantUserModel($this->owner, $this->tenant);

        $this->warehouseId = (string) (DB::table('warehouses')->where('tenant_id', $this->tenant->id)->where('is_default', 1)->value('id')
            ?: $this->seedWarehouse($this->tenant));
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. Customer payments — party and invoice must be this store's, and
    //    the invoice must be the paying customer's.
    // ═══════════════════════════════════════════════════════════════════

    #[Test]
    public function customer_payment_refuses_another_stores_customer(): void
    {
        $foreignCustomer = $this->party($this->other, 'customer');
        $sale = $this->creditSale($this->tenant, $this->party($this->tenant, 'customer'), 500);

        $this->postJson($this->v3('customer-payments'), $this->payment($foreignCustomer, $sale, 100))
            ->assertStatus(422)
            ->assertJsonValidationErrors('customer_id');

        $this->assertNoCustomerPaymentPosted();
    }

    #[Test]
    public function customer_payment_refuses_another_stores_sale_without_a_500(): void
    {
        $customer     = $this->party($this->tenant, 'customer');
        $foreignSale  = $this->creditSale($this->other, $this->party($this->other, 'customer'), 500);

        // JSON caller: a validation error, not the old InvalidArgumentException 500
        $this->postJson($this->v3('customer-payments'), $this->payment($customer, $foreignSale, 100))
            ->assertStatus(422)
            ->assertJsonValidationErrors('allocations.0.sale_id');

        // Web (Inertia) caller: redirect back with the error
        $this->from('/x')->post($this->v3('customer-payments'), $this->payment($customer, $foreignSale, 100))
            ->assertRedirect('/x')
            ->assertSessionHasErrors('allocations.0.sale_id');

        $this->assertNoCustomerPaymentPosted();
        $this->assertSame(0, DB::table('allocations')->where('sale_id', $foreignSale)->count());
        $this->assertSame('unpaid', DB::table('sales')->where('id', $foreignSale)->value('payment_status'));
    }

    #[Test]
    public function customer_payment_refuses_an_invoice_of_another_customer(): void
    {
        $payer       = $this->party($this->tenant, 'customer');
        $someoneElse = $this->party($this->tenant, 'customer');
        $theirSale   = $this->creditSale($this->tenant, $someoneElse, 500);

        $this->postJson($this->v3('customer-payments'), $this->payment($payer, $theirSale, 100))
            ->assertStatus(422)
            ->assertJsonValidationErrors('allocations.0.sale_id');

        $this->assertNoCustomerPaymentPosted();
        $this->assertSame(0, DB::table('allocations')->where('sale_id', $theirSale)->count());

        // Control: the right customer paying their own invoice still works.
        $ownSale = $this->creditSale($this->tenant, $payer, 300);
        $this->from('/x')->post($this->v3('customer-payments'), $this->payment($payer, $ownSale, 100))
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('allocations', [
            'tenant_id' => $this->tenant->id, 'sale_id' => $ownSale, 'allocated_amount' => 100.00, 'status' => 'active',
        ]);
        $this->assertSame('partial', DB::table('sales')->where('id', $ownSale)->value('payment_status'));
    }

    #[Test]
    public function supplier_payment_refuses_foreign_supplier_foreign_bill_and_another_suppliers_bill(): void
    {
        $supplier        = $this->party($this->tenant, 'supplier');
        $otherSupplier   = $this->party($this->tenant, 'supplier');
        $foreignSupplier = $this->party($this->other, 'supplier');

        $ownBill     = $this->creditPurchase($this->tenant, $supplier, 400);
        $theirBill   = $this->creditPurchase($this->tenant, $otherSupplier, 400);
        $foreignBill = $this->creditPurchase($this->other, $foreignSupplier, 400);

        $pay = fn (string $supplierId, string $purchaseId) => $this->postJson($this->v3('supplier-payments'), [
            'supplier_id' => $supplierId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => 100,
            'allocations' => [['purchase_id' => $purchaseId, 'amount' => 100]],
        ]);

        $pay($foreignSupplier, $ownBill)->assertStatus(422)->assertJsonValidationErrors('supplier_id');
        $pay($supplier, $foreignBill)->assertStatus(422)->assertJsonValidationErrors('allocations.0.purchase_id');
        $pay($supplier, $theirBill)->assertStatus(422)->assertJsonValidationErrors('allocations.0.purchase_id');

        $this->assertSame(0, DB::table('journal_entries')->whereIn('tenant_id', [$this->tenant->id, $this->other->id])->where('reference_type', 'supplier_payment')->count());
        $this->assertSame(0, DB::table('allocations')->whereIn('tenant_id', [$this->tenant->id, $this->other->id])->whereNotNull('purchase_id')->count());

        // Control: paying the supplier's own bill still works.
        $pay($supplier, $ownBill)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('allocations', ['tenant_id' => $this->tenant->id, 'purchase_id' => $ownBill, 'allocated_amount' => 100.00]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Raw inserts must stamp tenant_id (UOM conversions)
    // ═══════════════════════════════════════════════════════════════════

    #[Test]
    public function uom_conversion_is_saved_for_its_own_store_only(): void
    {
        $productId = $this->product($this->tenant);

        $this->from('/x')->post($this->v3("products/{$productId}/uom"), ['sale_uom' => 'box', 'conversion_factor' => 12])
            ->assertSessionHasNoErrors();

        $row = DB::table('product_uom_conversions')->where('product_id', $productId)->first();
        $this->assertNotNull($row);
        $this->assertSame((string) $this->tenant->id, (string) $row->tenant_id, 'The conversion must carry the store id (was NULL).');

        // Visible to its own store: the controller's own duplicate check now sees it.
        $this->from('/x')->post($this->v3("products/{$productId}/uom"), ['sale_uom' => 'BOX', 'conversion_factor' => 10])
            ->assertSessionHasErrors('sale_uom');
        $this->assertSame(1, DB::table('product_uom_conversions')->where('tenant_id', $this->tenant->id)->where('product_id', $productId)->count());

        // Invisible to another store.
        $this->assertSame(0, DB::table('product_uom_conversions')->where('tenant_id', $this->other->id)->count());

        // Another store's user cannot attach a conversion to this store's product.
        $foreignOwner = $this->member($this->other, 'owner');
        $this->actingAsTenantUserModel($foreignOwner, $this->other);
        $this->from('/x')->post("/s/{$this->other->slug}/v3/products/{$productId}/uom", ['sale_uom' => 'CTN', 'conversion_factor' => 24])
            ->assertNotFound();
        $this->assertSame(0, DB::table('product_uom_conversions')->whereIn('tenant_id', [$this->tenant->id, $this->other->id])->where('sale_uom', 'CTN')->count());
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Payroll — employee must be this store's; advance deduction is
    //    capped at THAT employee's own outstanding advance.
    // ═══════════════════════════════════════════════════════════════════

    #[Test]
    public function payroll_refuses_another_stores_employee(): void
    {
        $foreignEmployee = $this->employee($this->other, 'Foreign Worker');

        $this->postJson($this->v3('payroll/pay'), [
            'employee_id' => $foreignEmployee, 'payment_date' => now()->toDateString(),
            'gross_salary' => 1000, 'payment_method' => 'cash',
        ])->assertStatus(422)->assertJsonValidationErrors('employee_id');

        $this->postJson($this->v3('payroll/accrue'), [
            'period' => now()->format('Y-m'), 'accrual_date' => now()->toDateString(),
            'lines'  => [['employee_id' => $foreignEmployee, 'gross_salary' => 1000]],
        ])->assertStatus(422)->assertJsonValidationErrors('lines.0.employee_id');

        $this->postJson($this->v3('employee-settlements'), [
            'employee_id' => $foreignEmployee, 'settlement_date' => now()->toDateString(),
            'payment_method' => 'cash', 'partial_month_salary' => 500,
        ])->assertStatus(422)->assertJsonValidationErrors('employee_id');

        $this->assertSame(0, DB::table('journal_entries')
            ->whereIn('reference_type', ['salary_payment', 'salary_accrual', 'settlement_accrual', 'settlement_payment'])->count());
    }

    #[Test]
    public function payroll_advance_deduction_is_limited_to_the_employees_own_advance(): void
    {
        $alice = $this->employee($this->tenant, 'Alice');
        $bob   = $this->employee($this->tenant, 'Bob');

        // Bob has a large advance; Alice a small one.
        $this->advance($bob, 10000.00);
        $this->advance($alice, 500.00);

        // Alice cannot have 2,000 recovered — Bob's advance is not hers.
        $this->from('/x')->post($this->v3('payroll/pay'), [
            'employee_id' => $alice, 'payment_date' => now()->toDateString(),
            'gross_salary' => 5000, 'advance_deduction' => 2000, 'payment_method' => 'cash',
        ])->assertSessionHasErrors('advance_deduction');
        $this->assertSame(0, DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->where('reference_type', 'salary_payment')->count());

        // Her own 500 can be recovered.
        $this->from('/x')->post($this->v3('payroll/pay'), [
            'employee_id' => $alice, 'payment_date' => now()->toDateString(),
            'gross_salary' => 5000, 'advance_deduction' => 500, 'payment_method' => 'cash',
        ])->assertSessionHasNoErrors();

        // ...and once recovered, not again (even though Bob still owes 10,000).
        $this->from('/x')->post($this->v3('payroll/pay'), [
            'employee_id' => $alice, 'payment_date' => now()->toDateString(),
            'gross_salary' => 5000, 'advance_deduction' => 100, 'payment_method' => 'cash',
        ])->assertSessionHasErrors('advance_deduction');

        // Same cap on final settlement.
        $this->from('/x')->post($this->v3('employee-settlements'), [
            'employee_id' => $alice, 'settlement_date' => now()->toDateString(), 'payment_method' => 'cash',
            'partial_month_salary' => 3000, 'advance_deduction' => 1000,
        ])->assertSessionHasErrors('advance_deduction');
        $this->assertSame('active', DB::table('employees')->where('id', $alice)->value('status'));

        // Bob's own advance is still fully recoverable from Bob.
        $this->from('/x')->post($this->v3('payroll/pay'), [
            'employee_id' => $bob, 'payment_date' => now()->toDateString(),
            'gross_salary' => 12000, 'advance_deduction' => 10000, 'payment_method' => 'cash',
        ])->assertSessionHasNoErrors();

        $this->assertSame(2, DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->where('reference_type', 'salary_payment')->count());
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. Sales order → invoice: approved_by must be a verified manager approval
    // ═══════════════════════════════════════════════════════════════════

    #[Test]
    public function sales_order_conversion_below_cost_requires_a_verified_manager_approval(): void
    {
        $customer  = $this->party($this->tenant, 'customer');
        $productId = $this->product($this->tenant, 100.00, 60.00);
        $this->batch($this->tenant, $productId, 10, 60.00);

        // Order taken at 50/unit — below the 60 FIFO cost.
        $this->from('/x')->post($this->v3('sales-orders'), [
            'customer_id' => $customer, 'warehouse_id' => $this->warehouseId, 'order_date' => now()->toDateString(),
            'items' => [['product_id' => $productId, 'qty' => 2, 'sale_uom' => 'PCS', 'unit_price' => 50.00]],
        ])->assertSessionHasNoErrors();
        $orderId = DB::table('sales_orders')->where('tenant_id', $this->tenant->id)->value('id');
        $this->assertNotNull($orderId);

        // A sales executive (can convert, cannot approve) does the conversion.
        $clerk = $this->member($this->tenant, 'sales_executive', '999999');
        $this->actingAsTenantUserModel($clerk, $this->tenant);

        $foreignManager = $this->member($this->other, 'manager', self::MANAGER_PIN);
        $manager        = $this->member($this->tenant, 'manager', self::MANAGER_PIN);
        $convert = fn (array $extra) => $this->from('/x')->post($this->v3("sales-orders/{$orderId}/convert"),
            ['payment_method' => 'credit', 'sale_date' => now()->toDateString()] + $extra);

        // (a) no approval → approved_by error, not a 500
        $convert([])->assertSessionHasErrors('approved_by');
        // (b) a manager of ANOTHER store, even with their correct PIN
        $convert(['approved_by' => (string) $foreignManager->id, 'approval_pin' => self::MANAGER_PIN])->assertSessionHasErrors('approved_by');
        // (c) any existing user id that is not a member (the old rule only checked exists:users,id)
        $outsider = User::factory()->create();
        $convert(['approved_by' => (string) $outsider->id])->assertSessionHasErrors('approved_by');
        // (d) the clerk approving their own conversion
        $convert(['approved_by' => (string) $clerk->id, 'approval_pin' => '999999'])->assertSessionHasErrors('approved_by');
        // (e) this store's manager without / with a wrong PIN
        $convert(['approved_by' => (string) $manager->id])->assertSessionHasErrors('approved_by');
        $convert(['approved_by' => (string) $manager->id, 'approval_pin' => '000000'])->assertSessionHasErrors('approved_by');

        $this->assertSame(0, DB::table('sales')->where('tenant_id', $this->tenant->id)->count(), 'No below-cost invoice without a verified approval.');
        $this->assertSame('open', DB::table('sales_orders')->where('id', $orderId)->value('status'));

        // (f) this store's manager + correct PIN → converts
        $convert(['approved_by' => (string) $manager->id, 'approval_pin' => self::MANAGER_PIN])->assertSessionHasNoErrors();

        $sale = DB::table('sales')->where('tenant_id', $this->tenant->id)->where('source_order_id', $orderId)->first();
        $this->assertNotNull($sale);
        $this->assertEqualsWithDelta(100.00, (float) $sale->invoice_total, 0.001);
        $this->assertSame('converted', DB::table('sales_orders')->where('id', $orderId)->value('status'));
        $je = DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->where('reference_type', 'sale')->where('reference', $sale->id)->first();
        $this->assertSame((string) $manager->id, (string) $je->approved_by);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Fiscal year close — the owner may approve (owner ⊇ admin)
    // ═══════════════════════════════════════════════════════════════════

    #[Test]
    public function fiscal_year_close_accepts_the_owner_as_approver_but_not_a_manager_or_cashier(): void
    {
        $accounting = app(AccountingService::class);
        $accounting->getAccountByCode('3100', 'Retained Earnings', 'equity');
        $accounting->createEntry([
            'date' => now()->toDateString(), 'reference_type' => 'manual', 'reference' => 'FY-TEST',
            'description' => 'Cash sale',
        ], [
            ['account_code' => '1000', 'debit' => 250.00, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 250.00],
        ]);

        $manager = $this->member($this->tenant, 'manager');
        $cashier = $this->member($this->tenant, 'cashier');
        $foreignOwner = $this->member($this->other, 'owner');

        foreach ([$manager, $cashier, $foreignOwner] as $notAllowed) {
            $this->postJson($this->v3('fiscal-year/close'), [
                'fiscal_year_end' => now()->toDateString(), 'approved_by' => $notAllowed->id,
            ])->assertSessionHasErrors('approved_by');
        }
        $this->assertSame(0, DB::table('journal_entries')->whereIn('tenant_id', [$this->tenant->id, $this->other->id])->where('reference_type', 'fiscal_year_close')->count());

        $this->postJson($this->v3('fiscal-year/close'), [
            'fiscal_year_end' => now()->toDateString(), 'approved_by' => $this->owner->id,
        ])->assertSessionHasNoErrors();

        $close = DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->where('reference_type', 'fiscal_year_close')->first();
        $this->assertNotNull($close, 'The owner-approved close must post.');
        $this->assertSame((string) $this->owner->id, (string) $close->approved_by);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. users has no tenant_id — owner lookups go through tenant_users
    // ═══════════════════════════════════════════════════════════════════

    #[Test]
    public function hosted_until_expiry_job_mails_the_store_owner(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $this->travelTo(now()->startOfDay()->addHours(9));
        $this->tenant->forceFill(['hosted_until' => now()->addDays(30)->addHours(2)])->save();

        (new \App\Jobs\CheckHostedUntilExpiryJob())->handle(); // was a SQL error (users.tenant_id)

        \Illuminate\Support\Facades\Mail::assertQueued(\App\Mail\SubscriptionExpiryReminderMail::class,
            fn ($mail) => $mail->hasTo($this->owner->email) && (int) $mail->tenant->id === (int) $this->tenant->id);
    }

    #[Test]
    public function owner_daily_pulse_snapshot_resolves_the_store_owner_without_users_tenant_id(): void
    {
        app(AccountingService::class)->createEntry([
            'date' => now()->toDateString(), 'reference_type' => 'manual', 'reference' => 'PULSE-TEST',
            'description' => 'Cash sale',
        ], [
            ['account_code' => '1000', 'debit' => 250.00, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 250.00],
        ]);

        // Was: User::where('tenant_id', …) — a SQL error, users has no tenant_id.
        $snapshot = app(\App\Services\OwnerDailyPulseService::class)->captureSnapshot($this->tenant, now()->toDateString());

        $this->assertNotNull($snapshot);
        $this->assertSame((string) $this->tenant->id, (string) $snapshot->tenant_id);
        $this->assertEqualsWithDelta(250.00, (float) $snapshot->sales_value, 0.001, 'Readings must be read back from the Reckoner results.');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private function v3(string $path): string
    {
        return "/s/{$this->tenant->slug}/v3/{$path}";
    }

    private function member(Tenant $tenant, string $role, ?string $pin = null): User
    {
        $user = User::factory()->create(['last_store_id' => $tenant->id]);
        TenantUser::create([
            'tenant_id'    => $tenant->id,
            'user_id'      => $user->id,
            'role'         => $role,
            'status'       => 'active',
            'display_name' => $user->name,
            'joined_at'    => now(),
            'security_pin' => $pin ? Hash::make($pin) : null,
        ]);
        return $user;
    }

    private function party(Tenant $tenant, string $type): string
    {
        $id = (string) Str::uuid();
        DB::table('parties')->insert([
            'id' => $id, 'tenant_id' => $tenant->id, 'name' => ucfirst($type) . ' ' . Str::random(5),
            'type' => $type, 'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    private function creditSale(Tenant $tenant, string $partyId, float $total): string
    {
        $id = (string) Str::uuid();
        DB::table('sales')->insert([
            'id' => $id, 'tenant_id' => $tenant->id, 'reference_number' => 'SAL-' . Str::random(8),
            'party_id' => $partyId, 'warehouse_id' => $this->warehouseId,
            'subtotal' => $total, 'total' => $total, 'invoice_total' => $total,
            'status' => 'posted', 'payment_status' => 'unpaid',
            'user_id' => $this->owner->id, 'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    private function creditPurchase(Tenant $tenant, string $supplierId, float $total): string
    {
        $id = (string) Str::uuid();
        DB::table('purchases')->insert([
            'id' => $id, 'tenant_id' => $tenant->id, 'party_id' => $supplierId, 'warehouse_id' => $this->warehouseId,
            'invoice_number' => 'PUR-' . Str::random(8), 'purchase_date' => now()->toDateString(),
            'subtotal' => $total, 'total' => $total, 'payment_status' => 'unpaid', 'payment_method' => 'credit',
            'user_id' => $this->owner->id, 'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    private function payment(string $customerId, string $saleId, float $amount): array
    {
        return [
            'customer_id' => $customerId, 'payment_date' => now()->toDateString(),
            'payment_method' => 'cash', 'amount' => $amount,
            'allocations' => [['sale_id' => $saleId, 'amount' => $amount]],
        ];
    }

    private function assertNoCustomerPaymentPosted(): void
    {
        $this->assertSame(0, DB::table('journal_entries')->whereIn('tenant_id', [$this->tenant->id, $this->other->id])->where('reference_type', 'customer_payment')->count(),
            'No customer payment may be posted.');
    }

    private function product(Tenant $tenant, float $price = 100.00, float $cost = 60.00): string
    {
        $id = (string) Str::uuid();
        DB::table('products')->insert([
            'id' => $id, 'tenant_id' => $tenant->id, 'name' => 'Widget ' . Str::random(4),
            'sku' => 'W-' . Str::random(8), 'price' => $price, 'cost_price' => $cost,
            'base_unit' => 'PCS', 'stock_quantity' => 0, 'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    private function batch(Tenant $tenant, string $productId, float $qty, float $cost): void
    {
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $tenant->id,
            'product_id' => $productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => $qty, 'initial_qty' => $qty,
            'remaining_qty' => $qty, 'unit_cost' => $cost,
            'created_at' => now()->subDay(), 'updated_at' => now()->subDay(),
        ]);
    }

    private function employee(Tenant $tenant, string $name): string
    {
        $id = (string) Str::uuid();
        DB::table('employees')->insert([
            'id' => $id, 'tenant_id' => $tenant->id, 'name' => $name, 'monthly_salary' => 5000,
            'hire_date' => now()->subYear()->toDateString(), 'status' => 'active',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    /** Employee advance (DR 1350 / CR 1000) referenced to the employee, as S-078 posts it. */
    private function advance(string $employeeId, float $amount): void
    {
        $accounting = app(AccountingService::class);
        $accounting->getAccountByCode('1350', 'Employee Advance', 'asset');
        $accounting->createEntry([
            'date' => now()->toDateString(), 'reference_type' => 'employee_advance',
            'reference' => $employeeId, 'description' => 'Salary advance',
        ], [
            ['account_code' => '1350', 'debit' => $amount, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0, 'credit' => $amount],
        ]);
    }

    private function seedWarehouse(Tenant $tenant): string
    {
        $id = (string) Str::uuid();
        DB::table('warehouses')->insert([
            'id' => $id, 'tenant_id' => $tenant->id, 'name' => 'Default Warehouse', 'is_default' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }
}
