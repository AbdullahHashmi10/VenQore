<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Party;
use App\Models\Warehouse;
use App\Models\Stock;
use App\Models\Account;
use App\Models\Supplier;
use App\Services\V3\SaleService;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use Illuminate\Support\Str;

// Ensure we have a master user ready to authenticate as for services
$ownerUser = User::where('is_platform_admin', true)->first() ?? User::first();
auth()->login($ownerUser);

function seedAccounts($tenantId) {
    echo "Seeding accounts for tenant {$tenantId}...\n";
    $accounts = [
        ['code' => '1000', 'name' => 'Cash on Hand', 'type' => 'asset', 'normal_balance' => 'debit'],
        ['code' => '1010', 'name' => 'Bank Account', 'type' => 'asset', 'normal_balance' => 'debit'],
        ['code' => '1100', 'name' => 'Inventory', 'type' => 'asset', 'normal_balance' => 'debit'],
        ['code' => '1200', 'name' => 'Accounts Receivable', 'type' => 'asset', 'normal_balance' => 'debit'],
        ['code' => '2000', 'name' => 'Accounts Payable (Legacy)', 'type' => 'liability', 'normal_balance' => 'credit'],
        ['code' => '2110', 'name' => 'Accounts Payable', 'type' => 'liability', 'normal_balance' => 'credit'],
        ['code' => '2200', 'name' => 'Sales Tax Payable', 'type' => 'liability', 'normal_balance' => 'credit'],
        ['code' => '2100', 'name' => 'Customer Advance', 'type' => 'liability', 'normal_balance' => 'credit'],
        ['code' => '3000', 'name' => 'Owner Capital', 'type' => 'equity', 'normal_balance' => 'credit'],
        ['code' => '4000', 'name' => 'Sales Revenue', 'type' => 'income', 'normal_balance' => 'credit'],
        ['code' => '5000', 'name' => 'Cost of Goods Sold', 'type' => 'expense', 'normal_balance' => 'debit'],
    ];

    foreach ($accounts as $acc) {
        DB::table('accounts')->updateOrInsert(
            ['tenant_id' => $tenantId, 'code' => $acc['code']],
            array_merge($acc, ['id' => Str::uuid()->toString(), 'created_at' => now(), 'updated_at' => now()])
        );
    }
}

try {
    // 0. Ensure UOM sanity
    DB::table('products')->update(['base_unit' => 'PCS', 'unit' => 'PCS']);

    // ============================================
    // STORE A: Ali Shoes
    // ============================================
    echo "Processing Store A: Ali Shoes...\n";
    $storeA = Tenant::where('slug', 'ali-shoes')->first();
    app()->instance('current.tenant', $storeA);
    seedAccounts($storeA->id);
    
    $saleServiceA = app(SaleService::class);
    $fifoServiceA = app(FifoService::class);

    $redShoe = Product::where('tenant_id', $storeA->id)->where('sku', 'RED-01')->first();
    $blueShoe = Product::where('tenant_id', $storeA->id)->where('sku', 'BLU-02')->first();
    $partyA = Party::where('tenant_id', $storeA->id)->where('name', 'Ali Customer')->first();
    
    $whA = Warehouse::firstOrCreate(['tenant_id' => $storeA->id, 'name' => 'Main Warehouse'], ['is_default' => true]);
    
    // Cleanup & Fresh Start
    DB::table('sales')->where('tenant_id', $storeA->id)->delete();
    DB::table('sale_items')->where('tenant_id', $storeA->id)->delete();
    DB::table('journal_entries')->where('tenant_id', $storeA->id)->delete();
    DB::table('journal_items')->where('tenant_id', $storeA->id)->delete();
    DB::table('inventory_batches')->where('tenant_id', $storeA->id)->delete();

    $fifoServiceA->receiveBatch($redShoe->id, $whA->id, 100, 1000, 'initial');
    $fifoServiceA->receiveBatch($blueShoe->id, $whA->id, 100, 1200, 'initial');

    $saleA_data = [
        'customer_id' => $partyA->id,
        'warehouse_id' => $whA->id,
        'sale_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'amount_received' => 5000,
        'tenant_id' => $storeA->id,
        'items' => [
            ['product_id' => $redShoe->id, 'qty' => 1, 'unit_price' => 2000, 'sale_uom' => 'PCS'],
            ['product_id' => $blueShoe->id, 'qty' => 1, 'unit_price' => 3000, 'sale_uom' => 'PCS']
        ]
    ];
    $saleServiceA->post($saleA_data);


    // ============================================
    // STORE B: Zain Electronics
    // ============================================
    echo "Processing Store B: Zain Electronics...\n";
    $storeB = Tenant::where('slug', 'zain-electronics')->first();
    app()->instance('current.tenant', $storeB);
    seedAccounts($storeB->id);
    
    $saleServiceB = app(SaleService::class);
    $fifoServiceB = app(FifoService::class);

    $laptop = Product::where('tenant_id', $storeB->id)->where('sku', 'LT-003')->first();
    $tv = Product::where('tenant_id', $storeB->id)->where('sku', 'TV-001')->first();
    $partyB = Party::where('tenant_id', $storeB->id)->where('name', 'Zain Customer')->first();

    $whB = Warehouse::firstOrCreate(['tenant_id' => $storeB->id, 'name' => 'Main Warehouse'], ['is_default' => true]);
    
    DB::table('sales')->where('tenant_id', $storeB->id)->delete();
    DB::table('sale_items')->where('tenant_id', $storeB->id)->delete();
    DB::table('journal_entries')->where('tenant_id', $storeB->id)->delete();
    DB::table('journal_items')->where('tenant_id', $storeB->id)->delete();
    DB::table('inventory_batches')->where('tenant_id', $storeB->id)->delete();

    $fifoServiceB->receiveBatch($laptop->id, $whB->id, 50, 12000, 'initial');
    $fifoServiceB->receiveBatch($tv->id, $whB->id, 50, 8000, 'initial');

    $saleB_data = [
        'customer_id' => $partyB->id,
        'warehouse_id' => $whB->id,
        'sale_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'amount_received' => 15000,
        'tenant_id' => $storeB->id,
        'items' => [
            ['product_id' => $laptop->id, 'qty' => 1, 'unit_price' => 15000, 'sale_uom' => 'PCS']
        ]
    ];
    $saleServiceB->post($saleB_data);


    // ============================================
    // STORE C: VQ Test Store
    // ============================================
    echo "Processing Store C: VQ Test Store...\n";
    $storeC = Tenant::where('slug', 'vq-test-store')->first();
    app()->instance('current.tenant', $storeC);
    seedAccounts($storeC->id);
    
    $saleServiceC = app(SaleService::class);
    $fifoServiceC = app(FifoService::class);
    $accountingServiceC = app(AccountingService::class);

    $whC = Warehouse::firstOrCreate(['tenant_id' => $storeC->id, 'name' => 'Main Warehouse'], ['is_default' => true]);
    $products = Product::where('tenant_id', $storeC->id)->get();
    
    DB::table('sales')->where('tenant_id', $storeC->id)->delete();
    DB::table('sale_items')->where('tenant_id', $storeC->id)->delete();
    DB::table('journal_entries')->where('tenant_id', $storeC->id)->delete();
    DB::table('journal_items')->where('tenant_id', $storeC->id)->delete();
    DB::table('inventory_batches')->where('tenant_id', $storeC->id)->delete();
    DB::table('purchases')->delete();
    DB::table('purchase_items')->delete();

    foreach ($products as $p) {
        $fifoServiceC->receiveBatch($p->id, $whC->id, 50, $p->price * 0.5, 'initial');
    }

    $customerPartiesC = Party::where('tenant_id', $storeC->id)->where('type', 'customer')->get();
    
    for ($i = 0; $i < 2; $i++) {
        $p = $products->random();
        $saleServiceC->post([
            'customer_id' => $customerPartiesC->random()->id,
            'warehouse_id' => $whC->id,
            'sale_date' => now()->toDateString(),
            'payment_method' => 'cash',
            'amount_received' => $p->price,
            'tenant_id' => $storeC->id,
            'items' => [['product_id' => $p->id, 'qty' => 1, 'unit_price' => $p->price, 'sale_uom' => 'PCS']]
        ]);
    }
    
    echo "Creating Purchase for Store C...\n";
    $supplierParty = Party::firstOrCreate(['tenant_id' => $storeC->id, 'name' => 'Tech Supplier Ltd', 'type' => 'supplier']);
    $purchaseId = Str::uuid()->toString();
    $prod = $products->first();
    DB::table('purchases')->insert([
        'id' => $purchaseId, 'party_id' => $supplierParty->id, 'warehouse_id' => $whC->id,
        'purchase_date' => now()->toDateString(), 'subtotal' => 10000, 'total' => 10000, 'payment_status' => 'unpaid',
        'created_at' => now(), 'updated_at' => now()
    ]);
    $batch = $fifoServiceC->receiveBatch($prod->id, $whC->id, 10, 1000, 'purchase', $purchaseId);
    DB::table('purchase_items')->insert([
        'id' => Str::uuid()->toString(), 'purchase_id' => $purchaseId, 'product_id' => $prod->id,
        'qty' => 10, 'unit_cost' => 1000, 'line_total' => 10000, 'inventory_batch_id' => $batch->id,
        'created_at' => now(), 'updated_at' => now()
    ]);
    $accountingServiceC->createEntry(
        ['reference_type' => 'purchase', 'reference' => $purchaseId, 'description' => 'Purchase of inventory'],
        [['account_code' => '1100', 'debit' => 10000, 'credit' => 0], ['account_code' => '2110', 'debit' => 0, 'credit' => 10000, 'party_id' => $supplierParty->id]]
    );

    echo "Creating Manual Journal Entry for Store C...\n";
    $cash = Account::where('tenant_id', $storeC->id)->where('code', '1000')->first();
    $equity = Account::where('tenant_id', $storeC->id)->where('code', '3000')->first();
    if ($cash && $equity) {
        $accountingServiceC->createEntry(
            ['description' => 'Seed Investment'],
            [['account_id' => $cash->id, 'debit' => 100000, 'credit' => 0], ['account_id' => $equity->id, 'debit' => 0, 'credit' => 100000]]
        );
    }

    echo "✅ Success! All stores fully seeded with real accounting data.\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
