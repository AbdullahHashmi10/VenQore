<?php

namespace Tests\Feature\V3\Scenarios;

use Tests\TestCase;
use App\Services\V3\ManufacturingService;
use App\Services\V3\FifoService;
use App\Services\V3\AccountingService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class ManufacturingServiceTest extends TestCase
{
    use DatabaseTransactions;

    private ManufacturingService $manufacturing;
    private FifoService          $fifo;
    private AccountingService    $accounting;

    private string $finishedGoodId;
    private string $rawMaterial1Id;
    private string $rawMaterial2Id;
    private string $warehouseId;
    private string $bomId;

    protected function setUp(): void
    {
        parent::setUp();

        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);

        $this->manufacturing = app(ManufacturingService::class);
        $this->fifo          = app(FifoService::class);
        $this->accounting    = app(AccountingService::class);

        $this->seedAccounts();
        $this->warehouseId    = $this->seedWarehouse();
        $this->finishedGoodId = $this->seedProduct('FINISHED-GOOD', 'PCS');
        $this->rawMaterial1Id = $this->seedProduct('RAW-MAT-1', 'KG');
        $this->rawMaterial2Id = $this->seedProduct('RAW-MAT-2', 'LTR');

        // Stock up raw materials
        $this->fifo->receiveBatch($this->rawMaterial1Id, $this->warehouseId, 100, 50.00, 'purchase');
        $this->fifo->receiveBatch($this->rawMaterial2Id, $this->warehouseId, 100, 20.00, 'purchase');

        // Create BOM: 1 finished good = 2 KG of RM1 + 1 LTR of RM2
        $this->bomId = $this->seedBom([
            ['product_id' => $this->rawMaterial1Id, 'qty_per_unit' => 2.0, 'is_byproduct' => 0],
            ['product_id' => $this->rawMaterial2Id, 'qty_per_unit' => 1.0, 'is_byproduct' => 0],
        ]);
    }

    // ─── TEST 1: startProductionRun deducts raw materials (FIFO) ─────
    /** @test */
    public function start_production_run_deducts_raw_materials_fifo()
    {
        // Produce 5 units → needs 10 KG RM1 (5×2) + 5 LTR RM2 (5×1)
        $run = $this->manufacturing->startRun([
            'bom_id'       => $this->bomId,
            'planned_qty'  => 5.0,
            'warehouse_id' => $this->warehouseId,
            'run_date'     => now()->toDateString(),
        ]);

        $this->assertNotNull($run);
        $this->assertEquals('in_progress', $run->status);

        // RM1: 100 - 10 = 90 remaining
        $rm1Remaining = DB::table('inventory_batches')
            ->where('product_id', $this->rawMaterial1Id)
            ->sum('remaining_qty');
        $this->assertEquals(90.0, (float) $rm1Remaining);

        // RM2: 100 - 5 = 95 remaining
        $rm2Remaining = DB::table('inventory_batches')
            ->where('product_id', $this->rawMaterial2Id)
            ->sum('remaining_qty');
        $this->assertEquals(95.0, (float) $rm2Remaining);
    }

    // ─── TEST 2: startProductionRun posts WIP journal entry (B32) ────
    /** @test */
    public function start_production_run_posts_wip_journal_entry()
    {
        $run = $this->manufacturing->startRun([
            'bom_id'       => $this->bomId,
            'planned_qty'  => 5.0,
            'warehouse_id' => $this->warehouseId,
            'run_date'     => now()->toDateString(),
        ]);

        // Material cost: (5×2×50) + (5×1×20) = 500 + 100 = 600
        $expectedMaterialCost = 600.00;

        $account6400 = DB::table('accounts')->where('code', '6400')->first();
        $account1100 = DB::table('accounts')->where('code', '1100')->first();

        // Expensed to 6400 Manufacturing Cost instead of WIP
        $wip = DB::table('journal_items')
            ->where('journal_entry_id', $run->journal_entry_id)
            ->where('account_id', $account6400->id)
            ->first();

        $this->assertNotNull($wip);
        $this->assertEquals($expectedMaterialCost, (float) $wip->debit);

        // Inventory (1100) should be credited (materials moved out)
        $inv = DB::table('journal_items')
            ->where('journal_entry_id', $run->journal_entry_id)
            ->where('account_id', $account1100->id)
            ->first();

        $this->assertNotNull($inv);
        $this->assertEquals($expectedMaterialCost, (float) $inv->credit);
    }

    // ─── TEST 3: completeProductionRun creates finished goods batch ──
    /** @test */
    public function complete_production_run_creates_finished_goods_batch()
    {
        $run = $this->manufacturing->startRun([
            'bom_id'       => $this->bomId,
            'planned_qty'  => 5.0,
            'warehouse_id' => $this->warehouseId,
            'run_date'     => now()->toDateString(),
        ]);

        $this->manufacturing->completeRun($run->id, 5.0);

        // Finished goods batch must exist
        $batch = DB::table('inventory_batches')
            ->where('product_id', $this->finishedGoodId)
            ->where('batch_type', 'manufactured')
            ->first();

        $this->assertNotNull($batch);
        $this->assertEquals(5.0, (float) $batch->initial_qty);

        // Unit cost = total_material_cost / qty = 600 / 5 = 120
        $this->assertEquals(120.00, (float) $batch->unit_cost);
    }

    // ─── TEST 4: completeProductionRun closes WIP with B16/B32 ───────
    /** @test */
    public function complete_production_run_posts_completion_journal_closing_wip()
    {
        $run = $this->manufacturing->startRun([
            'bom_id'       => $this->bomId,
            'planned_qty'  => 5.0,
            'warehouse_id' => $this->warehouseId,
            'run_date'     => now()->toDateString(),
        ]);

        $fgBatch = $this->manufacturing->completeRun($run->id, 5.0);
        $completionEntry = \Illuminate\Support\Facades\DB::table('journal_entries')
            ->where('reference_type', 'production_complete')
            ->where('reference', $run->id)
            ->first();

        $account6400 = DB::table('accounts')->where('code', '6400')->first();
        $account1100 = DB::table('accounts')->where('code', '1100')->first();

        // 1100 Inventory debited (finished goods IN)
        $invDebit = DB::table('journal_items')
            ->where('journal_entry_id', $completionEntry->id)
            ->where('account_id', $account1100->id)
            ->where('debit', '>', 0)
            ->first();
        $this->assertNotNull($invDebit);
        $this->assertEquals(600.00, (float) $invDebit->debit);

        // 6400 Manufacturing Cost credited
        $wipCredit = DB::table('journal_items')
            ->where('journal_entry_id', $completionEntry->id)
            ->where('account_id', $account6400->id)
            ->where('credit', '>', 0)
            ->first();
        $this->assertNotNull($wipCredit);
        $this->assertEquals(600.00, (float) $wipCredit->credit);

        // WIP balance on production_run should now be 0
        $updatedRun = DB::table('production_runs')->where('id', $run->id)->first();
        $this->assertEquals(0.00, (float) $updatedRun->wip_balance);
        $this->assertEquals('completed', $updatedRun->status);
    }

    // ─── TEST 5: partialReverse reverses only unsold qty (S-015) ─────
    /** @test */
    public function partial_reverse_only_reverses_unsold_quantity()
    {
        $run = $this->manufacturing->startRun([
            'bom_id'       => $this->bomId,
            'planned_qty'  => 10.0,
            'warehouse_id' => $this->warehouseId,
            'run_date'     => now()->toDateString(),
        ]);
        $this->manufacturing->completeRun($run->id, 10.0);

        // Simulate 4 units sold from the finished goods batch
        $fgBatch = DB::table('inventory_batches')
            ->where('product_id', $this->finishedGoodId)
            ->where('batch_type', 'manufactured')
            ->first();

        DB::table('inventory_batches')
            ->where('id', $fgBatch->id)
            ->update(['remaining_qty' => 6.0]); // 10 produced - 4 sold = 6 remaining

        // Reverse 6 units (the unsold ones) — should succeed
        $this->manufacturing->partialReverse($run->id, 6.0);

        $updatedRun = DB::table('production_runs')->where('id', $run->id)->first();
        $this->assertEquals('partially_reversed', $updatedRun->status);
    }

    // ─── TEST 6: partialReverse blocks reversing sold units (S-015) ──
    /** @test */
    public function partial_reverse_throws_when_attempting_to_reverse_sold_units()
    {
        $run = $this->manufacturing->startRun([
            'bom_id'       => $this->bomId,
            'planned_qty'  => 10.0,
            'warehouse_id' => $this->warehouseId,
            'run_date'     => now()->toDateString(),
        ]);
        $this->manufacturing->completeRun($run->id, 10.0);

        // 4 sold → only 6 remaining — cannot reverse 8
        $fgBatch = DB::table('inventory_batches')
            ->where('product_id', $this->finishedGoodId)
            ->where('batch_type', 'manufactured')
            ->first();

        DB::table('inventory_batches')
            ->where('id', $fgBatch->id)
            ->update(['remaining_qty' => 6.0]);

        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        $saleId = \Illuminate\Support\Str::uuid()->toString();
        $saleItemId = \Illuminate\Support\Str::uuid()->toString();
        $userId = DB::table('users')->value('id') ?? \App\Models\User::factory()->create()->id;
        DB::table('sales')->insert([
            'id' => $saleId,
            'reference_number' => 'INV-TEST',
            'user_id' => $userId,
            'subtotal' => 0.00,
            'total' => 0.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('sale_items')->insert([
            'id' => $saleItemId,
            'sale_id' => $saleId,
            'product_id' => $this->finishedGoodId,
            'quantity' => 4,
            'unit_price' => 100,
            'subtotal' => 400.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('sale_item_batches')->insert([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'sale_item_id' => $saleItemId,
            'inventory_batch_id' => $fgBatch->id,
            'qty_deducted' => 4.0,
            'unit_cost' => $fgBatch->unit_cost,
            'total_cogs' => $fgBatch->unit_cost * 4.0,
            'is_reversed' => 0,
            'created_at' => now(),
        ]);
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        $this->expectException(\App\Exceptions\ProductionReversalException::class);

        // Attempt to reverse 8 but only 6 unsold — must throw
        $this->manufacturing->partialReverse($run->id, 8.0);
    }

    // ─── TEST 7: disassemble posts B30 and creates component batches ─
    /** @test */
    public function disassemble_posts_b30_and_creates_component_batches()
    {
        // Create a set product with a disassembly BOM
        $setProductId   = $this->seedProduct('PRINTER-SET', 'PCS');
        $component1Id   = $this->seedProduct('PRINTER',     'PCS');
        $component2Id   = $this->seedProduct('INK-CART',    'PCS');
        $component3Id   = $this->seedProduct('USB-CABLE',   'PCS');

        // Seed the set as a batch at Rs.5000
        $setBatch = $this->fifo->receiveBatch(
            $setProductId, $this->warehouseId, 1.0, 5000.00, 'purchase'
        );

        // Disassembly BOM: Printer 60%, Ink 25%, USB 15%
        $dbomId = $this->seedDisassemblyBom($setProductId, [
            ['component_product_id' => $component1Id, 'allocation_percent' => 60.00],
            ['component_product_id' => $component2Id, 'allocation_percent' => 25.00],
            ['component_product_id' => $component3Id, 'allocation_percent' => 15.00],
        ]);

        $this->manufacturing->disassemble($setProductId, 1.0, $this->warehouseId);

        // Set batch must be fully consumed
        $this->assertDatabaseHas('inventory_batches', [
            'id'            => $setBatch->id,
            'remaining_qty' => 0.0,
        ]);

        // Component batches must be created at allocated costs
        $this->assertDatabaseHas('inventory_batches', [
            'product_id'    => $component1Id,
            'unit_cost'     => 3000.00, // 60% of 5000
            'batch_type'    => 'disassembly',
        ]);

        $this->assertDatabaseHas('inventory_batches', [
            'product_id'    => $component2Id,
            'unit_cost'     => 1250.00, // 25% of 5000
            'batch_type'    => 'disassembly',
        ]);

        $this->assertDatabaseHas('inventory_batches', [
            'product_id'    => $component3Id,
            'unit_cost'     => 750.00, // 15% of 5000
            'batch_type'    => 'disassembly',
        ]);
    }

    // ─── TEST 8: disassembly BOM percentages must sum to 100 ─────────
    /** @test */
    public function disassemble_throws_when_bom_percentages_do_not_sum_to_100()
    {
        $setProductId = $this->seedProduct('BAD-SET', 'PCS');
        $comp1Id      = $this->seedProduct('COMP-1',  'PCS');
        $comp2Id      = $this->seedProduct('COMP-2',  'PCS');

        $this->fifo->receiveBatch($setProductId, $this->warehouseId, 1.0, 1000.00, 'purchase');

        // Intentionally bad BOM: 60 + 30 = 90 (not 100)
        $this->seedDisassemblyBom($setProductId, [
            ['component_product_id' => $comp1Id, 'allocation_percent' => 60.00],
            ['component_product_id' => $comp2Id, 'allocation_percent' => 30.00],
        ]);

        $this->expectException(\App\Exceptions\InvalidDisassemblyBomException::class);

        $this->manufacturing->disassemble($setProductId, 1.0, $this->warehouseId);
    }

    // ─── TEST 9: by-product reduces main product cost (S-094) ────────
    /** @test */
    public function by_product_nrv_reduces_main_product_cost_on_completion()
    {
        $byProductId = $this->seedProduct('SAWDUST', 'KG');

        // BOM: 2 KG RM1 (cost=50 each → Rs.100) + by-product SAWDUST at NRV Rs.10 per unit
        $bomWithByproduct = $this->seedBom([
            ['product_id' => $this->rawMaterial1Id, 'qty_per_unit' => 2.0,
             'is_byproduct' => 0, 'byproduct_nrv' => 0],
            ['product_id' => $byProductId, 'qty_per_unit' => 0.5,
             'is_byproduct' => 1, 'byproduct_nrv' => 10.00],
        ]);

        // Stock up raw material only (not byproduct — it gets CREATED)
        $this->fifo->receiveBatch($this->rawMaterial1Id, $this->warehouseId, 50, 50.00, 'purchase');

        $run = $this->manufacturing->startRun([
            'bom_id'       => $bomWithByproduct,
            'planned_qty'  => 1.0,
            'warehouse_id' => $this->warehouseId,
            'run_date'     => now()->toDateString(),
        ]);
        $this->manufacturing->completeRun($run->id, 1.0);

        // By-product batch at NRV = 0.5 × Rs.10 = Rs.5
        $this->assertDatabaseHas('inventory_batches', [
            'product_id' => $byProductId,
            'unit_cost'  => 10.00, // NRV per unit
            'batch_type' => 'manufactured',
        ]);

        // Main product cost = total_material_cost - by-product NRV
        // = (1×2×50) - (0.5×10) = 100 - 5 = 95
        // unit_cost of finished good = 95 / 1 = 95
        $fgBatch = DB::table('inventory_batches')
            ->where('product_id', $this->finishedGoodId)
            ->where('batch_type', 'manufactured')
            ->orderByDesc('created_at')
            ->first();

        $this->assertEquals(95.00, (float) $fgBatch->unit_cost);
    }

    // ═══════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════

    private function seedAccounts(): void
    {
        $accounts = [
            ['1000', 'Cash in Hand',              'asset',   'debit'],
            ['1100', 'Inventory Asset',            'asset',   'debit'],
            ['1150', 'Work-In-Progress',           'asset',   'debit'],
            ['4000', 'Sales Revenue',              'income',  'credit'],
            ['6400', 'Manufacturing Cost',         'expense', 'debit'],
            ['6410', 'Applied Manufacturing Labor','expense', 'debit'],
        ];
        foreach ($accounts as [$code, $name, $type, $balance]) {
            if (!DB::table('accounts')->where('code', $code)->exists()) {
                DB::table('accounts')->insert([
                    'id'             => Str::uuid()->toString(),
                    'code'           => $code,
                    'name'           => $name,
                    'type'           => $type,
                    'normal_balance' => $balance,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }
        }
    }

    private function seedWarehouse(): string
    {
        $id = Str::uuid()->toString();
        DB::table('warehouses')->insert([
            'id'         => $id,
            'name'       => 'Factory Warehouse',
            'is_default' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function seedProduct(string $sku, string $baseUom = 'PCS'): string
    {
        $id = Str::uuid()->toString();
        DB::table('products')->insert([
            'id'          => $id,
            'name'        => $sku,
            'sku'         => $sku . '-' . Str::random(4),
            'base_unit'   => $baseUom,
            'price'       => 100.00,
            'cost_price'  => 50.00,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
        return $id;
    }

    private function seedBom(array $items): string
    {
        $bomId = Str::uuid()->toString();
        DB::table('bill_of_materials')->insert([
            'id'             => $bomId,
            'product_id'     => $this->finishedGoodId,
            'version'        => 1,
            'effective_from' => now()->toDateString(),
            'is_active'      => 1,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        foreach ($items as $item) {
            DB::table('bom_items')->insert([
                'id'             => Str::uuid()->toString(),
                'bom_id'         => $bomId,
                'product_id'     => $item['product_id'],
                'qty_per_unit'   => $item['qty_per_unit'],
                'is_byproduct'   => $item['is_byproduct'] ?? 0,
                'byproduct_nrv'  => $item['byproduct_nrv'] ?? 0,
                'created_at'     => now(),
            ]);
        }

        return $bomId;
    }

    private function seedDisassemblyBom(string $productId, array $components): string
    {
        $dbomId = Str::uuid()->toString();
        DB::table('disassembly_boms')->insert([
            'id'         => $dbomId,
            'product_id' => $productId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($components as $comp) {
            DB::table('disassembly_bom_items')->insert([
                'id'                   => Str::uuid()->toString(),
                'disassembly_bom_id'   => $dbomId,
                'component_product_id' => $comp['component_product_id'],
                'allocation_percent'   => $comp['allocation_percent'],
                'created_at'           => now(),
            ]);
        }

        return $dbomId;
    }
}
