<?php

use App\Models\Tenant;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Party;
use App\Models\Account;
use App\Services\V3\SaleService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

try {
    echo "--- SIMULATING SALE ---\n";

    // 1. Ensure a Tenant exists
    $tenant = Tenant::firstOrCreate(['name' => 'AMD Outlets Test'], [
        'slug' => 'amd-outlets-test',
        'plan' => 'growth',
        'status' => 'active'
    ]);
    $tenantId = $tenant->id;
    echo "Tenant ID: $tenantId\n";

    // 2. Ensure Core Accounts exist
    $accounts = [
        ['code' => '4000', 'name' => 'Sales Order', 'type' => 'income'],
        ['code' => '1000', 'name' => 'Cash', 'type' => 'asset'],
        ['code' => '1200', 'name' => 'Inventory', 'type' => 'asset'],
        ['code' => '5000', 'name' => 'COGS', 'type' => 'expense'],
        ['code' => '1100', 'name' => 'Accounts Receivable', 'type' => 'asset'],
    ];
    foreach ($accounts as $acc) {
        $account = Account::where('code', $acc['code'])->first();
        if (!$account) {
            Account::create([
                 'id' => Str::uuid()->toString(),
                 'code' => $acc['code'],
                 'tenant_id' => $tenantId,
                 'name' => $acc['name'],
                 'type' => $acc['type'],
                 'is_active' => 1
            ]);
        } else {
            // Update tenant_id if null
            if ($account->tenant_id === null) {
                $account->update(['tenant_id' => $tenantId]);
            }
        }
    }
    echo "Accounts checked.\n";

    // 3. Ensure a Warehouse exists
    $warehouse = Warehouse::where('name', 'Main Warehouse')->where('tenant_id', $tenantId)->first();
    if (!$warehouse) {
        $warehouse = Warehouse::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Main Warehouse',
            'tenant_id' => $tenantId,
            'location' => 'Lahore'
        ]);
    }
    echo "Warehouse ID: " . $warehouse->id . "\n";

    // 4. Ensure a Product exists
    $product = Product::where('sku', 'SHO-001')->where('tenant_id', $tenantId)->first();
    if (!$product) {
        $product = Product::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Leather Shoes',
            'tenant_id' => $tenantId,
            'sku' => 'SHO-001',
            'price' => 2500,
            'tax_rate' => 0,
            'base_unit' => 'pair'
        ]);
    }
    echo "Product ID: " . $product->id . "\n";

    // 5. Ensure a Customer exists
    $customer = Party::where('name', 'Walking Customer')->where('tenant_id', $tenantId)->first();
    if (!$customer) {
        $customer = Party::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Walking Customer',
            'type' => 'customer',
            'tenant_id' => $tenantId
        ]);
    }
    echo "Customer ID: " . $customer->id . "\n";

    // --- ADD STOCK ---
    echo "Adding stock...\n";
    DB::table('stocks')->updateOrInsert(
        ['product_id' => $product->id, 'warehouse_id' => $warehouse->id, 'tenant_id' => $tenantId],
        ['quantity' => 10, 'updated_at' => now(), 'created_at' => now()]
    );
    
    // Using updateOrInsert for batches as well to avoid UUID collisions if already exists
    DB::table('inventory_batches')->updateOrInsert(
        ['product_id' => $product->id, 'warehouse_id' => $warehouse->id, 'tenant_id' => $tenantId],
        [
            'id' => DB::table('inventory_batches')->where('product_id', $product->id)->value('id') ?? Str::uuid()->toString(),
            'batch_type' => 'manual',
            'initial_qty' => 10,
            'original_qty' => 10,
            'remaining_qty' => 10,
            'unit_cost' => 1500,
            'updated_at' => now(),
            'created_at' => now()
        ]
    );

    // 6. Post a sale
    $saleService = app(SaleService::class);
    $saleData = [
        'customer_id' => $customer->id,
        'warehouse_id' => $warehouse->id,
        'sale_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'amount_received' => 2500,
        'items' => [
            [
                'product_id' => $product->id,
                'qty' => 1,
                'unit_price' => 2500,
                'discount_percent' => 0,
                'tax_rate' => 0,
                'sale_uom' => 'pair'
            ]
        ]
    ];

    $user = \App\Models\User::firstOrCreate(['email' => 'admin@venqore.com'], [
        'name' => 'Admin',
        'password' => bcrypt('password'),
        'last_store_id' => (string)$tenantId
    ]);
    auth()->login($user);

    $sale = $saleService->post($saleData);
    echo "Sale Created. ID: " . $sale->id . "\n";

    // 7. Verify tenant_id in ALL tables
    echo "\n--- VERIFICATION ---\n";

    $saleCheck = DB::table('sales')->where('id', $sale->id)->first();
    echo "Sale tenant_id: " . ($saleCheck->tenant_id ?: 'NULL') . "\n";

    $itemCheck = DB::table('sale_items')->where('sale_id', $sale->id)->first();
    echo "SaleItem tenant_id: " . ($itemCheck->tenant_id ?: 'NULL') . "\n";

    $jeCheck = DB::table('journal_entries')
        ->where('tenant_id', $tenantId)
        ->latest()
        ->first();
        
    if ($jeCheck) {
        echo "Latest JournalEntry tenant_id: " . ($jeCheck->tenant_id ?: 'NULL') . "\n";
        echo "Description: " . $jeCheck->description . "\n";
        
        $jiCheck = DB::table('journal_items')->where('journal_entry_id', $jeCheck->id)->first();
        echo "JournalItem tenant_id: " . ($jiCheck->tenant_id ?: 'NULL') . "\n";
    } else {
        echo "JournalEntry NOT FOUND for sale.\n";
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
