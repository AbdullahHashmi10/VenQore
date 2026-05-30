<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$products = DB::table('products')->get();
echo "Total products: " . count($products) . "\n";
foreach ($products as $p) {
    echo "- ID: {$p->id}, Name: {$p->name}, SKU: {$p->sku}, Deleted At: {$p->deleted_at}\n";
}
