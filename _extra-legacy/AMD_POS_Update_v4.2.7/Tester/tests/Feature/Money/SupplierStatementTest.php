<?php

use App\Models\Product;
use App\Models\Party;
use App\Models\Invoice;
use App\Models\Sale;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->tenant = $this->createTenant("statement-store", "ltd_3");
    $this->actingAsOwner($this->tenant);
    $this->seedTenantDefaults($this->tenant);
    $this->warehouseId = DB::table("warehouses")->where("tenant_id", $this->tenant->id)->value("id");
});

test("M1-10: a credit purchase shows as a POSITIVE supplier payable", function () {
    // 1. Create supplier and product
    $supplier = Party::factory()->create([
        "tenant_id" => $this->tenant->id,
        "type" => "supplier"
    ]);
    $product = Product::factory()->create([
        "tenant_id" => $this->tenant->id,
        "cost_price" => 45000.00,
        "price" => 60000.00,
    ]);

    // 2. Post a credit purchase (Invoice) of 45,000 to that supplier via V3 Purchases route
    $payload = [
        "supplier_id" => $supplier->id,
        "warehouse_id" => $this->warehouseId,
        "purchase_date" => now()->toDateString(),
        "payment_method" => "credit",
        "items" => [
            [
                "product_id" => $product->id,
                "qty" => 1,
                "unit_cost" => 45000.00,
                "tax_rate" => 0,
            ]
        ]
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/v3/purchases", $payload);
    $response->assertRedirect(); // V3 returns a redirect

    // Call partyStatement for that supplier
    $responseStatement = $this->get("/s/{$this->tenant->slug}/reports/party-statement?party_id={$supplier->id}");
    $responseStatement->assertOk();

    $props = $responseStatement->viewData("page")["props"];
    $this->assertEquals(45000.00, (float) $props["closingBalance"]);

    $this->assertTrialBalanceZero($this->tenant);
});

test("M1-10: a credit sale still shows customer receivable with correct sign", function () {
    // 1. Create customer and product
    $customer = Party::factory()->create([
        "tenant_id" => $this->tenant->id,
        "type" => "customer",
        "credit_limit" => 100000.00, // ensure credit limit is large enough
    ]);
    $product = Product::factory()->create([
        "tenant_id" => $this->tenant->id,
        "cost_price" => 5000.00,
        "price" => 10000.00,
    ]);

    Stock::updateOrCreate(
        ["product_id" => $product->id, "warehouse_id" => $this->warehouseId],
        ["quantity" => 10]
    );

    // Seed FIFO batch with remaining_qty = 10
    DB::table("inventory_batches")->insert([
        "id" => Str::uuid()->toString(),
        "tenant_id" => $this->tenant->id,
        "product_id" => $product->id,
        "warehouse_id" => $this->warehouseId,
        "unit_cost" => 5000.00,
        "original_qty" => 10,
        "initial_qty" => 10,
        "remaining_qty" => 10,
        "created_at" => now(),
        "updated_at" => now(),
    ]);

    // 2. Post a credit sale of 10,000 to that customer
    $payload = [
        "customer_id" => $customer->id,
        "warehouse_id" => $this->warehouseId,
        "items" => [
            [
                "product_id" => $product->id,
                "quantity" => 1,
                "price" => 10000.00,
                "discount" => 0
            ]
        ],
        "discount" => 0,
        "amount_paid" => 0, // unpaid -> credit sale
        "payment_method" => "credit",
        "add_to_ledger" => true,
    ];

    $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    $response->assertStatus(200);

    // Call partyStatement for that customer
    $responseStatement = $this->get("/s/{$this->tenant->slug}/reports/party-statement?party_id={$customer->id}");
    $responseStatement->assertOk();

    $props = $responseStatement->viewData("page")["props"];
    $this->assertEquals(10000.00, (float) $props["closingBalance"]);

    $this->assertTrialBalanceZero($this->tenant);
});
