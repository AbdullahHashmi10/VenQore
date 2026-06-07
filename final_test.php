<?php

ob_start();
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

echo "========== TEST 1: FULL POS SALE ==========\n";
try {
    $tenantA = Tenant::firstOrCreate(['slug' => 'test-store-final'], ['name' => 'Final Test Store', 'status' => 'active']);
    app()->instance('current.tenant', $tenantA);

    $user = User::first();
    if (!$user) {
        $user = User::forceCreate(['name' => 'Test', 'email' => 't@t.com', 'password' => 'secret']);
    }
    \Illuminate\Support\Facades\Auth::login($user);

    $w = Warehouse::firstOrCreate(['name' => 'Main', 'tenant_id' => $tenantA->id]);

    $p1 = Product::firstOrCreate(['sku' => 'TEST-F1', 'tenant_id' => $tenantA->id], ['name' => 'T1', 'price' => 100, 'type' => 'standard']);
    $p2 = Product::firstOrCreate(['sku' => 'TEST-F2', 'tenant_id' => $tenantA->id], ['name' => 'T2', 'price' => 200, 'type' => 'standard']);

    app(\App\Services\V3\FifoService::class)->receiveBatch(productId: $p1->id, warehouseId: $w->id, qty: 100, unitCost: 50, batchType: 'purchase');
    app(\App\Services\V3\FifoService::class)->receiveBatch(productId: $p2->id, warehouseId: $w->id, qty: 100, unitCost: 80, batchType: 'purchase');

    $request = Request::create('http://localhost/s/test-store-final/sales', 'POST', [
        'items' => [
            ['product_id' => $p1->id, 'quantity' => 2, 'price' => 100, 'discount' => 10], // Total = 190
            ['product_id' => $p2->id, 'quantity' => 1, 'price' => 200, 'discount' => 20], // Total = 180
        ],
        'discount' => 20, // Global discount
        'payment_method' => 'cash',
        'amount_paid' => 350,
        'tax' => 0,
        'add_to_ledger' => true // Required to post it to ledger officially
    ]);

    $controller = app(\App\Http\Controllers\SaleController::class);
    $response = $controller->store($request);
    echo "API RESPONSE: " . $response->getContent() . "\n";
    
    $saleId = json_decode($response->getContent())->sale_id ?? null;

    $jeRows = DB::select("SELECT * FROM journal_entries WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1", [$tenantA->id]);
    if (empty($jeRows)) {
        echo "NO JOURNAL ENTRY FOUND IN DB FOR TENANT: " . $tenantA->id . "\n";
    } else {
        $je = $jeRows[0];
        $query = "
            SELECT ji.debit, ji.credit, ji.party_id, a.code, a.name 
            FROM journal_items ji
            JOIN accounts a ON a.id = ji.account_id
            WHERE ji.journal_entry_id = ?
            ORDER BY a.code ASC
        ";
        $items = DB::select($query, [$je->id]);
        
        echo "\nJournal Items for Sale:\n";
        echo "Debit | Credit | Party ID | Code | Name\n";
        echo str_repeat("-", 80) . "\n";
        $td = 0; $tc = 0;
        foreach ($items as $i) {
            echo "{$i->debit} | {$i->credit} | " . ($i->party_id ?? 'NULL') . " | {$i->code} | {$i->name}\n";
            $td += $i->debit;
            $tc += $i->credit;
        }
        echo "Total Debit: $td | Total Credit: $tc\n";
        echo "Balanced? " . (abs($td - $tc) < 0.01 ? "YES" : "NO") . "\n";
    }

    echo "\n========== TEST 2: SALE RETURN ==========\n";
    $returnRequest = Request::create("http://localhost/s/test-store-final/sales/$saleId/return", 'POST', [
        'customer_id' => \App\Models\Party::where('tenant_id', $tenantA->id)->where('type', 'customer')->value('id') ?? (\App\Models\Party::forceCreate(['tenant_id' => $tenantA->id, 'name' => 'Walk-in', 'type' => 'customer', 'current_balance' => 0])->id),
        'items' => [
            ['product_id' => $p1->id, 'quantity' => 2, 'price' => 100],
            ['product_id' => $p2->id, 'quantity' => 1, 'price' => 200]
        ],
        'payment_method' => 'cash',
        'amount_refunded' => 350,
        'notes' => 'Customer return test'
    ]);
    
    try {
        $returnResponse = app(\App\Http\Controllers\ReturnController::class)->store($returnRequest);
        echo "RETURN API RESPONSE: " . $returnResponse->getContent() . "\n";
        
        $jeReturnRows = DB::select("SELECT * FROM journal_entries WHERE tenant_id = ? AND reference_type='sale_return' ORDER BY created_at DESC LIMIT 1", [$tenantA->id]);
        if (empty($jeReturnRows)) {
            echo "FAILED: Missing return journal entry\n";
        } else {
            $jeReturn = $jeReturnRows[0];
            $itemsReturn = DB::select($query, [$jeReturn->id]);
            echo "\nJournal Items for Return:\n";
            echo "Debit | Credit | Party ID | Code | Name\n";
            echo str_repeat("-", 80) . "\n";
            $tdR = 0; $tcR = 0;
            foreach ($itemsReturn as $i) {
                echo "{$i->debit} | {$i->credit} | " . ($i->party_id ?? 'NULL') . " | {$i->code} | {$i->name}\n";
                $tdR += $i->debit;
                $tcR += $i->credit;
            }
            echo "Total Debit: $tdR | Total Credit: $tcR\n";
            echo "Balanced? " . (abs($tdR - $tcR) < 0.01 ? "YES" : "NO") . "\n";
        }
    } catch (\Exception $e) {
        echo "RETURN CRASHED: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
    }

    echo "\n========== TEST 3: NEW TENANT EMPTY STATE ==========\n";
    $tenantEmpty = Tenant::firstOrCreate(['slug' => 'test-store-empty'], ['name' => 'Empty Store', 'status' => 'active']);
    app()->instance('current.tenant', $tenantEmpty);
    $routesToTest = [
        ['uri' => 'dashboard', 'controller' => \App\Http\Controllers\DashboardController::class, 'method' => 'index'],
        ['uri' => 'pos', 'controller' => \App\Http\Controllers\PosController::class, 'method' => 'index'],
        ['uri' => 'customers', 'controller' => \App\Http\Controllers\CustomerController::class, 'method' => 'index']
    ];
    foreach ($routesToTest as $r) {
        try {
            $req = Request::create("http://localhost/s/test-store-empty/{$r['uri']}", 'GET');
            $res = app($r['controller'])->{$r['method']}($req);
            echo "Route /{$r['uri']} -> OK\n";
        } catch (\Exception $e) {
            echo "Route /{$r['uri']} -> CRASHED: " . $e->getMessage() . "\n";
        }
    }

    echo "\n========== TEST 4: TENANT ISOLATION ==========\n";
    try {
        $req = Request::create("http://localhost/s/test-store-empty/sales/$saleId", 'GET');
        $res = app(\App\Http\Controllers\SaleController::class)->show($saleId);
        echo "Failure: Allowed to view Store A's sale from Store B context!\n";
    } catch (\Exception $e) {
        $class = get_class($e);
        echo "Route cross-tenant hit -> Exception Thrown: " . $class . "\n";
        if (str_contains($class, 'ModelNotFoundException')) {
             echo "ASSERTION PASSED: Safely rejected by global scope.\n";
        }
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}

file_put_contents(__DIR__ . '/final_output2.txt', ob_get_clean());
