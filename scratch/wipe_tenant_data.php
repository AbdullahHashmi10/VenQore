<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$email = 'test@venqore.com';
$user = User::where('email', $email)->first();

if (!$user) {
    echo "User {$email} not found.\n";
    exit;
}

$tenant = Tenant::find($user->last_store_id) ?? Tenant::latest()->first();

if (!$tenant) {
    echo "No store found to wipe.\n";
    exit;
}

$tenantId = $tenant->id;
echo "Wiping all transactional data for store: {$tenant->name} (ID: {$tenantId}, Slug: {$tenant->slug})...\n";

// Disable foreign key checks temporarily to avoid constraint checks during wipe
DB::statement('SET FOREIGN_KEY_CHECKS=0;');

// Get all tables in database
$tables = DB::select('SHOW TABLES');
$dbName = DB::getDatabaseName();
$key = "Tables_in_" . $dbName;

$wipedCount = 0;
foreach ($tables as $tableObj) {
    $tableName = $tableObj->$key;
    
    // Skip tenants and users and tenant_users pivot
    if (in_array($tableName, ['tenants', 'users', 'tenant_users', 'store_licenses', 'appsumo_codes', 'personal_access_tokens', 'migrations'])) {
        continue;
    }
    
    if (Schema::hasColumn($tableName, 'tenant_id')) {
        $deleted = DB::table($tableName)->where('tenant_id', $tenantId)->delete();
        if ($deleted > 0) {
            echo "Wiped {$deleted} records from table '{$tableName}'.\n";
            $wipedCount += $deleted;
        }
    }
}

// Re-enable foreign key checks
DB::statement('SET FOREIGN_KEY_CHECKS=1;');

echo "Total records wiped: {$wipedCount}\n";

// Reset onboarding step and setup_completed on the store
$tenant->onboarding_step = 'welcome';
$tenant->setup_completed = true;
$tenant->save();
echo "Reset store onboarding_step to 'welcome'.\n";

// Seed default charts of accounts, default settings, and tax settings
echo "Re-seeding tenant default parameters...\n";
\Database\Seeders\TenantDefaultSeeder::seedFor($tenant);
echo "Seeding completed successfully!\n";

echo "Reset and data wipe completed! test@venqore.com is ready for a fresh onboarding tour.\n";
