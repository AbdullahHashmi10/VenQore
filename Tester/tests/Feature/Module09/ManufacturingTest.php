<?php

namespace Tests\Feature\Module09;

use App\Models\Product;
use Tests\Feature\VenQoreTestCase;

test('bill_of_materials_defined_correctly', function () {
    $tenant = $this->createTenant();
    $this->actingAsOwner($tenant);
    $this->seedTenantDefaults($tenant);

    $rawMaterial1 = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Flour', 'is_manufactured' => 0]);
    $rawMaterial2 = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Sugar', 'is_manufactured' => 0]);

    $payload = [
        'name' => 'Cake (Manufactured)',
        'sku' => 'CAKE-01',
        'base_unit' => 'pcs',
        'sale_price' => 500,
        'cost_price' => 200, // Should be auto-calc ideally
        'is_manufactured' => 1,
        'bom' => [
            [
                'product_id' => $rawMaterial1->id,
                'quantity' => 2,
                'unit_cost' => 50
            ],
            [
                'product_id' => $rawMaterial2->id,
                'quantity' => 1,
                'unit_cost' => 100
            ]
        ]
    ];

    $response = $this->postJson("/s/{$tenant->slug}/v3/products", $payload);
    
    // Some endpoints return 201 or redirect
    $this->assertTrue(in_array($response->status(), [200, 201, 302]));

    $product = Product::where('sku', 'CAKE-01')->first();
    $this->assertNotNull($product);
    $this->assertEquals(1, $product->is_manufactured);

    // BOM table: bill_of_materials
    $this->assertDatabaseHas('bill_of_materials', [
        'product_id' => $product->id,
        'raw_material_id' => $rawMaterial1->id,
        'quantity' => 2
    ]);

    $this->assertDatabaseHas('bill_of_materials', [
        'product_id' => $product->id,
        'raw_material_id' => $rawMaterial2->id,
        'quantity' => 1
    ]);
})->todo();

test('production run consumes raw materials', function () {
    // TODO: Create product, raw materials, run production, assert raw materials consumed
})->todo();

test('production run produces finished goods', function () {
    // TODO: Assert new FIFO batch created for finished product
})->todo();

test('auto calculate assembly cost', function () {
    // TODO: Calculates correct total cost based on BOM and raw material FIFO costs
})->todo();
