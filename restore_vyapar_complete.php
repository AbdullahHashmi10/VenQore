<?php
/**
 * COMPLETE VYAPAR DATA RESTORATION SCRIPT
 * Imports: Sales, Purchases, Expenses, Payments In/Out, Opening Balances
 */

use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\Warehouse;
use App\Models\User;
use App\Models\Activity;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";

if (!file_exists($vypPath)) {
    die("VYP file not found.\n");
}

try {
    $pdo = new \PDO("sqlite:" . $vypPath);
    $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

    echo "=== COMPLETE VYAPAR DATA RESTORATION ===\n\n";

    echo "Step 1: Cleaning up previous data...\n";
    DB::statement('SET FOREIGN_KEY_CHECKS=0;');
    Sale::truncate();
    SaleItem::truncate();
    Payment::truncate();
    Activity::truncate();
    Expense::truncate();
    PurchaseOrder::truncate();
    PurchaseOrderItem::truncate();
    Transaction::truncate();
    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    DB::beginTransaction();

    $warehouse = Warehouse::first() ?: Warehouse::create(['name' => 'Default Warehouse']);
    $user = User::first();

    // MAPS
    $partyMap = [];
    $itemMap = [];

    // ============================================
    // STEP 2: PARTIES
    // ============================================
    echo "Step 2: Importing Parties...\n";
    $stmt = $pdo->query("SELECT * FROM kb_names");
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $phone = $row['phone_number'] ?: null;
        $name = $row['full_name'] ?: 'Unknown';
        
        $party = null;
        if ($phone) {
            $party = Party::where('phone', $phone)->first();
        } else {
            $party = Party::where('name', $name)->first();
        }

        if (!$party) {
            $party = Party::create([
                'name' => $name,
                'phone' => $phone,
                'type' => (($row['name_type'] ?? 1) == 1) ? 'customer' : 'supplier',
                'current_balance' => (float)($row['amount'] ?? 0)
            ]);
        } else {
            // Update balance from Vyapar
            $party->update(['current_balance' => (float)($row['amount'] ?? 0)]);
        }
        $partyMap[$row['name_id']] = $party->id;
    }
    echo "  -> " . count($partyMap) . " parties processed.\n";

    // ============================================
    // STEP 3: ITEMS
    // ============================================
    echo "Step 3: Importing Products...\n";
    $stmt = $pdo->query("SELECT * FROM kb_items");
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $product = Product::updateOrCreate(
            ['name' => $row['item_name']],
            [
                'price' => (float)($row['item_sale_unit_price'] ?? 0),
                'cost_price' => (float)($row['item_purchase_unit_price'] ?? 0),
                'sku' => $row['item_code'] ?: Str::random(8),
                'base_unit' => 'pcs',
                'stock_quantity' => (float)($row['item_stock_quantity'] ?? 0)
            ]
        );
        $itemMap[$row['item_id']] = $product->id;

        // Update stock
        if (($row['item_stock_quantity'] ?? 0) > 0) {
            $product->stocks()->updateOrCreate(
                ['warehouse_id' => $warehouse->id],
                ['quantity' => $row['item_stock_quantity']]
            );
        }
    }
    echo "  -> " . count($itemMap) . " products processed.\n";

    // Walk-in Party
    $walkInPartyId = Party::firstOrCreate(
        ['phone' => '0000000000'],
        ['name' => 'Walk-in Customer', 'type' => 'customer']
    )->id;

    // ============================================
    // STEP 4: SALES (txn_type = 1)
    // ============================================
    echo "Step 4: Importing Sales...\n";
    $stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 1");
    $salesCount = 0;
    $totalRevenue = 0;
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $txnPartyId = $partyMap[$row['txn_name_id'] ?? null] ?? $walkInPartyId;
        
        $cashAmt = (float)($row['txn_cash_amount'] ?? 0);
        $balAmt = (float)($row['txn_balance_amount'] ?? 0);
        $totalAmt = $cashAmt + $balAmt;
        $date = $row['txn_date'] ?: now();
        $ref = $row['txn_ref_number_char'] ?: ("VY-" . $row['txn_id']);

        $sale = Sale::create([
            'party_id' => $txnPartyId,
            'customer_id' => null,
            'reference_number' => $ref,
            'created_at' => $date,
            'updated_at' => $date,
            'subtotal' => $totalAmt,
            'total' => $totalAmt,
            'status' => 'completed',
            'payment_status' => ($balAmt <= 0) ? 'paid' : (($cashAmt > 0) ? 'partial' : 'unpaid'),
            'payment_method' => 'cash',
            'warehouse_id' => $warehouse->id,
            'user_id' => $user->id,
            'notes' => $row['txn_description'] ?? null
        ]);

        if ($cashAmt > 0) {
            Payment::create([
                'sale_id' => $sale->id,
                'amount' => $cashAmt,
                'method' => 'cash',
                'created_at' => $date
            ]);
        }

        Activity::create([
            'type' => 'sale',
            'description' => "Sale #{$ref}",
            'amount' => $totalAmt,
            'reference_id' => $sale->id,
            'reference_type' => 'Sale',
            'user_id' => $user->id,
            'created_at' => $date
        ]);

        // Line Items
        $txnId = $row['txn_id'];
        $itemStmt = $pdo->prepare("SELECT * FROM kb_lineitems WHERE lineitem_txn_id = ?");
        $itemStmt->execute([$txnId]);
        while ($li = $itemStmt->fetch(\PDO::FETCH_ASSOC)) {
            $newProdId = $itemMap[$li['item_id']] ?? null;
            if ($newProdId) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $newProdId,
                    'quantity' => max(1, (int)($li['quantity'] ?? 1)),
                    'unit_price' => (float)($li['priceperunit'] ?? 0),
                    'cost_price' => Product::find($newProdId)->cost_price ?? 0,
                    'subtotal' => (float)($li['total_amount'] ?? 0),
                    'created_at' => $date
                ]);
            }
        }
        $salesCount++;
        $totalRevenue += $totalAmt;
        if ($salesCount % 2000 == 0) echo "  -> Processed $salesCount sales...\n";
    }
    echo "  -> TOTAL: $salesCount sales, Rs " . number_format($totalRevenue, 0) . " revenue.\n";

    // ============================================
    // STEP 5: PURCHASES (txn_type = 2)
    // ============================================
    echo "Step 5: Importing Purchases...\n";
    $stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 2");
    $purchaseCount = 0;
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $supplierId = $partyMap[$row['txn_name_id'] ?? null] ?? null;
        
        $cashAmt = (float)($row['txn_cash_amount'] ?? 0);
        $balAmt = (float)($row['txn_balance_amount'] ?? 0);
        $totalAmt = $cashAmt + $balAmt;
        $date = $row['txn_date'] ?: now();

        $po = PurchaseOrder::create([
            'supplier_id' => $supplierId,
            'warehouse_id' => $warehouse->id,
            'reference_number' => 'VY-PO-' . $row['txn_id'],
            'status' => 'received',
            'order_date' => $date,
            'total_amount' => $totalAmt,
            'notes' => $row['txn_description'] ?? null,
            'user_id' => $user->id,
            'created_at' => $date
        ]);

        Activity::create([
            'type' => 'purchase',
            'description' => "Purchase from " . (Party::find($supplierId)->name ?? 'Supplier'),
            'amount' => $totalAmt,
            'reference_id' => $po->id,
            'reference_type' => 'PurchaseOrder',
            'user_id' => $user->id,
            'created_at' => $date
        ]);

        $purchaseCount++;
    }
    echo "  -> TOTAL: $purchaseCount purchases.\n";

    // ============================================
    // STEP 6: EXPENSES (txn_type = 7)
    // ============================================
    echo "Step 6: Importing Expenses...\n";
    $stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 7");
    $expenseCount = 0;
    $generalCat = ExpenseCategory::firstOrCreate(['name' => 'General']);
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $amount = (float)($row['txn_cash_amount'] ?? 0);
        $date = $row['txn_date'] ?: now();

        Expense::create([
            'category' => 'General',
            'expense_category_id' => $generalCat->id,
            'payee' => $row['txn_display_name'] ?? 'Expense',
            'amount' => $amount,
            'payment_method' => 'cash',
            'date' => $date,
            'description' => $row['txn_description'] ?? null,
            'created_at' => $date
        ]);

        Activity::create([
            'type' => 'expense',
            'description' => "Expense: " . ($row['txn_description'] ?: 'General'),
            'amount' => $amount,
            'user_id' => $user->id,
            'created_at' => $date
        ]);

        $expenseCount++;
    }
    echo "  -> TOTAL: $expenseCount expenses.\n";

    // ============================================
    // STEP 7: PAYMENT IN (txn_type = 4)
    // ============================================
    echo "Step 7: Importing Payments Received...\n";
    $stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 4");
    $paymentInCount = 0;
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $partyId = $partyMap[$row['txn_name_id'] ?? null] ?? null;
        $amount = (float)($row['txn_cash_amount'] ?? 0);
        $date = $row['txn_date'] ?: now();

        if ($partyId) {
            Transaction::create([
                'party_id' => $partyId,
                'amount' => $amount,
                'type' => 'payment_in',
                'created_at' => $date
            ]);
        }

        Activity::create([
            'type' => 'payment_in',
            'description' => "Payment received: Rs " . number_format($amount, 0),
            'amount' => $amount,
            'user_id' => $user->id,
            'created_at' => $date
        ]);

        $paymentInCount++;
    }
    echo "  -> TOTAL: $paymentInCount payments received.\n";

    // ============================================
    // STEP 8: PAYMENT OUT (txn_type = 3)
    // ============================================
    echo "Step 8: Importing Payments Made...\n";
    $stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 3");
    $paymentOutCount = 0;
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $partyId = $partyMap[$row['txn_name_id'] ?? null] ?? null;
        $amount = (float)($row['txn_cash_amount'] ?? 0);
        $date = $row['txn_date'] ?: now();

        if ($partyId) {
            Transaction::create([
                'party_id' => $partyId,
                'amount' => $amount,
                'type' => 'payment_out',
                'created_at' => $date
            ]);
        }

        Activity::create([
            'type' => 'payment_out',
            'description' => "Payment made: Rs " . number_format($amount, 0),
            'amount' => $amount,
            'user_id' => $user->id,
            'created_at' => $date
        ]);

        $paymentOutCount++;
    }
    echo "  -> TOTAL: $paymentOutCount payments made.\n";

    // ============================================
    // STEP 9: UPDATE ACCOUNT BALANCES
    // ============================================
    echo "Step 9: Updating Account Balances...\n";
    
    // Calculate totals
    $totalReceivables = Party::where('type', 'customer')->where('current_balance', '>', 0)->sum('current_balance');
    $totalPayables = Party::where('type', 'supplier')->where('current_balance', '>', 0)->sum('current_balance');
    
    // Update Accounts Receivable
    $arAccount = Account::where('code', '1200')->first();
    if ($arAccount) {
        $arAccount->update(['balance' => $totalReceivables]);
        echo "  -> Accounts Receivable: Rs " . number_format($totalReceivables, 0) . "\n";
    }

    // Update Accounts Payable
    $apAccount = Account::where('code', '2000')->first();
    if ($apAccount) {
        $apAccount->update(['balance' => $totalPayables]);
        echo "  -> Accounts Payable: Rs " . number_format($totalPayables, 0) . "\n";
    }

    // Update Cash Account based on Sales - Purchases - Expenses + Payments In - Payments Out
    $cashAccount = Account::where('code', '1000')->first();
    if ($cashAccount) {
        $totalCashIn = Sale::sum('total') + Transaction::where('type', 'payment_in')->sum('amount');
        $totalCashOut = PurchaseOrder::sum('total_amount') + Expense::sum('amount') + Transaction::where('type', 'payment_out')->sum('amount');
        $cashBalance = $totalCashIn - $totalCashOut;
        $cashAccount->update(['balance' => max(0, $cashBalance)]);
        echo "  -> Cash Balance: Rs " . number_format($cashBalance, 0) . "\n";
    }

    DB::commit();
    
    echo "\n=== RESTORATION COMPLETE ===\n";
    echo "Sales: $salesCount\n";
    echo "Purchases: $purchaseCount\n";
    echo "Expenses: $expenseCount\n";
    echo "Payments In: $paymentInCount\n";
    echo "Payments Out: $paymentOutCount\n";

} catch (\Exception $e) {
    if (DB::transactionLevel() > 0) DB::rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
