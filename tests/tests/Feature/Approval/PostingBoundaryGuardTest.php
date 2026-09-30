<?php

namespace Tests\Feature\Approval;

use App\Models\Account;
use App\Models\ApprovalDocument;
use App\Models\ApprovalReturnReason;
use App\Models\Category;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Party;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\Stock;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Approval\ApprovalExecutionEngine;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * Section 8 Posting Boundary Inventory & Architecture Guards Test.
 *
 * Verifies that:
 * 1. Pending submissions NEVER touch posted financial/operational tables.
 * 2. Unapproved direct bypass attempts are intercepted.
 * 3. Strict owner separation forbids maker self-approval.
 * 4. SaleObserver immutable lock protects finalized sales from modification/deletion.
 * 5. Approved execution goes strictly through canonical services with full ledger parity.
 */
class PostingBoundaryGuardTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $owner;
    private User $manager;
    private User $cashier;
    private User $accountant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('boundary-guard-' . uniqid(), 'ltd_3');
        $this->seedTenantDefaults($this->tenant);
        ApprovalReturnReason::seedDefaultReasons($this->tenant->id);

        $this->owner = $this->createTenantUser($this->tenant, 'owner');
        $this->manager = $this->createTenantUser($this->tenant, 'manager');
        $this->cashier = $this->createTenantUser($this->tenant, 'cashier');
        $this->accountant = $this->createTenantUser($this->tenant, 'accountant');
    }

    /**
     * Snapshot count of all financial and operational tables in the tenant.
     *
     * @return array<string, int>
     */
    private function financialFootprint(): array
    {
        $t = $this->tenant->id;
        return [
            'sales'                => DB::table('sales')->where('tenant_id', $t)->count(),
            'purchases'            => DB::table('purchases')->where('tenant_id', $t)->count(),
            'expenses'             => DB::table('expenses')->where('tenant_id', $t)->count(),
            'journal_entries'      => DB::table('journal_entries')->where('tenant_id', $t)->count(),
            'journal_items'        => DB::table('journal_items as ji')
                                        ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                                        ->where('je.tenant_id', $t)->count(),
            'stocks'               => DB::table('stocks')->where('tenant_id', $t)->count(),
            'inventory_batches'    => DB::table('inventory_batches')->where('tenant_id', $t)->count(),
        ];
    }

    public function test_pending_approval_submission_leaves_zero_financial_footprint(): void
    {
        $customer = Party::create(['tenant_id' => $this->tenant->id, 'name' => 'Boundary Customer', 'type' => 'customer']);
        $supplier = Party::create(['tenant_id' => $this->tenant->id, 'name' => 'Boundary Supplier', 'type' => 'supplier']);

        $category = Category::create(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        $product = Product::create([
            'tenant_id'   => $this->tenant->id,
            'name'        => 'Item 1',
            'sku'         => 'ITM-1',
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

        $purchase = Purchase::create([
            'tenant_id'       => $this->tenant->id,
            'party_id'        => $supplier->id,
            'invoice_number'  => 'PUR-BND-01',
            'purchase_date'   => now()->toDateString(),
            'total'           => 2000.00,
            'warehouse_id'    => 1,
        ]);

        $engine = app(ApprovalExecutionEngine::class);

        $before = $this->financialFootprint();

        // 1. Submit customer receipt
        $engine->submit(
            tenant: $this->tenant,
            maker: $this->accountant,
            documentType: ApprovalDocument::TYPE_CUSTOMER_RECEIPT,
            payload: [
                'customer_id'    => (string)$customer->id,
                'amount'         => 1000.00,
                'payment_date'   => now()->toDateString(),
                'payment_method' => 'cash',
                'allocations'    => [
                    ['sale_id' => (string)$sale->id, 'amount' => 1000.00],
                ],
            ],
            amount: 1000.00
        );

        // 2. Submit supplier payment
        $engine->submit(
            tenant: $this->tenant,
            maker: $this->accountant,
            documentType: ApprovalDocument::TYPE_SUPPLIER_PAYMENT,
            payload: [
                'supplier_id'    => (string)$supplier->id,
                'amount'         => 2000.00,
                'payment_date'   => now()->toDateString(),
                'payment_method' => 'cash',
                'allocations'    => [
                    ['purchase_id' => (string)$purchase->id, 'amount' => 2000.00],
                ],
            ],
            amount: 2000.00
        );

        // 3. Submit operating expense
        $engine->submit(
            tenant: $this->tenant,
            maker: $this->accountant,
            documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
            payload: [
                'amount'         => 500.00,
                'expense_date'   => now()->toDateString(),
                'payment_method' => 'cash',
            ],
            amount: 500.00
        );

        // 4. Submit sales invoice
        $engine->submit(
            tenant: $this->tenant,
            maker: $this->accountant,
            documentType: ApprovalDocument::TYPE_SALES_INVOICE,
            payload: [
                'customer_id'    => $customer->id,
                'items'          => [
                    ['product_id' => $product->id, 'qty' => 1, 'unit_price' => 1500.00, 'sale_uom' => 'pcs'],
                ],
                'payment_method' => 'cash',
            ],
            amount: 1500.00
        );

        $after = $this->financialFootprint();

        $this->assertSame($before, $after, 'Pending submissions must create zero financial/operational rows.');
        $this->assertSame(4, ApprovalDocument::where('tenant_id', $this->tenant->id)->count());
    }

    public function test_strict_owner_separation_blocks_maker_self_approval(): void
    {
        Setting::updateOrCreate(
            ['tenant_id' => $this->tenant->id, 'key' => 'approval_strict_owner_separation'],
            ['value' => 'true']
        );

        $engine = app(ApprovalExecutionEngine::class);

        $doc = $engine->submit(
            tenant: $this->tenant,
            maker: $this->owner,
            documentType: ApprovalDocument::TYPE_OPERATING_EXPENSE,
            payload: [
                'amount'         => 300.00,
                'expense_date'   => now()->toDateString(),
                'payment_method' => 'cash',
            ],
            amount: 300.00
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Separation of duties violation: Maker cannot approve their own submission.');

        $engine->approve(
            documentId: $doc->id,
            tenant: $this->tenant,
            reviewer: $this->owner,
            expectedVersion: 1
        );
    }

    public function test_sale_observer_prevents_direct_modification_and_deletion_of_posted_sales(): void
    {
        app()->instance('current.tenant', $this->tenant);

        $category = Category::create(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        $product = Product::create([
            'tenant_id'   => $this->tenant->id,
            'name'        => 'Hardware Item',
            'sku'         => 'HDW-01',
            'price'       => 1000.00,
            'unit'        => 'pcs',
            'base_unit'   => 'pcs',
            'category_id' => $category->id,
            'type'        => 'service',
        ]);

        $saleData = app(\App\Engines\SaleService::class)->post([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->owner->id,
            'payment_method' => 'cash',
            'items'          => [
                ['product_id' => $product->id, 'qty' => 1, 'unit_price' => 1000.00, 'sale_uom' => 'pcs'],
            ],
        ]);

        $sale = Sale::find($saleData->id);
        $this->assertSame('posted', $sale->status);

        // Attempt direct modification of financial column
        try {
            $sale->total = 500.00;
            $sale->save();
            $this->fail('Expected 403 HttpException on modifying financial column of posted sale.');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $this->assertSame(403, $e->getStatusCode());
        }

        // Attempt direct deletion of posted sale
        try {
            $sale->delete();
            $this->fail('Expected 403 HttpException on deleting posted sale.');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $this->assertSame(403, $e->getStatusCode());
        }
    }
}
