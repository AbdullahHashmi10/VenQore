<?php
use App\Models\User;
use App\Models\AppSumoCode;
use App\Models\StoreLicense;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

// 1. Create Dummy User
$user = User::create([
    'name' => 'LTD Tester',
    'email' => 'ltd-tester-' . time() . '@example.com',
    'password' => bcrypt('password'),
]);
echo "Created User ID: {$user->id}\n";

// 2. Create 3 Available AppSumo Codes
$code1 = 'CODE1-' . time();
$code2 = 'CODE2-' . time();
$code3 = 'CODE3-' . time();

AppSumoCode::create(['code' => $code1, 'status' => 'available', 'tier' => 'starter']);
AppSumoCode::create(['code' => $code2, 'status' => 'available', 'tier' => 'starter']);
AppSumoCode::create(['code' => $code3, 'status' => 'available', 'tier' => 'starter']);
echo "Created Codes: $code1, $code2, $code3\n";

// Helper to simulate redemption via Controller-like logic
function simulateRedeem($user, $codeString) {
    echo "Attempting to redeem: $codeString\n";
    $request = new \Illuminate\Http\Request(['code' => $codeString]);
    Auth::login($user);
    $controller = new \App\Http\Controllers\AppSumoController();
    $response = $controller->redeem($request);
    $data = json_decode($response->getContent(), true);
    if (isset($data['error'])) {
        echo "ERROR: " . $data['error'] . "\n";
    } else {
        echo "SUCCESS: " . $data['message'] . " (Plan: " . $data['plan'] . ")\n";
    }
    return $data;
}

// 3. Redeem Code 1
simulateRedeem($user, $code1);
$license = StoreLicense::withoutTenantScope()->where('user_id', $user->id)->first();
echo "License Plan: " . $license->plan . "\n";

// 4. Create Store (Manual simulation of creating store with this license)
$tenant = Tenant::create([
    'name' => 'LTD Store',
    'slug' => 'ltd-store-' . time(),
    'plan' => $license->plan,
    'status' => 'active',
    'plan_limits' => json_encode(config("plans.{$license->plan}")),
]);
$license->update(['tenant_id' => $tenant->id, 'status' => 'consumed']);
echo "Created Store ID: {$tenant->id} with Plan: {$tenant->plan}\n";

// 5. Redeem Code 2 (Stacking)
simulateRedeem($user, $code2);
$tenant->refresh();
echo "Store Plan after Code 2: " . $tenant->plan . "\n";
$limits = json_decode($tenant->plan_limits, true);
echo "Store Limit (Transactions): " . ($limits['transactions_per_month'] ?? 'NULL') . "\n";

// 6. Redeem Code 3 (Stacking Max)
simulateRedeem($user, $code3);
$tenant->refresh();
echo "Store Plan after Code 3: " . $tenant->plan . "\n";
$limits = json_decode($tenant->plan_limits, true);
echo "Store Limit (Transactions): " . ($limits['transactions_per_month'] ?? 'NULL') . "\n";

// Cleanup
$tenant->forceDelete();
$user->delete();
DB::table('app_sumo_codes')->whereIn('code', [$code1, $code2, $code3])->delete();
echo "Smoke Test Complete.\n";
