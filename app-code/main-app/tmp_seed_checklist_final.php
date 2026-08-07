<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Party;
use App\Models\Supplier;
use App\Models\AppSumoCode;
use Illuminate\Support\Str;

try {
    // 1. Initial Registration & Core Stores Setup
    echo "Setting up 'Admin' and 'API' stores...\n";
    $adminStore = Tenant::firstOrCreate(['name' => 'Admin'], [
        'slug' => 'admin-' . Str::lower(Str::random(5)),
        'currency_symbol' => '$',
        'currency_code' => 'USD',
        'setup_completed' => true,
        'status' => 'active',
        'plan' => 'business'
    ]);
    $apiStore = Tenant::firstOrCreate(['name' => 'API'], [
        'slug' => 'api-' . Str::lower(Str::random(5)),
        'currency_symbol' => '$',
        'currency_code' => 'USD',
        'setup_completed' => true,
        'status' => 'active',
        'plan' => 'business'
    ]);

    // 2. Platform God Admin
    echo "Creating Platform God Admin...\n";
    $god = User::updateOrCreate(['email' => 'god@venqore.com'], [
        'name' => 'Platform God',
        'password' => bcrypt('password'),
        'is_platform_admin' => true
    ]);

    // 3. Complete missing products
    $storeA = Tenant::where('slug', 'ali-shoes')->first();
    if ($storeA) {
        DB::table('products')->updateOrInsert(
            ['tenant_id' => $storeA->id, 'sku' => 'SND-03'],
            ['name' => 'Sandal', 'price' => 1500, 'cost_price' => 800, 'unit' => 'PCS', 'base_unit' => 'PCS', 'id' => Str::uuid()->toString(), 'created_at' => now(), 'updated_at' => now()]
        );
        echo "Added Sandal to Store A.\n";
    }

    $storeB = Tenant::where('slug', 'zain-electronics')->first();
    if ($storeB) {
        DB::table('products')->updateOrInsert(
            ['tenant_id' => $storeB->id, 'sku' => 'PHN-002'],
            ['name' => 'Phone', 'price' => 45000, 'cost_price' => 35000, 'unit' => 'PCS', 'base_unit' => 'PCS', 'id' => Str::uuid()->toString(), 'created_at' => now(), 'updated_at' => now()]
        );
        echo "Added Phone to Store B.\n";
    }

    // 4. Specific Functional Test Data (in Store C)
    $storeC = Tenant::where('slug', 'vq-test-store')->first();
    if ($storeC) {
        echo "Adding Specific Functional Test Data to Store C...\n";
        DB::table('products')->updateOrInsert(
            ['tenant_id' => $storeC->id, 'sku' => 'TS-5000'],
            ['name' => 'Test Shoes', 'price' => 5000, 'cost_price' => 3000, 'unit' => 'PCS', 'base_unit' => 'PCS', 'id' => Str::uuid()->toString(), 'created_at' => now(), 'updated_at' => now()]
        );
        
        $pAhmad = Party::firstOrCreate(['tenant_id' => $storeC->id, 'name' => 'Ahmed Ali', 'type' => 'customer']);
        DB::table('customers')->updateOrInsert(
            ['tenant_id' => $storeC->id, 'party_id' => $pAhmad->id],
            ['name' => 'Ahmed Ali', 'id' => Str::uuid()->toString(), 'created_at' => now(), 'updated_at' => now()]
        );
        
        $pTraders = Party::firstOrCreate(['tenant_id' => $storeC->id, 'name' => 'Ali Traders', 'type' => 'supplier']);
        DB::table('suppliers')->updateOrInsert(
            ['tenant_id' => $storeC->id, 'party_id' => $pTraders->id],
            ['name' => 'Ali Traders', 'id' => Str::uuid()->toString(), 'created_at' => now(), 'updated_at' => now()]
        );

        // Empty Category
        DB::table('categories')->updateOrInsert(
            ['tenant_id' => $storeC->id, 'name' => 'Refurbished Items'],
            ['code' => 'REF-02', 'id' => Str::uuid()->toString(), 'created_at' => now(), 'updated_at' => now()]
        );
        
        // Detailed Product
        DB::table('products')->updateOrInsert(
            ['tenant_id' => $storeC->id, 'sku' => 'PRO-XYZ-999'],
            ['name' => 'Elite Wireless Gaming Mouse', 'price' => 8500, 'cost_price' => 4500, 'unit' => 'PCS', 'base_unit' => 'PCS', 'id' => Str::uuid()->toString(), 'created_at' => now(), 'updated_at' => now()]
        );
    }

    // 5. System & Admin Edge Case Prep
    echo "Setting up Edge Case Data...\n";
    
    // Trash Store
    $trashStore = Tenant::withTrashed()->where('name', 'Trash Control Test Store')->first();
    if (!$trashStore) {
        $trashStore = Tenant::create([
            'name' => 'Trash Control Test Store',
            'slug' => 'trash-test-' . Str::lower(Str::random(3)),
            'setup_completed' => true
        ]);
        $trashStore->delete(); // Soft delete
        echo "Created and Soft-Deleted 'Trash Control Test Store'.\n";
    }

    // Trash User
    $trashUser = User::withTrashed()->where('email', 'deleted_tester@vq.com')->first();
    if (!$trashUser) {
        $trashUser = User::create([
            'email' => 'deleted_tester@vq.com',
            'name' => 'Deleted Tester',
            'password' => bcrypt('password')
        ]);
        $trashUser->delete(); // Soft delete
        echo "Created and Soft-Deleted 'Deleted Tester' user.\n";
    }

    // AppSumo Codes
    echo "Generating AppSumo Codes...\n";
    DB::table('appsumo_codes')->updateOrInsert(['code' => 'VQ-STARTER-LTD'], ['plan_tier' => 'Tier 1', 'is_redeemed' => false, 'id' => Str::uuid()->toString(), 'created_at' => now(), 'updated_at' => now()]);
    DB::table('appsumo_codes')->updateOrInsert(['code' => 'VQ-GROWTH-LTD'], ['plan_tier' => 'Tier 2', 'is_redeemed' => false, 'id' => Str::uuid()->toString(), 'created_at' => now(), 'updated_at' => now()]);
    DB::table('appsumo_codes')->updateOrInsert(['code' => 'VQ-BUSINESS-LTD'], ['plan_tier' => 'Tier 3', 'is_redeemed' => false, 'id' => Str::uuid()->toString(), 'created_at' => now(), 'updated_at' => now()]);

    // Mock Vyapar File
    $vyaparContent = "MOCK VYAPAR DATA VERSION 5.0\nSTORES: 1\nBOOKS: 2\n";
    file_put_contents(__DIR__ . '/restore.vyb', $vyaparContent);
    echo "Created mock Vyapar file: restore.vyb\n";

    echo "✅ Final Checklist Seeding Complete!\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
