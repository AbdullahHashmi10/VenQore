<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Tenant;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

$store = Tenant::where('slug', 'vq-test-store')->first();
if (!$store) die("Store not found");

$correctProducts = [
    'Smartphone' => ['price' => 50000, 'cost' => 45000],
    'Monitor'    => ['price' => 15000, 'cost' => 12000],
    'Keyboard'   => ['price' => 2000,  'cost' => 1500],
    'Mouse'      => ['price' => 1000,  'cost' => 700],
    'Printer'    => ['price' => 12000, 'cost' => 10000],
];

// Find the generic test products and rename them
$genericProducts = Product::withoutGlobalScopes()
    ->where('tenant_id', $store->id)
    ->where('name', 'LIKE', 'Test Product %')
    ->orderBy('name')
    ->get();

$i = 0;
foreach ($correctProducts as $name => $vals) {
    if (isset($genericProducts[$i])) {
        $p = $genericProducts[$i];
        $p->update([
            'name' => $name,
            'price' => $vals['price'],
            'cost_price' => $vals['cost']
        ]);
        echo "✅ Renamed and set price for '$name'.\n";
    } else {
        // Create if missing
        Product::withoutGlobalScopes()->create([
            'tenant_id' => $store->id,
            'name' => $name,
            'price' => $vals['price'],
            'cost_price' => $vals['cost'],
            'sku' => 'VQ-TEST-' . strtoupper(substr($name, 0, 3)) . rand(100, 999),
            'quantity' => 10,
            'stock_quantity' => 10,
            'is_active' => true,
            'id' => \Illuminate\Support\Str::uuid()->toString()
        ]);
        echo "✅ Created and set price for '$name'.\n";
    }
    $i++;
}
