<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

// Create or update user test@venqore.com
$user = User::where('email', 'test@venqore.com')->first();
if (!$user) {
    $user = new User([
        'name' => 'Test User',
        'email' => 'test@venqore.com',
        'password' => Hash::make('password'),
        'is_platform_admin' => false,
    ]);
    $user->email_verified_at = now();
    $user->save();
    echo "User test@venqore.com created.\n";
} else {
    $user->update([
        'password' => Hash::make('password'),
        'is_platform_admin' => false,
    ]);
    $user->email_verified_at = now();
    $user->save();
    echo "User test@venqore.com updated.\n";
}

// Find the test store
$tenant = Tenant::first();
if ($tenant) {
    // Link user to tenant as owner
    $exists = DB::table('tenant_users')
        ->where('tenant_id', $tenant->id)
        ->where('user_id', $user->id)
        ->exists();
    if (!$exists) {
        DB::table('tenant_users')->insert([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "User linked to tenant {$tenant->slug} as owner.\n";
    } else {
        DB::table('tenant_users')
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->update(['role' => 'owner']);
        echo "User role updated to owner for tenant {$tenant->slug}.\n";
    }
} else {
    // Create a default tenant if none exists
    $tenant = Tenant::create([
        'name' => 'Test Store',
        'slug' => 'test-store',
        'status' => 'active',
        'plan' => 'ltd_1',
        'currency_code' => 'USD',
        'currency_symbol' => '$',
        'timezone' => 'UTC',
        'setup_completed' => true,
    ]);
    DB::table('tenant_users')->insert([
        'tenant_id' => $tenant->id,
        'user_id' => $user->id,
        'role' => 'owner',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "Tenant 'test-store' created and user linked as owner.\n";
}
