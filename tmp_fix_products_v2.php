<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use Illuminate\Support\Facades\DB;

// 1. Fix corrupted image paths
$corruptedCount = DB::table('products')
    ->where('image_path', 'like', '%ðŸ“¦%')
    ->update(['image_path' => null]);

echo "✅ Fixed $corruptedCount products with corrupted image paths.\n";

// 2. Fix prices for the laptops seen in screenshot
$laptops = [
    'Dell XPS 15' => 250000,
    'Apple MacBook Air M3' => 350000,
    'Lenovo ThinkPad X1 Carbon' => 280000,
    'ASUS ROG Zephyrus G14' => 220000,
];

foreach ($laptops as $name => $price) {
    $count = DB::table('products')->where('name', $name)->update([
        'price' => $price,
        'cost_price' => $price * 0.8,
        'updated_at' => now()
    ]);
    
    if ($count > 0) {
        echo "✅ Updated prices for '$name': Price=$price\n";
    } else {
        echo "⚠️ Product '$name' not found.\n";
    }
}

// 3. Just in case, update any other product with price 0 to a default of 100
$zeroPriceCount = DB::table('products')
    ->where('price', '<=', 0)
    ->update(['price' => 100, 'cost_price' => 80]);

if ($zeroPriceCount > 0) {
    echo "✅ Updated $zeroPriceCount other products with 0 price to default 100.\n";
}

// 4. Clear the POS featured cache
$tenantIds = DB::table('products')->distinct()->pluck('tenant_id');
foreach ($tenantIds as $tid) {
    \Illuminate\Support\Facades\Cache::forget("pos.featured.{$tid}");
    \Illuminate\Support\Facades\Cache::forget("pos.categories.{$tid}");
}
echo "✅ Cleared POS caches for all tenants.\n";

echo "\nDone!\n";
