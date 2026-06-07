<?php

/* sys_gate_5_cycle.php */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

DB::statement('SET FOREIGN_KEY_CHECKS=0;');
DB::table('journal_items')->truncate();
DB::table('journal_entries')->truncate();
DB::table('payment_allocations')->truncate();
DB::table('payments')->truncate();
DB::table('sale_item_batches')->truncate();
DB::table('sale_items')->truncate();
DB::table('sales')->truncate();
DB::table('purchase_items')->truncate();
DB::table('purchases')->truncate();
DB::table('inventory_batches')->truncate();
DB::statement('SET FOREIGN_KEY_CHECKS=1;');

$firstUser = DB::table('users')->first();
auth()->loginUsingId($firstUser->id);

$warehouse = DB::table('warehouses')->first();
$supplier = DB::table('parties')->where('type', 'supplier')->first() ?? DB::table('parties')->insertGetId([
    'id' => Str::uuid()->toString(), 'type' => 'supplier', 'name' => 'Test Supplier', 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()
]);
$supplierId = is_object($supplier) ? $supplier->id : $supplier;

$customer = DB::table('parties')->where('type', 'customer')->first() ?? DB::table('parties')->insertGetId([
    'id' => Str::uuid()->toString(), 'type' => 'customer', 'name' => 'Test Customer', 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()
]);
$customerId = is_object($customer) ? $customer->id : $customer;

$product = DB::table('products')->where('type', 'finished_good')->first();

if (!$product) {
    $prodId = Str::uuid()->toString();
    DB::table('products')->insert([
        'id' => $prodId, 'name' => 'Test FG', 'type' => 'finished_good', 'base_unit' => 'PCS', 'created_at' => now(), 'updated_at' => now()
    ]);
    $product = DB::table('products')->find($prodId);
}

// Ensure accounts exist with correct balances
$neededAccounts = [
    ['code' => '5000', 'name' => 'Cost of Goods Sold', 'type' => 'expense'],
    ['code' => '7000', 'name' => 'Clearing', 'type' => 'liability'],
    ['code' => '4000', 'name' => 'Sales Revenue', 'type' => 'income'],
    ['code' => '1200', 'name' => 'Accounts Receivable', 'type' => 'asset'],
    ['code' => '2000', 'name' => 'Accounts Payable', 'type' => 'liability'],
];
foreach ($neededAccounts as $acc) {
    if (!DB::table('accounts')->where('code', $acc['code'])->exists()) {
        DB::table('accounts')->insert([
            'id' => Str::uuid()->toString(), 'code' => $acc['code'], 'name' => $acc['name'],
            'type' => $acc['type'], 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()
        ]);
    }
}

// 1. Purchase
$purchaseRequest = \Illuminate\Http\Request::create('/v3/purchases', 'POST', [
    'party_id' => $supplierId,
    'purchase_date' => now()->toDateString(),
    'reference_number' => 'PUR-5-1',
    'notes' => 'Test Purchase',
    'items' => [
        [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'qty' => 10,
            'unit_cost' => 50,
            'tax_rate' => 0
        ]
    ]
]);
$purchaseController = app(\App\Http\Controllers\V3\PurchaseController::class);
$purchaseController->store($purchaseRequest);

$purchase = DB::table('purchases')->orderBy('created_at', 'desc')->first();
$purchaseController->post($purchase->id);

// 2. Payment (Purchase)
$paymentRequest = \Illuminate\Http\Request::create('/v3/payments', 'POST', [
    'party_id' => $supplierId,
    'type' => 'payment_out',
    'payment_date' => now()->toDateString(),
    'payment_method' => 'cash',
    'amount' => 500,
    'reference_number' => 'PAY-5-1',
    'allocations' => [
        ['purchase_id' => $purchase->id, 'allocated_amount' => 500]
    ]
]);
$paymentController = app(\App\Http\Controllers\V3\PaymentController::class);
$paymentController->store($paymentRequest);

// 3. Sale
$saleRequest = \Illuminate\Http\Request::create('/v3/sales', 'POST', [
    'party_id' => $customerId,
    'sale_date' => now()->toDateString(),
    'warehouse_id' => $warehouse->id,
    'items' => [
        [
            'product_id' => $product->id,
            'qty' => 4,
            'unit_price' => 100,
            'tax_rate' => 0
        ]
    ]
]);
$saleController = app(\App\Http\Controllers\V3\SaleController::class);
$saleRes = $saleController->store($saleRequest);
$saleId = json_decode($saleRes->getContent())->id ?? json_decode($saleRes->getContent())->sale->id ?? DB::table('sales')->orderBy('created_at', 'desc')->first()->id;

$saleController->post($saleId);

// 4. Receipt (Sale)
$paymentRequest2 = \Illuminate\Http\Request::create('/v3/payments', 'POST', [
    'party_id' => $customerId,
    'type' => 'payment_in',
    'payment_date' => now()->toDateString(),
    'payment_method' => 'cash',
    'amount' => 400,
    'reference_number' => 'REC-5-1',
    'allocations' => [
        ['sale_id' => $saleId, 'allocated_amount' => 400]
    ]
]);
$paymentController->store($paymentRequest2);

echo "Cycle completed.\n";
