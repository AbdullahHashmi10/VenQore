<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use Illuminate\Support\Facades\DB;

$products = [
    // VQ Test Store
    'Smartphone' => ['price' => 50000, 'cost' => 45000],
    'Monitor'    => ['price' => 15000, 'cost' => 12000],
    'Keyboard'   => ['price' => 2000,  'cost' => 1500],
    'Mouse'      => ['price' => 1000,  'cost' => 700],
    'Printer'    => ['price' => 12000, 'cost' => 10000],
    
    // Store A
    'Red Shoe'   => ['price' => 3000,  'cost' => 2000],
    'Blue Shoe'  => ['price' => 3500,  'cost' => 2500],
    'Sandal'      => ['price' => 1500,  'cost' => 1000],
    
    // Store B
    'TV'         => ['price' => 80000, 'cost' => 70000],
    'Phone'      => ['price' => 40000, 'cost' => 35000],
    'Laptop'     => ['price' => 95000, 'cost' => 85000],

    // Functional Test data
    'Test Shoes' => ['price' => 5000,  'cost' => 3000],
    'Elite Wireless Gaming Mouse' => ['price' => 9999, 'cost' => 6000],
];

foreach ($products as $name => $vals) {
    $count = DB::table('products')->where('name', $name)->update([
        'price' => $vals['price'],
        'cost_price' => $vals['cost'],
        'updated_at' => now()
    ]);
    
    if ($count > 0) {
        echo "✅ Updated prices for '$name': Price={$vals['price']}, Cost={$vals['cost']}\n";
    } else {
        // Just in case it's named slightly differently or missing
        echo "⚠️  Product '$name' not found or was already correct.\n";
    }
}

echo "\nDone!\n";
