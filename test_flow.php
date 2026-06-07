<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

// 1. Truncate tables for a clean test
echo "--- TRUNCATING TABLES ---\n";
DB::statement('SET FOREIGN_KEY_CHECKS=0;');
DB::table('journal_items')->truncate();
DB::table('journal_entries')->truncate();
DB::table('inventory_batches')->truncate();
DB::table('sales')->truncate();
DB::table('sale_items')->truncate();
DB::table('sale_item_batches')->truncate();
DB::table('invoices')->truncate();
DB::table('payments')->truncate();
DB::table('transactions')->truncate();
DB::table('parties')->truncate();
DB::table('fund_transactions')->truncate();
DB::table('bank_accounts')->truncate();
DB::table('products')->truncate();
DB::table('categories')->truncate();
DB::table('warehouses')->truncate();
DB::statement('SET FOREIGN_KEY_CHECKS=1;');

// 2. Setup Base Data
$user = \App\Models\User::first() ?? \App\Models\User::factory()->create();
\Illuminate\Support\Facades\Auth::login($user);
echo "Logged in as User: " . $user->email . "\n";

// Mandatory for FundController
\App\Models\BankAccount::create(['name' => 'Cash', 'type' => 'cash', 'current_balance' => 0]);

// Helpers
function runChecks($stepName) {
    echo "\n=== CHECKS AFTER: $stepName ===\n";

    $check1 = DB::select("SELECT SUM(debit) as d, SUM(credit) as c, ABS(SUM(debit) - SUM(credit)) AS must_be_zero FROM journal_items ji JOIN journal_entries je ON ji.journal_entry_id = je.id WHERE je.is_reversed = 0");
    echo "Check 1 (Trial Balance Dr/Cr): " . ($check1[0]->d ?? 0) . " / " . ($check1[0]->c ?? 0) . " | Imbalance: " . ($check1[0]->must_be_zero ?? 'NULL') . "\n";

    $check2 = DB::select("SELECT ABS( (SELECT COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) FROM journal_items ji JOIN journal_entries je ON ji.journal_entry_id = je.id JOIN accounts a ON ji.account_id = a.id WHERE a.code = '1100' AND je.is_reversed = 0) - (SELECT COALESCE(SUM(remaining_qty * unit_cost),0) FROM inventory_batches WHERE remaining_qty > 0 AND deleted_at IS NULL)) AS must_be_zero");
    echo "Check 2 (Inventory Ledger vs Physical): " . ($check2[0]->must_be_zero ?? 'NULL') . "\n";
    
    $batches = DB::table('inventory_batches')->count();
    echo "Batch Count: $batches\n";
}

function call($controller, $method, $request) {
    try {
        $resp = app($controller)->$method($request);
        $content = is_object($resp) && method_exists($resp, 'getContent') ? $resp->getContent() : 'N/A';
        echo "Response: " . (is_object($resp) ? get_class($resp) : 'Scalar') . " | Content: " . substr($content, 0, 100) . "\n";
        return $resp;
    } catch (\Exception $e) {
        echo "FAILED: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
        throw $e;
    }
}

// ---------------------------------------------------------
// Transaction 1 — Add funds
// ---------------------------------------------------------
$req1 = Request::create('/funds/add', 'POST', [
    'account_type' => 'cash',
    'amount' => 10000,
    'reason' => 'Test Capital',
]);
call(\App\Http\Controllers\FundController::class, 'addFunds', $req1);
runChecks('Transaction 1 (Add Funds)');

// Entities Setup
$supplier = \App\Models\Party::create(['name' => 'Test Supplier', 'type' => 'supplier', 'phone' => '1111111111']);
$customer = \App\Models\Party::create(['name' => 'Test Customer', 'type' => 'customer', 'phone' => '2222222222']);
$category = \App\Models\Category::create(['name' => 'Test Cat']);
$product = \App\Models\Product::create(['name' => 'Test Product', 'sku' => 'TEST-01', 'price' => 1000, 'cost_price' => 500, 'category_id' => $category->id]);
$warehouse = \App\Models\Warehouse::create(['name' => 'Main', 'location' => 'HQ']);

// ---------------------------------------------------------
// Transaction 2 — Purchase
// ---------------------------------------------------------
$req2 = Request::create('/purchases', 'POST', [
    'party_id' => $supplier->id,
    'date' => now()->toDateString(),
    'payment_method' => 'cash',
    'amount_paid' => 5000,
    'status' => 'received', // CRITICAL FIX
    'items' => [['product_id' => $product->id, 'quantity' => 10, 'price' => 500]]
]);
call(\App\Http\Controllers\PurchaseController::class, 'store', $req2);
runChecks('Transaction 2 (Purchase)');

// ---------------------------------------------------------
// Transaction 3 — Sale
// ---------------------------------------------------------
$req3 = Request::create('/sales', 'POST', [
    'customer_id' => $customer->id,
    'payment_method' => 'cash',
    'amount_paid' => 2000,
    'items' => [['product_id' => $product->id, 'quantity' => 2, 'price' => 1000]]
]);
call(\App\Http\Controllers\SaleController::class, 'store', $req3);
runChecks('Transaction 3 (Sale)');

// ---------------------------------------------------------
// Transaction 4 — Return
// ---------------------------------------------------------
$reqR = Request::create("/returns", 'POST', [
    'customer_id' => $customer->id,
    'payment_method' => 'cash',
    'amount_refunded' => 1000,
    'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 1000]]
]);
call(\App\Http\Controllers\ReturnController::class, 'store', $reqR);
runChecks('Transaction 4 (Return)');

echo "\n=== FINAL LEDGER SNAPSHOT ===\n";
$final = DB::select("SELECT a.code, a.name, SUM(ji.debit) as total_debit, SUM(ji.credit) as total_credit, SUM(ji.debit) - SUM(ji.credit) as balance FROM journal_items ji JOIN journal_entries je ON ji.journal_entry_id = je.id JOIN accounts a ON ji.account_id = a.id WHERE je.is_reversed = 0 GROUP BY a.code, a.name ORDER BY a.code");
foreach ($final as $f) {
    echo "{$f->code} | {$f->name} || Dr: {$f->total_debit} | Cr: {$f->total_credit} | Bal: {$f->balance}\n";
}
echo "END_TEST\n";
