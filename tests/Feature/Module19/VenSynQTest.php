<?php

namespace Tests\Feature\Module19;

use Tests\Feature\VenQoreTestCase;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Warehouse;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Services\VenSynQ\VenSynQService;

/**
 * Module 19 — VenSynQ (post-launch feature)
 * Multi-store sync engine, command center dashboard, and cross-store
 * inventory consolidation.
 */
test('vensync_syncs_product_across_stores', function () {
    // 1. Create two tenants (Store A and Store B)
    $tenantA = $this->createTenant('store-a');
    $tenantB = $this->createTenant('store-b');

    // 2. Set context as Tenant A and create a product
    $this->bindTenantContext($tenantA);
    $productA = Product::factory()->create([
        'sku'        => 'SYNC-PROD-123',
        'name'       => 'Original Product A',
        'cost_price' => 10.00,
        'price'      => 25.00,
        'base_unit'  => 'pcs',
    ]);

    // Verify it exists in Tenant A and is scoped
    $this->assertDatabaseHas('products', [
        'tenant_id' => $tenantA->id,
        'sku'       => 'SYNC-PROD-123',
    ]);

    // Verify Tenant B has no such product yet
    $this->bindTenantContext($tenantB);
    $this->assertDatabaseMissing('products', [
        'tenant_id' => $tenantB->id,
        'sku'       => 'SYNC-PROD-123',
    ]);

    // 3. Trigger product sync using VenSynQService
    $service = new VenSynQService();
    $service->syncProductAcrossStores($productA, [$tenantB->id]);

    // Assert product is synced to Tenant B
    $this->bindTenantContext($tenantB);
    $this->assertDatabaseHas('products', [
        'tenant_id' => $tenantB->id,
        'sku'       => 'SYNC-PROD-123',
        'name'      => 'Original Product A',
        'cost_price'=> 10.00,
        'price'     => 25.00,
    ]);

    // 4. Update product in Tenant A and sync again to check update propagation
    $this->bindTenantContext($tenantA);
    $productA->update([
        'name'  => 'Updated Product A Name',
        'price' => 30.00,
    ]);

    $service->syncProductAcrossStores($productA, [$tenantB->id]);

    // Assert update propagated to Tenant B
    $this->bindTenantContext($tenantB);
    $this->assertDatabaseHas('products', [
        'tenant_id' => $tenantB->id,
        'sku'       => 'SYNC-PROD-123',
        'name'      => 'Updated Product A Name',
        'price'     => 30.00,
    ]);
});

test('command_center_shows_consolidated_revenue', function () {
    // 1. Create two tenants owned by the same merchant context
    $tenantA = $this->createTenant('store-a');
    $tenantB = $this->createTenant('store-b');

    // 2. Add sales in Tenant A
    $this->bindTenantContext($tenantA);
    Sale::factory()->create([
        'status'    => 'posted',
        'posted_at' => now(),
        'total'     => 150.00,
    ]);
    Sale::factory()->create([
        'status'    => 'posted',
        'posted_at' => now(),
        'total'     => 200.00,
    ]);
    Sale::factory()->create([
        'status'    => 'draft',
        'posted_at' => null,
        'total'     => 999.00, // draft sale, should be ignored
    ]);

    // 3. Add sales in Tenant B
    $this->bindTenantContext($tenantB);
    Sale::factory()->create([
        'status'    => 'posted',
        'posted_at' => now(),
        'total'     => 350.00,
    ]);
    Sale::factory()->create([
        'status'    => 'draft',
        'posted_at' => null,
        'total'     => 500.00, // draft sale, should be ignored
    ]);

    // 4. Calculate consolidated revenue across Tenant A and Tenant B
    $service = new VenSynQService();
    $revenue = $service->getConsolidatedRevenue([$tenantA->id, $tenantB->id]);

    // Assert consolidated revenue is 150 + 200 + 350 = 700.00
    $this->assertEquals(700.00, $revenue);
});

test('cross_store_transfer_updates_both_inventories', function () {
    // 1. Create two tenants (Store A and Store B)
    $tenantA = $this->createTenant('store-a');
    $tenantB = $this->createTenant('store-b');

    // 2. Create products with matching SKU in both tenants
    $sku = 'TRANS-SKU-99';

    $this->bindTenantContext($tenantA);
    $productA = Product::factory()->create([
        'sku'            => $sku,
        'name'           => 'Transfer Product',
        'cost_price'     => 12.00,
        'price'          => 24.00,
        'stock_quantity' => 100, // Aggregate stock quantity
    ]);

    // Create warehouse for Tenant A
    $warehouseA = Warehouse::create([
        'tenant_id' => $tenantA->id,
        'name'      => 'Warehouse A',
        'is_active' => true,
    ]);

    // Seed stock for Tenant A
    $stockA = Stock::create([
        'tenant_id'         => $tenantA->id,
        'product_id'        => $productA->id,
        'warehouse_id'      => $warehouseA->id,
        'quantity'          => 100,
        'reserved_quantity' => 0,
    ]);

    $this->bindTenantContext($tenantB);
    $productB = Product::factory()->create([
        'sku'            => $sku,
        'name'           => 'Transfer Product',
        'cost_price'     => 12.00,
        'price'          => 24.00,
        'stock_quantity' => 0, // Aggregate stock quantity starts at 0
    ]);

    // Create warehouse for Tenant B
    $warehouseB = Warehouse::create([
        'tenant_id' => $tenantB->id,
        'name'      => 'Warehouse B',
        'is_active' => true,
    ]);

    // 3. Perform stock transfer from Warehouse A to Warehouse B
    $service = new VenSynQService();
    $result = $service->transferStockBetweenStores($warehouseA->id, $warehouseB->id, $sku, 40.00);

    $this->assertTrue($result);

    // 4. Assert stock quantities are updated correctly
    // Warehouse A Stock should be 60, product aggregate should be 60
    $this->bindTenantContext($tenantA);
    $this->assertDatabaseHas('stocks', [
        'id'       => $stockA->id,
        'quantity' => 60.00,
    ]);
    $this->assertDatabaseHas('products', [
        'id'             => $productA->id,
        'stock_quantity' => 60,
    ]);

    // Warehouse B Stock should be 40, product aggregate should be 40
    $this->bindTenantContext($tenantB);
    $this->assertDatabaseHas('stocks', [
        'warehouse_id' => $warehouseB->id,
        'product_id'   => $productB->id,
        'quantity'     => 40.00,
    ]);
    $this->assertDatabaseHas('products', [
        'id'             => $productB->id,
        'stock_quantity' => 40,
    ]);

    // 5. Assert that StockMovements exist for both stores
    $this->assertDatabaseHas('stock_movements', [
        'tenant_id'    => $tenantA->id,
        'product_id'   => $productA->id,
        'warehouse_id' => $warehouseA->id,
        'quantity'     => -40.00,
        'type'         => 'transfer',
    ]);

    $this->assertDatabaseHas('stock_movements', [
        'tenant_id'    => $tenantB->id,
        'product_id'   => $productB->id,
        'warehouse_id' => $warehouseB->id,
        'quantity'     => 40.00,
        'type'         => 'transfer',
    ]);
});
