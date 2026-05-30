<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;

$email = 'test@venqore.com';
$user = User::where('email', $email)->first();

if (!$user) {
    echo "User {$email} not found.\n";
    exit;
}

echo "Found user {$email} (ID: {$user->id})...\n";

// Find any tenant in the DB to link to
$tenant = Tenant::latest()->first();

if (!$tenant) {
    echo "No stores found in database. Please register a store from the Hub first.\n";
    exit;
}

echo "Targeting store: {$tenant->name} (ID: {$tenant->id}, Slug: {$tenant->slug})\n";

// Reset onboarding step and setup_completed on the store
$tenant->onboarding_step = 'welcome';
$tenant->setup_completed = true;
$tenant->save();
echo "Updated store onboarding_step to 'welcome' and setup_completed to true.\n";

// Link user to this store if not already linked
$membership = TenantUser::where('user_id', $user->id)->where('tenant_id', $tenant->id)->first();
if (!$membership) {
    TenantUser::create([
        'tenant_id' => $tenant->id,
        'user_id' => $user->id,
        'role' => 'owner',
        'status' => 'active',
        'joined_at' => now(),
    ]);
    echo "Created store membership for user.\n";
} else {
    $membership->status = 'active';
    $membership->role = 'owner';
    $membership->save();
    echo "Updated store membership to active owner.\n";
}

// Set last_store_id
$user->last_store_id = $tenant->id;
$user->save();
echo "Updated user last_store_id to {$tenant->id}.\n";

echo "Reset completed! The user test@venqore.com will now log in and land straight on the Dashboard with the onboarding tour welcome modal active.\n";
