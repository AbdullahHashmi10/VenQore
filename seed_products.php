<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Support\Str;

try {
    echo "Starting Seeding...\n";

    // Ensure Prerequisites
    $category = Category::firstOrCreate(
        ['name' => 'Test Category'],
        [
            'base_unit' => 'pcs',
            'secondary_unit' => 'box',
            'conversion_rate' => 10
        ]
    );
    echo "Category ID: " . $category->id . "\n";

    $brand = Brand::firstOrCreate(
        ['name' => 'Test Brand']
    );
    echo "Brand ID: " . $brand->id . "\n";

    $count = 0;
    for ($i = 1; $i <= 10; $i++) {
        $sku = 'TST-' . strtoupper(Str::random(6));
        
        try {
            $product = Product::create([
                'name' => "Test Product $i",
                'sku' => $sku,
                'category_id' => $category->id,
                'brand_id' => $brand->id,
                'price' => rand(100, 1000),
                'cost_price' => rand(50, 90),
                'stock' => rand(10, 100), // Assuming stock is a column or accessible
                'description' => "Auto-generated test product $i",
                'type' => 'standard',
                'base_unit' => 'pcs'
            ]);
            echo "Created: {$product->name} ({$product->id})\n";
            $count++;
        } catch (\Exception $e) {
            echo "Failed to create product $i: " . $e->getMessage() . "\n";
        }
    }

    echo "\nSuccessfully created $count/10 products.\n";

} catch (\Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
}
