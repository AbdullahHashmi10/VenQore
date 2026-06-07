<?php

use App\Models\Product;
use App\Models\Stock;
use App\Models\ManufacturingRule;
use App\Models\ManufacturingIngredient;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    // 1. Create Ingredients
    $pepper = Product::firstOrCreate(
        ['sku' => 'ING-PEP'], 
        [
            'name' => 'Black Pepper', 
            'price' => 200, 
            'cost_price' => 100, 
            'unit' => 'g',
            'base_unit' => 'g'
        ]
    );
    Stock::updateOrCreate(['product_id' => $pepper->id, 'warehouse_id' => 1], ['quantity' => 1000]);

    $cumin = Product::firstOrCreate(
        ['sku' => 'ING-CUM'], 
        [
            'name' => 'Cumin Seeds', 
            'price' => 150, 
            'cost_price' => 80, 
            'unit' => 'g',
            'base_unit' => 'g'
        ]
    );
    Stock::updateOrCreate(['product_id' => $cumin->id, 'warehouse_id' => 1], ['quantity' => 1000]);

    // 2. Create Composite Item
    $garamMasala = Product::firstOrCreate(
        ['sku' => 'PRD-GM'], 
        [
            'name' => 'Garam Masala Pkt', 
            'price' => 500, 
            'cost_price' => 0, 
            'unit' => 'pkt',
            'base_unit' => 'pkt',
            'type' => 'composite'
        ]
    );
    Stock::updateOrCreate(['product_id' => $garamMasala->id, 'warehouse_id' => 1], ['quantity' => 0]);

    // 3. Create Rule
    $rule = ManufacturingRule::updateOrCreate(
        ['product_id' => $garamMasala->id],
        ['name' => 'Garam Masala Recipe', 'is_active' => true]
    );
    
    ManufacturingIngredient::where('rule_id', $rule->id)->delete();
    
    ManufacturingIngredient::create(['rule_id' => $rule->id, 'ingredient_product_id' => $pepper->id, 'quantity_per_unit' => 10, 'unit' => 'g']);
    ManufacturingIngredient::create(['rule_id' => $rule->id, 'ingredient_product_id' => $cumin->id, 'quantity_per_unit' => 5, 'unit' => 'g']);

    echo "SETUP_COMPLETE: IDs: Pepper={$pepper->id} Cumin={$cumin->id} GM={$garamMasala->id}\n";
    
    // Show current stock
    echo "\n=== BEFORE SALE ===\n";
    echo "Black Pepper Stock: " . Stock::where('product_id', $pepper->id)->where('warehouse_id', 1)->first()->quantity . "g\n";
    echo "Cumin Seeds Stock: " . Stock::where('product_id', $cumin->id)->where('warehouse_id', 1)->first()->quantity . "g\n";
    echo "Garam Masala Stock: " . Stock::where('product_id', $garamMasala->id)->where('warehouse_id', 1)->first()->quantity . "pkt\n";
    
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}
