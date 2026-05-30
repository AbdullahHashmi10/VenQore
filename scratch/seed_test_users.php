<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

// Get tenant demo (ID: 1)
$tenant = Tenant::find(1);
if (!$tenant) {
    echo "Creating tenant...\n";
    $tenant = Tenant::create([
        'id' => 1,
        'name' => 'VenQore Demo Store',
        'slug' => 'demo',
        'plan' => 'business',
        'status' => 'active',
        'currency_symbol' => '$',
        'currency_code' => 'USD',
        'setup_completed' => true,
        'is_demo' => true,
    ]);
}

// Ensure defaults seeded
try {
    \Database\Seeders\TenantDefaultSeeder::seedFor($tenant);
} catch (\Exception $e) {
    echo "Default seeder note: " . $e->getMessage() . "\n";
}

// 1. Create or update the owner user
$owner = User::updateOrCreate(
    ['email' => 'owner@demo.com'],
    [
        'name' => 'Owner Tester',
        'password' => Hash::make('password'),
        'last_store_id' => $tenant->id,
    ]
);

DB::table('tenant_users')->updateOrInsert(
    ['tenant_id' => $tenant->id, 'user_id' => $owner->id],
    [
        'role' => 'owner',
        'status' => 'active',
        'display_name' => 'Owner Tester',
        'created_at' => now(),
        'updated_at' => now(),
    ]
);

// 2. Create or update the cashier user
$cashier = User::updateOrCreate(
    ['email' => 'cashier@demo.com'],
    [
        'name' => 'Cashier Tester',
        'password' => Hash::make('password'),
        'last_store_id' => $tenant->id,
    ]
);

DB::table('tenant_users')->updateOrInsert(
    ['tenant_id' => $tenant->id, 'user_id' => $cashier->id],
    [
        'role' => 'cashier',
        'status' => 'active',
        'display_name' => 'Cashier Tester',
        'created_at' => now(),
        'updated_at' => now(),
    ]
);

echo "Users seeded successfully!\n";
