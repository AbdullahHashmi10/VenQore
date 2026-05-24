<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Http\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

try {
    // 1. Resolve tenant
    $tenant = \App\Models\Tenant::where('slug', 'amd-outlets-1')->first();
    if (!$tenant) {
        echo "Tenant 'amd-outlets-1' not found! Existing tenants:\n";
        foreach (\App\Models\Tenant::all() as $t) {
            echo "  - {$t->slug} (ID: {$t->id})\n";
        }
        $tenant = \App\Models\Tenant::first();
        if ($tenant) {
            echo "Using first tenant instead: {$tenant->slug}\n";
        } else {
            echo "No tenants found in the database.\n";
            return;
        }
    }

    // Bind current tenant
    app()->instance('current.tenant', $tenant);
    echo "Selected Tenant: {$tenant->slug} (ID: {$tenant->id})\n";

    // Create and bind mock request first
    $request = \Illuminate\Http\Request::create("/s/{$tenant->slug}/purchases", 'GET');
    app()->instance('request', $request);

    // 2. Resolve User and log in
    $user = \App\Models\User::whereExists(function($q) use ($tenant) {
        $q->select(DB::raw(1))
          ->from('tenant_users')
          ->whereColumn('tenant_users.user_id', 'users.id')
          ->where('tenant_id', $tenant->id);
    })->first();

    if (!$user) {
        $user = \App\Models\User::first();
    }

    if ($user) {
        Auth::guard('web')->setUser($user);
        Auth::setUser($user);
        echo "Logged in as User: {$user->email} (ID: {$user->id}, Role: {$user->role})\n";
    } else {
        echo "No users found in database.\n";
        return;
    }

    // 3. Test legacy index() GET request
    echo "\n=== Testing legacy GET /purchases (index) ===\n";
    $controller = app(\App\Http\Controllers\PurchaseController::class);
    $response = $controller->index($request);
    echo "Legacy Index Response Success! Type: " . get_class($response) . "\n";

    // 4. Test legacy create() GET request
    echo "\n=== Testing legacy GET /purchases/create ===\n";
    $response = $controller->create();
    echo "Legacy Create Response Success! Type: " . get_class($response) . "\n";

    // 5. Test V3 index() GET request
    echo "\n=== Testing V3 GET /v3/purchases (index) ===\n";
    $v3Controller = app(\App\Http\Controllers\V3\PurchaseController::class);
    $response = $v3Controller->index();
    echo "V3 Index Response Success! Type: " . get_class($response) . "\n";

    // 6. Test V3 create() GET request
    echo "\n=== Testing V3 GET /v3/purchases/create ===\n";
    $response = $v3Controller->create();
    echo "V3 Create Response Success! Type: " . get_class($response) . "\n";

} catch (\Throwable $e) {
    echo "EXCEPTION CAUGHT:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
