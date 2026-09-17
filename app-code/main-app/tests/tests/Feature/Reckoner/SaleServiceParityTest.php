<?php

namespace Tests\Feature\Reckoner;

use App\Engines\SaleService;
use App\Models\Party;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

class SaleServiceParityTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $owner;
    private string $tenantId;
    private string $warehouseId;
    private string $productId;
    private string $customerId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('parity-' . Str::lower(Str::random(6)), 'growth', 'active');
        $this->tenantId = (string) $this->tenant->id;
        $this->seedTenantDefaults($this->tenant);
        $this->owner = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->owner, $this->tenant);

        $this->warehouseId = (string) DB::table('warehouses')->where('tenant_id', $this->tenantId)->value('id');

        $this->productId = (string) Str::uuid();
        DB::table('products')->insert([
            'id'             => $this->productId,
            'tenant_id'      => $this->tenantId,
            'name'           => 'Parity Test Item',
            'sku'            => 'SKU-' . Str::random(6),
            'base_unit'      => 'PCS',
            'price'          => 100.00,
            'cost_price'     => 40.00,
            'stock_quantity' => 100,
            'tax_rate'       => 10.0,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        // Create opening FIFO batch and stock record so FIFO deduction succeeds
        DB::table('inventory_batches')->insert([
            'id'            => (string) Str::uuid(),
            'tenant_id'     => $this->tenantId,
            'product_id'    => $this->productId,
            'warehouse_id'  => $this->warehouseId,
            'batch_type'    => 'opening',
            'original_qty'  => 100,
            'remaining_qty' => 100,
            'unit_cost'     => 40.00,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        DB::table('stocks')->insert([
            'id'           => (string) Str::uuid(),
            'tenant_id'    => $this->tenantId,
            'product_id'   => $this->productId,
            'warehouse_id' => $this->warehouseId,
            'quantity'     => 100,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $this->customerId = (string) Str::uuid();
        DB::table('parties')->insert([
            'id'           => $this->customerId,
            'tenant_id'    => $this->tenantId,
            'name'         => 'Parity Customer',
            'type'         => 'customer',
            'credit_limit' => 50000.00,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);
    }

    /**
     * @test
     * Proves that SaleService::post() and SaleController::store() write sales.source
     * identically for POS and invoice/manual sales.
     */
    public function it_writes_sales_source_identically_across_both_paths(): void
    {
        // 1. Controller POS sale -> sales.source = 'pos'
        $resPos = $this->postJson($this->storeUrl($this->tenant, 'sales'), [
            'customer_id'    => $this->customerId,
            'warehouse_id'   => $this->warehouseId,
            'items'          => [['product_id' => $this->productId, 'quantity' => 1, 'price' => 100.00, 'discount' => 0]],
            'payment_method' => 'cash',
            'amount_paid'    => 110.00,
            'source'         => 'pos',
        ]);
        $resPos->assertOk()->assertJson(['success' => true]);
        $controllerPosSaleId = $resPos->json('sale_id');
        $this->assertSame('pos', DB::table('sales')->where('id', $controllerPosSaleId)->value('source'));

        // 2. Controller Manual/Invoice sale -> sales.source = 'manual'
        $resManual = $this->postJson($this->storeUrl($this->tenant, 'sales'), [
            'customer_id'    => $this->customerId,
            'warehouse_id'   => $this->warehouseId,
            'items'          => [['product_id' => $this->productId, 'quantity' => 1, 'price' => 100.00, 'discount' => 0]],
            'payment_method' => 'cash',
            'amount_paid'    => 110.00,
            'source'         => 'manual',
        ]);
        $resManual->assertOk()->assertJson(['success' => true]);
        $controllerManualSaleId = $resManual->json('sale_id');
        $this->assertSame('manual', DB::table('sales')->where('id', $controllerManualSaleId)->value('source'));

        // 3. SaleService POS sale -> sales.source = 'pos'
        $enginePosSale = app(SaleService::class)->post([
            'source'          => 'pos',
            'customer_id'     => $this->customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => now()->toDateString(),
            'payment_method'  => 'cash',
            'amount_received' => 110.00,
            'items'           => [[
                'product_id' => $this->productId,
                'qty'        => 1,
                'unit_price' => 100.00,
                'tax_rate'   => 10.0,
            ]],
        ]);
        $this->assertSame('pos', $enginePosSale->source);
        $this->assertSame('pos', DB::table('sales')->where('id', $enginePosSale->id)->value('source'));

        // 4. SaleService Manual/Invoice sale -> sales.source = 'manual'
        $engineManualSale = app(SaleService::class)->post([
            'source'          => 'manual',
            'customer_id'     => $this->customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => now()->toDateString(),
            'payment_method'  => 'credit',
            'amount_received' => 0.00,
            'items'           => [[
                'product_id' => $this->productId,
                'qty'        => 1,
                'unit_price' => 100.00,
                'tax_rate'   => 10.0,
            ]],
        ]);
        $this->assertSame('manual', $engineManualSale->source);
        $this->assertSame('manual', DB::table('sales')->where('id', $engineManualSale->id)->value('source'));
    }

    /**
     * @test
     * Proves that both paths produce identical journal line structure and debit/credits for the same input.
     */
    public function it_produces_identical_journal_lines_for_identical_sale_inputs(): void
    {
        // Path A: SaleController::store (credit sale, 2 items @ 100, tax 10%)
        $res = $this->postJson($this->storeUrl($this->tenant, 'sales'), [
            'customer_id'    => $this->customerId,
            'warehouse_id'   => $this->warehouseId,
            'items'          => [['product_id' => $this->productId, 'quantity' => 2, 'price' => 100.00, 'discount' => 0]],
            'payment_method' => 'credit',
            'amount_paid'    => 0.00,
            'source'         => 'manual',
        ]);
        $res->assertOk()->assertJson(['success' => true]);
        $ctrlSaleId = $res->json('sale_id');

        // Path B: SaleService::post (credit sale, 2 items @ 100, tax 10%)
        $engineSale = app(SaleService::class)->post([
            'source'          => 'manual',
            'customer_id'     => $this->customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => now()->toDateString(),
            'payment_method'  => 'credit',
            'amount_received' => 0.00,
            'items'           => [[
                'product_id' => $this->productId,
                'qty'        => 2,
                'unit_price' => 100.00,
                'tax_rate'   => 10.0,
            ]],
        ]);

        $getLines = function (string $saleId) {
            $entryId = DB::table('journal_entries')
                ->where('tenant_id', $this->tenantId)
                ->where('reference_type', 'sale')
                ->where('reference', $saleId)
                ->value('id');

            $this->assertNotNull($entryId, "Journal entry not found for sale {$saleId}");

            return DB::table('journal_items as ji')
                ->join('accounts as a', 'a.id', '=', 'ji.account_id')
                ->where('ji.journal_entry_id', $entryId)
                ->orderBy('a.code')
                ->get(['a.code', 'ji.debit', 'ji.credit'])
                ->mapWithKeys(fn ($r) => [$r->code => [round((float) $r->debit, 2), round((float) $r->credit, 2)]])
                ->all();
        };

        $ctrlLines = $getLines($ctrlSaleId);
        $engineLines = $getLines($engineSale->id);

        $this->assertSame($ctrlLines, $engineLines, "Journal lines must match between SaleController and SaleService");

        // Expected accounting lines:
        // 1100 (Inventory) CR 80.00 (2 * 40 cost)
        // 1200 (AR)        DR 220.00 (2 * 100 + 10% tax)
        // 2100 (Tax)       CR 20.00 (10% on 200)
        // 4000 (Revenue)   CR 200.00
        // 5000 (COGS)      DR 80.00
        $this->assertEquals([0.00, 80.00], $ctrlLines['1100']);
        $this->assertEquals([220.00, 0.00], $ctrlLines['1200']);
        $this->assertEquals([0.00, 20.00], $ctrlLines['2100']);
        $this->assertEquals([0.00, 200.00], $ctrlLines['4000']);
        $this->assertEquals([80.00, 0.00], $ctrlLines['5000']);
    }
}
