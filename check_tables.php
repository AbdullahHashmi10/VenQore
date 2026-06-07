<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = DB::select('SHOW TABLES');
foreach ($tables as $t) {
    echo array_values((array)$t)[0] . "\n";
}
echo "\n--- CHECKING CUSTOMERS TABLE ---\n";
if (Schema::hasTable('customers')) {
    echo "Table 'customers' EXISTS.\n";
} else {
    echo "Table 'customers' DOES NOT EXIST.\n";
}
echo "\n--- CHECKING PARTIES TABLE ---\n";
if (Schema::hasTable('parties')) {
    echo "Table 'parties' EXISTS.\n";
} else {
    echo "Table 'parties' DOES NOT EXIST.\n";
}
