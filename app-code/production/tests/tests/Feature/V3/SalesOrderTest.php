<?php

namespace Tests\Feature\V3;

use App\Models\Party;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\VenQoreTestCase;

class SalesOrderTest extends VenQoreTestCase
{
    use RefreshDatabase;

    public function test_can_create_and_convert_v3_sales_order(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsTenantUser($tenant, 'owner');
        $this->seedTenantDefaults($tenant);

        // Get default warehouse created by seeder
        $warehouse = Warehouse::where('is_default', true)->first();

        // Create a product
        $product = Product::create([
            'name' => 'Test Item',
            'sku' => 'SKU-TEST-123',
            'price' => 100.0,
            'cost_price' => 50.0,
            'base_unit' => 'PCS',
        ]);

        // Create a customer
        $customer = Party::create([
            'name' => 'Test Customer',
            'type' => 'customer',
        ]);

        // 1. Create Sales Order
        $response = $this->from('/some-page')->post(route('store.v3.sales-orders.store', ['store_slug' => $tenant->slug]), [
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'order_date' => '2026-07-08',
            'delivery_date' => '2026-07-15',
            'notes' => 'Test notes',
            'items' => [
                [
                    'product_id' => $product->id,
                    'qty' => 10.0,
                    'unit_price' => 100.0,
                    'sale_uom' => 'PCS',
                    'discount_percent' => 5.0,
                    'tax_rate' => 10.0,
                ]
            ]
        ]);

        $response->assertRedirect('/some-page');

        // Verify order is created in database
        $order = SalesOrder::first();
        $this->assertNotNull($order);
        $this->assertEquals($customer->id, $order->party_id);
        $this->assertEquals($warehouse->id, $order->warehouse_id);
        // line cost: 1000, discount: 50 -> total: 950
        $this->assertEquals(950.0, $order->total_amount);

        // Verify order item is created with correct V3 columns
        $orderItem = SalesOrderItem::first();
        $this->assertNotNull($orderItem);
        $this->assertEquals($order->id, $orderItem->sales_order_id);
        $this->assertEquals($product->id, $orderItem->product_id);
        $this->assertEquals(10.0, $orderItem->qty);
        $this->assertEquals('PCS', $orderItem->sale_uom);
        $this->assertEquals(5.0, $orderItem->discount_percent);
        $this->assertEquals(10.0, $orderItem->tax_rate);
        $this->assertEquals(950.0, $orderItem->line_total);

        // 2. Convert Sales Order to Invoice (Sale)
        $responseConvert = $this->post(route('store.v3.sales-orders.convert', ['store_slug' => $tenant->slug, 'id' => $order->id]), [
            'payment_method' => 'cash',
            'amount_received' => 950.0,
            'sale_date' => '2026-07-08',
        ]);

        $responseConvert->assertRedirect();
        
        // Verify order status updated to converted
        $order->refresh();
        $this->assertEquals('converted', $order->status);
    }
}
