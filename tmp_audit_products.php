<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Tenant;
use App\Models\Product;

$store = Tenant::where('slug', 'vq-test-store')->first();
if ($store) {
    echo "Products in vq-test-store:\n";
    foreach(Product::where('tenant_id', $store->id)->get() as $p) {
        echo "- {$p->name} (Price: {$p->price}, Cost: {$p->cost_price})\n";
    }
}
