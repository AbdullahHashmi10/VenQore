<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Warehouses ---\n";
print_r(DB::table('warehouses')->where('tenant_id', 3)->get()->toArray());

echo "\n--- License ---\n";
print_r(DB::table('store_licenses')->where('tenant_id', 3)->get()->toArray());
