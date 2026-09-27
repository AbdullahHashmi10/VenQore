<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\ApprovalReturnReason;
use App\Models\BankAccount;
use App\Models\Category;
use App\Models\DebitNote;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\JournalEntry;
use App\Models\Party;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\CanonicalPostingScope;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

class FourteenOperationsHttpWorkflowTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $owner;
    private User $manager;
    private User $staffUser;
    private Warehouse $warehouse;
    private BankAccount $bankAccount;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('http-14op-' . uniqid(), 'ltd_3');
        $this->seedTenantDefaults($this->tenant);
        ApprovalReturnReason::seedDefaultReasons($this->tenant->id);

        $this->owner = $this->createTenantUser($this->tenant, 'owner');
        $this->manager = $this->createTenantUser($this->tenant, 'manager');
        $this->staffUser = $this->createTenantUser($this->tenant, 'cashier');

        // Create warehouse
        $this->warehouse = Warehouse::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Primary Depot',
        ]);

        // Create bank account
        $this->bankAccount = BankAccount::create([
            'tenant_id'       => $this->tenant->id,
            'name'            => 'Operating Account',
            'bank_name'       => 'Allied Bank',
            'account_number'  => 'PK88ALB000123456789',
            'account_type'    => 'current',
            'opening_balance' => 100000.00,
            'current_balance' => 100000.00,
        ]);
    }

    private function setApprovalMode(User $user, string $mode): void
    {
        TenantUser::where('tenant_id', $this->tenant->id)
            ->where('user_id', $user->id)
            ->update(['transaction_approval_mode' => $mode]);
    }

    private function grantPermissions(User $user, array $permissions): void
    {
        TenantUser::where('tenant_id', $this->tenant->id)
            ->where('user_id', $user->id)
            ->update([
                'permissions'              => $permissions,
                'permission_override_mode' => 'custom',
            ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. V3 Bank Transfers: Permission, Direct Mode, Approval Gate & Single Posting
    // ─────────────────────────────────────────────────────────────────────────
    public function test_v3_bank_transfer_permission_direct_and_approval_workflow(): void
    {
        $payload = [
            'description'   => 'Transfer till cash to bank',
            'transfer_date' => now()->toDateString(),
            'amount'        => 5000.00,
            'from_account'  => '1000',
            'to_account'    => '1010',
        ];

        // 1. Staff lacking finance.internal_transfer receives 403
        $unauthStaff = $this->staffUser; // cashier has no finance.internal_transfer
        $res403 = $this->actingAsTenantUserModel($unauthStaff, $this->tenant)
            ->post("/s/{$this->tenant->slug}/v3/bank-transfers", $payload);
        $res403->assertStatus(403);

        // 2. Give staff permission but put in approval mode = 'required'
        $this->grantPermissions($unauthStaff, ['finance.internal_transfer']);
        $this->setApprovalMode($unauthStaff, 'required');

        $glCountBefore = JournalEntry::where('tenant_id', $this->tenant->id)->count();

        $resPending = $this->actingAsTenantUserModel($unauthStaff, $this->tenant)
            ->post("/s/{$this->tenant->slug}/v3/bank-transfers", $payload);
        $resPending->assertRedirect();
        $resPending->assertSessionHas('info');

        // Zero GL entries posted while pending
        $this->assertSame($glCountBefore, JournalEntry::where('tenant_id', $this->tenant->id)->count());

        $doc = ApprovalDocument::where('tenant_id', $this->tenant->id)
            ->where('document_type', ApprovalDocument::TYPE_FUND_TRANSFER)
            ->latest('id')
            ->firstOrFail();
        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertSame(5000.00, (float)$doc->amount);

        // 3. Reviewer approves -> exactly ONE GL entry posted
        $resApprove = $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$doc->id}/approve", [
                'expected_version' => 1,
            ]);
        $resApprove->assertOk();
        $this->assertSame($glCountBefore + 1, JournalEntry::where('tenant_id', $this->tenant->id)->count());
        $this->assertDatabaseHas('journal_entries', [
            'tenant_id'      => $this->tenant->id,
            'reference_type' => 'bank_transfer',
        ]);

        // 4. Owner posts direct -> posted immediately
        $resDirect = $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->post("/s/{$this->tenant->slug}/v3/bank-transfers", [
                'description'   => 'Owner direct transfer',
                'transfer_date' => now()->toDateString(),
                'amount'        => 2000.00,
                'from_account'  => '1010',
                'to_account'    => '1000',
            ]);
        $resDirect->assertRedirect();
        $this->assertSame($glCountBefore + 2, JournalEntry::where('tenant_id', $this->tenant->id)->count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. /funds/transfer: Permission, Direct Mode, Approval Gate & Single Posting
    // ─────────────────────────────────────────────────────────────────────────
    public function test_funds_transfer_permission_and_approval_workflow(): void
    {
        $payload = [
            'from_type'    => 'cash',
            'to_type'      => 'bank',
            'to_bank_id'   => $this->bankAccount->id,
            'amount'       => 1500.00,
            'reason'       => 'Safe deposit',
            'passcode'     => '123456',
        ];

        // 1. Staff lacking permission receives 403
        $res403 = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->post("/s/{$this->tenant->slug}/funds/transfer", $payload);
        $res403->assertStatus(403);

        // 2. Give staff permission and test required approval
        $this->grantPermissions($this->staffUser, ['finance.internal_transfer']);
        $this->setApprovalMode($this->staffUser, 'required');

        $glCountBefore = JournalEntry::where('tenant_id', $this->tenant->id)->count();

        $resPending = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->post("/s/{$this->tenant->slug}/funds/transfer", $payload);
        $resPending->assertRedirect();
        $resPending->assertSessionHas('info');

        $this->assertSame($glCountBefore, JournalEntry::where('tenant_id', $this->tenant->id)->count());

        $doc = ApprovalDocument::where('tenant_id', $this->tenant->id)
            ->where('document_type', ApprovalDocument::TYPE_FUND_TRANSFER)
            ->latest('id')
            ->firstOrFail();

        // 3. Approve
        $resApprove = $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$doc->id}/approve", [
                'expected_version' => 1,
            ]);
        $resApprove->assertOk();
        $this->assertSame($glCountBefore + 1, JournalEntry::where('tenant_id', $this->tenant->id)->count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Customer Receipt: Permission, Direct, Approval Gate & Single Posting
    // ─────────────────────────────────────────────────────────────────────────
    public function test_customer_receipt_http_permission_and_approval(): void
    {
        $customer = Party::create(['tenant_id' => $this->tenant->id, 'name' => 'Cust 1', 'type' => 'customer']);

        $category = Category::firstOrCreate(['tenant_id' => $this->tenant->id, 'name' => 'Services']);
        $product = Product::create([
            'tenant_id'   => $this->tenant->id,
            'name'        => 'Consulting',
            'sku'         => 'CNS-01',
            'price'       => 1000.00,
            'unit'        => 'pcs',
            'base_unit'   => 'pcs',
            'category_id' => $category->id,
            'type'        => 'service',
        ]);

        app()->instance('current.tenant', $this->tenant);
        $sale = app(\App\Engines\SaleService::class)->post([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->owner->id,
            'customer_id'    => $customer->id,
            'payment_method' => 'credit',
            'items'          => [
                ['product_id' => $product->id, 'qty' => 1, 'unit_price' => 1000.00, 'sale_uom' => 'pcs'],
            ],
        ]);

        $payload = [
            'customer_id'    => (string)$customer->id,
            'payment_date'   => now()->toDateString(),
            'payment_method' => 'cash',
            'amount'         => 1000.00,
            'reference'      => 'REC-01',
            'allocations'    => [
                ['sale_id' => (string)$sale->id, 'amount' => 1000.00],
            ],
        ];

        // 1. Staff lacking finance.receive_payment -> 403
        $res403 = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/customer-payments", $payload);
        $res403->assertStatus(403);

        // 2. Staff with permission and approval mode = required -> 202
        $this->grantPermissions($this->staffUser, ['finance.receive_payment']);
        $this->setApprovalMode($this->staffUser, 'required');

        $glBefore = JournalEntry::where('tenant_id', $this->tenant->id)->count();
        $res202 = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/customer-payments", $payload);
        $res202->assertStatus(202);
        $this->assertSame($glBefore, JournalEntry::where('tenant_id', $this->tenant->id)->count());

        $docId = $res202->json('approval_document_id');

        // 3. Reviewer approves -> 1 journal entry posted
        $resApprove = $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/approve", [
                'expected_version' => 1,
            ]);
        $resApprove->assertOk();
        $this->assertSame($glBefore + 1, JournalEntry::where('tenant_id', $this->tenant->id)->count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Supplier Payment: Permission, Direct, Approval Gate & Single Posting
    // ─────────────────────────────────────────────────────────────────────────
    public function test_supplier_payment_http_permission_and_approval(): void
    {
        $supplier = Party::create(['tenant_id' => $this->tenant->id, 'name' => 'Supp 1', 'type' => 'supplier']);
        $purchase = Purchase::create([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->owner->id,
            'party_id'       => $supplier->id,
            'warehouse_id'   => $this->warehouse->id,
            'purchase_date'  => now()->toDateString(),
            'payment_status' => 'unpaid',
            'payment_method' => 'credit',
            'subtotal'       => 2500.00,
            'total'          => 2500.00,
            'invoice_number' => 'PUR-4OP-01',
        ]);

        $payload = [
            'supplier_id'    => (string)$supplier->id,
            'payment_date'   => now()->toDateString(),
            'payment_method' => 'cash',
            'amount'         => 2500.00,
            'reference'      => 'SUPP-PAY-01',
            'allocations'    => [
                ['purchase_id' => (string)$purchase->id, 'amount' => 2500.00],
            ],
        ];

        // 1. Staff lacking finance.send_payment -> 403
        $res403 = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/supplier-payments", $payload);
        $res403->assertStatus(403);

        // 2. Staff with permission and approval mode = required -> 202
        $this->grantPermissions($this->staffUser, ['finance.send_payment']);
        $this->setApprovalMode($this->staffUser, 'required');

        $glBefore = JournalEntry::where('tenant_id', $this->tenant->id)->count();
        $res202 = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/supplier-payments", $payload);
        $res202->assertStatus(202);
        $this->assertSame($glBefore, JournalEntry::where('tenant_id', $this->tenant->id)->count());

        $docId = $res202->json('approval_document_id');

        // 3. Approve -> posts
        $resApprove = $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/approve", [
                'expected_version' => 1,
            ]);
        $resApprove->assertOk();
        $this->assertSame($glBefore + 1, JournalEntry::where('tenant_id', $this->tenant->id)->count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Operating Expense: HTTP Create, Approval Gate & Update/Delete Deadbolt
    // ─────────────────────────────────────────────────────────────────────────
    public function test_operating_expense_http_and_modification_deadbolt(): void
    {
        $cat = ExpenseCategory::create(['tenant_id' => $this->tenant->id, 'name' => 'Utilities']);

        $payload = [
            'description'    => 'Water Bill',
            'expense_date'   => now()->toDateString(),
            'amount'         => 350.00,
            'payment_method' => 'cash',
        ];

        // 1. Missing permission -> 403
        $res403 = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/expenses", $payload);
        $res403->assertStatus(403);

        // 2. Give permission and set approval mode = required
        $this->grantPermissions($this->staffUser, ['finance.expenses']);
        $this->setApprovalMode($this->staffUser, 'required');

        $glBefore = JournalEntry::where('tenant_id', $this->tenant->id)->count();
        $res202 = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/expenses", $payload);
        $res202->assertStatus(202);
        $this->assertSame($glBefore, JournalEntry::where('tenant_id', $this->tenant->id)->count());

        $docId = $res202->json('approval_document_id');

        // 3. Approve -> 1 entry
        $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/approve", ['expected_version' => 1])
            ->assertOk();
        $this->assertSame($glBefore + 1, JournalEntry::where('tenant_id', $this->tenant->id)->count());

        // 4. Test Update Deadbolt: an existing expense cannot be updated when approval is required
        $expense = Expense::create([
            'tenant_id'           => $this->tenant->id,
            'expense_category_id' => $cat->id,
            'category'            => $cat->name,
            'amount'              => 500.00,
            'grand_total'         => 500.00,
            'payment_method'      => 'cash',
            'date'                => now()->toDateString(),
        ]);

        $updateRes = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->putJson("/s/{$this->tenant->slug}/expenses/{$expense->id}", [
                'expense_category_id' => $cat->id,
                'amount'              => 600.00,
                'date'                => now()->toDateString(),
                'payment_method'      => 'cash',
            ]);
        $updateRes->assertStatus(422)
            ->assertJsonPath('message', 'When approval workflow is required, posted expenses cannot be directly modified.');

        // 5. Test Delete Deadbolt: an existing expense cannot be deleted when approval is required
        $deleteRes = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->deleteJson("/s/{$this->tenant->slug}/expenses/{$expense->id}");
        $deleteRes->assertStatus(422)
            ->assertJsonPath('message', 'When approval workflow is required, posted expenses cannot be directly deleted.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Purchase Posting: HTTP Create, Approval Gate & Update Deadbolt
    // ─────────────────────────────────────────────────────────────────────────
    public function test_purchase_posting_http_and_update_deadbolt(): void
    {
        $supplier = Party::create(['tenant_id' => $this->tenant->id, 'name' => 'Wholesale Supply', 'type' => 'supplier']);
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 100.00]);

        $payload = [
            'party_id'       => $supplier->id,
            'warehouse_id'   => $this->warehouse->id,
            'purchase_date'  => now()->toDateString(),
            'payment_method' => 'credit',
            'total'          => 1000.00,
            'items'          => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 10,
                    'unit_cost'  => 100.00,
                    'subtotal'   => 1000.00,
                ],
            ],
        ];

        // 1. Missing purchases.create -> 403
        $res403 = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/purchases", $payload);
        $res403->assertStatus(403);

        // 2. Staff with permission and approval mode = required -> 202
        $this->grantPermissions($this->staffUser, ['purchases.create']);
        $this->setApprovalMode($this->staffUser, 'required');

        $glBefore = JournalEntry::where('tenant_id', $this->tenant->id)->count();
        $stockBefore = DB::table('stocks')->where('tenant_id', $this->tenant->id)->count();

        $res202 = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/purchases", $payload);
        $res202->assertStatus(202)
            ->assertJsonPath('pending_approval', true);

        // Zero ledger and zero stock footprint while pending
        $this->assertSame($glBefore, JournalEntry::where('tenant_id', $this->tenant->id)->count());
        $this->assertSame($stockBefore, DB::table('stocks')->where('tenant_id', $this->tenant->id)->count());

        $docNumber = $res202->json('document_number');
        $doc = ApprovalDocument::where('document_number', $docNumber)->firstOrFail();

        // 3. Approve -> posts purchase and journal
        $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$doc->id}/approve", ['expected_version' => 1])
            ->assertOk();

        $this->assertSame($glBefore + 1, JournalEntry::where('tenant_id', $this->tenant->id)->count());

        // 4. Test Update Deadbolt: a posted purchase cannot be directly modified when approval is required
        $purchase = Purchase::where('tenant_id', $this->tenant->id)->latest('id')->firstOrFail();
        $this->grantPermissions($this->staffUser, ['purchases.create', 'purchases.edit']);

        $updateRes = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->putJson("/s/{$this->tenant->slug}/v3/purchases/{$purchase->id}", [
                'supplier_id'    => $supplier->id,
                'warehouse_id'   => $this->warehouse->id,
                'purchase_date'  => now()->toDateString(),
                'payment_method' => 'credit',
                'items'          => [
                    ['product_id' => $product->id, 'qty' => 12, 'unit_cost' => 100.00],
                ],
            ]);
        $updateRes->assertStatus(422)
            ->assertJsonPath('message', 'When approval workflow is required, posted purchases cannot be directly modified. Please void or return the purchase.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Generic Payment Screen: Block Standalone Customer/Supplier Refund Bypass
    // ─────────────────────────────────────────────────────────────────────────
    public function test_payment_screen_blocks_standalone_refund_bypasses(): void
    {
        $customer = Party::create(['tenant_id' => $this->tenant->id, 'name' => 'Alice Customer', 'type' => 'customer']);
        $supplier = Party::create(['tenant_id' => $this->tenant->id, 'name' => 'Bob Supplier', 'type' => 'supplier']);

        $this->grantPermissions($this->staffUser, [
            'finance.receive_payment',
            'finance.send_payment',
            'finance.customer_refund',
            'finance.supplier_refund',
        ]);
        $this->setApprovalMode($this->staffUser, 'required');

        // Customer refund attempted via generic payment screen -> blocked with 422
        $resCustRefund = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/payments", [
                'party_id'       => $customer->id,
                'type'           => 'out',
                'amount'         => 300.00,
                'payment_method' => 'cash',
                'date'           => now()->toDateString(),
            ]);
        $resCustRefund->assertStatus(422)
            ->assertJsonPath('message', 'When approval workflow is enabled, customer refunds must be recorded against a sales return. Use Sales → Returns.');

        // Supplier refund attempted via generic payment screen -> blocked with 422
        $resSuppRefund = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/payments", [
                'party_id'       => $supplier->id,
                'type'           => 'in',
                'amount'         => 450.00,
                'payment_method' => 'cash',
                'date'           => now()->toDateString(),
            ]);
        $resSuppRefund->assertStatus(422)
            ->assertJsonPath('message', 'When approval workflow is enabled, supplier refunds must be recorded against a debit note. Use Purchases → Debit Notes → Refund.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Capital Injection & Drawings via V3 Funds
    // ─────────────────────────────────────────────────────────────────────────
    public function test_v3_funds_injection_and_drawings(): void
    {
        $this->grantPermissions($this->staffUser, [
            'finance.capital_add',
            'finance.owner_drawings',
        ]);
        $this->setApprovalMode($this->staffUser, 'required');

        // Capital Injection
        $resInj = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->post("/s/{$this->tenant->slug}/v3/funds", [
                'type'             => 'injection',
                'description'      => 'Owner capital injection',
                'transaction_date' => now()->toDateString(),
                'amount'           => 10000.00,
                'payment_method'   => 'cash',
                'passcode'         => '123456',
            ]);
        $resInj->assertRedirect();
        $resInj->assertSessionHas('info');

        $docInj = ApprovalDocument::where('tenant_id', $this->tenant->id)
            ->where('document_type', ApprovalDocument::TYPE_CAPITAL_INJECTION)
            ->latest('id')
            ->firstOrFail();
        $this->assertSame(10000.00, (float)$docInj->amount);

        // Owner drawings
        $resDraw = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->post("/s/{$this->tenant->slug}/v3/funds", [
                'type'             => 'drawing',
                'description'      => 'Owner personal drawings',
                'transaction_date' => now()->toDateString(),
                'amount'           => 2500.00,
                'payment_method'   => 'cash',
                'passcode'         => '123456',
            ]);
        $resDraw->assertRedirect();
        $resDraw->assertSessionHas('info');

        $docDraw = ApprovalDocument::where('tenant_id', $this->tenant->id)
            ->where('document_type', ApprovalDocument::TYPE_OWNER_DRAWINGS)
            ->latest('id')
            ->firstOrFail();
        $this->assertSame(2500.00, (float)$docDraw->amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Administrative Sales Invoice: Permission, Approval Gate & Single Posting
    // ─────────────────────────────────────────────────────────────────────────
    public function test_administrative_sales_invoice_http_workflow(): void
    {
        $customer = Party::create(['tenant_id' => $this->tenant->id, 'name' => 'Govt Dept', 'type' => 'customer']);
        $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 500.00]);

        $payload = [
            'customer_id'    => $customer->id,
            'warehouse_id'   => $this->warehouse->id,
            'payment_method' => 'credit',
            'discount'       => 0,
            'source'         => 'admin', // non-pos administrative invoice
            'items'          => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 4,
                    'price'      => 500.00,
                    'discount'   => 0,
                ],
            ],
        ];

        // 1. User lacking sales.create (viewer) -> 403
        $viewer = $this->createTenantUser($this->tenant, 'viewer');
        $res403 = $this->actingAsTenantUserModel($viewer, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/sales", $payload);
        $res403->assertStatus(403);

        // 2. Staff with permission and approval mode = required -> 202
        $this->grantPermissions($this->staffUser, ['sales.create', 'sales.view']);
        $this->setApprovalMode($this->staffUser, 'required');

        $glBefore = JournalEntry::where('tenant_id', $this->tenant->id)->count();

        $res202 = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/sales", $payload);
        $res202->assertStatus(202)
            ->assertJsonPath('status', 'pending_approval');

        $this->assertSame($glBefore, JournalEntry::where('tenant_id', $this->tenant->id)->count());

        $docId = $res202->json('approval_document_id');

        // 3. Reviewer approves -> 1 invoice posted
        $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/approve", ['expected_version' => 1])
            ->assertOk();

        $this->assertSame($glBefore + 1, JournalEntry::where('tenant_id', $this->tenant->id)->count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 10. Sales Return: Permission, Approval Gate & Single Posting
    // ─────────────────────────────────────────────────────────────────────────
    public function test_sales_return_http_workflow(): void
    {
        $customer = Party::create(['tenant_id' => $this->tenant->id, 'name' => 'Return Customer', 'type' => 'customer']);
        $product = Product::factory()->create([
            'tenant_id'  => $this->tenant->id,
            'price'      => 300.00,
            'cost_price' => 100.00,
        ]);

        app()->instance('current.tenant', $this->tenant);
        $sale = app(\App\Engines\SaleService::class)->post([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->owner->id,
            'customer_id'    => $customer->id,
            'payment_method' => 'cash',
            'warehouse_id'   => $this->warehouse->id,
            'items'          => [
                ['product_id' => $product->id, 'qty' => 2, 'unit_price' => 300.00, 'sale_uom' => 'pcs'],
            ],
        ]);
        $saleItem = DB::table('sale_items')->where('sale_id', $sale->id)->first();

        $payload = [
            'return_date' => now()->toDateString(),
            'reason'      => 'Damaged goods returned',
            'items'       => [
                [
                    'sale_item_id' => (string)$saleItem->id,
                    'return_qty'   => 1,
                ],
            ],
        ];

        // 1. User lacking sales.returns (viewer) -> 403
        $viewer = $this->createTenantUser($this->tenant, 'viewer');
        $res403 = $this->actingAsTenantUserModel($viewer, $this->tenant)
            ->post("/s/{$this->tenant->slug}/v3/sales/{$sale->id}/return", $payload);
        $res403->assertStatus(403);

        // 2. Staff with sales.returns in required approval mode
        $this->grantPermissions($this->staffUser, ['sales.returns']);
        $this->setApprovalMode($this->staffUser, 'required');

        $glBefore = JournalEntry::where('tenant_id', $this->tenant->id)->count();

        $resPending = $this->actingAsTenantUserModel($this->staffUser, $this->tenant)
            ->post("/s/{$this->tenant->slug}/v3/sales/{$sale->id}/return", $payload);
        $resPending->assertRedirect();
        $resPending->assertSessionHas('info');

        // Zero GL footprint while pending
        $this->assertSame($glBefore, JournalEntry::where('tenant_id', $this->tenant->id)->count());

        $doc = ApprovalDocument::where('tenant_id', $this->tenant->id)
            ->where('document_type', ApprovalDocument::TYPE_SALES_RETURN)
            ->latest('id')
            ->firstOrFail();

        // 3. Reviewer approves -> posts return and journal atomically
        $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$doc->id}/approve", ['expected_version' => 1])
            ->assertOk();

        $this->assertSame($glBefore + 1, JournalEntry::where('tenant_id', $this->tenant->id)->count());
    }
}
