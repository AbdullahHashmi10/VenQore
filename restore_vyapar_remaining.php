<?php
/**
 * COMPLETE REMAINING DATA RESTORATION (Purchases, Expenses, Payments)
 * Sales are already imported - this script continues from where the previous one failed.
 */

use App\Models\Party;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\User;
use App\Models\Activity;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\PurchaseOrder;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";

try {
    $pdo = new \PDO("sqlite:" . $vypPath);
    $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

    echo "=== CONTINUING VYAPAR RESTORATION ===\n\n";

    $warehouse = Warehouse::first();
    $user = User::first();

    // Build Party Map from existing parties
    $partyMap = [];
    $stmt = $pdo->query("SELECT * FROM kb_names");
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $name = $row['full_name'] ?: 'Unknown';
        $party = Party::where('name', $name)->first();
        if ($party) {
            $partyMap[$row['name_id']] = $party->id;
        }
    }

    // Build Supplier Map
    echo "Step 1: Mapping Suppliers...\n";
    $supplierMap = [];
    $stmt = $pdo->query("SELECT * FROM kb_names WHERE name_type = 2");
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $name = $row['full_name'] ?: 'Unknown';
        $phone = $row['phone_number'] ?: null;
        
        // Find or create Supplier (separate from Party)
        $supplier = Supplier::where('name', $name)->first();
        if (!$supplier) {
            $supplier = Supplier::create([
                'name' => $name,
                'phone' => $phone,
                'email' => null,
                'address' => null
            ]);
        }
        $supplierMap[$row['name_id']] = $supplier->id;
    }
    echo "  -> " . count($supplierMap) . " suppliers mapped.\n";

    DB::beginTransaction();

    // ============================================
    // PURCHASES (txn_type = 2)
    // ============================================
    echo "Step 2: Importing Purchases...\n";
    $stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 2");
    $purchaseCount = 0;
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $supplierId = $supplierMap[$row['txn_name_id'] ?? null] ?? null;
        
        // Skip if no valid supplier
        if (!$supplierId) continue;
        
        $cashAmt = (float)($row['txn_cash_amount'] ?? 0);
        $balAmt = (float)($row['txn_balance_amount'] ?? 0);
        $totalAmt = $cashAmt + $balAmt;
        $date = $row['txn_date'] ?: now();

        try {
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
                'description' => "Purchase from " . (Supplier::find($supplierId)->name ?? 'Supplier'),
                'amount' => $totalAmt,
                'reference_id' => $po->id,
                'reference_type' => 'PurchaseOrder',
                'user_id' => $user->id,
                'created_at' => $date
            ]);

            $purchaseCount++;
        } catch (\Exception $e) {
            // Skip problematic records
        }
    }
    echo "  -> TOTAL: $purchaseCount purchases imported.\n";

    // ============================================
    // EXPENSES (txn_type = 7)
    // ============================================
    echo "Step 3: Importing Expenses...\n";
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
    echo "  -> TOTAL: $expenseCount expenses imported.\n";

    // ============================================
    // PAYMENT IN (txn_type = 4)
    // ============================================
    echo "Step 4: Importing Payments Received...\n";
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
    // PAYMENT OUT (txn_type = 3)
    // ============================================
    echo "Step 5: Importing Payments Made...\n";
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
    // UPDATE ACCOUNT BALANCES
    // ============================================
    echo "Step 6: Updating Account Balances...\n";
    
    $totalReceivables = Party::where('type', 'customer')->where('current_balance', '>', 0)->sum('current_balance');
    $totalPayables = Party::where('type', 'supplier')->where('current_balance', '>', 0)->sum('current_balance');
    
    $arAccount = Account::where('code', '1200')->first();
    if ($arAccount) {
        $arAccount->update(['balance' => $totalReceivables]);
        echo "  -> Accounts Receivable: Rs " . number_format($totalReceivables, 0) . "\n";
    }

    $apAccount = Account::where('code', '2000')->first();
    if ($apAccount) {
        $apAccount->update(['balance' => $totalPayables]);
        echo "  -> Accounts Payable: Rs " . number_format($totalPayables, 0) . "\n";
    }

    DB::commit();
    
    echo "\n=== RESTORATION COMPLETE ===\n";

} catch (\Exception $e) {
    if (DB::transactionLevel() > 0) DB::rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
}
