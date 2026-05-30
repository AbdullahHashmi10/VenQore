<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;

$user = User::where('email', 'test@venqore.com')->first();
$tenant = Tenant::where('slug', 'demo')->first();

if (!$user) {
    die("User test@venqore.com not found.\n");
}

if (!$tenant) {
    $tenant = Tenant::first();
}

if ($tenant) {
    // Link user to tenant
    TenantUser::updateOrCreate(
        [
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
        ],
        [
            'role' => 'owner',
            'status' => 'active',
        ]
    );
    
    // Set user's last store ID to this tenant (safe save)
    $user->last_store_id = $tenant->id;
    $user->save();
    
    echo "SUCCESS: Linked user test@venqore.com to store '" . $tenant->name . "' (" . $tenant->slug . ") as Owner!\n";
} else {
    echo "No stores exist in the database yet.\n";
}
