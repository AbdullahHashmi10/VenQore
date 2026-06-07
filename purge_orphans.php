<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = ['payments', 'warehouses', 'units', 'settings'];
foreach($tables as $t) {
    $count = DB::table($t)->whereNull('tenant_id')->delete();
    echo "Deleted $count rows from $t\n";
}
