<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$warehouses = \Illuminate\Support\Facades\DB::table('warehouses')->get();
echo "Warehouses:\n";
foreach ($warehouses as $w) {
    echo "ID: " . $w->id . " - Name: " . $w->name . "\n";
}
