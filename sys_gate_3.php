<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\V3\SaleService;
use App\Services\V3\AccountingService;
use App\Services\V3\PaymentService;

function runQueriesOut($name, $queries) {
    echo "\n=== $name ===\n";
    foreach ($queries as $i => $q) {
        echo "Query " . ($i+1) . ":\n";
        try {
            $res = DB::select($q);
            if (empty($res)) {
                echo "(Empty Result)\n";
            } else {
                echo json_encode($res, JSON_PRETTY_PRINT) . "\n";
            }
        } catch (\Exception $e) {
            echo "ERROR: " . $e->getMessage() . "\n";
        }
    }
}

DB::transaction(function() {
    DB::table('journal_items')->delete();
    DB::table('journal_entries')->delete();
    DB::table('payment_allocations')->delete();
    DB::table('sales')->delete();
    DB::table('sale_items')->delete();
    DB::table('sale_item_batches')->delete();
    DB::table('parties')->where('type', 'customer')->delete();
    DB::table('products')->delete();
    DB::table('warehouses')->delete();
    DB::table('inventory_batches')->delete();

    $customerId = Str::uuid()->toString();
    DB::table('parties')->insert(['id' => $customerId, 'name' => 'Test Customer', 'type' => 'customer']);
    $warehouseId = Str::uuid()->toString();
    DB::table('warehouses')->insert(['id' => $warehouseId, 'name' => 'Main WH']);
    $productId = Str::uuid()->toString();
    DB::table('products')->insert(['id' => $productId, 'name' => 'Test Product', 'sku' => 'TP-1', 'opening_stock' => 0]);
    $userId = DB::table('users')->value('id') ?? 1;

    // Give some inventory
    DB::table('inventory_batches')->insert([
        'id' => Str::uuid()->toString(), 'product_id' => $productId, 'warehouse_id' => $warehouseId,
        'batch_type' => 'purchase', 'unit_cost' => 50, 'initial_qty' => 100, 'remaining_qty' => 100,
        'created_at' => now(), 'updated_at' => now()
    ]);

    // B4 Payment & B25 Bounced Cheque
    $saleService = app(SaleService::class);
    $paymentService = app(PaymentService::class);
    $accountingService = app(AccountingService::class);

    $sale1 = $saleService->post([
        'customer_id' => $customerId, 'warehouse_id' => $warehouseId, 'sale_date' => now()->toDateString(),
        'payment_method' => 'credit', 'amount_received' => 0,
        'items' => [['product_id' => $productId, 'qty' => 1, 'sale_uom' => 'EA', 'unit_price' => 100, 'discount_percent' => 0, 'tax_rate' => 0, 'is_promotional' => false]]
    ]);

    // Make Payment B4
    $b4Entry = $accountingService->createEntry([
        'entry_date' => now()->toDateString(), 'reference_type' => 'customer_payment', 'reference_id' => Str::uuid()->toString(),
        'description' => 'Payment for sale 1', 'party_id' => $customerId
    ], [
        ['account_code' => '1000', 'debit' => 100, 'credit' => 0],
        ['account_code' => '1200', 'debit' => 0, 'credit' => 100, 'party_id' => $customerId]
    ]);
    $paymentService->allocate($b4Entry->id, [['sale_id' => $sale1->id, 'amount' => 100]]);

    // Bounce B25
    $accountingService->reverseEntry($b4Entry->id, 'Bounced cheque');

    runQueriesOut('B25 Bounced Cheque', [
        "SELECT s.invoice_number, s.payment_status FROM sales s WHERE s.id = '{$sale1->id}'",
        "SELECT status FROM payment_allocations WHERE payment_journal_entry_id = '{$b4Entry->id}'",
        "SELECT id, is_reversed, reversed_by FROM journal_entries WHERE id = '{$b4Entry->id}'"
    ]);

    // B26 Bad Debt
    $badDebtEntry = $accountingService->createEntry([
        'entry_date' => now()->toDateString(), 'reference_type' => 'bad_debt', 'reference_id' => $sale1->id,
        'description' => 'Bad debt', 'party_id' => $customerId, 'approved_by' => $userId
    ], [
        ['account_code' => '6700', 'debit' => 100, 'credit' => 0],
        ['account_code' => '1200', 'debit' => 0, 'credit' => 100, 'party_id' => $customerId]
    ]);
    DB::table('sales')->where('id', $sale1->id)->update(['payment_status' => 'written_off']);

    runQueriesOut('B26 Bad Debt', [
        "SELECT je.approved_by, ji.debit, a.code FROM journal_entries je JOIN journal_items ji ON je.id = ji.journal_entry_id JOIN accounts a ON ji.account_id = a.id WHERE je.reference_type = 'bad_debt' ORDER BY je.created_at DESC"
    ]);

    // B20 Advance
    $b20Entry = $accountingService->createEntry([
        'entry_date' => now()->toDateString(), 'reference_type' => 'customer_advance', 'reference_id' => Str::uuid()->toString(),
        'description' => 'Advance', 'party_id' => $customerId
    ], [
        ['account_code' => '1000', 'debit' => 200, 'credit' => 0],
        ['account_code' => '2100', 'debit' => 0, 'credit' => 200, 'party_id' => $customerId]
    ]);

    runQueriesOut('B20 Advance', [
        "SELECT a.code, SUM(ji.debit) as dr, SUM(ji.credit) as cr FROM journal_items ji JOIN accounts a ON ji.account_id = a.id JOIN journal_entries je ON ji.journal_entry_id = je.id WHERE je.reference_type = 'customer_advance' GROUP BY a.code"
    ]);

    // S-048 Advance Settlement
    $sale2 = $saleService->post([
        'customer_id' => $customerId, 'warehouse_id' => $warehouseId, 'sale_date' => now()->toDateString(),
        'payment_method' => 'credit', 'amount_received' => 0,
        'advance_amount' => 200,
        'items' => [['product_id' => $productId, 'qty' => 2, 'sale_uom' => 'EA', 'unit_price' => 100, 'discount_percent' => 0, 'tax_rate' => 0, 'is_promotional' => false]]
    ]);

    runQueriesOut('S-048 Advance Settlement', [
        "SELECT a.code, SUM(ji.debit) as dr, SUM(ji.credit) as cr FROM journal_items ji JOIN accounts a ON ji.account_id = a.id JOIN journal_entries je ON ji.journal_entry_id = je.id WHERE je.reference_type = 'advance_settlement' GROUP BY a.code",
        "SELECT 
            (SELECT SUM(ji.debit) - SUM(ji.credit) FROM journal_items ji JOIN accounts a ON ji.account_id = a.id WHERE a.code = '1200' AND ji.party_id = '{$customerId}') as ar_balance,
            (SELECT SUM(ji.credit) - SUM(ji.debit) FROM journal_items ji JOIN accounts a ON ji.account_id = a.id WHERE a.code = '2100' AND ji.party_id = '{$customerId}') as advance_balance"
    ]);

});
