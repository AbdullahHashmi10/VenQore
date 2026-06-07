<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Warehouse;
use App\Models\Tenant;

$demo = Tenant::where('slug', 'demo')->first();
echo "Demo Tenant ID: " . ($demo ? $demo->id : 'NOT FOUND') . "\n";

// Bind and test
app()->instance('current.tenant', $demo);
$w = Warehouse::first();
echo "Warehouse::first(): " . ($w ? "ID={$w->id}, TenantID={$w->tenant_id}" : "NOT FOUND") . "\n";

$warehouses = Warehouse::withoutTenantScope()->get();
foreach ($warehouses as $w) {
    echo "Warehouse: ID={$w->id}, TenantID={$w->tenant_id}, Name={$w->name}\n";
}
