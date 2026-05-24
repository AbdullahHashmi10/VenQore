<?php

namespace Tests\Feature\V3\Scenarios;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Services\V3\FifoService;
use App\Services\V3\AccountingService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class FifoServiceTest extends TestCase
{
    use DatabaseTransactions;

    private FifoService $fifo;
    private string $productId;
    private string $warehouseId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->fifo = app(FifoService::class);

        // Seed a product and warehouse for all tests
        $this->productId   = Str::uuid()->toString();
        $this->warehouseId = Str::uuid()->toString();

        DB::table('products')->insertOrIgnore([
            'id'           => $this->productId,
            'name'         => 'Test Product',
            'sku'          => 'TEST-' . Str::random(6),
            'unit'         => 'PCS',
            'cost_price'   => 0,
            'price'        => 100,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        DB::table('warehouses')->insertOrIgnore([
            'id'         => $this->warehouseId,
            'name'       => 'Test Warehouse',
            'is_default' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createBatch(float $qty, float $unitCost, string $createdAt = null): string
    {
        $id = Str::uuid()->toString();
        DB::table('inventory_batches')->insert([
            'id'           => $id,
            'product_id'   => $this->productId,
            'warehouse_id' => $this->warehouseId,
            'batch_type'   => 'purchase',
            'unit_cost'    => $unitCost,
            'initial_qty'  => $qty,
            'remaining_qty'=> $qty,
            'created_at'   => $createdAt ?? now(),
            'updated_at'   => now(),
        ]);
        return $id;
    }

    // ─── TEST 1: Oldest batch consumed first ──────────────────────────
    /** @test */
    public function it_deducts_from_oldest_batch_first()
    {
        // Batch 1 — older, cost Rs.10
        $batch1 = $this->createBatch(10, 10.00, now()->subDays(2)->toDateTimeString());
        // Batch 2 — newer, cost Rs.20
        $batch2 = $this->createBatch(10, 20.00, now()->subDays(1)->toDateTimeString());

        $result = $this->fifo->deductStock($this->productId, $this->warehouseId, 5, 'PCS');

        // Only batch1 should be touched (oldest first)
        $this->assertCount(1, $result);
        $this->assertEquals($batch1, $result[0]['batch_id']);
        $this->assertEquals(5, $result[0]['qty_taken']);
        $this->assertEquals(10.00, $result[0]['unit_cost']);
        $this->assertEquals(50.00, $result[0]['total_cost']);

        // batch1 remaining_qty should now be 5
        $this->assertDatabaseHas('inventory_batches', [
            'id'            => $batch1,
            'remaining_qty' => 5,
        ]);

        // batch2 should be untouched
        $this->assertDatabaseHas('inventory_batches', [
            'id'            => $batch2,
            'remaining_qty' => 10,
        ]);
    }

    // ─── TEST 2: Spans multiple batches correctly ──────────────────────
    /** @test */
    public function it_spans_multiple_batches_when_first_is_insufficient()
    {
        $batch1 = $this->createBatch(4, 10.00, now()->subDays(3)->toDateTimeString());
        $batch2 = $this->createBatch(4, 15.00, now()->subDays(2)->toDateTimeString());
        $batch3 = $this->createBatch(4, 20.00, now()->subDays(1)->toDateTimeString());

        // Deduct 7 units — should consume all of batch1 (4) + 3 from batch2
        $result = $this->fifo->deductStock($this->productId, $this->warehouseId, 7, 'PCS');

        $this->assertCount(2, $result);

        $this->assertEquals($batch1, $result[0]['batch_id']);
        $this->assertEquals(4, $result[0]['qty_taken']);
        $this->assertEquals(40.00, $result[0]['total_cost']);

        $this->assertEquals($batch2, $result[1]['batch_id']);
        $this->assertEquals(3, $result[1]['qty_taken']);
        $this->assertEquals(45.00, $result[1]['total_cost']);

        // Total COGS must equal 85.00
        $totalCogs = array_sum(array_column($result, 'total_cost'));
        $this->assertEquals(85.00, $totalCogs);

        // batch1 exhausted, batch2 partially used, batch3 untouched
        $this->assertDatabaseHas('inventory_batches', ['id' => $batch1, 'remaining_qty' => 0]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batch2, 'remaining_qty' => 1]);
        $this->assertDatabaseHas('inventory_batches', ['id' => $batch3, 'remaining_qty' => 4]);
    }

    // ─── TEST 3: Throws when stock insufficient ────────────────────────
    /** @test */
    public function it_throws_when_stock_is_insufficient()
    {
        $this->createBatch(3, 10.00);

        $this->expectException(\App\Exceptions\InsufficientStockException::class);

        $this->fifo->deductStock($this->productId, $this->warehouseId, 10, 'PCS');
    }

    // ─── TEST 4: Database CHECK constraint blocks negative stock ───────
    /** @test */
    public function database_constraint_blocks_negative_remaining_qty()
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        // Directly attempt to set remaining_qty below zero — DB must reject this
        $batchId = $this->createBatch(5, 10.00);
        DB::statement("UPDATE inventory_batches SET remaining_qty = -1 WHERE id = ?", [$batchId]);
    }

    // ─── TEST 5: restoreStock returns qty to exact original batch ──────
    /** @test */
    public function it_restores_stock_to_exact_original_batch()
    {
        $batch1 = $this->createBatch(10, 10.00, now()->subDays(2)->toDateTimeString());
        $this->createBatch(10, 20.00, now()->subDays(1)->toDateTimeString());

        // Perform a deduction first
        $deductions = $this->fifo->deductStock($this->productId, $this->warehouseId, 6, 'PCS');

        // Create a fake sale and sale_item to restore from to satisfy FK constraint
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();

        $saleId = Str::uuid()->toString();
        DB::table('sales')->insert([
            'id' => $saleId,
            'reference_number' => 'INV-TEST',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $saleItemId = Str::uuid()->toString();
        DB::table('sale_items')->insert([
            'id' => $saleItemId,
            'sale_id' => $saleId,
            'product_id' => $this->productId,
            'quantity' => 6,
            'unit_price' => 100,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        foreach ($deductions as $d) {
            DB::table('sale_item_batches')->insert([
                'id'                   => Str::uuid()->toString(),
                'sale_item_id'         => $saleItemId,
                'inventory_batch_id'   => $d['batch_id'],
                'qty_deducted'         => $d['qty_taken'],
                'unit_cost'            => $d['unit_cost'],
                'total_cogs'           => $d['total_cost'],
                'is_reversed'          => 0,
                'created_at'           => now(),
            ]);
        }

        // Now restore
        $this->fifo->restoreStock($saleItemId);

        // batch1 should be back to 10
        $this->assertDatabaseHas('inventory_batches', [
            'id'             => $batch1,
            'remaining_qty'  => 10,
        ]);

        // sale_item_batches rows should be marked reversed
        $this->assertDatabaseHas('sale_item_batches', [
            'sale_item_id' => $saleItemId,
            'is_reversed'  => 1,
        ]);
    }

    // ─── TEST 6: receiveBatch creates a new batch correctly ───────────
    /** @test */
    public function it_creates_a_new_batch_on_receive()
    {
        $batch = $this->fifo->receiveBatch(
            productId:   $this->productId,
            warehouseId: $this->warehouseId,
            qty:         50.0,
            unitCost:    25.00,
            batchType:   'purchase'
        );

        $this->assertDatabaseHas('inventory_batches', [
            'id'            => $batch->id,
            'product_id'    => $this->productId,
            'warehouse_id'  => $this->warehouseId,
            'unit_cost'     => 25.00,
            'initial_qty'   => 50.0,
            'remaining_qty' => 50.0,
        ]);
    }

    // ─── TEST 7: FIFO is per-warehouse — other warehouse not touched ───
    /** @test */
    public function it_only_deducts_from_the_specified_warehouse()
    {
        $otherWarehouseId = Str::uuid()->toString();
        DB::table('warehouses')->insert([
            'id'         => $otherWarehouseId,
            'name'       => 'Other Warehouse',
            'is_default' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3 units in the target warehouse
        $targetBatch = $this->createBatch(3, 10.00);

        // 10 units in a different warehouse — should not be touched
        $otherBatchId = Str::uuid()->toString();
        DB::table('inventory_batches')->insert([
            'id'            => $otherBatchId,
            'product_id'    => $this->productId,
            'warehouse_id'  => $otherWarehouseId,
            'batch_type'    => 'purchase',
            'unit_cost'     => 10.00,
            'initial_qty'   => 10,
            'remaining_qty' => 10,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        // Should throw because target warehouse only has 3, not 5
        $this->expectException(\App\Exceptions\InsufficientStockException::class);
        $this->fifo->deductStock($this->productId, $this->warehouseId, 5, 'PCS');
    }
}
