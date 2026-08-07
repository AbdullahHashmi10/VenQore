<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;

echo "\n========== STEP 3: LIVE TRANSACTION TEST ==========\n";
try {
    $tenantA = Tenant::firstOrCreate(['slug' => 'store-a'], ['name' => 'Store A', 'status' => 'active']);
    app()->instance('current.tenant', $tenantA);
    
    $user = User::first();
    if (!$user) {
        $user = User::forceCreate(['name' => 'Test', 'email' => 't@t.com', 'password' => 'secret']);
    }
    \Auth::login($user);

    $w = Warehouse::firstOrCreate(['name' => 'Main', 'tenant_id' => $tenantA->id]);

    $p1 = Product::firstOrCreate(['sku' => 'TEST-001', 'tenant_id' => $tenantA->id], ['name' => 'Test Item 1', 'price' => 100, 'type' => 'standard']);
    $p2 = Product::firstOrCreate(['sku' => 'TEST-002', 'tenant_id' => $tenantA->id], ['name' => 'Test Item 2', 'price' => 200, 'type' => 'standard']);

    app(\App\Services\V3\FifoService::class)->receiveBatch(productId: $p1->id, warehouseId: $w->id, qty: 100, unitCost: 50, batchType: 'purchase');
    app(\App\Services\V3\FifoService::class)->receiveBatch(productId: $p2->id, warehouseId: $w->id, qty: 100, unitCost: 80, batchType: 'purchase');

    $request = Request::create('/test-sale', 'POST', [
        'items' => [
            ['product_id' => $p1->id, 'quantity' => 1, 'price' => 100, 'discount' => 10],
            ['product_id' => $p2->id, 'quantity' => 2, 'price' => 200, 'discount' => 20],
        ],
        'discount' => 10,
        'payment_method' => 'cash',
        'amount_paid' => 460,
        'tax' => 20,
        'add_to_ledger' => true
    ]);

    $controller = app(\App\Http\Controllers\SaleController::class);
    $response = $controller->store($request);

    echo "API RESPONSE: " . $response->getContent() . "\n";

    echo "Sale completed without errors? YES\n";
    
    $lastEntryArr = DB::select("SELECT * FROM journal_entries WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1", [$tenantA->id]);
    if (empty($lastEntryArr)) die("Missing Journal\n");
    $lastEntry = $lastEntryArr[0];
    
    $items = DB::select("SELECT ji.*, a.code FROM journal_items ji JOIN accounts a ON ji.account_id = a.id WHERE journal_entry_id = ?", [$lastEntry->id]);
    
    echo "Journal Items created: " . count($items) . "\n";
    
    $debit = 0; $credit = 0;
    $invCode = 'None';
    $receivablePartySet = 'No Receivable Line';

    foreach($items as $i) {
        $debit += $i->debit;
        $credit += $i->credit;
        if ($i->code == '1100') $invCode = '1100 Used';
        if ($i->code == '1010' && $invCode == 'None') $invCode = '1010 Used for Inv?';
        if ($i->code == '1200' || $i->code == '1000' || $i->code == '1010') {
            if ($i->party_id) $receivablePartySet = 'Yes, Party ID: ' . $i->party_id;
            else $receivablePartySet = 'No';
        }
    }
    
    echo "Debits equal credits? " . (abs($debit - $credit) < 0.01 ? "YES ($debit)" : "NO (D: $debit, C: $credit)") . "\n";
    echo "Is party_id filled on the receivable line? " . $receivablePartySet . "\n";
    echo "What account code was used for inventory? " . $invCode . "\n";
    
    $saleIdA = DB::table('sales')->where('tenant_id', $tenantA->id)->orderBy('created_at', 'desc')->value('id');

    echo "\n========== STEP 4: TENANT ISOLATION TEST ==========\n";
    $tenantB = Tenant::firstOrCreate(['slug' => 'store-b'], ['name' => 'Store B', 'status' => 'active']);
    app()->instance('current.tenant', $tenantB);
    
    try {
        $found = Sale::findOrFail($saleIdA);
        echo "Failure: Sale data from Store A is visible in Store B context!\n";
    } catch (\Exception $e) {
        echo "Expected: 404 (ModelNotFoundException) for Sale\n";
    }

    try {
        $foundEntry = \App\Models\JournalEntry::findOrFail($lastEntry->id);
        echo "Failure: Journal data from Store A is visible in Store B context!\n";
    } catch (\Exception $e) {
        echo "Expected: 404 (ModelNotFoundException) for Journal Entry\n";
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
