<?php

use App\Models\Party;
use App\Models\Product;
use App\Models\Proposal;
use App\Models\ProposalItem;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Sale;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Warehouse;
use App\Models\Stock;
use App\Models\JournalEntry;
use Tests\Feature\VenQoreTestCase;

test('posted_invoice_returns_403_on_edit_attempt', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);

    $sale = Sale::factory()->create([
        'tenant_id' => $tenant->id,
        'status' => 'posted',
        'net_sales' => 100,
        'invoice_total' => 100,
        'subtotal_gross' => 100,
        'total' => 100,
        'subtotal' => 100,
    ]);

    $payload = [
        'customer_id' => null,
        'items' => [
            [
                'product_id' => Product::factory()->create(['tenant_id' => $tenant->id])->id,
                'quantity' => 1,
                'price' => 50,
                'discount' => 0,
            ]
        ],
        'discount' => 0,
        'amount_paid' => 50,
        'payment_method' => 'cash',
        'add_to_ledger' => false,
    ];

    $response = $this->putJson("/s/{$tenant->slug}/sales/{$sale->id}", $payload);

    // The observer aborts with 403
    $response->assertStatus(403);

    // Verify database value is unchanged
    $this->assertDatabaseHas('sales', [
        'id' => $sale->id,
        'net_sales' => 100,
        'invoice_total' => 100,
    ]);
});

test('proposal_to_sale_conversion_transfers_fields_and_no_duplicate_journals', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);

    $warehouse = Warehouse::create(['name' => 'Main', 'tenant_id' => $tenant->id]);
    $party = Party::factory()->customer()->create(['tenant_id' => $tenant->id]);
    
    $product1 = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 10]);
    $product2 = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 20]);
    $product3 = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 30]);

    // Give them some stock
    Stock::create(['product_id' => $product1->id, 'warehouse_id' => $warehouse->id, 'quantity' => 100]);
    Stock::create(['product_id' => $product2->id, 'warehouse_id' => $warehouse->id, 'quantity' => 100]);
    Stock::create(['product_id' => $product3->id, 'warehouse_id' => $warehouse->id, 'quantity' => 100]);

    $proposal = Proposal::create([
        'reference_number' => 'PROP-001',
        'customer_id' => $party->id,
        'customer_name' => $party->name,
        'status' => 'draft',
        'total_amount' => 600,
        'user_id' => auth()->id(),
        'tenant_id' => $tenant->id,
    ]);

    ProposalItem::create(['proposal_id' => $proposal->id, 'product_id' => $product1->id, 'product_name' => $product1->name, 'quantity' => 1, 'unit_price' => 100, 'total' => 100]);
    ProposalItem::create(['proposal_id' => $proposal->id, 'product_id' => $product2->id, 'product_name' => $product2->name, 'quantity' => 2, 'unit_price' => 100, 'total' => 200]);
    ProposalItem::create(['proposal_id' => $proposal->id, 'product_id' => $product3->id, 'product_name' => $product3->name, 'quantity' => 3, 'unit_price' => 100, 'total' => 300]);

    // Track initial journal entries count
    $initialJournalCount = JournalEntry::count();

    $response = $this->post("/s/{$tenant->slug}/proposals/{$proposal->id}/convert");

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Proposal converted to Sale.');

    // Assert proposal status changed
    $this->assertEquals('accepted', $proposal->fresh()->status);

    // Assert sale created correctly
    $sale = Sale::where('party_id', $party->id)->first();
    $this->assertNotNull($sale);
    $this->assertEquals(600, $sale->total);
    
    // Assert line items transferred
    $this->assertCount(3, $sale->items);
    
    // Check product quantities
    $this->assertEquals(1, $sale->items->where('product_id', $product1->id)->first()->quantity);
    $this->assertEquals(2, $sale->items->where('product_id', $product2->id)->first()->quantity);
    $this->assertEquals(3, $sale->items->where('product_id', $product3->id)->first()->quantity);

    // Assert no journal entries were created
    $this->assertEquals($initialJournalCount, JournalEntry::count());
});

test('v3_quotation_to_sales_order_conversion', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);

    $warehouse = Warehouse::create(['name' => 'Main', 'tenant_id' => $tenant->id]);
    $party = Party::factory()->customer()->create(['tenant_id' => $tenant->id]);
    $product = Product::factory()->create(['tenant_id' => $tenant->id]);

    $quotation = Quotation::create([
        'quotation_number' => 'QUO-123',
        'party_id' => $party->id,
        'quotation_date' => now()->toDateString(),
        'status' => 'draft',
        'total_amount' => 500,
        'created_by' => auth()->id(),
        'tenant_id' => $tenant->id,
    ]);

    QuotationItem::create([
        'quotation_id' => $quotation->id,
        'product_id' => $product->id,
        'qty' => 5,
        'sale_uom' => 'pcs',
        'unit_price' => 100,
        'line_total' => 500,
    ]);

    $response = $this->post("/s/{$tenant->slug}/v3/quotations/{$quotation->id}/convert-to-order", [
        'warehouse_id' => $warehouse->id,
    ]);

    $response->assertRedirect();
    
    $this->assertEquals('accepted', $quotation->fresh()->status);
    
    $salesOrder = SalesOrder::where('customer_id', $party->id)->first();
    $this->assertNotNull($salesOrder);
    $this->assertEquals(500, $salesOrder->total_amount);
});

test('sales_orders_stock_hold_and_conversion_to_sale', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);

    $warehouse = Warehouse::create(['name' => 'Main', 'tenant_id' => $tenant->id]);
    $party = Party::factory()->customer()->create(['tenant_id' => $tenant->id]);
    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 50]);

    Stock::create([
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 10
    ]);

    // Create first sales order for 8 units
    $response1 = $this->postJson("/s/{$tenant->slug}/sales-orders", [
        'customer_id' => $party->id,
        'order_date' => now()->toDateString(),
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 8,
                'unit_price' => 100,
                'discount' => 0
            ]
        ],
        'discount' => 0,
        'shipping_charges' => 0,
        'warehouse_id' => $warehouse->id,
    ]);
    
    $response1->assertStatus(200);

    // Assert available stock is functionally 2 for new orders
    // The second order attempts 3 units and should be blocked by validation or logic
    $response2 = $this->postJson("/s/{$tenant->slug}/sales-orders", [
        'customer_id' => $party->id,
        'order_date' => now()->toDateString(),
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 3,
                'unit_price' => 100,
                'discount' => 0
            ]
        ],
        'discount' => 0,
        'shipping_charges' => 0,
        'warehouse_id' => $warehouse->id,
    ]);
    
    // Assert it is blocked (e.g. 422 for insufficient stock validation)
    $response2->assertStatus(422);

    $order = SalesOrder::first();

    $initialJournalCount = JournalEntry::where('tenant_id', $tenant->id)->count();

    dump($order->toArray());

    $response = $this->post("/s/{$tenant->slug}/sales-orders/{$order->id}/convert");

    $response->assertJson(['success' => true]);
    $this->assertEquals('completed', $order->fresh()->status);

    $sale = Sale::where('party_id', $party->id)->first();
    $this->assertNotNull($sale);
    $this->assertEquals(800, $sale->net_sales);

    // Stock should be deducted by 8 (from 10 to 2)
    $stock = Stock::where('product_id', $product->id)->first();
    $this->assertEquals(2, $stock->quantity);

    // One journal entry should be created
    $this->assertEquals($initialJournalCount + 1, JournalEntry::where('tenant_id', $tenant->id)->count());
});

test('recurring invoice generation creates a correct new invoice with line items', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $warehouse = Warehouse::create(['name' => 'Main', 'tenant_id' => $tenant->id]);
    $party = Party::factory()->customer()->create(['tenant_id' => $tenant->id]);
    $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 50, 'price' => 100]);

    Stock::create([
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 10
    ]);

    \Illuminate\Support\Facades\DB::table('inventory_batches')->insert([
        'tenant_id' => $tenant->id,
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'batch_type' => 'purchase',
        'unit_cost' => 50.00,
        'original_qty' => 10.00,
        'initial_qty' => 10.00,
        'remaining_qty' => 10.00,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Create a recurring invoice template via Controller (POST)
    $payload = [
        'customer_id' => $party->id,
        'warehouse_id' => $warehouse->id,
        'frequency' => 'monthly',
        'items' => [
            [
                'product_id' => $product->id,
                'qty' => 2,
                'unit_price' => 100,
            ]
        ],
        'next_run_date' => '2026-05-25',
        'status' => 'active',
    ];

    $response = $this->postJson("/s/{$tenant->slug}/recurring-invoices", $payload);
    if ($response->status() !== 201) {
        $response->dump();
    }
    $response->assertStatus(201);

    // Run the Artisan command to generate the invoice
    \Illuminate\Support\Facades\Artisan::call('recurring-invoices:generate');

    // Assert a sale was created
    $sale = Sale::where('party_id', $party->id)->first();
    $this->assertNotNull($sale);
    $this->assertEquals(200.00, (float) $sale->total);

    // Assert template next run date is updated
    $template = \App\Models\RecurringInvoice::first();
    $expectedNextRunDate = \Carbon\Carbon::parse($payload['next_run_date'])->addMonth()->toDateString();
    $this->assertEquals($expectedNextRunDate, $template->next_run_date->toDateString());

    // Assert FIFO batch remaining_qty is decremented by 2 (from 10 to 8)
    $batchRemaining = \Illuminate\Support\Facades\DB::table('inventory_batches')
        ->where('product_id', $product->id)
        ->sum('remaining_qty');
    $this->assertEquals(8.0, (float) $batchRemaining);
});

