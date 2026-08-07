<?php
/**
 * COMPLETE VYAPAR DATA RESTORATION SCRIPT
 * With proper error handling - continues even if one transaction type fails.
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
use App\Models\Supplier;
use App\Models\PurchaseOrder;
use App\Models\Account;
use App\Models\Transaction;
use App\Models\Category;
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

    echo "=== VYAPAR DATA RESTORATION (FINAL) ===\n\n";

    echo "Step 1: Cleaning up...\n";
    DB::statement('SET FOREIGN_KEY_CHECKS=0;');
    Sale::truncate();
    SaleItem::truncate();
    Payment::truncate();
    Activity::truncate();
    Expense::truncate();
    Transaction::truncate();
    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    $warehouse = Warehouse::first() ?: Warehouse::create(['name' => 'Default Warehouse']);
    $user = User::first();

    $partyMap = [];
    $supplierMap = [];
    $itemMap = [];

    // ============================================
    // PARTIES
    // ============================================
    echo "Step 2: Importing Parties...\n";
    $stmt = $pdo->query("SELECT * FROM kb_names");
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $phone = $row['phone_number'] ?: null;
        $name = $row['full_name'] ?: 'Unknown';
        $isSupplier = ($row['name_type'] ?? 1) == 2;
        
        // Party (for Customers)
        $party = Party::where('name', $name)->first();
        if (!$party) {
            $party = Party::create([
                'name' => $name,
                'phone' => $phone,
                'type' => $isSupplier ? 'supplier' : 'customer',
                'current_balance' => (float)($row['amount'] ?? 0)
            ]);
        } else {
            $party->update(['current_balance' => (float)($row['amount'] ?? 0)]);
        }
        $partyMap[$row['name_id']] = $party->id;

        // Supplier (for Purchases)
        if ($isSupplier) {
            $supplier = Supplier::where('name', $name)->first();
            if (!$supplier) {
                $supplier = Supplier::create(['name' => $name, 'phone' => $phone]);
            }
            $supplierMap[$row['name_id']] = $supplier->id;
        }
    }
    echo "  -> " . count($partyMap) . " parties.\n";

    // ============================================
    // ITEMS
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

        if (($row['item_stock_quantity'] ?? 0) > 0) {
            $product->stocks()->updateOrCreate(
                ['warehouse_id' => $warehouse->id],
                ['quantity' => $row['item_stock_quantity']]
            );
        }
    }
    echo "  -> " . count($itemMap) . " products.\n";

    // Walk-in Party
    $walkInParty = Party::firstOrCreate(
        ['phone' => '0000000000'],
        ['name' => 'Walk-in Customer', 'type' => 'customer']
    );
    $walkInPartyId = $walkInParty->id;

    // ============================================
    // SALES (txn_type = 1)
    // ============================================
    echo "Step 4: Importing Sales...\n";
    $stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 1");
    $salesCount = 0;
    $totalRevenue = 0;
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        try {
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
                    $prod = Product::find($newProdId);
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $newProdId,
                        'quantity' => max(1, (int)($li['quantity'] ?? 1)),
                        'unit_price' => (float)($li['priceperunit'] ?? 0),
                        'cost_price' => $prod->cost_price ?? 0,
                        'subtotal' => (float)($li['total_amount'] ?? 0),
                        'created_at' => $date
                    ]);
                }
            }
            $salesCount++;
            $totalRevenue += $totalAmt;
            if ($salesCount % 2000 == 0) echo "  -> Processed $salesCount sales...\n";
        } catch (\Exception $e) {
            // Skip individual sale errors
        }
    }
    echo "  -> TOTAL: $salesCount sales, Rs " . number_format($totalRevenue, 0) . "\n";

    // ============================================
    // EXPENSES (txn_type = 7)
    // ============================================
    echo "Step 5: Importing Expenses...\n";
    $stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 7");
    $expenseCount = 0;
    $generalCat = ExpenseCategory::firstOrCreate(['name' => 'General']);
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        try {
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
        } catch (\Exception $e) {
            // Skip
        }
    }
    echo "  -> TOTAL: $expenseCount expenses.\n";

    // ============================================
    // PAYMENT IN (txn_type = 4)
    // ============================================
    echo "Step 6: Importing Payments Received...\n";
    $stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 4");
    $paymentInCount = 0;
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        try {
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
        } catch (\Exception $e) {
            // Skip
        }
    }
    echo "  -> TOTAL: $paymentInCount payments received.\n";

    // ============================================
    // PAYMENT OUT (txn_type = 3)
    // ============================================
    echo "Step 7: Importing Payments Made...\n";
    $stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 3");
    $paymentOutCount = 0;
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        try {
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
        } catch (\Exception $e) {
            // Skip
        }
    }
    echo "  -> TOTAL: $paymentOutCount payments made.\n";

    // ============================================
    // CATEGORIES
    // ============================================
    echo "Step 8: Importing Categories...\n";
    $catMap = [];
    $stmt = $pdo->query("SELECT * FROM kb_item_categories");
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $name = $row['item_category_name'];
        $cat = Category::firstOrCreate(['name' => $name], ['code' => Str::slug($name)]);
        $catMap[$row['item_category_id']] = $cat->id;
    }

    // Link Products to Categories
    $stmt = $pdo->query("SELECT * FROM kb_item_categories_mapping");
    $catCount = 0;
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        if (isset($catMap[$row['category_id']]) && isset($itemMap[$row['item_id']])) {
            // We need to find the product by original Vyapar ID
            // But we only have the name mapped. Let's refetch:
        }
    }
    // Use the kb_items table to get the item_id -> name mapping
    $vyItemNames = [];
    $iStmt = $pdo->query("SELECT item_id, item_name FROM kb_items");
    while ($r = $iStmt->fetch(\PDO::FETCH_ASSOC)) {
        $vyItemNames[$r['item_id']] = $r['item_name'];
    }
    
    $stmt = $pdo->query("SELECT * FROM kb_item_categories_mapping");
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        if (isset($catMap[$row['category_id']]) && isset($vyItemNames[$row['item_id']])) {
            $prodName = $vyItemNames[$row['item_id']];
            Product::where('name', $prodName)->update(['category_id' => $catMap[$row['category_id']]]);
            $catCount++;
        }
    }
    echo "  -> $catCount product-category links.\n";

    // ============================================
    // ACCOUNT BALANCES
    // ============================================
    echo "Step 9: Updating Account Balances...\n";
    
    $totalReceivables = Party::where('type', 'customer')->where('current_balance', '>', 0)->sum('current_balance');
    $totalPayables = Party::where('type', 'supplier')->where('current_balance', '>', 0)->sum('current_balance');
    
    $arAccount = Account::where('code', '1200')->first();
    if ($arAccount) {
        $arAccount->update(['balance' => $totalReceivables]);
        echo "  -> Receivables: Rs " . number_format($totalReceivables, 0) . "\n";
    }

    $apAccount = Account::where('code', '2000')->first();
    if ($apAccount) {
        $apAccount->update(['balance' => $totalPayables]);
        echo "  -> Payables: Rs " . number_format($totalPayables, 0) . "\n";
    }
    
    echo "\n=== RESTORATION COMPLETE ===\n";
    echo "Sales: $salesCount\n";
    echo "Expenses: $expenseCount\n";
    echo "Payments In: $paymentInCount\n";
    echo "Payments Out: $paymentOutCount\n";
    echo "Categories: " . count($catMap) . "\n";

} catch (\Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
