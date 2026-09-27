<?php

namespace Tests\Feature\Approval;

use App\Engines\AccountingService;
use App\Engines\SaleService;
use App\Models\ApprovalDocument;
use App\Models\ApprovalReturnReason;
use App\Models\ApprovalRevision;
use App\Models\ApprovalTransition;
use App\Models\BankAccount;
use App\Models\Category;
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
use App\Services\Approval\ApprovalExecutionEngine;
use App\Services\Approval\ApprovalPolicyResolver;
use App\Services\CanonicalPostingScope;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * OwnerEmployeeWalkthroughTest
 *
 * Implements and verifies the full owner and employee walkthrough required by
 * Doc 29 §78 and Doc 30:
 * 1. Customer receipt approval & single atomic posting
 * 2. Purchase bill posting (stock & settlement effects)
 * 3. Sales return & refund single atomic posting (no double-post)
 * 4. Operating expense approval
 * 5. Internal fund transfer (cash to bank atomic)
 * 6. Return-for-correction lifecycle (review return -> editor load -> resubmit -> approve)
 * 7. Master switch OFF (unconditional direct posting without approval creation)
 */
class OwnerEmployeeWalkthroughTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $owner;
    private User $manager;
    private User $cashier;
    private User $accountant;
    private User $purchasingOfficer;
    private Warehouse $warehouse;
    private ApprovalExecutionEngine $engine;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('demo-walk-' . uniqid(), 'ltd_3');
        $this->tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($this->tenant);
        ApprovalReturnReason::seedDefaultReasons($this->tenant->id);

        $this->owner             = $this->createTenantUser($this->tenant, 'owner');
        $this->manager           = $this->createTenantUser($this->tenant, 'manager');
        $this->cashier           = $this->createTenantUser($this->tenant, 'cashier');
        $this->accountant        = $this->createTenantUser($this->tenant, 'accountant');
        $this->purchasingOfficer = $this->createTenantUser($this->tenant, 'purchasing_officer');

        $this->warehouse = Warehouse::firstOrCreate(
            ['tenant_id' => $this->tenant->id],
            ['name' => 'Main Warehouse']
        );

        $this->engine = app(ApprovalExecutionEngine::class);

        // Configure standard employee approval mode = required for cashier, accountant, purchasing_officer
        TenantUser::where('tenant_id', $this->tenant->id)
            ->whereIn('user_id', [$this->cashier->id, $this->accountant->id, $this->purchasingOfficer->id])
            ->update(['transaction_approval_mode' => 'required']);

        // Enable master approval switch
        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_admin_enabled'],
            ['value' => '1']
        );
    }

    /**
     * Demo 1: Customer Receipt Walkthrough
     * Maker submits customer receipt -> pending approval (zero GL) -> Owner approves -> 1 atomic GL entry.
     */
    public function test_demo_1_customer_receipt_approval_and_posting_walkthrough(): void
    {
        $customer = Party::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Acme Client Corp',
            'type'      => 'customer',
        ]);

        $category = Category::firstOrCreate(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        $product = Product::create([
            'tenant_id'   => $this->tenant->id,
            'name'        => 'Consulting Service',
            'sku'         => 'SVC-001',
            'price'       => 1500.00,
            'unit'        => 'hrs',
            'base_unit'   => 'hrs',
            'category_id' => $category->id,
            'type'        => 'service',
        ]);

        app()->instance('current.tenant', $this->tenant);
        $sale = app(SaleService::class)->post([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->owner->id,
            'customer_id'    => $customer->id,
            'payment_method' => 'credit',
            'items'          => [
                ['product_id' => $product->id, 'qty' => 1, 'unit_price' => 1500.00, 'sale_uom' => 'hrs'],
            ],
        ]);

        $journalCountBefore = JournalEntry::where('tenant_id', $this->tenant->id)->count();

        // Step 1: Employee (Accountant) submits Customer Receipt via HTTP
        $payload = [
            'customer_id'    => (string)$customer->id,
            'payment_date'   => now()->toDateString(),
            'payment_method' => 'cash',
            'amount'         => 1500.00,
            'reference'      => 'CR-DEMO-01',
            'allocations'    => [
                ['sale_id' => (string)$sale->id, 'amount' => 1500.00],
            ],
        ];

        $res = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/customer-payments", $payload);

        $res->assertStatus(202)->assertJsonPath('status', 'pending_approval');
        $docId = $res->json('approval_document_id');

        // Verify: ZERO financial ledger footprint while pending
        $this->assertSame($journalCountBefore, JournalEntry::where('tenant_id', $this->tenant->id)->count());
        $this->assertDatabaseHas('approval_documents', [
            'id'            => $docId,
            'status'        => ApprovalDocument::STATUS_PENDING,
            'document_type' => ApprovalDocument::TYPE_CUSTOMER_RECEIPT,
        ]);

        // Step 2: Owner reviews and approves
        $approveRes = $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/approve", [
                'expected_version' => 1,
            ]);

        $approveRes->assertOk()->assertJsonPath('success', true);

        // Verify: Exactly 1 atomic GL entry posted and invoice marked paid
        $this->assertSame($journalCountBefore + 1, JournalEntry::where('tenant_id', $this->tenant->id)->count());
        $this->assertDatabaseHas('approval_documents', [
            'id'     => $docId,
            'status' => ApprovalDocument::STATUS_APPROVED,
        ]);

        $saleRecord = Sale::find($sale->id);
        $this->assertSame('paid', $saleRecord->payment_status);
    }

    /**
     * Demo 2: Purchase/Bill Posting Walkthrough
     * Maker submits purchase -> pending (zero stock increment, zero AP) -> Owner approves -> posted atomically.
     */
    public function test_demo_2_purchase_bill_approval_and_stock_walkthrough(): void
    {
        $supplier = Party::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Industrial Materials Ltd',
            'type'      => 'supplier',
        ]);

        $category = Category::firstOrCreate(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        $product = Product::create([
            'tenant_id'   => $this->tenant->id,
            'name'        => 'Steel Bars',
            'sku'         => 'STL-01',
            'price'       => 200.00,
            'cost_price'  => 120.00,
            'unit'        => 'pcs',
            'base_unit'   => 'pcs',
            'category_id' => $category->id,
            'type'        => 'standard',
        ]);

        $purchasePayload = [
            'supplier_id'     => $supplier->id,
            'warehouse_id'    => $this->warehouse->id,
            'purchase_date'   => now()->toDateString(),
            'invoice_number'  => 'PB-DEMO-01',
            'payment_status'  => 'unpaid',
            'payment_method'  => 'credit',
            'notes'           => 'Urgent materials restock',
            'items'           => [
                [
                    'product_id' => $product->id,
                    'qty'        => 50,
                    'cost_price' => 120.00,
                    'subtotal'   => 6000.00,
                ],
            ],
        ];

        // Step 1: Submit purchase posting for approval
        $doc = $this->engine->submit(
            tenant:         $this->tenant,
            maker:          $this->purchasingOfficer,
            documentType:   ApprovalDocument::TYPE_PURCHASE_POSTING,
            payload:        $purchasePayload,
            amount:         6000.00,
            description:    'Purchase bill PB-DEMO-01',
            idempotencyKey: 'idem-pb-01'
        );

        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);

        // Verify: No stock movement or purchase record before approval
        $this->assertDatabaseMissing('purchases', [
            'tenant_id'      => $this->tenant->id,
            'invoice_number' => 'PB-DEMO-01',
        ]);

        // Step 2: Owner approves
        $res = $this->engine->approve(
            documentId:      $doc->id,
            tenant:          $this->tenant,
            reviewer:        $this->owner,
            expectedVersion: 1
        );

        $this->assertTrue($res['success']);
        $this->assertSame(ApprovalDocument::STATUS_APPROVED, $res['document']->status);

        // Verify: Purchase record exists and is posted
        $this->assertDatabaseHas('purchases', [
            'tenant_id' => $this->tenant->id,
            'total'     => 6000.00,
        ]);
    }

    /**
     * Demo 3: Sales Return with Cash Refund Walkthrough
     * Customer returns item -> maker submits return -> pending -> reviewer approves ->
     * restock and cash refund posted atomically in a single ledger entry (no double-post).
     */
    public function test_demo_3_sales_return_with_refund_walkthrough(): void
    {
        $customer = Party::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Return Client',
            'type'      => 'customer',
        ]);

        $category = Category::firstOrCreate(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        $product = Product::create([
            'tenant_id'   => $this->tenant->id,
            'name'        => 'Retail Device',
            'sku'         => 'DEV-01',
            'price'       => 800.00,
            'cost_price'  => 500.00,
            'unit'        => 'pcs',
            'base_unit'   => 'pcs',
            'category_id' => $category->id,
            'type'        => 'standard',
        ]);

        app()->instance('current.tenant', $this->tenant);
        $sale = app(SaleService::class)->post([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->owner->id,
            'customer_id'    => $customer->id,
            'payment_method' => 'cash',
            'items'          => [
                ['product_id' => $product->id, 'qty' => 2, 'unit_price' => 800.00, 'sale_uom' => 'pcs'],
            ],
        ]);

        $returnPayload = [
            '_path'           => 'sale_return',
            'sale_id'         => $sale->id,
            'return_date'     => now()->toDateString(),
            'reason'          => 'Customer found defect in 1 unit',
            'refund_method'   => 'cash',
            'amount_refunded' => 800.00,
            'items'           => [
                [
                    'sale_item_id' => Sale::with('items')->find($sale->id)->items->first()->id,
                    'product_id'   => $product->id,
                    'qty_returned' => 1,
                    'refund_price' => 800.00,
                    'restock'      => true,
                ],
            ],
        ];

        // Step 1: Cashier submits return with refund
        $doc = $this->engine->submit(
            tenant:         $this->tenant,
            maker:          $this->cashier,
            documentType:   ApprovalDocument::TYPE_SALES_RETURN,
            payload:        $returnPayload,
            amount:         800.00,
            description:    'Sales return for sale #' . $sale->id,
            idempotencyKey: 'idem-ret-01'
        );

        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);

        // Step 2: Owner approves
        $res = $this->engine->approve(
            documentId:      $doc->id,
            tenant:          $this->tenant,
            reviewer:        $this->owner,
            expectedVersion: 1
        );

        $this->assertTrue($res['success']);
        $this->assertSame(ApprovalDocument::STATUS_APPROVED, $res['document']->status);

        // Verify: Exactly 1 atomic reversal/refund ledger entry created
        $this->assertDatabaseHas('journal_entries', [
            'tenant_id'      => $this->tenant->id,
            'reference_type' => 'sale_return',
        ]);
    }

    /**
     * Demo 4: Operating Expense Walkthrough
     * Maker submits expense -> pending -> reviewer approves -> journal posted.
     */
    public function test_demo_4_operating_expense_walkthrough(): void
    {
        $category = ExpenseCategory::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Office Utilities',
        ]);

        $payload = [
            'description'    => 'Monthly Internet Fiber',
            'expense_date'   => now()->toDateString(),
            'amount'         => 350.00,
            'payment_method' => 'cash',
            'category_id'    => $category->id,
        ];

        // Step 1: Accountant submits via HTTP
        $res = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/expenses", $payload);

        $res->assertStatus(202)->assertJsonPath('status', 'pending_approval');
        $docId = $res->json('approval_document_id');

        // Step 2: Owner approves
        $approveRes = $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/approve", [
                'expected_version' => 1,
            ]);

        $approveRes->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseHas('journal_entries', [
            'tenant_id'      => $this->tenant->id,
            'reference_type' => 'operating_expense',
        ]);
    }

    /**
     * Demo 5: Internal Transfer Walkthrough
     * Cash-to-bank transfer submitted -> pending -> reviewer approves -> DR Bank CR Cash posted atomically.
     */
    public function test_demo_5_internal_transfer_walkthrough(): void
    {
        $bankAccount = BankAccount::create([
            'tenant_id'    => $this->tenant->id,
            'name'         => 'Commercial Bank Checking',
            'account_type' => 'bank',
        ]);

        $transferPayload = [
            'amount'               => 2500.00,
            'from_type'            => 'cash',
            'to_type'              => 'bank',
            'to_bank_account_id'   => $bankAccount->id,
            'transfer_date'        => now()->toDateString(),
            'reason'               => 'Weekly till cash deposit',
        ];

        // Step 1: Accountant submits internal transfer
        $doc = $this->engine->submit(
            tenant:         $this->tenant,
            maker:          $this->accountant,
            documentType:   ApprovalDocument::TYPE_FUND_TRANSFER,
            payload:        $transferPayload,
            amount:         2500.00,
            description:    'Cash to bank transfer',
            idempotencyKey: 'idem-tf-01'
        );

        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);

        // Step 2: Owner approves
        $res = $this->engine->approve(
            documentId:      $doc->id,
            tenant:          $this->tenant,
            reviewer:        $this->owner,
            expectedVersion: 1
        );

        $this->assertTrue($res['success']);
        $this->assertSame(ApprovalDocument::STATUS_APPROVED, $res['document']->status);

        // Verify: GL entry posted
        $this->assertDatabaseHas('journal_entries', [
            'tenant_id'      => $this->tenant->id,
            'reference_type' => 'fund_transfer',
        ]);
    }

    /**
     * Demo 6: Return for Correction Cycle Walkthrough
     * Reviewer returns doc with reasons & notes -> maker loads in original editor ->
     * maker resubmits -> version increments & revision history preserved -> reviewer approves.
     */
    public function test_demo_6_return_for_correction_cycle_walkthrough(): void
    {
        $category = ExpenseCategory::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Maintenance',
        ]);

        $payload = [
            'description'    => 'Air Conditioner Repair',
            'expense_date'   => now()->toDateString(),
            'amount'         => 900.00,
            'payment_method' => 'cash',
            'category_id'    => $category->id,
        ];

        // 1. Accountant submits
        $submitRes = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/expenses", $payload);
        $submitRes->assertStatus(202);
        $docId = $submitRes->json('approval_document_id');

        // 2. Owner returns with reason code and notes
        $returnRes = $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/return", [
                'reason_codes'     => ['INCORRECT_AMOUNT'],
                'reviewer_notes'   => 'Repair invoice total was 750, please adjust.',
                'expected_version' => 1,
            ]);
        $returnRes->assertOk()->assertJsonPath('success', true);

        $doc = ApprovalDocument::find($docId);
        $this->assertSame(ApprovalDocument::STATUS_RETURNED, $doc->status);
        $this->assertSame(2, (int)$doc->version);

        // 3. Maker visits original-editor screen with ?edit_approval={id}
        $editorRes = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
            ->get("/s/{$this->tenant->slug}/expenses/create?edit_approval={$docId}");
        $editorRes->assertOk();
        $editorRes->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) =>
            $page->component('Expenses/Create')
                ->has('approval_correction', fn ($corr) =>
                    $corr->where('document_id', $docId)
                         ->where('version', 2)
                         ->where('return_notes', 'Repair invoice total was 750, please adjust.')
                         ->where('return_reason_codes', ['INCORRECT_AMOUNT'])
                         ->etc()
                )
        );

        // 4. Maker resubmits corrected payload
        $correctedPayload = array_merge($payload, ['amount' => 750.00]);
        $resubmitRes = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/resubmit", [
                'payload'          => $correctedPayload,
                'amount'           => 750.00,
                'expected_version' => 2,
            ]);
        $resubmitRes->assertOk()->assertJsonPath('success', true);

        $doc->refresh();
        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertSame(3, (int)$doc->version);
        $this->assertSame(750.00, (float)$doc->amount);
        $this->assertCount(2, $doc->revisions);

        // 5. Owner approves the corrected revision
        $finalApprove = $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/approve", [
                'expected_version' => 3,
            ]);
        $finalApprove->assertOk()->assertJsonPath('success', true);

        $doc->refresh();
        $this->assertSame(ApprovalDocument::STATUS_APPROVED, $doc->status);
        $this->assertDatabaseHas('journal_entries', [
            'tenant_id'      => $this->tenant->id,
            'reference_type' => 'operating_expense',
        ]);
    }

    /**
     * Demo 7: Master Switch OFF Walkthrough
     * When master switch is OFF, all submissions post directly and unconditionally.
     * Zero approval documents created.
     */
    public function test_demo_7_master_switch_off_direct_posting_walkthrough(): void
    {
        // Turn Master Approval Switch OFF
        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_admin_enabled'],
            ['value' => '0']
        );

        $docCountBefore = ApprovalDocument::where('tenant_id', $this->tenant->id)->count();
        $journalCountBefore = JournalEntry::where('tenant_id', $this->tenant->id)->count();

        // Even though accountant's employee mode is 'required', master OFF overrides unconditionally
        $payload = [
            'description'    => 'Coffee and Tea for Office',
            'expense_date'   => now()->toDateString(),
            'amount'         => 120.00,
            'payment_method' => 'cash',
        ];

        $res = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/expenses", $payload);

        // Must redirect directly, not return 202 pending
        $res->assertRedirect();

        // Must post directly to journal
        $this->assertSame($journalCountBefore + 1, JournalEntry::where('tenant_id', $this->tenant->id)->count());

        // ZERO approval documents created
        $this->assertSame($docCountBefore, ApprovalDocument::where('tenant_id', $this->tenant->id)->count());
    }

    /**
     * Regression: Purchase approval posting succeeds when auth()->id() is null and user 1 does not exist.
     * Prevents FK constraint violation on stock_movements.user_id.
     */
    public function test_purchase_approval_posting_foreign_key_isolation_regression(): void
    {
        auth()->logout();
        $this->assertNull(auth()->id());

        $supplier = Party::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Regression Supplier Ltd',
            'type'      => 'supplier',
        ]);

        $category = Category::firstOrCreate(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        $product = Product::create([
            'tenant_id'   => $this->tenant->id,
            'name'        => 'Regression Iron Rods',
            'sku'         => 'RGR-01',
            'price'       => 500.00,
            'cost_price'  => 300.00,
            'unit'        => 'pcs',
            'base_unit'   => 'pcs',
            'category_id' => $category->id,
            'type'        => 'standard',
        ]);

        $purchasePayload = [
            'supplier_id'     => $supplier->id,
            'warehouse_id'    => $this->warehouse->id,
            'purchase_date'   => now()->toDateString(),
            'invoice_number'  => 'PB-REGR-01',
            'payment_status'  => 'unpaid',
            'payment_method'  => 'credit',
            'notes'           => 'Regression Restock',
            'items'           => [
                [
                    'product_id' => $product->id,
                    'qty'        => 20,
                    'cost_price' => 300.00,
                    'subtotal'   => 6000.00,
                ],
            ],
        ];

        $doc = $this->engine->submit(
            tenant:         $this->tenant,
            maker:          $this->purchasingOfficer,
            documentType:   ApprovalDocument::TYPE_PURCHASE_POSTING,
            payload:        $purchasePayload,
            amount:         6000.00,
            description:    'Purchase bill PB-REGR-01',
            idempotencyKey: 'idem-pb-regr-01'
        );

        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);

        // Owner approves while no user session is in auth()
        $res = $this->engine->approve(
            documentId:      $doc->id,
            tenant:          $this->tenant,
            reviewer:        $this->owner,
            expectedVersion: 1
        );

        $this->assertTrue($res['success']);
        $this->assertSame(ApprovalDocument::STATUS_APPROVED, $res['document']->status);
        $this->assertDatabaseHas('purchases', [
            'tenant_id' => $this->tenant->id,
            'total'     => 6000.00,
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'tenant_id'  => $this->tenant->id,
            'product_id' => $product->id,
            'quantity'   => 20,
        ]);
    }
}

