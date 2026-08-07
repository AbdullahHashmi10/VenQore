<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Tenant;
use App\Models\Product;

echo "All Products:\n";
foreach(Product::all() as $p) {
    $t = Tenant::find($p->tenant_id);
    $slug = $t ? $t->slug : "N/A";
    echo "- {$p->name} [{$slug}] (Price: {$p->price}, Cost: {$p->cost_price})\n";
}
