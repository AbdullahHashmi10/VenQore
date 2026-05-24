<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$count = App\Models\Product::withoutTenantScope()->withTrashed()->count();
echo "Total products: $count\n";

$products = App\Models\Product::withoutTenantScope()->withTrashed()->take(5)->get();
foreach ($products as $p) {
    echo "ID: {$p->id}, Name: {$p->name}, SKU: {$p->sku}, Tenant ID: {$p->tenant_id}, Deleted: {$p->deleted_at}\n";
}
