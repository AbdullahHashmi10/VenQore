<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$results = DB::select("
    SELECT TABLE_NAME, COLUMN_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE REFERENCED_TABLE_NAME = 'users' 
    AND TABLE_SCHEMA = DATABASE()
");

foreach ($results as $row) {
    echo "{$row->TABLE_NAME}.{$row->COLUMN_NAME}\n";
}
