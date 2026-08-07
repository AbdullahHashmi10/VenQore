<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Party;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Support\Str;

class MigrationController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Migration');
    }

    public function analyze(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:51200', // 50MB
        ]);

        $file = $request->file('file');
        // Rename with .sqlite extension for reliable opening if it's .vyp
        $filename = 'migration_' . time() . '.sqlite';
        $path = $file->storeAs('temp_migration', $filename, 'local');
        $fullPath = Storage::disk('local')->path($path);

        try {
            // Attempt to open SQLite connection
            // We use standard PDO. If file is encrypted with SQLCipher & header is misleading, this will fail.
            $pdo = new \PDO("sqlite:" . $fullPath);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

            // Get Tables
            $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            $tables = $stmt->fetchAll(\PDO::FETCH_COLUMN);

            // Basic Stats
            $stats = [];
            
            // Guessing Vyapar Table Names (Common ones)
            // Party Table often: 'Party', 'Account', 'Ledger'
            // Item Table often: 'Item', 'Product', 'Stock'
            
            $potentialParties = 0;
            $potentialItems = 0;
            $potentialSales = 0;
            $potentialPurchases = 0;

            foreach ($tables as $table) {
                $count = $pdo->query("SELECT COUNT(*) FROM \"$table\"")->fetchColumn();
                $stats[$table] = $count;

                if (Str::contains(strtolower($table), ['party', 'parties', 'ledger', 'account'])) {
                    $potentialParties += $count;
                }
                if (Str::contains(strtolower($table), ['item', 'product', 'stock'])) {
                    $potentialItems += $count;
                }
                if (Str::contains(strtolower($table), ['sale', 'invoice', 'bill'])) {
                    $potentialSales += $count;
                }
                if (Str::contains(strtolower($table), ['purchase', 'vendor_reference'])) {
                    $potentialPurchases += $count;
                }
            }

            return response()->json([
                'success' => true,
                'tables' => $stats,
                'path' => $path,
                'analysis' => [
                    'potential_parties' => $potentialParties,
                    'potential_items' => $potentialItems,
                    'potential_sales' => $potentialSales,
                    'potential_purchases' => $potentialPurchases
                ]
            ]);

        } catch (\Exception $e) {
            // Delete file if failed
            Storage::disk('local')->delete($path);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse database. It might be encrypted or corrupted. Error: ' . $e->getMessage()
            ], 422);
        }
    }

    public function execute(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
            'options' => 'array'
        ]);

        $fullPath = Storage::disk('local')->path($request->path);

        if (!file_exists($fullPath)) {
            return back()->withErrors(['error' => 'Migration file expired. Please upload again.']);
        }

        try {
            $pdo = new \PDO("sqlite:" . $fullPath);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

            $log = [];
            $importedParties = 0;
            $importedProducts = 0;
            $partyMap = [];
            $productMap = [];

            DB::beginTransaction();

            // -------------------------
            // 1. IMPORT PARTIES
            // -------------------------
            // Vyapar usually uses 'Party' table
            // Fields often: Name, ContactNumber, Balance, Email
            
            // Introspect tables to find the right one
            $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(\PDO::FETCH_COLUMN);
            $partyTable = $this->findTable($tables, ['Party', 'Parties', 'kb_party', 'kb_names']);
            
            if ($partyTable) {
                // Get columns
                $cols = $this->getColumns($pdo, $partyTable);
                // Map columns
                $idCol = $this->findCol($cols, ['id', 'party_id']); // Capture ID
                $nameCol = $this->findCol($cols, ['name', 'party_name', 'ledger_name']);
                $phoneCol = $this->findCol($cols, ['phone', 'contact', 'mobile']);
                $balanceCol = $this->findCol($cols, ['balance', 'current_balance', 'closing_balance']); 
                
                if ($nameCol) {
                    $stmt = $pdo->query("SELECT * FROM \"$partyTable\"");
                    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                        $name = $row[$nameCol] ?? 'Unknown';
                        $phone = $phoneCol ? ($row[$phoneCol] ?? null) : null;
                        $oldId = $idCol ? $row[$idCol] : ($row['party_id'] ?? null);

                        $rawBalance = $balanceCol ? ($row[$balanceCol] ?? 0) : 0;
                        $balance = floatval($rawBalance);
                        $type = 'customer';
                        
                        $party = Party::updateOrCreate(
                            ['phone' => $phone], 
                            [
                                'name' => $name,
                                'type' => $type,
                                'opening_balance' => $balance,
                                'current_balance' => $balance
                            ]
                        );

                        if ($oldId) {
                            $partyMap[$oldId] = $party->id;
                        }
                        $importedParties++;
                    }
                    $log[] = "Imported $importedParties parties from table '$partyTable'.";
                }
            }

            // 2. IMPORT ITEMS (Capture IDs for mapping)
            // -------------------------
            $itemTable = $this->findTable($tables, ['Item', 'Items', 'Product', 'kb_items']);
            
            if ($itemTable) {
                $cols = $this->getColumns($pdo, $itemTable);
                $idCol = $this->findCol($cols, ['id', 'item_id']); // Capture old ID
                $nameCol = $this->findCol($cols, ['name', 'item_name']);
                $priceCol = $this->findCol($cols, ['sale_price', 'price', 'mrp']);
                $costCol = $this->findCol($cols, ['purchase_price', 'cost']);
                $stockCol = $this->findCol($cols, ['stock', 'quantity', 'current_stock']);
                $codeCol = $this->findCol($cols, ['item_code', 'code', 'barcode']);

                if ($nameCol) {
                    $stmt = $pdo->query("SELECT * FROM \"$itemTable\"");
                    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                        $name = $row[$nameCol];
                        $price = $priceCol ? ($row[$priceCol] ?? 0) : 0;
                        $cost = $costCol ? ($row[$costCol] ?? 0) : 0;
                        $stock = $stockCol ? ($row[$stockCol] ?? 0) : 0;
                        $code = $codeCol ? ($row[$codeCol] ?? null) : null;
                        $oldId = $idCol ? $row[$idCol] : ($row['item_id'] ?? null);

                        $product = Product::updateOrCreate(
                            ['name' => $name],
                            [
                                'price' => $price,
                                'cost_price' => $cost,
                                'sku' => $code ?? Str::random(8),
                                'base_unit' => 'pcs',
                            ]
                        );

                        if ($oldId) {
                            $productMap[$oldId] = $product->id;
                        }

                        if ($stock > 0) {
                            $product->stocks()->updateOrCreate(
                                ['warehouse_id' => \App\Models\Warehouse::first()->id],
                                ['quantity' => $stock]
                            );
                        }
                        $importedProducts++;
                    }
                    $log[] = "Imported $importedProducts products from table '$itemTable'.";
                }
            }

            // -------------------------
            // 3. IMPORT SALES (INVOICES)
            // -------------------------
            $saleTable = $this->findTable($tables, ['Sale', 'Invoice', 'Bill', 'kb_transactions']); // Try to find sales table
            $saleItemTable = $this->findTable($tables, ['SaleItem', 'InvoiceItem', 'BillItem', 'TransactionItem', 'kb_lineitems']); 
            
            if ($saleTable) {
                 $cols = $this->getColumns($pdo, $saleTable);
                 $oldIdCol = $this->findCol($cols, ['id', 'invoice_id']);
                 $partyIdCol = $this->findCol($cols, ['party_id', 'customer_id']);
                 $dateCol = $this->findCol($cols, ['date', 'invoice_date']);
                 $totalCol = $this->findCol($cols, ['total', 'grand_total', 'amount']);
                 $invNoCol = $this->findCol($cols, ['invoice_number', 'invoice_no', 'bill_no']);

                 $importedSales = 0;

                 if ($oldIdCol && $partyIdCol) {
                     $stmt = $pdo->query("SELECT * FROM \"$saleTable\"");
                     while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                         $oldPartyId = $row[$partyIdCol];
                         $newPartyId = $partyMap[$oldPartyId] ?? null; // Use mapped ID
                         $oldSaleId = $row[$oldIdCol];

                         if ($newPartyId) {
                             $sale = \App\Models\Sale::create([
                                 'party_id' => $newPartyId,
                                 'invoice_number' => $invNoCol ? ($row[$invNoCol] ?? 'INV-MIG-'.Str::random(6)) : 'INV-MIG-'.Str::random(6),
                                 'date' => $dateCol ? ($row[$dateCol] ?? now()) : now(),
                                 'grand_total' => $totalCol ? ($row[$totalCol] ?? 0) : 0,
                                 'status' => 'completed',
                                 'payment_status' => 'paid', // Assume paid for migration history
                                 'warehouse_id' => \App\Models\Warehouse::first()->id,
                                 'user_id' => auth()->id() ?? 1
                             ]);

                             // Import Line Items (if table exists)
                             if ($importedSales < 1000 && $saleItemTable) { // Limit deep processing for speed
                                $iCols = $this->getColumns($pdo, $saleItemTable);
                                $refIdCol = $this->findCol($iCols, ['sale_id', 'invoice_id']); // Link column
                                $itemIdCol = $this->findCol($iCols, ['item_id', 'product_id']);
                                $qtyCol = $this->findCol($iCols, ['qty', 'quantity']);
                                $rateCol = $this->findCol($iCols, ['rate', 'price', 'unit_price']);

                                if ($refIdCol && $itemIdCol) {
                                    $itemStmt = $pdo->query("SELECT * FROM \"$saleItemTable\" WHERE \"$refIdCol\" = '$oldSaleId'");
                                    while ($itemRow = $itemStmt->fetch(\PDO::FETCH_ASSOC)) {
                                        $oldItemId = $itemRow[$itemIdCol];
                                        $newItemId = $productMap[$oldItemId] ?? null;
                                        
                                        if ($newItemId) {
                                            \App\Models\SaleItem::create([
                                                'sale_id' => $sale->id,
                                                'product_id' => $newItemId,
                                                'quantity' => $qtyCol ? ($itemRow[$qtyCol] ?? 1) : 1,
                                                'unit_price' => $rateCol ? ($itemRow[$rateCol] ?? 0) : 0,
                                                'subtotal' => ($qtyCol ? ($itemRow[$qtyCol] ?? 1) : 1) * ($rateCol ? ($itemRow[$rateCol] ?? 0) : 0),
                                            ]);
                                        }
                                    }
                                }
                             }
                             $importedSales++;
                         }
                     }
                     $log[] = "Imported $importedSales sales history records.";
                 }
            }

            // -------------------------
            // 4. IMPORT PURCHASES (BILLS)
            // -------------------------
            $purchTable = $this->findTable($tables, ['Purchase', 'Bill', 'VendorReference']);
            $purchItemTable = $this->findTable($tables, ['PurchaseItem', 'BillItem']);

            if ($purchTable) {
                $cols = $this->getColumns($pdo, $purchTable);
                $oldIdCol = $this->findCol($cols, ['id', 'purchase_id']);
                $partyIdCol = $this->findCol($cols, ['party_id', 'vendor_id', 'supplier_id']);
                $dateCol = $this->findCol($cols, ['date', 'bill_date']);
                $totalCol = $this->findCol($cols, ['total', 'grand_total', 'amount']);
                $billNoCol = $this->findCol($cols, ['bill_number', 'bill_no']);

                $importedPurchases = 0;

                if ($oldIdCol && $partyIdCol) {
                    $stmt = $pdo->query("SELECT * FROM \"$purchTable\"");
                    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                        $oldPartyId = $row[$partyIdCol];
                        $newPartyId = $partyMap[$oldPartyId] ?? null;
                        $oldPurchId = $row[$oldIdCol];

                        if ($newPartyId) {
                            $purchase = \App\Models\PurchaseOrder::create([
                                'supplier_id' => $newPartyId, // PO uses supplier_id usually logic maps to Party if supplier
                                'order_number' => $billNoCol ? ($row[$billNoCol] ?? 'PO-MIG-'.Str::random(6)) : 'PO-MIG-'.Str::random(6),
                                'order_date' => $dateCol ? ($row[$dateCol] ?? now()) : now(),
                                'total_amount' => $totalCol ? ($row[$totalCol] ?? 0) : 0,
                                'status' => 'received',
                                'payment_status' => 'paid',
                                'warehouse_id' => \App\Models\Warehouse::first()->id,
                                'user_id' => auth()->id() ?? 1
                            ]);

                            if ($importedPurchases < 1000 && $purchItemTable) {
                                $iCols = $this->getColumns($pdo, $purchItemTable);
                                $refIdCol = $this->findCol($iCols, ['purchase_id', 'bill_id']);
                                $itemIdCol = $this->findCol($iCols, ['item_id', 'product_id']);
                                $qtyCol = $this->findCol($iCols, ['qty', 'quantity']);
                                $rateCol = $this->findCol($iCols, ['rate', 'cost', 'unit_price']);

                                if ($refIdCol && $itemIdCol) {
                                    $itemStmt = $pdo->query("SELECT * FROM \"$purchItemTable\" WHERE \"$refIdCol\" = '$oldPurchId'");
                                    while ($itemRow = $itemStmt->fetch(\PDO::FETCH_ASSOC)) {
                                        $oldItemId = $itemRow[$itemIdCol];
                                        $newItemId = $productMap[$oldItemId] ?? null;

                                        if ($newItemId) {
                                            \App\Models\PurchaseOrderItem::create([
                                                'purchase_order_id' => $purchase->id,
                                                'product_id' => $newItemId,
                                                'quantity' => $qtyCol ? ($itemRow[$qtyCol] ?? 1) : 1,
                                                'unit_cost' => $rateCol ? ($itemRow[$rateCol] ?? 0) : 0,
                                                'subtotal' => ($qtyCol ? ($itemRow[$qtyCol] ?? 1) : 1) * ($rateCol ? ($itemRow[$rateCol] ?? 0) : 0),
                                            ]);
                                        }
                                    }
                                }
                            }
                            $importedPurchases++;
                        }
                    }
                    $log[] = "Imported $importedPurchases purchase history records.";
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully imported $importedParties parties and $importedProducts products.",
                'log' => $log
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Helpers
    private function findTable($tables, $searches) {
        foreach ($searches as $search) {
            foreach ($tables as $t) {
                if (strtolower($t) == strtolower($search)) return $t;
            }
        }
        return null;
    }

    private function getColumns($pdo, $table) {
        $stmt = $pdo->query("PRAGMA table_info(\"$table\")");
        return $stmt->fetchAll(\PDO::FETCH_COLUMN, 1); // Index 1 is name
    }

    private function findCol($cols, $searches) {
        foreach ($searches as $search) {
            foreach ($cols as $c) {
                // Exact or partial match? Exact is safer for code logic
                // But Vyapar cols might be 'Item Name' (with space)
                $cleanC = str_replace( [' ','_'], '', strtolower($c));
                $cleanS = str_replace( [' ','_'], '', strtolower($search));
                if ($cleanC == $cleanS) return $c;
            }
        }
        return null;
    }
}
