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
        $tenant = $this->createTenant();
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
}
