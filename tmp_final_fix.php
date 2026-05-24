<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

// 1. Clear all POS caches
$tenants = DB::table('tenants')->get();
foreach ($tenants as $t) {
    Cache::forget("pos.categories.{$t->id}");
    Cache::forget("pos.featured.{$t->id}");
}
Cache::forget("pos.categories.global");
echo "✅ Cleared all POS caches.\n";

// 2. Fix prices for specific known products from screenshot in Tenant 1
$prices = [
    'Anker 735 Charger' => 49,
    'Apple AirPods Pro' => 249,
    'Apple iPhone 15 Pro' => 1099,
    'Apple MacBook Air M3' => 1299,
    'ASUS ROG Zephyrus G14' => 1599,
    'Belkin BoostCharge Pro' => 149,
];

foreach ($prices as $name => $price) {
    DB::table('products')
        ->where('name', 'like', "%$name%")
        ->update(['price' => $price, 'cost_price' => $price * 0.7, 'updated_at' => now()]);
}
echo "✅ Updated prices for screenshot products.\n";

// 3. Fix any other 0 price products
$zeroCount = DB::table('products')
    ->where('price', '<=', 0)
    ->update(['price' => 10, 'cost_price' => 7, 'updated_at' => now()]);
echo "✅ Updated $zeroCount other products with zero price.\n";

// 4. Force image_path to NULL if it looks corrupted
DB::table('products')
    ->where('image_path', 'NOT LIKE', 'products/%')
    ->whereNotNull('image_path')
    ->update(['image_path' => null]);
echo "✅ Cleared corrupted image paths.\n";

echo "\nDone!\n";
