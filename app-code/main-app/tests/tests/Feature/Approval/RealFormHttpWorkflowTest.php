<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\ApprovalReturnReason;
use App\Models\Category;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\JournalEntry;
use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Tests\Feature\VenQoreTestCase;

class RealFormHttpWorkflowTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $owner;
    private User $manager;
    private User $cashier;
    private User $accountant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('http-appr-' . uniqid(), 'ltd_3');
        $this->seedTenantDefaults($this->tenant);
        ApprovalReturnReason::seedDefaultReasons($this->tenant->id);

        $this->owner = $this->createTenantUser($this->tenant, 'owner');
        $this->manager = $this->createTenantUser($this->tenant, 'manager');
        $this->cashier = $this->createTenantUser($this->tenant, 'cashier');
        $this->accountant = $this->createTenantUser($this->tenant, 'accountant');
    }

    public function test_customer_payment_http_submission_direct_vs_required(): void
    {
        $customer = Party::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Acme Client',
            'type'      => 'customer',
        ]);

        $category = Category::firstOrCreate(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        $product = Product::create([
            'tenant_id'   => $this->tenant->id,
            'name'        => 'Service Item',
            'sku'         => 'SRV-01',
            'price'       => 500.00,
            'unit'        => 'pcs',
            'base_unit'   => 'pcs',
            'category_id' => $category->id,
            'type'        => 'service',
        ]);

        // Create an unpaid sale invoice first via SaleService
        app()->instance('current.tenant', $this->tenant);
        $sale = app(\App\Engines\SaleService::class)->post([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->owner->id,
            'customer_id'    => $customer->id,
            'payment_method' => 'credit',
            'items'          => [
                ['product_id' => $product->id, 'qty' => 1, 'unit_price' => 500.00, 'sale_uom' => 'pcs'],
            ],
        ]);

        $payload = [
            'customer_id'    => (string)$customer->id,
            'payment_date'   => now()->toDateString(),
            'payment_method' => 'cash',
            'amount'         => 500.00,
            'reference'      => 'PAY-DIR-01',
            'allocations'    => [
                ['sale_id' => (string)$sale->id, 'amount' => 500.00],
            ],
        ];

        // 1. Owner posts DIRECTLY
        $resOwner = $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/customer-payments", $payload);
        $resOwner->assertRedirect();

        $this->assertDatabaseHas('journal_entries', [
            'tenant_id'      => $this->tenant->id,
            'reference_type' => 'customer_payment',
        ]);

        // 2. Staff with required approval (Accountant) submits -> ROUTES TO PENDING APPROVAL
        \App\Models\TenantUser::where('tenant_id', $this->tenant->id)->where('user_id', $this->accountant->id)->update([
            'transaction_approval_mode' => 'required',
        ]);

        $payloadAccountant = [
            'customer_id'    => (string)$customer->id,
            'payment_date'   => now()->toDateString(),
            'payment_method' => 'cash',
            'amount'         => 500.00,
            'reference'      => 'PAY-STAFF-01',
            'allocations'    => [
                ['sale_id' => (string)$sale->id, 'amount' => 500.00],
            ],
        ];

        $journalCountBefore = JournalEntry::where('tenant_id', $this->tenant->id)->count();

        $resStaff = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/customer-payments", $payloadAccountant);

        $resStaff->assertStatus(202)
            ->assertJsonPath('status', 'pending_approval');

        $this->assertSame($journalCountBefore, JournalEntry::where('tenant_id', $this->tenant->id)->count(), 'Pending payment must not create journal rows.');

        $docId = $resStaff->json('approval_document_id');
        $this->assertDatabaseHas('approval_documents', [
            'id'            => $docId,
            'tenant_id'     => $this->tenant->id,
            'document_type' => ApprovalDocument::TYPE_CUSTOMER_RECEIPT,
            'status'        => ApprovalDocument::STATUS_PENDING,
        ]);
    }

    public function test_operating_expense_http_submission_direct_vs_required_and_threshold(): void
    {
        $category = ExpenseCategory::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Office Refreshments',
        ]);

        $payload = [
            'description'         => 'Tea and coffee',
            'expense_date'        => now()->toDateString(),
            'amount'              => 200.00,
            'payment_method'      => 'cash',
        ];

        // 1. Owner posts direct for normal expense
        $resOwner = $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/expenses", $payload);
        $resOwner->assertRedirect();
        $this->assertDatabaseHas('journal_entries', [
            'tenant_id'      => $this->tenant->id,
            'reference_type' => 'operating_expense',
        ]);

        // 2. Set Store Amount Threshold = 1000.00
        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_amount_threshold'],
            ['value' => '1000.00']
        );

        $largePayload = [
            'description'         => 'Generator repair and fuel',
            'expense_date'        => now()->toDateString(),
            'amount'              => 1500.00,
            'payment_method'      => 'cash',
        ];

        $journalCountBefore = JournalEntry::where('tenant_id', $this->tenant->id)->count();

        // Accountant with inherit mode routes to approval
        $resLarge = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/expenses", $largePayload);

        $resLarge->assertStatus(202)->assertJsonPath('status', 'pending_approval');
        $this->assertSame($journalCountBefore, JournalEntry::where('tenant_id', $this->tenant->id)->count(), 'Pending large expense must not write journal rows.');
    }

    public function test_supplier_payment_http_submission_and_approval_workflow(): void
    {
        $supplier = Party::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'National Supply Corp',
            'type'      => 'supplier',
        ]);

        $warehouse = \App\Models\Warehouse::where('tenant_id', $this->tenant->id)->first() ?? \App\Models\Warehouse::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Main Warehouse',
        ]);

        $purchase = \App\Models\Purchase::create([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->owner->id,
            'party_id'       => $supplier->id,
            'warehouse_id'   => $warehouse->id,
            'purchase_date'  => now()->toDateString(),
            'payment_status' => 'unpaid',
            'payment_method' => 'credit',
            'subtotal'       => 3200.00,
            'total'          => 3200.00,
            'invoice_number' => 'PUR-TEST-01',
        ]);

        $payload = [
            'supplier_id'    => (string)$supplier->id,
            'payment_date'   => now()->toDateString(),
            'payment_method' => 'cash',
            'amount'         => 3200.00,
            'reference'      => 'SP-HTTP-01',
            'allocations'    => [
                ['purchase_id' => (string)$purchase->id, 'amount' => 3200.00],
            ],
        ];

        // 1. Accountant submits supplier payment -> 202
        $res = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/supplier-payments", $payload);

        $res->assertStatus(202)->assertJsonPath('status', 'pending_approval');
        $docId = $res->json('approval_document_id');

        // 2. Reviewer (Manager) views inbox
        $inboxRes = $this->actingAsTenantUserModel($this->manager, $this->tenant)
            ->get("/s/{$this->tenant->slug}/approvals/inbox");
        $inboxRes->assertOk();

        // 3. Reviewer approves
        $approveRes = $this->actingAsTenantUserModel($this->manager, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/approve", [
                'expected_version' => 1,
            ]);

        $approveRes->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseHas('approval_documents', [
            'id'     => $docId,
            'status' => ApprovalDocument::STATUS_APPROVED,
        ]);
        $this->assertDatabaseHas('journal_entries', [
            'tenant_id'      => $this->tenant->id,
            'reference_type' => 'supplier_payment',
        ]);
    }

    public function test_maker_correction_resubmission_and_withdrawal_cycle(): void
    {
        $payload = [
            'description'         => 'Electricity Bill',
            'expense_date'        => now()->toDateString(),
            'amount'              => 800.00,
            'payment_method'      => 'cash',
        ];

        // 1. Accountant submits
        $submitRes = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/v3/expenses", $payload);
        $submitRes->assertStatus(202);
        $docId = $submitRes->json('approval_document_id');

        // 2. Manager returns with reason code and notes
        $returnRes = $this->actingAsTenantUserModel($this->manager, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/return", [
                'reason_codes'     => ['INCORRECT_AMOUNT'],
                'reviewer_notes'   => 'The amount on the electricity bill is 750, not 800.',
                'expected_version' => 1,
            ]);
        $returnRes->assertOk()->assertJsonPath('success', true);

        $doc = ApprovalDocument::find($docId);
        $this->assertSame(ApprovalDocument::STATUS_RETURNED, $doc->status);
        $this->assertSame(2, (int)$doc->version);

        // 3. Other user (Cashier) CANNOT resubmit another maker's returned document
        $unauthRes = $this->actingAsTenantUserModel($this->cashier, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/resubmit", [
                'payload'          => array_merge($payload, ['amount' => 750.00]),
                'amount'           => 750.00,
                'expected_version' => 2,
            ]);
        $unauthRes->assertStatus(403);

        // 4. Maker (Accountant) resubmits with corrected amount and version
        $resubmitRes = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/resubmit", [
                'payload'          => array_merge($payload, ['amount' => 750.00]),
                'amount'           => 750.00,
                'expected_version' => 2,
            ]);
        $resubmitRes->assertOk()->assertJsonPath('success', true);

        $doc->refresh();
        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertSame(3, (int)$doc->version);
        $this->assertSame(750.00, (float)$doc->amount);
        $this->assertCount(2, $doc->revisions);

        // 5. Maker withdraws document
        $withdrawRes = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/withdraw", [
                'expected_version' => 3,
                'reason'           => 'Paid directly by landlord.',
            ]);
        $withdrawRes->assertOk()->assertJsonPath('success', true);

        $doc->refresh();
        $this->assertSame(ApprovalDocument::STATUS_WITHDRAWN, $doc->status);
        $this->assertSame(4, (int)$doc->version);

        // 6. Reviewer cannot approve a withdrawn document
        $tryApprove = $this->actingAsTenantUserModel($this->manager, $this->tenant)
            ->postJson("/s/{$this->tenant->slug}/approvals/{$docId}/approve", [
                'expected_version' => 4,
            ]);
        $tryApprove->assertStatus(422);
    }

    public function test_all_four_document_types_support_maker_correction_resubmission(): void
    {
        $customer = Party::create(['tenant_id' => $this->tenant->id, 'name' => 'Real Customer', 'type' => 'customer']);
        $supplier = Party::create(['tenant_id' => $this->tenant->id, 'name' => 'Real Supplier', 'type' => 'supplier']);
        $category = ExpenseCategory::create(['tenant_id' => $this->tenant->id, 'name' => 'Supplies Category']);

        $sale = \App\Services\CanonicalPostingScope::run(fn() => Sale::create([
            'tenant_id' => $this->tenant->id,
            'party_id' => $customer->id,
            'user_id' => $this->owner->id,
            'status' => 'posted',
            'subtotal' => 1000.00,
            'net_sales' => 1000.00,
            'total' => 1000.00,
            'posted_at' => now(),
        ]));

        $purchase = \App\Models\Purchase::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->owner->id,
            'party_id' => $supplier->id,
            'purchase_date' => now()->toDateString(),
            'payment_status' => 'unpaid',
            'payment_method' => 'credit',
            'subtotal' => 2000.00,
            'total' => 2000.00,
        ]);

        $product = \App\Models\Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'price' => 100.00,
        ]);

        $types = [
            ApprovalDocument::TYPE_CUSTOMER_RECEIPT => [
                'amount' => 500.00,
                'customer_id' => (string)$customer->id,
                'payment_date' => now()->toDateString(),
                'payment_method' => 'cash',
                'allocations' => [['sale_id' => (string)$sale->id, 'amount' => 500.00]],
            ],
            ApprovalDocument::TYPE_SUPPLIER_PAYMENT => [
                'amount' => 1200.00,
                'supplier_id' => (string)$supplier->id,
                'payment_date' => now()->toDateString(),
                'payment_method' => 'cash',
                'allocations' => [['purchase_id' => (string)$purchase->id, 'amount' => 1200.00]],
            ],
            ApprovalDocument::TYPE_OPERATING_EXPENSE => [
                'amount' => 350.00,
                'description' => 'Office supplies',
                'expense_date' => now()->toDateString(),
                'payment_method' => 'cash',
                'category_id' => $category->id,
            ],
            ApprovalDocument::TYPE_SALES_INVOICE => [
                'amount' => 100.00,
                'customer_id' => (string)$customer->id,
                'items' => [['product_id' => (string)$product->id, 'quantity' => 1, 'price' => 100.00, 'discount' => 0.00]],
            ],
        ];

        foreach ($types as $docType => $initPayload) {
            $doc = app(\App\Services\Approval\ApprovalStateMachine::class)->submitNew(
                tenantId: $this->tenant->id,
                documentType: $docType,
                maker: $this->accountant,
                payload: $initPayload,
                amount: $initPayload['amount']
            );

            // Return for correction
            $returnRes = $this->actingAsTenantUserModel($this->manager, $this->tenant)
                ->postJson("/s/{$this->tenant->slug}/approvals/{$doc->id}/return", [
                    'reason_codes'     => ['INCORRECT_AMOUNT'],
                    'reviewer_notes'   => 'Please correct and resubmit.',
                    'expected_version' => 1,
                ]);
            $returnRes->assertOk();

            $updatedPayload = $initPayload;
            $newAmount = $initPayload['amount'] + 50.00;
            $updatedPayload['amount'] = $newAmount;
            if ($docType === ApprovalDocument::TYPE_CUSTOMER_RECEIPT) {
                $updatedPayload['allocations'] = [['sale_id' => (string)$sale->id, 'amount' => $newAmount]];
            } elseif ($docType === ApprovalDocument::TYPE_SUPPLIER_PAYMENT) {
                $updatedPayload['allocations'] = [['purchase_id' => (string)$purchase->id, 'amount' => $newAmount]];
            } elseif ($docType === ApprovalDocument::TYPE_SALES_INVOICE) {
                $updatedPayload['items'] = [['product_id' => (string)$product->id, 'quantity' => 1, 'price' => $newAmount, 'discount' => 0.00]];
            }

            // Resubmit with stale version fails
            $staleRes = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
                ->postJson("/s/{$this->tenant->slug}/approvals/{$doc->id}/resubmit", [
                    'payload'          => $updatedPayload,
                    'amount'           => $newAmount,
                    'expected_version' => 1, // Stale!
                ]);
            $staleRes->assertStatus(422);

            // Resubmit with correct version succeeds
            $resubmitRes = $this->actingAsTenantUserModel($this->accountant, $this->tenant)
                ->postJson("/s/{$this->tenant->slug}/approvals/{$doc->id}/resubmit", [
                    'payload'          => $updatedPayload,
                    'amount'           => $newAmount,
                    'expected_version' => 2,
                ]);
            $resubmitRes->assertOk();

            $doc->refresh();
            $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
            $this->assertSame(3, (int)$doc->version);
            $this->assertSame((float)$newAmount, (float)$doc->amount);
        }
    }

    public function test_cross_tenant_isolation_returns_404(): void
    {
        $otherTenant = $this->createTenant('other-t-' . uniqid(), 'ltd_3');
        $otherMaker = $this->createTenantUser($otherTenant, 'cashier');

        $doc = app(\App\Services\Approval\ApprovalStateMachine::class)->submitNew(
            tenantId: $otherTenant->id,
            documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
            maker: $otherMaker,
            payload: ['amount' => 100.00],
            amount: 100.00
        );

        // Attempt to access other tenant's document from this tenant
        $res = $this->actingAsTenantUserModel($this->manager, $this->tenant)
            ->get("/s/{$this->tenant->slug}/approvals/{$doc->id}");
        $res->assertStatus(404);
    }
}
