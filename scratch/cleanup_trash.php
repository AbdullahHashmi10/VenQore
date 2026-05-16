<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Tenant;

echo "--- CLEANING UP TRASHED RECORDS ---\n";

// Force delete any trashed users
$trashedUsers = User::onlyTrashed()->get();
$userCount = $trashedUsers->count();
foreach ($trashedUsers as $user) {
    echo "Permanently deleting user: {$user->email}\n";
    $user->forceDelete();
}

// Force delete any trashed tenants
$trashedTenants = Tenant::onlyTrashed()->get();
$tenantCount = $trashedTenants->count();
foreach ($trashedTenants as $tenant) {
    echo "Permanently deleting store: {$tenant->slug}\n";
    $tenant->forceDelete();
}

echo "\nCleanup complete. Users deleted: $userCount, Stores deleted: $tenantCount.\n";
echo "The email 'admin@amd.com' and any previously used store slugs are now available for re-registration.\n";
