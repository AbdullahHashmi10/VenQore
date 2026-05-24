<?php

use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\Party;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

try {
    echo "--- TESTING PRODUCT DELETE / ARCHIVE ---\n";

    $tenantId = 7;
    $user = User::firstOrCreate(['email' => 'admin@venqore.com'], [
        'name' => 'Admin',
        'password' => bcrypt('password'),
        'last_store_id' => (string)$tenantId
    ]);
    auth()->login($user);
    
    // Case 1: Product with sales (should archive)
    $sku1 = 'TEST-' . Str::random(5);
    $p1 = Product::create([
        'name' => 'Archive Test Product',
        'tenant_id' => $tenantId,
        'sku' => $sku1,
        'is_active' => 1
    ]);
    
    // Create a fake sale
    $w = Warehouse::firstOrCreate(['name' => 'Main Warehouse', 'tenant_id' => $tenantId]);
    $c = Party::firstOrCreate(['name' => 'Walking Customer', 'type' => 'customer', 'tenant_id' => $tenantId]);

    $sale = Sale::create([
        'tenant_id' => $tenantId,
        'total' => 100,
        'status' => 'posted',
        'posted_at' => now(),
        'party_id' => $c->id,
        'warehouse_id' => $w->id,
        'user_id' => $user->id
    ]);
    
    // Add a fake sale item
    DB::table('sale_items')->insert([
        'id' => Str::uuid()->toString(),
        'sale_id' => $sale->id,
        'product_id' => $p1->id,
        'tenant_id' => $tenantId,
        'quantity' => 1,
        'unit_price' => 100,
        'line_total' => 100,
        'created_at' => now()
    ]);
    
    echo "Testing delete of product with sales...\n";
    $hasHistory = DB::table('sale_items')->where('product_id', $p1->id)->exists();
    if ($hasHistory) {
        $p1->update(['is_active' => 0]);
        echo "Product archived (is_active=0).\n";
    } else {
        $p1->delete();
        echo "Product deleted.\n";
    }
    
    $check1 = DB::table('products')->where('id', $p1->id)->first();
    echo "Final is_active: " . $check1->is_active . "\n";
    echo "Final deleted_at: " . ($check1->deleted_at ? "Y" : "N") . "\n";

    // Case 2: Product without sales (should soft-delete)
    $sku2 = 'TEST-' . Str::random(5);
    $p2 = Product::create([
        'name' => 'SoftDelete Test Product',
        'tenant_id' => $tenantId,
        'sku' => $sku2,
        'is_active' => 1
    ]);
    
    echo "\nTesting delete of product without sales...\n";
    $hasHistory2 = DB::table('sale_items')->where('product_id', $p2->id)->exists();
    if ($hasHistory2) {
        $p2->update(['is_active' => 0]);
        echo "Product archived.\n";
    } else {
        $p2->delete();
        echo "Product deleted.\n";
    }
    
    $check2 = DB::table('products')->where('id', $p2->id)->first();
    echo "Final is_active: " . $check2->is_active . "\n";
    echo "Final deleted_at: " . ($check2->deleted_at ? "Y" : "N") . "\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
