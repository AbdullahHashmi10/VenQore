<?php

uses(\Tests\Feature\VenQoreTestCase::class);

use App\Models\Sale;
use App\Models\Product;
use App\Models\Stock;
use App\Models\JournalEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;



beforeEach(function () {
    $this->tenant = $this->createTenant('immutability-store', 'ltd_3');
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    $this->warehouseId = DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');
});

test('M1-04: a posted sale cannot be force-deleted from the recycle bin', function () {
    // 1. Create a product with stock
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'cost_price' => 100.00,
        'price' => 200.00,
        'tax_rate' => 0,
    ]);

    Stock::updateOrCreate(
        ['product_id' => $product->id, 'warehouse_id' => $this->warehouseId],
        ['quantity' => 50]
    );

    DB::table('inventory_batches')->insert([
        'id' => Str::uuid()->toString(),
        'tenant_id' => $this->tenant->id,
        'product_id' => $product->id,
        'warehouse_id' => $this->warehouseId,
        'unit_cost' => 100.00,
        'original_qty' => 50,
        'initial_qty' => 50,
        'remaining_qty' => 50,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // 2. Post a sale
    $payload = [
        'customer_id' => null,
        'warehouse_id' => $this->warehouseId,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 10,
                'price' => 200.00,
                'discount' => 0,
            ]
        ],
        'discount' => 0,
        'amount_paid' => 2000.00,
        'payment_method' => 'cash',
        'add_to_ledger' => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertOk();

    $saleId = Sale::where('tenant_id', $this->tenant->id)->value('id');
    $this->assertNotNull($saleId);

    // Assert a journal entry exists
    $this->assertTrue(JournalEntry::where('tenant_id', $this->tenant->id)->where('reference', $saleId)->exists());

    // 3. Soft-delete the sale, bypassing observers since observers block deletion of posted sales
    $sale = Sale::findOrFail($saleId);
    $sale->deleteQuietly();

    // 4. Force-delete via recycle-bin route
    $deleteResponse = $this->deleteJson("/s/{$this->tenant->slug}/admin/recycle-bin/{$saleId}/force-delete", [
        'type' => 'sale',
    ]);

    // It should be redirected back with errors
    $deleteResponse->assertSessionHasErrors('error');

    // Assert: sale row still exists
    $this->assertNotNull(Sale::withTrashed()->find($saleId));

    // Assert trial balance remains zero
    $this->assertTrialBalanceZero($this->tenant);
});

test('M1-04: an unposted draft sale CAN be force-deleted', function () {
    // Build a minimal sale row with no journal entry directly
    $sale = Sale::create([
        'tenant_id' => $this->tenant->id,
        'warehouse_id' => $this->warehouseId,
        'reference_number' => 'UNPOSTED-DRAFT-123',
        'subtotal' => 500,
        'discount' => 0,
        'tax' => 0,
        'total' => 500,
        'net_sales' => 500,
        'invoice_total' => 500,
        'payment_method' => 'cash',
        'status' => 'draft',
        'user_id' => auth()->id(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->assertNotNull($sale->id);

    // Soft-delete the sale
    $sale->delete();

    // Assert not permanently deleted yet
    $this->assertNotNull(Sale::withTrashed()->find($sale->id));

    // Force-delete via recycle-bin route
    $deleteResponse = $this->deleteJson("/s/{$this->tenant->slug}/admin/recycle-bin/{$sale->id}/force-delete", [
        'type' => 'sale',
    ]);

    // Assert redirect
    $deleteResponse->assertRedirect();

    // Assert sale row is gone from DB
    $this->assertNull(Sale::withTrashed()->find($sale->id));

    // Assert trial balance remains zero
    $this->assertTrialBalanceZero($this->tenant);
});
