<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

function auditTable($table) {
    if(!Schema::hasTable($table)) return;
    $indexes = DB::select("SHOW INDEX FROM $table");
    echo "Indexes for $table:\n";
    foreach($indexes as $idx) {
        echo sprintf("  Name: %-40s Column: %-20s Unique: %s\n", $idx->Key_name, $idx->Column_name, ($idx->Non_unique == 0 ? 'YES' : 'NO'));
    }
}

foreach(DB::select('SHOW TABLES') as $t) {
    $tn = collect($t)->first();
    $indexes = DB::select("SHOW INDEX FROM $tn WHERE Non_unique = 0");
    foreach($indexes as $idx) {
        if($idx->Key_name == 'sales_reference_number_unique') {
            echo "FOUND index 'sales_reference_number_unique' in table $tn on column {$idx->Column_name}\n";
        }
    }
}
