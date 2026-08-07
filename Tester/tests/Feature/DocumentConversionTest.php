<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Party;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Proposal;
use App\Models\ProposalItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Warehouse;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

class DocumentConversionTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_pre_sale_conversion_to_invoice_success(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $this->seedTenantDefaults($tenant);

        // Create warehouse
        $warehouse = Warehouse::create([
            'name' => 'Main Warehouse',
            'tenant_id' => $tenant->id,
        ]);

        // Create product
        $product = Product::create([
            'name' => 'Test Product',
            'sku' => 'PROD-001',
            'cost_price' => 100,
            'price' => 150,
            'tax_rate' => 0, // No tax
            'tenant_id' => $tenant->id,
        ]);

        // Create customer
        $customer = Party::create([
            'name' => 'Alice Johnson',
            'type' => 'customer',
            'tenant_id' => $tenant->id,
        ]);

        // Create Sales Order (Pre-Sale) with delivery and extra charges
        $salesOrder = SalesOrder::create([
            'order_number' => 'SO-001',
            'customer_id' => $customer->id,
            'status' => 'confirmed',
            'order_date' => now(),
            'total_amount' => 300,
            'delivery_charge' => 100,
            'extra_charge_value' => 50,
            'extra_charge_label' => 'Packaging',
            'user_id' => $user->id,
            'tenant_id' => $tenant->id,
        ]);

        SalesOrderItem::create([
            'sales_order_id' => $salesOrder->id,
            'product_id' => $product->id,
            'quantity_requested' => 1,
            'quantity_reserved' => 1,
            'unit_price' => 150,
            'discount' => 0,
            'discount_type' => 'fixed',
            'subtotal' => 150,
            'tenant_id' => $tenant->id,
        ]);

        // Set the active session user
        $this->actingAs($user);

        // Convert the Sales Order to Sale
        $response = $this->post(route('store.sales-orders.convert', [
            'store_slug' => $tenant->slug,
            'salesOrder' => $salesOrder->id
        ]));

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        // Verify Sales Order completed
        $salesOrder->refresh();
        $this->assertEquals('completed', $salesOrder->status);

        // Verify Sale created
        $saleId = $response->json('sale_id');
        $sale = Sale::withoutTenantScope()->find($saleId);

        $this->assertNotNull($sale);
        $this->assertEquals($customer->id, $sale->party_id);
        $this->assertEquals(150, $sale->subtotal);
        $this->assertEquals(100, $sale->delivery_charge);
        $this->assertEquals(50, $sale->extra_charge_value);
        $this->assertEquals('Packaging', $sale->extra_charge_label);
        $this->assertEquals(300, $sale->total); // 150 (subtotal) + 100 (delivery) + 50 (extra)

        // Verify Sale Items created
        $this->assertDatabaseHas('sale_items', [
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 150,
        ]);
    }

    public function test_proposal_conversion_to_presale_success(): void
    {
        $tenant = $this->createTenant('proposal-tenant-1', 'business');
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $this->seedTenantDefaults($tenant);

        // Create customer
        $customer = Party::create([
            'name' => 'Bob Smith',
            'type' => 'customer',
            'tenant_id' => $tenant->id,
        ]);

        // Create product
        $product = Product::create([
            'name' => 'Proposal Product',
            'sku' => 'PROD-002',
            'price' => 200,
            'tenant_id' => $tenant->id,
        ]);

        // Create Proposal
        $proposal = Proposal::create([
            'reference_number' => 'PROP-001',
            'customer_id' => $customer->id,
            'status' => 'pending',
            'total_amount' => 200,
            'user_id' => $user->id,
            'tenant_id' => $tenant->id,
        ]);

        ProposalItem::create([
            'proposal_id' => $proposal->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 200,
            'total' => 200,
            'tenant_id' => $tenant->id,
        ]);

        $this->actingAs($user);

        // Convert Proposal to Pre-Sale (Sales Order)
        $response = $this->post(route('store.proposals.convert-to-presale', [
            'store_slug' => $tenant->slug,
            'proposal' => $proposal->id
        ]));

        $response->assertStatus(302); // Redirect back on success
        
        $proposal->refresh();
        $this->assertEquals('accepted', $proposal->status);

        // Assert Sales Order was created
        $this->assertDatabaseHas('sales_orders', [
            'customer_id' => $customer->id,
            'total_amount' => 200,
            'tenant_id' => $tenant->id,
        ]);
    }

    public function test_purchase_order_receive_success(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $this->seedTenantDefaults($tenant);

        // Create warehouse
        $warehouse = Warehouse::create([
            'name' => 'Supplier Warehouse',
            'tenant_id' => $tenant->id,
        ]);

        // Create supplier
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'phone' => '123456',
            'tenant_id' => $tenant->id,
        ]);

        // Create product
        $product = Product::create([
            'name' => 'Supplier Product',
            'sku' => 'PROD-003',
            'cost_price' => 120,
            'price' => 150,
            'tenant_id' => $tenant->id,
        ]);

        // Create Purchase Order (Pre-Purchase)
        $purchaseOrder = PurchaseOrder::create([
            'reference_number' => 'PO-001',
            'supplier_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
            'status' => 'pending',
            'order_date' => now(),
            'total_amount' => 120,
            'user_id' => $user->id,
            'tenant_id' => $tenant->id,
        ]);

        PurchaseOrderItem::create([
            'purchase_order_id' => $purchaseOrder->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_cost' => 120,
            'tenant_id' => $tenant->id,
        ]);

        $this->actingAs($user);

        // Receive the Purchase Order
        $response = $this->post(route('store.purchase-orders.receive', [
            'store_slug' => $tenant->slug,
            'purchaseOrder' => $purchaseOrder->id
        ]));

        $response->assertStatus(302); // Redirect back on success

        $purchaseOrder->refresh();
        $this->assertEquals('received', $purchaseOrder->status);

        // Verify stock batch was added
        $this->assertDatabaseHas('inventory_batches', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'remaining_qty' => 1,
            'unit_cost' => 120,
        ]);
    }

    public function test_proposal_re_conversion_syncs_instead_of_duplicate(): void
    {
        $tenant = $this->createTenant('proposal-tenant-2', 'business');
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $this->seedTenantDefaults($tenant);

        $customer = Party::create([
            'name' => 'Bob Smith',
            'type' => 'customer',
            'tenant_id' => $tenant->id,
        ]);

        $product = Product::create([
            'name' => 'Proposal Product',
            'sku' => 'PROD-002',
            'price' => 200,
            'tenant_id' => $tenant->id,
        ]);

        $proposal = Proposal::create([
            'reference_number' => 'PROP-001',
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'status' => 'sent',
            'valid_until' => now()->addDays(7),
            'total_amount' => 200,
            'user_id' => $user->id,
            'tenant_id' => $tenant->id,
        ]);

        $item = ProposalItem::create([
            'proposal_id' => $proposal->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 200,
            'total' => 200,
            'tenant_id' => $tenant->id,
        ]);

        $this->actingAs($user);

        // Convert the Proposal to Pre-Sale (First Time)
        $response = $this->post(route('store.proposals.convert-to-presale', [
            'store_slug' => $tenant->slug,
            'proposal' => $proposal->id
        ]));

        $response->assertStatus(302);

        // Verify Sales Order exists
        $salesOrder = SalesOrder::where('notes', 'Converted from Proposal #PROP-001')->first();
        $this->assertNotNull($salesOrder);
        $this->assertEquals(200, $salesOrder->total_amount);

        // Update Proposal Item amount and re-convert
        $item->update(['unit_price' => 700, 'total' => 700]);
        $proposal->update(['total_amount' => 700]);
        
        $response2 = $this->post(route('store.proposals.convert-to-presale', [
            'store_slug' => $tenant->slug,
            'proposal' => $proposal->id
        ]));

        $response2->assertStatus(302);

        // Verify NO duplicate sales order created, and the existing one was updated
        $salesOrdersCount = SalesOrder::where('notes', 'Converted from Proposal #PROP-001')->count();
        $this->assertEquals(1, $salesOrdersCount);

        $salesOrder->refresh();
        $this->assertEquals(700, $salesOrder->total_amount);

        // Finalize Sales Order to completed/sale
        $salesOrder->update(['status' => 'completed']);

        // Attempting to convert again should fail with session error
        $response3 = $this->post(route('store.proposals.convert-to-presale', [
            'store_slug' => $tenant->slug,
            'proposal' => $proposal->id
        ]));

        $response3->assertStatus(302);
        $response3->assertSessionHas('error', 'The converted Pre-Sale has already been finalized into a Sale and cannot be altered.');
    }

    /**
     * Pre-Sale to Sale: quantity_reserved resets to 0 on conversion.
     *
     * Verifies that after a Pre-Sale is converted to a Sale:
     *  1. The sale_items row has the correct quantity.
     *  2. Every SalesOrderItem.quantity_reserved is reset to 0.
     */
    public function test_presale_to_sale_quantity_reserved_resets_to_zero(): void
    {
        $tenant = $this->createTenant();
        $user   = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $this->seedTenantDefaults($tenant);

        $warehouse = Warehouse::where('tenant_id', $tenant->id)->first();
        $product   = Product::create([
            'name'       => 'Widget A',
            'sku'        => 'WDGT-001',
            'cost_price' => 50,
            'price'      => 100,
            'tax_rate'   => 0,
            'tenant_id'  => $tenant->id,
        ]);
        \App\Models\Stock::create([
            'tenant_id'    => $tenant->id,
            'warehouse_id' => $warehouse->id,
            'product_id'   => $product->id,
            'quantity'     => 1000,
        ]);
        // Seed an InventoryBatch so FIFO deduction succeeds
        \App\Models\InventoryBatch::create([
            'tenant_id'     => $tenant->id,
            'product_id'    => $product->id,
            'warehouse_id'  => $warehouse->id,
            'original_qty'  => 1000,
            'initial_qty'   => 1000,
            'remaining_qty' => 1000,
            'unit_cost'     => 50,
        ]);

        // Create a Pre-Sale with 3 units reserved
        $order = SalesOrder::create([
            'order_number'  => 'SO-QTY-001',
            'customer_id'   => null,
            'status'        => 'confirmed',
            'order_date'    => now()->toDateString(),
            'total_amount'  => 300,
            'user_id'       => $user->id,
            'tenant_id'     => $tenant->id,
        ]);
        SalesOrderItem::create([
            'sales_order_id'     => $order->id,
            'product_id'         => $product->id,
            'quantity_requested' => 3,
            'quantity_reserved'  => 3,
            'unit_price'         => 100,
            'discount'           => 0,
            'discount_type'      => 'fixed',
            'subtotal'           => 300,
            'tenant_id'          => $tenant->id,
        ]);

        $this->actingAs($user);
        $response = $this->postJson(route('store.pre-sales.convert', [
            'store_slug'  => $tenant->slug,
            'salesOrder'  => $order->id,
        ]));

        $response->assertOk();

        // The created sale_item must have quantity = 3
        $this->assertDatabaseHas('sale_items', [
            'product_id' => $product->id,
            'quantity'   => 3,
        ]);

        // quantity_reserved must be reset to 0
        $this->assertDatabaseHas('sales_order_items', [
            'sales_order_id'    => $order->id,
            'quantity_reserved' => 0,
        ]);
    }

    /**
     * Pre-Sale Status Lock: a completed Pre-Sale cannot be converted again.
     *
     * Expects HTTP 422 when attempting to convert a completed / cancelled Pre-Sale.
     */
    public function test_completed_presale_cannot_be_converted_again(): void
    {
        $tenant = $this->createTenant();
        $user   = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $this->seedTenantDefaults($tenant);

        $product = Product::create([
            'name'       => 'Locked Product',
            'sku'        => 'LCK-001',
            'cost_price' => 20,
            'price'      => 40,
            'tax_rate'   => 0,
            'tenant_id'  => $tenant->id,
        ]);

        // Already-completed pre-sale
        $order = SalesOrder::create([
            'order_number' => 'SO-LOCK-001',
            'customer_id'  => null,
            'status'       => 'completed',
            'order_date'   => now()->toDateString(),
            'total_amount' => 40,
            'user_id'      => $user->id,
            'tenant_id'    => $tenant->id,
        ]);
        SalesOrderItem::create([
            'sales_order_id'     => $order->id,
            'product_id'         => $product->id,
            'quantity_requested' => 1,
            'quantity_reserved'  => 0,
            'unit_price'         => 40,
            'discount'           => 0,
            'discount_type'      => 'fixed',
            'subtotal'           => 40,
            'tenant_id'          => $tenant->id,
        ]);

        $this->actingAs($user);
        $response = $this->postJson(route('store.pre-sales.convert', [
            'store_slug' => $tenant->slug,
            'salesOrder' => $order->id,
        ]));

        $response->assertStatus(422);
        $response->assertJson(['success' => false]);
    }

    /**
     * PO Edit Lock: a received PurchaseOrder rejects PUT edits with HTTP 403.
     */
    public function test_received_purchase_order_rejects_edit(): void
    {
        $tenant   = $this->createTenant();
        $user     = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $this->seedTenantDefaults($tenant);

        $warehouse = Warehouse::where('tenant_id', $tenant->id)->first();
        $supplier  = \App\Models\Supplier::create([
            'name'      => 'ACME Corp',
            'tenant_id' => $tenant->id,
        ]);
        $product   = Product::create([
            'name'       => 'PO Product',
            'sku'        => 'PO-001',
            'cost_price' => 10,
            'price'      => 20,
            'tax_rate'   => 0,
            'tenant_id'  => $tenant->id,
        ]);

        // Column is `reference_number`, not `po_number`; also needs `user_id`
        $po = PurchaseOrder::create([
            'reference_number' => 'PO-EDIT-001',
            'supplier_id'      => $supplier->id,
            'warehouse_id'     => $warehouse->id,
            'status'           => 'received',
            'order_date'       => now()->toDateString(),
            'total_amount'     => 100,
            'user_id'          => $user->id,
            'tenant_id'        => $tenant->id,
        ]);
        PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'product_id'        => $product->id,
            'quantity'          => 10,
            'unit_cost'         => 10,
            'total_cost'        => 100,
            'tenant_id'         => $tenant->id,
        ]);

        $this->actingAs($user);
        $response = $this->putJson(route('store.purchase-orders.update', [
            'store_slug'     => $tenant->slug,
            'purchase_order' => $po->id,
        ]), [
            'supplier_id'  => $supplier->id,
            'warehouse_id' => $warehouse->id,
            'order_date'   => now()->toDateString(),
            'items'        => [[
                'product_id' => $product->id,
                'quantity'   => 5,
                'unit_cost'  => 10,
            ]],
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'Cannot update a received order. It is immutable.',
        ]);
    }

    /**
     * Print Flash ID: pre-sale conversion flashes print_sale_id to the session.
     */
    public function test_presale_conversion_flashes_print_sale_id(): void
    {
        $tenant = $this->createTenant();
        $user   = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $this->seedTenantDefaults($tenant);

        $warehouse = Warehouse::where('tenant_id', $tenant->id)->first();
        $product   = Product::create([
            'name'       => 'Flash Product',
            'sku'        => 'FLS-001',
            'cost_price' => 10,
            'price'      => 20,
            'tax_rate'   => 0,
            'tenant_id'  => $tenant->id,
        ]);
        \App\Models\Stock::create([
            'tenant_id'    => $tenant->id,
            'warehouse_id' => $warehouse->id,
            'product_id'   => $product->id,
            'quantity'     => 1000,
        ]);
        \App\Models\InventoryBatch::create([
            'tenant_id'     => $tenant->id,
            'product_id'    => $product->id,
            'warehouse_id'  => $warehouse->id,
            'original_qty'  => 1000,
            'initial_qty'   => 1000,
            'remaining_qty' => 1000,
            'unit_cost'     => 10,
        ]);

        $order = SalesOrder::create([
            'order_number' => 'SO-FLASH-001',
            'customer_id'  => null,
            'status'       => 'confirmed',
            'order_date'   => now()->toDateString(),
            'total_amount' => 20,
            'user_id'      => $user->id,
            'tenant_id'    => $tenant->id,
        ]);
        SalesOrderItem::create([
            'sales_order_id'     => $order->id,
            'product_id'         => $product->id,
            'quantity_requested' => 1,
            'quantity_reserved'  => 1,
            'unit_price'         => 20,
            'discount'           => 0,
            'discount_type'      => 'fixed',
            'subtotal'           => 20,
            'tenant_id'          => $tenant->id,
        ]);

        $this->actingAs($user);

        // X-Inertia header triggers the redirect-with-flash-session path
        $response = $this->withHeader('X-Inertia', 'true')
            ->post(route('store.pre-sales.convert', [
                'store_slug' => $tenant->slug,
                'salesOrder' => $order->id,
            ]));

        $response->assertRedirect();
        $response->assertSessionHas('print_sale_id');

        // The flashed sale id must match a real Sale row
        $flashedId = session('print_sale_id');
        $this->assertNotNull($flashedId);
        $this->assertDatabaseHas('sales', ['id' => $flashedId]);
    }
}
