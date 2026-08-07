<?php

use App\Models\Product;
use App\Models\Stock;
use App\Models\Party;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->tenant = $this->createTenant("fractional-store", "ltd_3");
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    $this->warehouseId = DB::table("warehouses")->where("tenant_id", $this->tenant->id)->value("id");
});

test("M1-07: a fractional-quantity sale persists 2.5, not 2 or 3", function () {
    $party = Party::factory()->customer()->create(["tenant_id" => $this->tenant->id]);
    $product = Product::factory()->create([
        "tenant_id" => $this->tenant->id,
        "cost_price" => 100.00,
        "price" => 200.00,
        "tax_rate" => 0,
    ]);

    Stock::updateOrCreate(
        ["product_id" => $product->id, "warehouse_id" => $this->warehouseId],
        ["quantity" => 10]
    );

    $batchId = Str::uuid()->toString();
    DB::table("inventory_batches")->insert([
        "id" => $batchId,
        "tenant_id" => $this->tenant->id,
        "product_id" => $product->id,
        "warehouse_id" => $this->warehouseId,
        "unit_cost" => 100.00,
        "original_qty" => 10,
        "initial_qty" => 10,
        "remaining_qty" => 10,
        "created_at" => now(),
        "updated_at" => now(),
    ]);

    $payload = [
        "customer_id" => $party->id,
        "warehouse_id" => $this->warehouseId,
        "items" => [
            [
                "product_id" => $product->id,
                "quantity" => 2.5,
                "price" => 200.00,
                "discount" => 0
            ]
        ],
        "discount" => 0,
        "amount_paid" => 500.00,
        "payment_method" => "cash",
        "add_to_ledger" => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertStatus(200);

    $saleId = $response->json("sale_id");
    $sale = Sale::findOrFail($saleId);

    $saleItem = $sale->items()->first();
    $this->assertEquals(2.5, (float) $saleItem->quantity);

    $qtyDeductedSum = (float) DB::table("sale_item_batches")
        ->where("sale_item_id", $saleItem->id)
        ->sum("qty_deducted");
    $this->assertEquals(2.5, $qtyDeductedSum);

    $remainingQty = (float) DB::table("inventory_batches")
        ->where("id", $batchId)
        ->value("remaining_qty");
    $this->assertEquals(7.5, $remainingQty);

    $this->assertTrialBalanceZero($this->tenant);
});
