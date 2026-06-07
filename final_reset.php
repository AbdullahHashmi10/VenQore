<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$demoTenantId = 1;
$platformOwnerId = 2; // platform@venqore.com
$demoOwnerId = 1;

echo "--- STARTING SYSTEM RESET (FORCE MODE) ---\n";

// Disable FK checks
DB::statement('SET FOREIGN_KEY_CHECKS=0');

try {
    // 1. Get all tables (except migrations and system ones)
    $tables = DB::select('SHOW TABLES');
    $dbName = DB::getDatabaseName();
    $prop = "Tables_in_" . $dbName;

    foreach ($tables as $tableObj) {
        $table = $tableObj->$prop;
        
        // Skip system tables
        if (in_array($table, ['migrations', 'failed_jobs', 'personal_access_tokens', 'jobs'])) {
            continue;
        }

        if ($table === 'tenants') {
            $count = DB::table($table)->where('id', '!=', $demoTenantId)->delete();
            echo "- $table: Deleted " . ($count ?: 0) . " non-demo tenant(s)\n";
            continue;
        }

        if ($table === 'users') {
            $count = DB::table($table)->whereNotIn('id', [$platformOwnerId, $demoOwnerId])->delete();
            echo "- $table: Deleted " . ($count ?: 0) . " user(s)\n";
            continue;
        }

        // For all other tables, delete data that is NOT associated with the demo tenant
        // If the table has tenant_id, scope it. Otherwise, if it's a general data table, maybe wipe it?
        // Actually, most transactional tables should be wiped except for demo data.
        
        if (Schema::hasColumn($table, 'tenant_id')) {
            $count = DB::table($table)->where('tenant_id', '!=', $demoTenantId)->delete();
            echo "- $table: Purged " . ($count ?: 0) . " row(s) (non-demo)\n";
        } else {
            // Tables without tenant_id but might be transactional
            $wipeList = [
                'activities', 'activity_logs', 'audit_logs', 'error_logs', 
                'manufacturing_logs', 'parked_sales', 'platform_activity_log', 
                'production_logs', 'proposals', 'sessions', 
                'staff_attendances', 'staff_daily_summaries', 'stock_movements'
            ];
            
            if (in_array($table, $wipeList)) {
                $count = DB::table($table)->delete();
                echo "- $table: Wiped " . ($count ?: 0) . " row(s) (global log/transaction)\n";
            }
        }
    }

    echo "\n✅ System reset successful.\n";
} catch (\Throwable $e) {
    echo "\n❌ System reset failed: " . $e->getMessage() . "\n";
} finally {
    // Re-enable FK checks
    DB::statement('SET FOREIGN_KEY_CHECKS=1');
}

echo "\n--- Resetting Demo Store Data ---\n";
$exitCode = Artisan::call('demo:reset');
echo "Artisan demo:reset finished with exit code: $exitCode\n";
echo Artisan::output();
