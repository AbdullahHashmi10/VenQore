<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$coreTables = ['products', 'sales', 'parties', 'accounts', 'journal_entries', 'warehouses', 'stocks', 'stock_movements'];

echo "--- Multi-Tenant Isolation Audit ---\n";

foreach ($coreTables as $table) {
    if (!\Schema::hasTable($table)) {
        echo "[SKIP] $table table does not exist\n";
        continue;
    }
    
    $nullCount = \DB::table($table)->whereNull('tenant_id')->count();
    $totalCount = \DB::table($table)->count();
    
    if ($nullCount > 0) {
        echo "[FAIL] $table: $nullCount rows found with NULL tenant_id (Total: $totalCount)\n";
    } else {
        echo "[PASS] $table: All $totalCount rows have tenant_id\n";
    }
}

$stores = \App\Models\Tenant::all();
echo "\n--- Stores Summary ---\n";
foreach ($stores as $store) {
    $pCount = \DB::table('products')->where('tenant_id', $store->id)->count();
    echo "ID: {$store->id} | Slug: {$store->slug} | Products: $pCount\n";
}
