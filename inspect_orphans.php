<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = ['payments', 'warehouses', 'units', 'settings'];
foreach($tables as $t) {
    echo "\n--- $t ---\n";
    $rows = DB::table($t)->whereNull('tenant_id')->get();
    foreach($rows as $r) {
        if ($t === 'settings') echo "Key: " . $r->key . ", Value: " . $r->value . "\n";
        elseif ($t === 'units') echo "Name: " . $r->name . "\n";
        elseif ($t === 'warehouses') echo "Name: " . $r->name . "\n";
        else print_r($r);
    }
}
