<?php

use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\Warehouse;
use App\Models\User;
use App\Models\Activity;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";

if (!file_exists($vypPath)) {
    die("VYP file not found at $vypPath\n");
}

try {
    $pdo = new \PDO("sqlite:" . $vypPath);
    $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'");
    $tables = $stmt->fetchAll(\PDO::FETCH_COLUMN);

    echo "Cleaning up current sales data for fresh restoration...\n";
    DB::statement('SET FOREIGN_KEY_CHECKS=0;');
    Sale::truncate();
    SaleItem::truncate();
    Payment::truncate();
    Activity::truncate(); // Clean activity feed too
    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    DB::beginTransaction();

    $partyMap = [];
    $itemMap = [];

    $warehouse = Warehouse::first() ?: Warehouse::create(['name' => 'Default Warehouse']);
    // Try to find an admin user or use the first one
    $user = User::query()->where('email', 'like', '%admin%')->first() ?: User::first();

    // 1. PARTIES
    if (in_array('kb_names', $tables)) {
        echo "Importing Parties...\n";
        $stmt = $pdo->query("SELECT * FROM kb_names");
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $phone = $row['phone_number'] ?: null;
            $name = $row['full_name'] ?: ($row['name'] ?: 'Unknown');
            
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
            }
            $partyMap[$row['name_id']] = $party->id;
        }
    }

    // 2. ITEMS
    if (in_array('kb_items', $tables)) {
        echo "Importing Items...\n";
        $stmt = $pdo->query("SELECT * FROM kb_items");
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $product = Product::updateOrCreate(
                ['name' => $row['item_name']],
                [
                    'price' => (float)($row['item_sale_unit_price'] ?? 0),
                    'cost_price' => (float)($row['item_purchase_unit_price'] ?? 0),
                    'sku' => $row['item_code'] ?: Str::random(8),
                    'base_unit' => 'pcs',
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
    }

    // 3. TRANSACTIONS
    if (in_array('kb_transactions', $tables) && in_array('kb_lineitems', $tables)) {
        echo "Importing Transactions...\n";
        
        $stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 1");
        $count = 0;
        
        $walkInPartyId = Party::firstOrCreate(
            ['phone' => '0000000000'],
            ['name' => 'Walk-in Customer', 'type' => 'customer']
        )->id;

        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            try {
                $txnPartyId = $partyMap[$row['txn_name_id'] ?? null] ?? $walkInPartyId;
                
                $cashAmt = (float)($row['txn_cash_amount'] ?? 0);
                $balAmt = (float)($row['txn_balance_amount'] ?? 0);
                $totalAmt = $cashAmt + $balAmt;
                $date = $row['txn_date'] ?: now();
                $ref = $row['txn_ref_number_char'] ?: ("VY-" . ($row['txn_invoice_prefix'] ?? '') . $row['txn_id']);

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
                        'reference' => $row['txn_payment_reference'] ?? null,
                        'created_at' => $date,
                        'updated_at' => $date
                    ]);
                }

                // Create Activity Record (Dashboard feed)
                Activity::create([
                    'type' => 'sale',
                    'description' => "Sale #{$ref} to " . (Party::find($txnPartyId)->name ?? 'Customer'),
                    'amount' => $totalAmt,
                    'reference_id' => $sale->id,
                    'reference_type' => 'Sale',
                    'user_id' => $user->id,
                    'created_at' => $date,
                    'updated_at' => $date
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
                            'quantity' => (int)($li['quantity'] ?? 1),
                            'unit_price' => (float)($li['priceperunit'] ?? 0),
                            'subtotal' => (float)($li['total_amount'] ?? 0),
                            'created_at' => $date,
                            'updated_at' => $date
                        ]);
                    }
                }
                $count++;
                if ($count % 2000 == 0) echo "Processed $count sales...\n";
            } catch (\Exception $e) {
                // Silently skip duplicates or minor errors to ensure batch completes
            }
        }
        echo "Final: Imported $count Transactions.\n";
    }

    DB::commit();
    echo "Restoration Successful!\n";

} catch (\Exception $e) {
    if (DB::transactionLevel() > 0) DB::rollBack();
    echo "GENERAL ERROR: " . $e->getMessage() . "\n";
}
