<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenant = DB::table('tenants')->where('id', '!=', 1)->orderBy('created_at', 'desc')->first();

if (!$tenant) {
    echo "FAIL: No new tenant found!\n";
    exit(1);
}

echo "--- Tenant Verification ---\n";
echo "ID: " . $tenant->id . "\n";
echo "Name: " . $tenant->name . "\n";
echo "Slug: " . $tenant->slug . "\n";
echo "Plan: " . $tenant->plan . "\n";
echo "Status: " . $tenant->status . "\n";

echo "\n--- Membership Check ---\n";
$membership = DB::table('tenant_users')->where('tenant_id', $tenant->id)->first();
if ($membership) {
    echo "User ID: " . $membership->user_id . "\n";
    echo "Role: " . $membership->role . "\n";
} else {
    echo "FAIL: No membership found for this tenant!\n";
}

echo "\n--- Warehouse Check ---\n";
$warehouses = DB::table('warehouses')->where('tenant_id', $tenant->id)->get();
foreach($warehouses as $w) {
    echo "Warehouse: " . $w->name . "\n";
}

echo "\n--- License Check ---\n";
if (Schema::hasTable('store_licenses')) {
    $license = DB::table('store_licenses')->where('tenant_id', $tenant->id)->first();
    if ($license) {
        echo "License Plan: " . $license->plan . "\n";
        echo "Expires At: " . $license->expires_at . "\n";
    } else {
        echo "FAIL: No license found for this tenant!\n";
    }
} else {
     echo "SKIP: store_licenses table not found (check config/plans.php logic)\n";
}
