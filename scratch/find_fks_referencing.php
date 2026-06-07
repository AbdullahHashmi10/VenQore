<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$dbName = DB::getDatabaseName();

$results = DB::select("
    SELECT 
        TABLE_NAME, 
        COLUMN_NAME, 
        CONSTRAINT_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME
    FROM 
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE 
        REFERENCED_TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME IN ('products', 'stocks')
", [$dbName]);

echo "Foreign Keys pointing to 'products' or 'stocks' in database '{$dbName}':\n";
foreach ($results as $r) {
    echo "- Table '{$r->TABLE_NAME}' (col '{$r->COLUMN_NAME}') references '{$r->REFERENCED_TABLE_NAME}' (col '{$r->REFERENCED_COLUMN_NAME}') via constraint '{$r->CONSTRAINT_NAME}'\n";
}
