<?php

namespace Tests\Feature;

use App\Models\DebitNote;
use App\Models\Party;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DebitNoteTest extends VenQoreTestCase
{
    use RefreshDatabase;

    public function test_can_create_approved_debit_note_and_record_stock_movement(): void
    {
        $tenant = $this->createTenant();
        $this->actingAsTenantUser($tenant, 'owner');

        // Create warehouse
        $warehouse = Warehouse::create([
            'name' => 'Main Warehouse',
            'is_default' => true,
        ]);

        // Create product
        $product = Product::create([
            'name' => 'Test Item',
            'sku' => 'SKU-TEST-123',
            'price' => 100.0,
            'cost_price' => 50.0,
        ]);

        // Create supplier
        $supplier = Party::create([
            'name' => 'Supplier Inc',
            'type' => 'supplier',
        ]);

        // Send POST request to store debit note
        $response = $this->post(route('store.debit-notes.store', ['store_slug' => $tenant->slug]), [
            'supplier_id' => $supplier->id,
            'date' => '2026-07-08',
            'status' => 'approved',
            'reason' => 'Damaged items returned',
            'warehouse_id' => $warehouse->id,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5.0,
                    'unit_price' => 50.0,
                ],
            ],
        ]);

        $response->assertRedirect(route('store.debit-notes.index', ['store_slug' => $tenant->slug]));

        // Verify DebitNote is stored in DB
        $debitNote = DebitNote::first();
        $this->assertNotNull($debitNote);
        $this->assertEquals(250.0, $debitNote->amount);

        // Verify StockMovement is created in DB with correct reference_id column value
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'purchase_return',
            'quantity' => -5.0,
            'reference_id' => $debitNote->reference_number,
        ]);
    }
}
