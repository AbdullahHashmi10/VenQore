<?php

namespace Tests\Feature\Approval;

use App\Engines\SaleService;
use App\Models\Account;
use App\Models\ApprovalDocument;
use App\Models\ApprovalReturnReason;
use App\Models\Category;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\JournalEntry;
use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Approval\ApprovalExecutionEngine;
use Tests\Feature\VenQoreTestCase;

class FourDocumentApprovalTest extends VenQoreTestCase
{
    private ApprovalExecutionEngine $engine;

    protected function setUp(): void
    {
        parent::setUp();
        $this->engine = app(ApprovalExecutionEngine::class);
    }

    public function test_customer_receipt_approval_flow(): void
    {
        $tenant = $this->createTenant('appr-cr-' . uniqid(), 'ltd_3');
        $maker = $this->createTenantUser($tenant, 'cashier');
        $reviewer = $this->createTenantUser($tenant, 'manager');

        $customer = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Test Customer',
            'type'      => 'customer',
        ]);

        $category = Category::create(['tenant_id' => $tenant->id, 'name' => 'General']);
        $product = Product::create([
            'tenant_id'   => $tenant->id,
            'name'        => 'Item 1',
            'sku'         => 'ITM-1',
            'unit'        => 'pcs',
            'base_unit'   => 'pcs',
            'price'       => 1000.00,
            'category_id' => $category->id,
        ]);

        app()->instance('current.tenant', $tenant);
        $sale = app(SaleService::class)->post([
            'tenant_id'      => $tenant->id,
            'user_id'        => $maker->id,
            'customer_id'    => $customer->id,
            'payment_method' => 'credit',
            'items'          => [
                ['product_id' => $product->id, 'qty' => 1, 'unit_price' => 1000.00, 'sale_uom' => 'pcs'],
            ],
        ]);

        $journalCountBefore = JournalEntry::where('tenant_id', $tenant->id)->count();

        // 1. Submit Customer Receipt for Approval
        $payload = [
            'customer_id'    => $customer->id,
            'payment_date'   => now()->toDateString(),
            'payment_method' => 'cash',
            'amount'         => 1000.00,
            'reference'      => 'REC-001',
            'allocations'    => [
                ['sale_id' => $sale->id, 'amount' => 1000.00],
            ],
        ];

        $doc = $this->engine->submit(
            tenant: $tenant,
            maker: $maker,
            documentType: ApprovalDocument::TYPE_CUSTOMER_RECEIPT,
            payload: $payload,
            amount: 1000.00,
            description: 'Customer payment against invoice',
            idempotencyKey: 'idem-cust-1'
        );

        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertSame($journalCountBefore, JournalEntry::where('tenant_id', $tenant->id)->count(), 'Pending receipt must not create journal entries.');

        // 2. Reviewer Approves
        $res = $this->engine->approve(
            documentId: $doc->id,
            tenant: $tenant,
            reviewer: $reviewer,
            expectedVersion: 1
        );

        $this->assertTrue($res['success']);
        $this->assertSame(ApprovalDocument::STATUS_APPROVED, $res['document']->status);
        $this->assertSame($reviewer->id, $res['document']->reviewer_id);
        $this->assertNotNull($res['document']->posted_at);

        // Verify Journal Entry created: DR 1000 Cash, CR 1200 AR
        $this->assertSame($journalCountBefore + 1, JournalEntry::where('tenant_id', $tenant->id)->count());
        $journal = JournalEntry::find($res['posted_result']['journal_entry_id']);
        $this->assertNotNull($journal);

        // Verify Sale payment status updated to paid
        $saleDb = Sale::find($sale->id);
        $this->assertSame('paid', $saleDb->payment_status);
    }

    public function test_supplier_payment_approval_flow(): void
    {
        $tenant = $this->createTenant('appr-sp-' . uniqid(), 'ltd_3');
        $maker = $this->createTenantUser($tenant, 'cashier');
        $reviewer = $this->createTenantUser($tenant, 'manager');

        $supplier = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Wholesale Supplier Ltd',
            'type'      => 'supplier',
        ]);

        $journalCountBefore = JournalEntry::where('tenant_id', $tenant->id)->count();

        // 1. Submit Supplier Payment for Approval
        $payload = [
            'supplier_id'    => $supplier->id,
            'payment_date'   => now()->toDateString(),
            'payment_method' => 'cash',
            'amount'         => 2500.00,
            'reference'      => 'SP-001',
            'notes'          => 'Payment for batch inventory',
        ];

        $doc = $this->engine->submit(
            tenant: $tenant,
            maker: $maker,
            documentType: ApprovalDocument::TYPE_SUPPLIER_PAYMENT,
            payload: $payload,
            amount: 2500.00,
            description: 'Supplier payment for raw materials',
            idempotencyKey: 'idem-sup-1'
        );

        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertSame($journalCountBefore, JournalEntry::where('tenant_id', $tenant->id)->count());

        // 2. Reviewer Approves
        $res = $this->engine->approve(
            documentId: $doc->id,
            tenant: $tenant,
            reviewer: $reviewer,
            expectedVersion: 1
        );

        $this->assertTrue($res['success']);
        $this->assertSame(ApprovalDocument::STATUS_APPROVED, $res['document']->status);
        $this->assertSame($journalCountBefore + 1, JournalEntry::where('tenant_id', $tenant->id)->count());
        $this->assertNotNull($res['posted_result']['journal_entry_id']);
    }

    public function test_operating_expense_approval_flow(): void
    {
        $tenant = $this->createTenant('appr-exp-' . uniqid(), 'ltd_3');
        $maker = $this->createTenantUser($tenant, 'cashier');
        $reviewer = $this->createTenantUser($tenant, 'manager');

        $category = ExpenseCategory::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Office Cleaning',
        ]);

        $expenseCountBefore = Expense::where('tenant_id', $tenant->id)->count();

        // 1. Submit Expense for Approval
        $payload = [
            'expense_category_id' => $category->id,
            'amount'              => 350.00,
            'payment_method'      => 'cash',
            'expense_date'        => now()->toDateString(),
            'notes'               => 'Monthly cleaning services',
        ];

        $doc = $this->engine->submit(
            tenant: $tenant,
            maker: $maker,
            documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
            payload: $payload,
            amount: 350.00,
            description: 'Cleaning expense voucher'
        );

        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertSame($expenseCountBefore, Expense::where('tenant_id', $tenant->id)->count(), 'Pending expense must not create Expense records.');

        // 2. Reviewer Approves
        $res = $this->engine->approve(
            documentId: $doc->id,
            tenant: $tenant,
            reviewer: $reviewer,
            expectedVersion: 1
        );

        $this->assertTrue($res['success']);
        $this->assertSame(ApprovalDocument::STATUS_APPROVED, $res['document']->status);
        $this->assertSame($expenseCountBefore + 1, Expense::where('tenant_id', $tenant->id)->count());

        $expense = Expense::find($res['posted_result']['id']);
        $this->assertNotNull($expense);
        $this->assertSame(350.00, (float)$expense->amount);
        $this->assertNotNull($res['posted_result']['journal_entry_id']);
    }

    public function test_admin_sales_invoice_approval_flow(): void
    {
        $tenant = $this->createTenant('appr-inv-' . uniqid(), 'ltd_3');
        $maker = $this->createTenantUser($tenant, 'cashier');
        $reviewer = $this->createTenantUser($tenant, 'manager');

        $customer = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Wholesale Client',
            'type'      => 'customer',
        ]);

        $category = Category::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Electronics',
        ]);

        $product = Product::create([
            'tenant_id'   => $tenant->id,
            'name'        => 'Industrial Router',
            'sku'         => 'RTR-001',
            'unit'        => 'pcs',
            'base_unit'   => 'pcs',
            'category_id' => $category->id,
            'price'       => 5000.00,
            'cost_price'  => 3000.00,
        ]);

        $salesCountBefore = Sale::where('tenant_id', $tenant->id)->count();

        // 1. Submit Sales Invoice for Approval
        $payload = [
            'customer_id'     => $customer->id,
            'items'           => [
                ['product_id' => $product->id, 'quantity' => 2, 'unit_price' => 4750.00, 'sale_uom' => 'pcs'],
            ],
            'discount_amount' => 0.00,
            'tax_amount'      => 0.00,
            'payment_method'  => 'credit',
            'notes'           => 'Corporate bulk order',
        ];

        $doc = $this->engine->submit(
            tenant: $tenant,
            maker: $maker,
            documentType: ApprovalDocument::TYPE_SALES_INVOICE,
            payload: $payload,
            amount: 9500.00,
            description: 'Bulk order invoice'
        );

        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertSame($salesCountBefore, Sale::where('tenant_id', $tenant->id)->count(), 'Pending sales invoice must not create Sale records.');

        // 2. Reviewer Approves
        $res = $this->engine->approve(
            documentId: $doc->id,
            tenant: $tenant,
            reviewer: $reviewer,
            expectedVersion: 1
        );

        $this->assertTrue($res['success']);
        $this->assertSame(ApprovalDocument::STATUS_APPROVED, $res['document']->status);
        $this->assertSame($salesCountBefore + 1, Sale::where('tenant_id', $tenant->id)->count());

        $sale = Sale::find($res['posted_result']['id']);
        $this->assertNotNull($sale);
        $this->assertSame(9500.00, (float)($sale->net_sales ?? $sale->total));
        $this->assertSame('posted', $sale->status);
    }
}
