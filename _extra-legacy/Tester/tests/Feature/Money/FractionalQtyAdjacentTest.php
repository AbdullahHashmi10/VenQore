<?php

namespace Tests\Feature\Money;

use App\Models\Product;
use App\Models\Warehouse;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\Account;
use App\Models\Stock;
use Tests\Feature\VenQoreTestCase;

class FractionalQtyAdjacentTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_B7_a_pre_sale_sales_order_persists_a_fractional_quantity_2_point_5()
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Fractional Product',
            'cost_price' => 10.00,
        ]);

        $customer = \App\Models\Party::factory()->create([
            'tenant_id' => $tenant->id,
            'type' => 'customer',
        ]);

        $salesOrder = SalesOrder::create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'order_number' => 'SO-' . \Illuminate\Support\Str::random(5),
            'order_date' => now()->toDateString(),
            'status' => 'pending',
            'total_amount' => 25.00,
            'user_id' => auth()->id() ?? 1,
        ]);

        $item = SalesOrderItem::create([
            'tenant_id' => $tenant->id,
            'sales_order_id' => $salesOrder->id,
            'product_id' => $product->id,
            'quantity_requested' => 2.5000,
            'unit_price' => 10.00,
            'subtotal' => 25.00,
        ]);

        $freshItem = SalesOrderItem::findOrFail($item->id);
        $this->assertEquals(2.5, (float) $freshItem->quantity_requested);

        // Verify the database value directly as float/decimal
        $dbVal = \DB::table('sales_order_items')->where('id', $item->id)->value('quantity_requested');
        $this->assertEquals(2.5, (float) $dbVal);
    }

    public function test_B7_a_stock_transfer_persists_a_fractional_quantity_2_point_5()
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);

        // Account setups for stock adjustments
        Account::forceCreate([
            'tenant_id' => $tenant->id,
            'code' => '6300',
            'name' => 'Stock Adjustment Loss',
            'type' => 'expense',
            'normal_balance' => 'debit',
        ]);
        Account::forceCreate([
            'tenant_id' => $tenant->id,
            'code' => '4200',
            'name' => 'Stock Adjustment Gain',
            'type' => 'revenue',
            'normal_balance' => 'credit',
        ]);
        // Inventory account is 1400
        Account::forceCreate([
            'tenant_id' => $tenant->id,
            'code' => '1400',
            'name' => 'Inventory',
            'type' => 'asset',
            'normal_balance' => 'debit',
        ]);

        $warehouseA = Warehouse::create([
            'tenant_id' => $tenant->id,
            'name' => 'Warehouse A',
            'code' => 'WHA',
        ]);

        $warehouseB = Warehouse::create([
            'tenant_id' => $tenant->id,
            'name' => 'Warehouse B',
            'code' => 'WHB',
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Transferred Product',
            'cost_price' => 100.00,
            'stock_quantity' => 10.00,
        ]);

        Stock::create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouseA->id,
            'quantity' => 10.00,
        ]);

        // Seed FIFO batch in Warehouse A
        $batchId = \Illuminate\Support\Str::uuid()->toString();
        \DB::table('inventory_batches')->insert([
            'tenant_id' => $tenant->id,
            'id' => $batchId,
            'product_id' => $product->id,
            'warehouse_id' => $warehouseA->id,
            'batch_type' => 'purchase',
            'unit_cost' => 100.00,
            'original_qty' => 10.00,
            'initial_qty' => 10.00,
            'remaining_qty' => 10.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $payload = [
            'from_warehouse_id' => $warehouseA->id,
            'to_warehouse_id' => $warehouseB->id,
            'transfer_date' => now()->toDateString(),
            'status' => 'completed',
            'notes' => 'Transferring fractional stock',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2.5,
                ]
            ]
        ];

        $response = $this->post("/s/{$tenant->slug}/stock-transfers", $payload);
        if (session('errors')) {
            dd(session('errors')->getMessages());
        }
        $response->assertRedirect();

        // Verify stock transfers table quantity
        $transferItem = \DB::table('stock_transfer_items')->first();
        $this->assertNotNull($transferItem);
        $this->assertEquals(2.5, (float) $transferItem->quantity);

        // Verify stock levels moved correctly
        $stockA = Stock::where('product_id', $product->id)->where('warehouse_id', $warehouseA->id)->first();
        $stockB = Stock::where('product_id', $product->id)->where('warehouse_id', $warehouseB->id)->first();

        $this->assertEquals(7.5, (float) $stockA->quantity);
        $this->assertEquals(2.5, (float) $stockB->quantity);
    }
}
