<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductBarcode;
use App\Models\Stock;
use App\Models\InventoryBatch;
use App\Models\SaleItem;
use App\Models\Sale;
use App\Models\Party;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\VenQoreTestCase;

class ProductDeletionTest extends VenQoreTestCase
{
    use RefreshDatabase;

    public function test_cannot_delete_product_with_remaining_stock(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);

        // Seed defaults (warehouse, etc.)
        $this->seedTenantDefaults($tenant);
        $warehouse = Warehouse::first();

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Stocked Product',
            'sku' => 'STK-001',
        ]);

        // Add remaining stock batch
        InventoryBatch::create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 10,
            'remaining_qty' => 10,
            'unit_cost' => 100,
            'batch_type' => 'initial_stock',
        ]);

        $response = $this->delete($this->storeUrl($tenant, "inventory/{$product->id}"));

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('products', ['id' => $product->id, 'deleted_at' => null]);
    }

    public function test_cannot_delete_product_with_transaction_history(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);
        $warehouse = Warehouse::first();

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'History Product',
            'sku' => 'HST-001',
        ]);

        $customer = Party::create([
            'tenant_id' => $tenant->id,
            'name' => 'Test Customer',
            'type' => 'customer',
        ]);

        $sale = Sale::create([
            'tenant_id' => $tenant->id,
            'reference_number' => 'REF-001',
            'total' => 200,
            'subtotal' => 200,
            'status' => 'posted',
            'party_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'user_id' => auth()->id(),
        ]);

        // Mock sale item (transaction history)
        SaleItem::create([
            'tenant_id' => $tenant->id,
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 200,
            'line_total' => 200,
            'subtotal' => 200,
        ]);

        $response = $this->delete($this->storeUrl($tenant, "inventory/{$product->id}"));

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('products', ['id' => $product->id, 'deleted_at' => null]);
    }

    public function test_can_delete_clean_product_and_force_delete(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);
        $warehouse = Warehouse::first();

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Clean Product',
            'sku' => 'CLN-001',
        ]);

        // Attach barcodes, variants, and stock
        ProductBarcode::create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'barcode' => '1234567890123',
            'barcode_type' => 'EAN13',
        ]);

        ProductVariant::create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'sku' => 'CLN-001-VAR',
            'variant_name' => 'Size M',
            'price' => 150,
            'cost_price' => 100,
        ]);

        Stock::create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 0,
        ]);

        // 1. Test soft-delete (destroy)
        $response = $this->delete($this->storeUrl($tenant, "inventory/{$product->id}"));

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertSoftDeleted('products', ['id' => $product->id]);

        // 2. Test permanent delete (forceDelete) via RecycleBinController
        $response2 = $this->delete($this->storeUrl($tenant, "admin/recycle-bin/{$product->id}/force-delete"), [
            'type' => 'product',
        ]);

        $response2->assertRedirect();
        $response2->assertSessionHas('success');

        // Verify it was hard-deleted from database
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        $this->assertDatabaseMissing('product_barcodes', ['product_id' => $product->id]);
        $this->assertDatabaseMissing('product_variants', ['product_id' => $product->id]);
        $this->assertDatabaseMissing('stocks', ['product_id' => $product->id]);
    }
}
