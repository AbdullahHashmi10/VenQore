<?php
require realpath(__DIR__ . '/..') . '/vendor/autoload.php';
$app = require_once realpath(__DIR__ . '/..') . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$tables = DB::select('SHOW TABLES');
$database = config('database.connections.mysql.database');
$property = "Tables_in_" . $database;

$tenantTables = [];
foreach ($tables as $table) {
    $tableName = $table->$property;
    if (Schema::hasColumn($tableName, 'tenant_id')) {
        $tenantTables[] = $tableName;
    }
}
echo implode(', ', $tenantTables);
?>
