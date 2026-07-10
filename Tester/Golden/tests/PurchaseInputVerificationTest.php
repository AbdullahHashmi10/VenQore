<?php

namespace Tests\Feature\Golden;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Services\V3\AccountingService;

/**
 * ============================================================
 * Phase 3 — Input Verification: PURCHASE Events
 * ============================================================
 *
 * Event catalog:
 *  [P-01] Cash purchase — inventory debit, cash credit, input tax
 *  [P-02] Credit purchase — AP credit instead of cash
 *  [P-03] Purchase with input tax — GL 2300 debit
 *  [P-04] Purchase return — reversal restores AP and inventory
 *  [P-05] Multi-line purchase — each line creates a separate FIFO batch
 *
 * @group golden
 * @group phase3
 * @group phase3-purchases
 */
class PurchaseInputVerificationTest extends InputVerificationTestCase
{
    private AccountingService $accounting;

    protected function setUp(): void
    {
        parent::setUp();
        $this->accounting = app(AccountingService::class);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P-01] CASH PURCHASE — happy path
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Cash purchase of 10 units @ Rs.1,000 each, 17% input tax.
     *   Goods value = 10,000. Input tax = 1,700. Total = 11,700.
     *   DR 1100 Inventory    10,000.00
     *   DR 2300 Input Tax     1,700.00
     *   CR 1000 Cash         11,700.00
     *
     * A FIFO batch must be created with original_qty=10, unit_cost=1,000.
     */
    public function test_P01_cash_purchase_debits_inventory_and_input_tax(): void
    {
        $vendorId = $this->createVendor('Acme Suppliers');
        $productId = \Illuminate\Support\Str::uuid()->toString();
        DB::table('products')->insert(['base_unit' => 'pcs', 
            'id'              => $productId,
            'tenant_id'       => $this->tenant->id,
            'name'            => 'Purchase Test Product',
            'sku'             => 'PUR-' . substr($productId, 0, 8),
            'price'   => 1500.00,
            'cost_price'      => 1000.00,
            'tax_rate'        => 17,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $goodsValue  = 10 * 1000.0;  // 10,000
        $inputTax    = round($goodsValue * 0.17, 2); // 1,700
        $totalPayable = $goodsValue + $inputTax;     // 11,700

        $beforeBatchCount = DB::table('inventory_batches')
            ->where('tenant_id', $this->tenant->id)
            ->where('product_id', $productId)
            ->count();

        $purchaseSvc = app(\App\Services\V3\PurchaseService::class);
        $purchaseSvc->store([
            'vendor_id'      => $vendorId,
            'warehouse_id'   => $this->warehouseId,
            'purchase_date'  => '2025-06-15',
            'payment_method' => 'cash',
            'items' => [[
                'product_id' => $productId,
                'qty'        => 10,
                'unit_cost'  => 1000.00,
                'tax_rate'   => 17,
            ]],
        ]);

        $lines = $this->getJournalLines('purchase');
        $this->assertJournalBalanced($lines);

        $this->assertJournalLine($lines, '1100', 'debit',  $goodsValue,   'Inventory debit (purchase)');
        $this->assertJournalLine($lines, '2300', 'debit',  $inputTax,     'Input tax debit');
        $this->assertJournalLine($lines, '1000', 'credit', $totalPayable, 'Cash credit (paid on delivery)');

        // FIFO batch created
        $afterBatchCount = DB::table('inventory_batches')
            ->where('tenant_id', $this->tenant->id)
            ->where('product_id', $productId)
            ->count();
        $this->assertEquals($beforeBatchCount + 1, $afterBatchCount,
            'Purchase should create exactly one new FIFO batch');

        $newBatch = DB::table('inventory_batches')
            ->where('tenant_id', $this->tenant->id)
            ->where('product_id', $productId)
            ->orderBy('created_at', 'desc')
            ->first();

        $this->assertEqualsWithDelta(10.0, (float)$newBatch->original_qty, 0.001, 'Batch original_qty');
        $this->assertEqualsWithDelta(10.0, (float)$newBatch->remaining_qty, 0.001, 'Batch remaining_qty');
        $this->assertEqualsWithDelta(1000.0, (float)$newBatch->unit_cost, 0.001, 'Batch unit_cost');

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P-02] CREDIT PURCHASE — AP instead of cash
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Credit purchase: payment_method='credit'. No cash out. Full amount → AP.
     *   DR 1100 Inventory    10,000.00
     *   DR 2300 Input Tax     1,700.00
     *   CR 2000 AP           11,700.00
     */
    public function test_P02_credit_purchase_credits_ap_instead_of_cash(): void
    {
        $vendorId  = $this->createVendor();
        $productId = \Illuminate\Support\Str::uuid()->toString();
        DB::table('products')->insert(['base_unit' => 'pcs', 
            'id' => $productId, 'tenant_id' => $this->tenant->id,
            'name' => 'Credit Purchase Product', 'sku' => 'CP-' . substr($productId, 0, 8),
            'price' => 1500.00, 'cost_price' => 1000.00, 'tax_rate' => 17,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $totalPayable = 10 * 1000 * 1.17;

        $purchaseSvc = app(\App\Services\V3\PurchaseService::class);
        $purchaseSvc->store([
            'vendor_id'      => $vendorId,
            'warehouse_id'   => $this->warehouseId,
            'purchase_date'  => '2025-06-15',
            'payment_method' => 'credit',
            'items' => [[
                'product_id' => $productId,
                'qty'        => 10,
                'unit_cost'  => 1000.00,
                'tax_rate'   => 17,
            ]],
        ]);

        $lines = $this->getJournalLines('purchase');
        $this->assertJournalBalanced($lines);

        $this->assertJournalLine($lines, '2000', 'credit', $totalPayable, 'AP (credit purchase)');

        $cashLines = $lines->filter(fn($l) => $l->code === '1000' && (float)$l->credit > 0);
        $this->assertEmpty($cashLines->toArray(),
            'Credit purchase must not have a Cash CR line — only AP');

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P-03] PURCHASE RETURN — full reversal
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Post a credit purchase, then return all goods.
     * After return: GL 1100 net = 0 for that product, GL 2000 net = 0, FIFO batch gone.
     */
    public function test_P03_purchase_return_reverses_inventory_and_ap(): void
    {
        $vendorId  = $this->createVendor();
        $productId = \Illuminate\Support\Str::uuid()->toString();
        DB::table('products')->insert(['base_unit' => 'pcs', 
            'id' => $productId, 'tenant_id' => $this->tenant->id,
            'name' => 'Return Product', 'sku' => 'RT-' . substr($productId, 0, 8),
            'price' => 1200.00, 'cost_price' => 800.00, 'tax_rate' => 0,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $gl1100Before = $this->glBalance('1100');
        $apBefore     = $this->glBalance('2000');

        $purchaseSvc = app(\App\Services\V3\PurchaseService::class);
        $purchase    = $purchaseSvc->store([
            'vendor_id'      => $vendorId,
            'warehouse_id'   => $this->warehouseId,
            'purchase_date'  => '2025-06-15',
            'payment_method' => 'credit',
            'items' => [[
                'product_id' => $productId,
                'qty'        => 5,
                'unit_cost'  => 800.00,
                'tax_rate'   => 0,
            ]],
        ]);

        // Verify purchase was journalized
        $this->assertGreaterThan($apBefore, $this->glBalance('2000'),
            'AP should increase after credit purchase');

        // Now return all items
        $purchaseSvc->createReturn($purchase->id, [
            'return_date' => '2025-06-16',
            'reason'      => 'Defective goods',
            'items' => [[
                'product_id'         => $productId,
                'purchase_item_id'   => DB::table('purchase_items')
                    ->where('purchase_id', $purchase->id)
                    ->value('id'),
                'qty_returned'       => 5,
            ]],
        ]);

        // Both balances must be restored
        $this->assertEqualsWithDelta($gl1100Before, $this->glBalance('1100'), $this->TOLERANCE,
            'GL 1100 must be restored after purchase return');
        $this->assertEqualsWithDelta($apBefore, $this->glBalance('2000'), $this->TOLERANCE,
            'GL 2000 (AP) must be restored after purchase return');

        // FIFO batch should be zeroed out
        $remainingQty = DB::table('inventory_batches')
            ->where('tenant_id', $this->tenant->id)
            ->where('product_id', $productId)
            ->sum('remaining_qty');
        $this->assertEqualsWithDelta(0.0, (float)$remainingQty, 0.001,
            'All FIFO qty must be zeroed after full purchase return');

        $this->assertLedgerInvariantsHold();
    }
}
