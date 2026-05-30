<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$productId = '019e750d-2a48-7127-b07a-4f8d0695988f';

echo "Checking database references for Product ID: {$productId}\n";

$tables = DB::select('SHOW TABLES');
$dbName = DB::getDatabaseName();
$prop = "Tables_in_" . $dbName;

foreach ($tables as $t) {
    $tableName = $t->$prop;
    
    // Check if table has a product_id or equivalent column
    $columns = Schema::getColumnListing($tableName);
    
    foreach ($columns as $col) {
        if (in_array($col, ['product_id', 'ingredient_product_id', 'product_variant_id'])) {
            $count = DB::table($tableName)->where($col, $productId)->count();
            if ($count > 0) {
                echo "- Table '{$tableName}' has {$count} rows referencing this product via column '{$col}'\n";
            }
        }
    }
}

echo "Check complete.\n";
