<?php

namespace Tests\Feature;

use App\Models\EcommerceChannel;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Warehouse;
use App\Services\SmartFulfillmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SmartFulfillmentTest extends VenQoreTestCase
{
    use RefreshDatabase;

    public function test_smart_fulfillment_creates_jit_purchase_draft_with_correct_unit_price(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsTenantUser($tenant, 'owner');
        $this->seedTenantDefaults($tenant);

        // Get default warehouse created by seeder
        $warehouse = Warehouse::where('is_default', true)->first();

        // Create ecommerce channel
        $channel = EcommerceChannel::create([
            'name' => 'Shopify Store',
            'platform' => 'shopify',
            'warehouse_id' => $warehouse->id,
            'fee_percentage' => 2.0,
            'is_connected' => true,
        ]);

        // Create product
        $product = Product::create([
            'name' => 'Test Item',
            'sku' => 'TEST-SKU-456',
            'price' => 100.0,
            'cost_price' => 45.0,
            'base_unit' => 'PCS',
        ]);

        // Input items contract
        $items = [
            [
                'sku' => 'TEST-SKU-456',
                'quantity' => 5,
                'sale_price' => 100.0,
                'platform_fee' => 2.0,
                'channel_id' => $channel->id,
                'channel_order_id' => 'ORD-12345',
                'fulfillment_type' => 'jit',
                'currency' => 'USD',
            ]
        ];

        // Process dropship sale
        $service = app(SmartFulfillmentService::class);
        $sale = $service->processDropshipSale($items, $channel->id, $tenant->id, auth()->id());

        $this->assertNotNull($sale);
        $this->assertEquals('ORD-12345', $sale->channel_order_id);

        // Verify that JIT Draft Purchase is created
        $purchase = \App\Models\Purchase::where('is_jit', true)->where('jit_sale_id', $sale->id)->first();
        $this->assertNotNull($purchase);
        $this->assertEquals('draft', $purchase->approval_status);
        $this->assertEquals(225.0, $purchase->total); // 5 * 45.0 (cost_price)

        // Verify that the PurchaseItem carries the correct unit price column value
        $purchaseItem = \App\Models\PurchaseItem::where('purchase_id', $purchase->id)->first();
        $this->assertNotNull($purchaseItem);
        $this->assertEquals($product->id, $purchaseItem->product_id);
        $this->assertEquals(5, $purchaseItem->qty);
        $this->assertEquals(45.0, $purchaseItem->unit_cost);
        $this->assertEquals(225.0, $purchaseItem->line_total);
    }
}
