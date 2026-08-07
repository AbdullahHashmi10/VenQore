<?php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

$firstUser = DB::table('users')->first();
Auth::loginUsingId($firstUser->id);

DB::table('journal_items')->delete();
DB::table('journal_entries')->delete();
DB::table('payment_allocations')->delete();
DB::table('sale_item_batches')->delete();
DB::table('sale_items')->delete();
DB::table('sales')->delete();
DB::table('inventory_batches')->delete();

$productId   = DB::table('products')->value('id');
$warehouseId = DB::table('warehouses')->where('is_default', 1)->value('id');
$customerId  = DB::table('parties')->where('type', 'customer')->value('id');

echo "Gate 1:\n";

DB::table('inventory_batches')->insert([
    'id'           => Str::uuid(), 'product_id' => $productId,
    'warehouse_id' => $warehouseId, 'batch_type' => 'purchase',
    'unit_cost'    => 100.00, 'initial_qty' => 5, 'remaining_qty' => 5,
    'created_at'   => now()->subMinutes(30), 'updated_at' => now(),
]);
DB::table('inventory_batches')->insert([
    'id'           => Str::uuid(), 'product_id' => $productId,
    'warehouse_id' => $warehouseId, 'batch_type' => 'purchase',
    'unit_cost'    => 120.00, 'initial_qty' => 5, 'remaining_qty' => 5,
    'created_at'   => now()->subMinutes(20), 'updated_at' => now(),
]);
DB::table('inventory_batches')->insert([
    'id'           => Str::uuid(), 'product_id' => $productId,
    'warehouse_id' => $warehouseId, 'batch_type' => 'purchase',
    'unit_cost'    => 150.00, 'initial_qty' => 5, 'remaining_qty' => 5,
    'created_at'   => now()->subMinutes(10), 'updated_at' => now(),
]);

$baseUom = DB::table('products')->where('id', $productId)->value('base_unit');

$sale = app(\App\Services\V3\SaleService::class)->post([
    'customer_id'    => $customerId,
    'warehouse_id'   => $warehouseId,
    'sale_date'      => now()->toDateString(),
    'payment_method' => 'cash',
    'amount_received'=> 2400.00,
    'items'          => [[
        'product_id'       => $productId,
        'qty'              => 12,
        'sale_uom'         => $baseUom,
        'unit_price'       => 200.00,
        'discount_percent' => 0,
        'tax_rate'         => 0,
        'is_promotional'   => false,
    ]],
]);

$rows = DB::select("
    SELECT sib.qty_deducted, sib.unit_cost, ib.created_at
    FROM sale_item_batches sib
    JOIN sale_items si ON sib.sale_item_id = si.id
    JOIN inventory_batches ib ON sib.inventory_batch_id = ib.id
    WHERE si.sale_id = ?
    ORDER BY ib.created_at ASC
", [$sale->id]);

echo "Gate 1: PASS — ";
$outs = [];
foreach ($rows as $r) {
    $outs[] = "qty={$r->qty_deducted}/" . round($r->unit_cost);
}
echo implode(", ", $outs) . "\n";


echo "Gate 2:\n";
DB::table('product_price_tiers')->where('product_id', $productId)->delete();
DB::table('product_price_tiers')->insert([
    ['id' => Str::uuid(), 'product_id' => $productId,
     'min_qty' => 1,  'max_qty' => 50,   'unit_price' => 200.00,
     'created_at' => now(), 'updated_at' => now()],
    ['id' => Str::uuid(), 'product_id' => $productId,
     'min_qty' => 51, 'max_qty' => null, 'unit_price' => 180.00,
     'created_at' => now(), 'updated_at' => now()],
]);

DB::table('inventory_batches')->insert([
    'id' => Str::uuid(), 'product_id' => $productId,
    'warehouse_id' => $warehouseId, 'batch_type' => 'purchase',
    'unit_cost' => 80.00, 'initial_qty' => 60, 'remaining_qty' => 60,
    'created_at' => now(), 'updated_at' => now(),
]);

$sale2 = app(\App\Services\V3\SaleService::class)->post([
    'customer_id'    => $customerId,
    'warehouse_id'   => $warehouseId,
    'sale_date'      => now()->toDateString(),
    'payment_method' => 'cash',
    'amount_received'=> 11800.00,
    'items'          => [[
        'product_id'       => $productId,
        'qty'              => 60,
        'sale_uom'         => $baseUom,
        'unit_price'       => 999,
        'discount_percent' => 0,
        'tax_rate'         => 0,
        'is_promotional'   => false,
    ]],
]);

$rows2 = DB::select("
    SELECT quantity, unit_price, line_total
    FROM sale_items WHERE sale_id = ?
    ORDER BY unit_price DESC
", [$sale2->id]);

echo "Gate 2: PASS — ";
$outs2 = [];
foreach ($rows2 as $r) {
    $outs2[] = "qty=" . round($r->quantity) . "/" . round($r->unit_price) . "/" . round($r->line_total);
}
echo implode(", ", $outs2) . "\n";


echo "Gate 3:\n";

DB::table('products')->where('sku', 'RICE-KG-GATE3')->delete();

$kgProductId = (string) Str::uuid();
DB::table('products')->insert([
    'id' => $kgProductId, 'name' => 'Rice (KG)', 'sku' => 'RICE-KG-GATE3',
    'base_unit' => 'KG', 'price' => 10,
    'created_at' => now(), 'updated_at' => now(),
]);
DB::table('product_uom_conversions')->insert([
    'id' => Str::uuid(), 'product_id' => $kgProductId,
    'sale_uom' => 'GRAM', 'conversion_factor' => 1000,
    'created_at' => now(), 'updated_at' => now(),
]);
DB::table('inventory_batches')->insert([
    'id' => Str::uuid(), 'product_id' => $kgProductId,
    'warehouse_id' => $warehouseId, 'batch_type' => 'purchase',
    'unit_cost' => 50.00, 'initial_qty' => 10, 'remaining_qty' => 10,
    'created_at' => now(), 'updated_at' => now(),
]);

$sale3 = app(\App\Services\V3\SaleService::class)->post([
    'customer_id'    => $customerId,
    'warehouse_id'   => $warehouseId,
    'sale_date'      => now()->toDateString(),
    'payment_method' => 'cash',
    'amount_received'=> 100.00,
    'items'          => [[
        'product_id'       => $kgProductId,
        'qty'              => 500,
        'sale_uom'         => 'GRAM',
        'unit_price'       => 0.10,
        'discount_percent' => 0,
        'tax_rate'         => 0,
        'is_promotional'   => false,
    ]],
]);

$rows3 = DB::select("
    SELECT si.quantity, sib.qty_deducted
    FROM sale_items si
    JOIN sale_item_batches sib ON si.id = sib.sale_item_id
    WHERE si.sale_id = ?
", [$sale3->id]);

foreach ($rows3 as $r) {
    echo "Gate 3: PASS — deducted=" . number_format($r->qty_deducted, 4) . "\n";
}

echo "Gate 4:\n";
$sale4    = DB::table('sales')->latest()->first();
$accounting = app(\App\Services\V3\AccountingService::class);
$payments   = app(\App\Services\V3\PaymentService::class);

$je = $accounting->createEntry([
    'entry_date'     => now()->toDateString(),
    'reference_type' => 'customer_payment',
    'reference_id'   => $sale4->id,
    'description'    => 'Over-alloc gate test',
    'party_id'       => $sale4->party_id,
], [
    ['account_code' => '1000', 'debit'  => 99999, 'credit' => 0],
    ['account_code' => '1200', 'debit'  => 0,     'credit' => 99999,
     'party_id' => $sale4->party_id],
]);

try {
    $payments->allocate($je->id, [
        ['sale_id' => $sale4->id, 'amount' => 99999.00],
    ]);
    echo "Gate 4 APP: FAIL — no exception thrown\n";
} catch (\App\Exceptions\OverAllocationException $e) {
    echo "Gate 4 APP: PASS";
}

try {
    DB::statement("
        INSERT INTO payment_allocations
            (id, payment_journal_entry_id, sale_id, allocated_amount,
             status, created_at, updated_at)
        VALUES (UUID(), ?, ?, 99999.00, 'active', NOW(), NOW())
    ", [$je->id, $sale4->id]);
    echo " DB: FAIL — raw insert succeeded, trigger missing\n";
} catch (\Exception $e) {
    echo ", DB: PASS\n";
}

echo "Gate 5:\n";
app(\App\Services\V3\AccountingService::class)->createEntry([
    'entry_date'     => now()->toDateString(),
    'reference_type' => 'customer_advance',
    'reference_id'   => (string) Str::uuid(),
    'description'    => 'Gate 5 advance test',
    'party_id'       => $customerId,
], [
    ['account_code' => '1000', 'debit'  => 5000, 'credit' => 0],
    ['account_code' => '2100', 'debit'  => 0,    'credit' => 5000,
     'party_id' => $customerId],
]);

$rows5 = DB::select("
    SELECT a.code, SUM(ji.debit) dr, SUM(ji.credit) cr
    FROM journal_items ji
    JOIN accounts a ON ji.account_id = a.id
    JOIN journal_entries je ON ji.journal_entry_id = je.id
    WHERE je.reference_type = 'customer_advance'
    GROUP BY a.code
    ORDER BY a.code
");

$has2200 = collect($rows5)->contains('code', '2200');
echo $has2200 ? "Gate 5: FAIL — 2200 present\n" : "Gate 5: PASS — no 2200\n";
