<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = DB::select('SHOW TABLES');
echo "TABLE COUNTS:\n";
foreach($tables as $table) {
    $tableName = array_values((array)$table)[0];
    try {
        $count = DB::table($tableName)->count();
        if ($count > 0) {
            $tenantCount = 0;
            if (Schema::hasColumn($tableName, 'tenant_id')) {
                $tenantCount = DB::table($tableName)->where('tenant_id', 3)->count();
            }
            echo "{$tableName}: Total={$count}, Tenant3={$tenantCount}\n";
        }
    } catch (\Exception $e) {
        // Skip view or something
    }
}
