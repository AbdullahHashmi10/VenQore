<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Product;
use App\Models\Party;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\BankAccount;
use App\Models\Warehouse;
use App\Models\User;
use App\Models\Activity;
use App\Models\Expense;
use App\Models\Supplier;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Account;
use App\Models\Transaction;
use App\Models\Category;
use App\Models\Stock;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Setting;
use App\Models\ProductBatch;
use App\Models\ProductSerial;
use App\Models\ProductUnit;
use App\Models\CustomCharge;
use App\Models\DebitNote;

class DataImportService
{
    /**
     * Main entry point. Accepts the file path AND the original extension.
     */
    public function importVyaparOrExcel($filePath, $originalExtension)
    {
        $ext = strtolower($originalExtension);

        try {
            if ($ext === 'vyb') {
                return $this->restoreFromVyapar($filePath);
            }

            if ($ext === 'vyp') {
                return $this->restoreFromVypDirect($filePath);
            }

            if (in_array($ext, ['csv', 'xlsx', 'xls', 'txt'])) {
                return $this->importFromCsv($filePath);
            }

            return ['success' => false, 'message' => "Unsupported file type: .$ext"];

        } catch (\Exception $e) {
            Log::error("Import Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    private function restoreFromVyapar($filePath)
    {
        $tempDir = storage_path('app/temp_restore_' . time());
        if (!file_exists($tempDir)) mkdir($tempDir, 0755, true);

        try {
            $zip = new \ZipArchive;
            if ($zip->open($filePath) === TRUE) {
                $zip->extractTo($tempDir);
                $zip->close();
            } else {
                throw new \Exception("Corrupted Transmission: Failed to open Vyapar backup.");
            }

            $vypFiles = glob($tempDir . '/*.vyp');
            if (empty($vypFiles)) $vypFiles = glob($tempDir . '/**/*.vyp');
            if (empty($vypFiles)) throw new \Exception("Data Not Found: No Vyapar database (.vyp) inside the backup.");

            $vypPath = $vypFiles[0];
            $result = $this->importFromSqliteDatabase($vypPath);

            File::deleteDirectory($tempDir);
            return $result;

        } catch (\Exception $e) {
            File::deleteDirectory($tempDir);
            Log::error("Vyapar Migration Failed: " . $e->getMessage());
            return ['success' => false, 'message' => "Vyapar Core Error: " . $e->getMessage()];
        }
    }

    private function restoreFromVypDirect($filePath)
    {
        try {
            return $this->importFromSqliteDatabase($filePath);
        } catch (\Exception $e) {
            Log::error("VYP Direct Import Failed: " . $e->getMessage());
            return ['success' => false, 'message' => "Import Failed: " . $e->getMessage()];
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  CORE SQLITE IMPORT - ALIGNED WITH VYAPAR MASTER SCHEMA (67 TABLES)
    // ═══════════════════════════════════════════════════════════════

    private function importFromSqliteDatabase($vypPath)
    {
        $pdo = new \PDO("sqlite:" . $vypPath);
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

        $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(\PDO::FETCH_COLUMN);
        Log::info("Vyapar Restore - Found " . count($tables) . " tables: " . implode(', ', $tables));

        if (empty($tables)) {
            return ['success' => false, 'message' => "Invalid or Empty Database File. No tables found."];
        }

        $warehouse = Warehouse::where('is_default', true)->first()
            ?: Warehouse::first();
        if (!$warehouse) {
            $warehouse = Warehouse::create(['name' => 'Main Store']);
            DB::table('warehouses')->where('id', $warehouse->id)->update(['is_default' => true]);
        }
        
        $user = User::first();
        $userId = auth()->id() ?? ($user ? $user->id : null);

        $counters = [
            'categories' => 0, 'products' => 0, 'parties' => 0,
            'sales' => 0, 'purchases' => 0, 'expenses' => 0,
            'payments_in' => 0, 'payments_out' => 0,
            'credit_notes' => 0, 'debit_notes' => 0,
            'estimates' => 0, 'delivery_challans' => 0,
            'banks' => 0, 'settings' => 0, 'units' => 0,
            'tax_codes' => 0, 'skipped' => 0,
            'batches' => 0, 'serials' => 0, 'taxes' => 0,
            'warehouses' => 0, 'accounts' => 0, 'journals' => 0,
            'charges' => 0, 'unit_mappings' => 0,
        ];

        $partyMap = [];
        $itemMap = [];
        $categoryMap = [];
        $customerMap = []; 
        $supplierMap = [];
        $unitMap = [];

        DB::beginTransaction();

        try {
            $this->updateProgress($userId, 2, "Analyzing Vyapar database...");

            // ──────────────────────────────────────────────────────────
            // 1. BUSINESS INFO (kb_firms) → VenQore Settings
            // ──────────────────────────────────────────────────────────
            $firmTable = $this->findTable($tables, ['kb_firms']);
            if ($firmTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$firmTable\" LIMIT 1", function ($row) use (&$counters) {
                    $map = [
                        'business_name' => $row['firm_name'] ?? null,
                        'business_email' => $row['firm_email'] ?? null,
                        'business_phone' => $row['firm_phone'] ?? null,
                        'business_address' => $row['firm_address'] ?? null,
                        'gst_number' => $row['firm_gstin_number'] ?? null,
                        'tin_number' => $row['firm_tin_number'] ?? null,
                        'business_state' => $row['firm_state'] ?? null,
                        'invoice_prefix' => $row['firm_invoice_prefix'] ?? null,
                        'invoice_number' => $row['firm_invoice_number'] ?? null,
                    ];
                    foreach ($map as $key => $value) {
                        if ($value !== null && $value !== '') {
                            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
                            $counters['settings']++;
                        }
                    }
                }, 'Business Info');
            }
            $this->updateProgress($userId, 5, "Imported business settings...");

            // ──────────────────────────────────────────────────────────
            // 2. ITEM UNITS (kb_item_units)
            // ──────────────────────────────────────────────────────────
            $unitTable = $this->findTable($tables, ['kb_item_units']);
            if ($unitTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$unitTable\"", function ($row) use (&$unitMap, &$counters) {
                    $unitMap[$row['unit_id']] = $row['unit_short_name'] ?? ($row['unit_name'] ?? 'pcs');
                    $counters['units']++;
                }, 'Item Units');
            }

            // ──────────────────────────────────────────────────────────
            // 3. CATEGORIES (kb_item_categories)
            // ──────────────────────────────────────────────────────────
            $catTable = $this->findTable($tables, ['kb_item_categories']);
            if ($catTable) {
                $cols = $this->getColumns($pdo, $catTable);
                $idCol = $this->findCol($cols, ['item_category_id']);
                $nameCol = $this->findCol($cols, ['item_category_name']);

                if ($nameCol) {
                    $this->safeImport($pdo, "SELECT * FROM \"$catTable\"", function ($row) use (&$categoryMap, &$counters, $nameCol, $idCol) {
                        $name = $row[$nameCol] ?? null;
                        if (!$name) return;
                        $cat = Category::firstOrCreate(
                            ['name' => $name],
                            ['code' => Str::slug($name)]
                        );
                        if ($idCol && isset($row[$idCol])) {
                            $categoryMap[$row[$idCol]] = $cat->id;
                        }
                        $counters['categories']++;
                    }, 'Categories');
                }
            }
            $this->updateProgress($userId, 10, "Imported {$counters['categories']} categories...");

            // ──────────────────────────────────────────────────────────
            // 4. PRODUCTS (kb_items) - 41 columns in master schema
            // ──────────────────────────────────────────────────────────
            $itemTable = $this->findTable($tables, ['kb_items']);
            if ($itemTable) {
                $cols = $this->getColumns($pdo, $itemTable);

                $this->safeImport($pdo, "SELECT * FROM \"$itemTable\"", function ($row) use (&$itemMap, &$counters, $warehouse, &$categoryMap, &$unitMap, $cols) {
                    $name = $row['item_name'] ?? null;
                    if (!$name) return;

                    $sku = (!empty($row['item_code'])) ? $row['item_code'] : ('VY-' . Str::random(6));
                    $baseUnitId = $row['base_unit_id'] ?? null;
                    $baseUnit = ($baseUnitId && isset($unitMap[$baseUnitId])) ? $unitMap[$baseUnitId] : 'pcs';
                    $catId = isset($row['category_id']) ? ($categoryMap[$row['category_id']] ?? null) : null;

                    $product = Product::updateOrCreate(
                        ['name' => $name],
                        [
                            'sku' => $sku,
                            'price' => (float)($row['item_sale_unit_price'] ?? 0),
                            'cost_price' => (float)($row['item_purchase_unit_price'] ?? 0),
                            'stock_quantity' => (float)($row['item_stock_quantity'] ?? 0),
                            'alert_quantity' => (int)($row['item_min_stock_quantity'] ?? 0),
                            'category_id' => $catId,
                            'base_unit' => $baseUnit,
                            'description' => $row['item_description'] ?? null,
                        ]
                    );

                    if (isset($row['item_id'])) {
                        $itemMap[$row['item_id']] = [
                            'id' => $product->id,
                            'cost' => $product->cost_price
                        ];
                    }
                    $counters['products']++;

                    // Stock entry
                    $stockQty = (float)($row['item_stock_quantity'] ?? 0);
                    if ($stockQty > 0) {
                        Stock::updateOrCreate(
                            ['product_id' => $product->id, 'warehouse_id' => $warehouse->id],
                            ['quantity' => $stockQty]
                        );
                    }
                }, 'Products');
            }
            $this->updateProgress($userId, 30, "Imported {$counters['products']} products...");

            // ──────────────────────────────────────────────────────────
            // 4B. CATEGORY MAPPING (kb_item_categories_mapping)
            // ──────────────────────────────────────────────────────────
            $catMapTable = $this->findTable($tables, ['kb_item_categories_mapping']);
            if ($catMapTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$catMapTable\"", function ($row) use (&$itemMap, &$categoryMap) {
                    $itemId = $row['item_id'] ?? null;
                    $catId = $row['category_id'] ?? null;
                    
                    if ($itemId && $catId && isset($itemMap[$itemId]) && isset($categoryMap[$catId])) {
                        // Update product with category_id
                        Product::where('id', $itemMap[$itemId]['id'])->update(['category_id' => $categoryMap[$catId]]);
                    }
                }, 'Category Mapping');
            }

            // ──────────────────────────────────────────────────────────
            // 5. PARTIES (kb_names) - 32 columns in master schema
            // ──────────────────────────────────────────────────────────
            $partyTable = $this->findTable($tables, ['kb_names']);
            if ($partyTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$partyTable\"", function ($row) use (&$partyMap, &$customerMap, &$supplierMap, &$counters) {
                    $name = $row['full_name'] ?? 'Unknown';

                    // Phone handling
                    $rawPhone = $row['phone_number'] ?? null;
                    if (!$rawPhone || strlen(preg_replace('/[^0-9]/', '', $rawPhone)) < 5) {
                        $phone = '0000' . str_pad($counters['parties'], 6, '0', STR_PAD_LEFT);
                    } else {
                        $phone = preg_replace('/[^0-9]/', '', $rawPhone);
                    }

                    // name_type: 1 = Customer, 2 = Supplier (per Vyapar convention)
                    $nameType = (int)($row['name_type'] ?? 1);
                    $isSupplier = ($nameType == 2);

                    $openingBalance = (float)($row['amount'] ?? 0); // 'amount' is current balance in kb_names
                    $email = $row['email'] ?? null;
                    $address = $row['address'] ?? null;
                    $gstin = $row['name_gstin_number'] ?? null;
                    $creditLimit = $row['credit_limit'] ?? null;

                    if ($isSupplier) {
                        $party = Party::updateOrCreate(
                            ['phone' => $phone],
                            [
                                'name' => $name,
                                'type' => 'supplier',
                                'opening_balance' => $openingBalance,
                                'current_balance' => $openingBalance,
                                'email' => $email,
                                'address' => $address,
                            ]
                        );
                        $supp = Supplier::updateOrCreate(
                            ['phone' => $phone],
                            [
                                'name' => $name,
                                'email' => $email,
                                'address' => $address,
                                'tax_id' => $gstin,
                            ]
                        );
                        if (isset($row['name_id'])) {
                            $partyMap[$row['name_id']] = $party->id;
                            $supplierMap[$row['name_id']] = $supp->id;
                        }
                    } else {
                        $party = Party::updateOrCreate(
                            ['phone' => $phone],
                            [
                                'name' => $name,
                                'type' => 'customer',
                                'opening_balance' => $openingBalance,
                                'current_balance' => $openingBalance,
                                'email' => $email,
                                'address' => $address,
                            ]
                        );
                        $cust = \App\Models\Customer::updateOrCreate(
                            ['phone' => $phone],
                            [
                                'name' => $name,
                                'email' => $email,
                                'address' => $address,
                            ]
                        );
                        if (isset($row['name_id'])) {
                            $partyMap[$row['name_id']] = $party->id;
                            $customerMap[$row['name_id']] = $cust->id;
                        }
                    }
                    $counters['parties']++;
                }, 'Parties');
            }
            $this->updateProgress($userId, 50, "Imported {$counters['parties']} parties...");

            // ──────────────────────────────────────────────────────────
            // 6. PAYMENT TYPES / BANKS (kb_paymentTypes) - 16 columns
            // ──────────────────────────────────────────────────────────
            $ptTable = $this->findTable($tables, ['kb_paymentTypes']);
            if ($ptTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$ptTable\"", function ($row) use (&$counters) {
                    $name = $row['paymentType_name'] ?? 'Unknown';
                    $accNum = $row['paymentType_accountNumber'] ?? ('VY-' . ($row['paymentType_id'] ?? Str::random(4)));

                    BankAccount::updateOrCreate(
                        ['account_number' => $accNum],
                        [
                            'name' => $name,
                            'bank_name' => $row['paymentType_bankName'] ?? $name,
                            'opening_balance' => (float)($row['paymentType_opening_balance'] ?? 0),
                            'current_balance' => (float)($row['paymentType_opening_balance'] ?? 0),
                        ]
                    );
                    $counters['banks']++;
                }, 'Payment Types / Banks');
            }

            // Also check kb_bank_accounts (5 columns) as secondary
            $baTable = $this->findTable($tables, ['kb_bank_accounts']);
            if ($baTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$baTable\"", function ($row) use (&$counters) {
                    $accNum = $row['bank_account_number'] ?? ('BA-' . Str::random(4));
                    BankAccount::updateOrCreate(
                        ['account_number' => $accNum],
                        [
                            'name' => $row['bank_account_type'] ?? 'Bank Account',
                            'bank_name' => $row['bank_account_type'] ?? 'Bank',
                        ]
                    );
                    $counters['banks']++;
                }, 'Bank Accounts');
            }
            $this->updateProgress($userId, 55, "Imported {$counters['banks']} bank accounts...");

            // ──────────────────────────────────────────────────────────
            // 6B. TAX CODES (kb_tax_code → Settings)
            // ──────────────────────────────────────────────────────────
            $taxTable = $this->findTable($tables, ['kb_tax_code']);
            if ($taxTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$taxTable\"", function ($row) use (&$counters) {
                    $name = $row['tax_code_name'] ?? null;
                    $rate = $row['tax_rate'] ?? null;
                    if ($name && $rate !== null) {
                        Setting::updateOrCreate(
                            ['key' => 'vyapar_tax_' . ($row['tax_code_id'] ?? Str::random(4))],
                            ['value' => json_encode(['name' => $name, 'rate' => (float)$rate, 'type' => (int)($row['tax_code_type'] ?? 0)])]
                        );
                        $counters['taxes']++;
                    }
                }, 'Tax Codes');
            }

            // ──────────────────────────────────────────────────────────
            // 6C. BATCH/SERIAL TRACKING (kb_item_stock_tracking → product_batches)
            // ──────────────────────────────────────────────────────────
            $istTable = $this->findTable($tables, ['kb_item_stock_tracking']);
            if ($istTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$istTable\"", function ($row) use (&$counters, &$itemMap) {
                    $vyItemId = $row['ist_item_id'] ?? null;
                    $productData = $vyItemId ? ($itemMap[$vyItemId] ?? null) : null;
                    if (!$productData) return;

                    $batchNum = $row['ist_batch_number'] ?? null;
                    $serialNum = $row['ist_serial_number'] ?? null;

                    // Import batch info
                    if ($batchNum && $batchNum !== '') {
                        ProductBatch::updateOrCreate(
                            ['product_id' => $productData['id'], 'batch_number' => $batchNum],
                            [
                                'expiry_date' => !empty($row['ist_expiry_date']) ? $this->parseDate($row['ist_expiry_date']) : null,
                                'manufacturing_date' => !empty($row['ist_manufacturing_date']) ? $this->parseDate($row['ist_manufacturing_date']) : null,
                                'current_quantity' => (float)($row['ist_current_quantity'] ?? 0),
                                'initial_quantity' => (float)($row['ist_opening_quantity'] ?? 0),
                            ]
                        );
                        $counters['batches']++;
                    }

                    // Import serial info
                    if ($serialNum && $serialNum !== '') {
                        ProductSerial::updateOrCreate(
                            ['serial_number' => $serialNum],
                            [
                                'product_id' => $productData['id'],
                                'status' => 'available',
                            ]
                        );
                        $counters['serials']++;
                    }
                }, 'Batch/Serial Tracking');
            }

            // ──────────────────────────────────────────────────────────
            // 6D. SERIAL DETAILS (kb_serial_details → product_serials)
            // ──────────────────────────────────────────────────────────
            $serialTable = $this->findTable($tables, ['kb_serial_details']);
            if ($serialTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$serialTable\"", function ($row) use (&$counters, &$itemMap) {
                    $vyItemId = $row['serial_item_id'] ?? null;
                    $productData = $vyItemId ? ($itemMap[$vyItemId] ?? null) : null;
                    if (!$productData) return;

                    $sn = $row['serial_number'] ?? null;
                    if ($sn && $sn !== '') {
                        ProductSerial::updateOrCreate(
                            ['serial_number' => $sn],
                            ['product_id' => $productData['id'], 'status' => 'available']
                        );
                        $counters['serials']++;
                    }
                }, 'Serial Details');
            }

            // ──────────────────────────────────────────────────────────
            // 6E. UNIT MAPPINGS (kb_item_units_mapping → product_units)
            // ──────────────────────────────────────────────────────────
            $unitMapTable = $this->findTable($tables, ['kb_item_units_mapping']);
            if ($unitMapTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$unitMapTable\"", function ($row) use (&$counters, &$unitMap) {
                    $baseId = $row['base_unit_id'] ?? null;
                    $secId = $row['secondary_unit_id'] ?? null;
                    $convRate = (float)($row['conversion_rate'] ?? 0);

                    if ($baseId && $secId && $convRate > 0) {
                        $baseUnit = $unitMap[$baseId] ?? 'pcs';
                        $secUnit = $unitMap[$secId] ?? 'box';

                        // Store as a setting for reference - product_units need a product_id
                        Setting::updateOrCreate(
                            ['key' => 'vyapar_unit_map_' . ($row['unit_mapping_id'] ?? Str::random(4))],
                            ['value' => json_encode(['base' => $baseUnit, 'secondary' => $secUnit, 'rate' => $convRate])]
                        );
                        $counters['unit_mappings']++;
                    }
                }, 'Unit Mappings');
            }

            // ──────────────────────────────────────────────────────────
            // 6F. STORES (stores → warehouses)
            // ──────────────────────────────────────────────────────────
            $storeTable = $this->findTable($tables, ['stores']);
            if ($storeTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$storeTable\"", function ($row) use (&$counters) {
                    $name = $row['name'] ?? 'Vyapar Store';
                    Warehouse::updateOrCreate(
                        ['name' => $name],
                        [
                            'location' => $row['address'] ?? null,
                        ]
                    );
                    $counters['warehouses']++;
                }, 'Stores/Warehouses');
            }

            // ──────────────────────────────────────────────────────────
            // 6G. INVOICE PREFIXES (kb_prefix → Settings)
            // ──────────────────────────────────────────────────────────
            $prefixTable = $this->findTable($tables, ['kb_prefix']);
            if ($prefixTable) {
                $txnTypeNames = [1 => 'sale', 2 => 'purchase', 3 => 'credit_note', 4 => 'debit_note', 5 => 'payment_in', 6 => 'payment_out', 7 => 'expense', 8 => 'estimate', 9 => 'delivery_challan'];
                $this->safeImport($pdo, "SELECT * FROM \"$prefixTable\"", function ($row) use (&$counters, $txnTypeNames) {
                    $txnType = (int)($row['prefix_txn_type'] ?? 0);
                    $prefix = $row['prefix_value'] ?? null;
                    $typeName = $txnTypeNames[$txnType] ?? 'unknown_' . $txnType;
                    if ($prefix) {
                        Setting::updateOrCreate(
                            ['key' => 'prefix_' . $typeName],
                            ['value' => $prefix]
                        );
                        $counters['settings']++;
                    }
                }, 'Invoice Prefixes');
            }

            // ──────────────────────────────────────────────────────────
            // 6H. ADDRESSES (kb_address → enhance parties)
            // ──────────────────────────────────────────────────────────
            $addrTable = $this->findTable($tables, ['kb_address']);
            if ($addrTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$addrTable\"", function ($row) use (&$counters, &$partyMap, &$customerMap, &$supplierMap) {
                    $vyNameId = $row['name_id'] ?? null;
                    $address = $row['address'] ?? null;
                    if (!$vyNameId || !$address) return;

                    // Update customer address if exists
                    if (isset($customerMap[$vyNameId])) {
                        \App\Models\Customer::where('id', $customerMap[$vyNameId])
                            ->whereNull('address')
                            ->update(['address' => $address]);
                    }
                    // Update supplier address if exists
                    if (isset($supplierMap[$vyNameId])) {
                        Supplier::where('id', $supplierMap[$vyNameId])
                            ->whereNull('address')
                            ->update(['address' => $address]);
                    }
                }, 'Addresses');
            }

            // ──────────────────────────────────────────────────────────
            // 6I. EXTRA CHARGES (kb_extra_charges → custom_charges)
            // ──────────────────────────────────────────────────────────
            $chargeTable = $this->findTable($tables, ['kb_extra_charges']);
            if ($chargeTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$chargeTable\"", function ($row) use (&$counters) {
                    $name = $row['extra_charges_name'] ?? null;
                    if ($name) {
                        CustomCharge::updateOrCreate(
                            ['name' => $name],
                            [
                                'default_amount' => 0,
                                'is_percentage' => false,
                                'is_active' => (int)($row['enabled'] ?? 0) === 1,
                            ]
                        );
                        $counters['charges']++;
                    }
                }, 'Extra Charges');
            }

            // ──────────────────────────────────────────────────────────
            // 6J. ACCOUNTS (other_accounts, chart_of_accounts_mapping → accounts)
            // ──────────────────────────────────────────────────────────
            $oaTable = $this->findTable($tables, ['other_accounts']);
            if ($oaTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$oaTable\"", function ($row) use (&$counters) {
                    $name = $row['name'] ?? null;
                    if ($name) {
                        Account::updateOrCreate(
                            ['name' => $name],
                            [
                                'code' => 'VY-ACC-' . ($row['id'] ?? Str::random(4)),
                                'type' => 'asset', // default; Vyapar doesn't map 1:1 to our types
                                'balance' => (float)($row['opening_balance'] ?? 0),
                            ]
                        );
                        $counters['accounts']++;
                    }
                }, 'Other Accounts');
            }

            $this->updateProgress($userId, 58, "Imported tax codes, batches, stores...");

            // ──────────────────────────────────────────────────────────
            // 7. TRANSACTIONS (kb_transactions - 84 cols, kb_lineitems - 31 cols)
            //    Type mapping from Vyapar:
            //    1=Sale, 2=Purchase, 3=Credit Note, 4=Debit Note,
            //    5=Payment-In, 6=Payment-Out, 7=Expense,
            //    8=Estimate, 9=Delivery Challan
            // ──────────────────────────────────────────────────────────
            $txnTable = $this->findTable($tables, ['kb_transactions']);
            $lineTable = $this->findTable($tables, ['kb_lineitems']);

            if ($txnTable) {
                // Pre-prepare line item query
                $lineItemStmt = null;
                $colsLine = [];
                if ($lineTable) {
                    $colsLine = $this->getColumns($pdo, $lineTable);
                    $lineItemStmt = $pdo->prepare("SELECT * FROM \"$lineTable\" WHERE \"lineitem_txn_id\" = ?");
                }

                $stmt = $pdo->query("SELECT * FROM \"$txnTable\"");
                $totalTxns = 0;

                while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                    $type = (int)($row['txn_type'] ?? 0);

                    try {
                        switch ($type) {
                            case 1: // SALE
                                $this->processSale($row, $partyMap, $customerMap, $itemMap, $user, $warehouse, $lineItemStmt);
                                $counters['sales']++;
                                break;
                            case 2: // PURCHASE
                                $this->processPurchase($row, $partyMap, $supplierMap, $itemMap, $user, $warehouse, $lineItemStmt);
                                $counters['purchases']++;
                                break;
                            case 3: // CREDIT NOTE (Sale Return)
                                $this->processCreditNote($row, $partyMap, $customerMap, $itemMap, $user, $warehouse, $lineItemStmt);
                                $counters['credit_notes']++;
                                break;
                            case 4: // DEBIT NOTE (Purchase Return)
                                $this->processDebitNote($row, $partyMap, $supplierMap, $itemMap, $user, $warehouse, $lineItemStmt);
                                $counters['debit_notes']++;
                                break;
                            case 5: // PAYMENT-IN
                                $this->processPaymentIn($row, $partyMap, $user);
                                $counters['payments_in']++;
                                break;
                            case 6: // PAYMENT-OUT
                                $this->processPaymentOut($row, $partyMap, $user);
                                $counters['payments_out']++;
                                break;
                            case 7: // EXPENSE
                                $this->processExpense($row, $user, $warehouse);
                                $counters['expenses']++;
                                break;
                            case 8: // ESTIMATE
                                $counters['estimates']++;
                                break;
                            case 9: // DELIVERY CHALLAN
                                $counters['delivery_challans']++;
                                break;
                            default:
                                $counters['skipped']++;
                                break;
                        }
                    } catch (\Exception $e) {
                        Log::warning("Skipped txn #{$row['txn_id']} type=$type: " . $e->getMessage());
                        $counters['skipped']++;
                    }

                    $totalTxns++;
                    if ($totalTxns % 200 === 0) {
                        $this->updateProgress($userId, min(90, 55 + ($totalTxns / 50)), "Processed $totalTxns transactions...");
                    }
                }
            }
            $this->updateProgress($userId, 92, "Finalizing import...");

            // ──────────────────────────────────────────────────────────
            // 8. VYAPAR SETTINGS (kb_settings)
            // ──────────────────────────────────────────────────────────
            $settingsTable = $this->findTable($tables, ['kb_settings']);
            if ($settingsTable) {
                $this->safeImport($pdo, "SELECT * FROM \"$settingsTable\"", function ($row) use (&$counters) {
                    $key = $row['setting_key'] ?? null;
                    $val = $row['setting_value'] ?? null;
                    if ($key && $val) {
                        Setting::updateOrCreate(
                            ['key' => 'vyapar_' . $key],
                            ['value' => $val]
                        );
                        $counters['settings']++;
                    }
                }, 'Vyapar Settings');
            }

            // ──────────────────────────────────────────────────────────
            // 9. JOURNAL ENTRIES (journal_entry + journal_entry_line_items → journal_entries + journal_items)
            // ──────────────────────────────────────────────────────────
            $jeTable = $this->findTable($tables, ['journal_entry']);
            $jeliTable = $this->findTable($tables, ['journal_entry_line_items']);
            if ($jeTable) {
                $jeLineStmt = null;
                if ($jeliTable) {
                    $jeLineStmt = $pdo->prepare("SELECT * FROM \"$jeliTable\" WHERE \"journal_entry_id\" = ?");
                }

                $this->safeImport($pdo, "SELECT * FROM \"$jeTable\"", function ($row) use (&$counters, $user, $jeLineStmt) {
                    $date = $this->parseDate($row['date'] ?? null);
                    $ref = $row['reference_number'] ?? ('VY-JE-' . ($row['id'] ?? Str::random(4)));

                    $je = JournalEntry::create([
                        'date' => $date,
                        'reference' => $ref,
                        'description' => $row['description'] ?? 'Imported from Vyapar',
                        'user_id' => $user->id,
                        'created_at' => $date,
                        'updated_at' => $date,
                    ]);

                    // Import line items for this journal entry
                    if ($jeLineStmt && isset($row['id'])) {
                        $jeLineStmt->execute([$row['id']]);
                        while ($li = $jeLineStmt->fetch(\PDO::FETCH_ASSOC)) {
                            $amount = (float)($li['amount'] ?? 0);
                            $amountType = (int)($li['amount_type'] ?? 0); // 0=debit, 1=credit typically

                            // We need an account - use default or find/create
                            $defaultAccount = Account::first();
                            if (!$defaultAccount) {
                                $defaultAccount = Account::create([
                                    'name' => 'General',
                                    'code' => 'GEN-001',
                                    'type' => 'asset',
                                ]);
                            }

                            JournalItem::create([
                                'journal_entry_id' => $je->id,
                                'account_id' => $defaultAccount->id,
                                'debit' => $amountType == 0 ? $amount : 0,
                                'credit' => $amountType == 1 ? $amount : 0,
                                'description' => 'Vyapar Import',
                            ]);
                        }
                    }
                    $counters['journals']++;
                }, 'Journal Entries');
            }

            DB::commit();
            $this->updateProgress($userId, 100, "Done.");

            $summary = "Imported: {$counters['products']} products, {$counters['parties']} parties, "
                . "{$counters['sales']} sales, {$counters['purchases']} purchases, "
                . "{$counters['expenses']} expenses, {$counters['payments_in']} payments-in, "
                . "{$counters['payments_out']} payments-out, {$counters['credit_notes']} credit notes, "
                . "{$counters['banks']} banks, {$counters['categories']} categories, "
                . "{$counters['batches']} batches, {$counters['serials']} serials, "
                . "{$counters['taxes']} tax codes, {$counters['journals']} journals, "
                . "{$counters['warehouses']} warehouses, {$counters['accounts']} accounts, "
                . "{$counters['charges']} charges, {$counters['settings']} settings.";

            Log::info("Vyapar Import Complete: $summary");
            return ['success' => true, 'message' => $summary];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Import Failed: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return ['success' => false, 'message' => "Error: " . $e->getMessage()];
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  TRANSACTION PROCESSORS (aligned with Vyapar master column names)
    // ══════════════════════════════════════════════════════════════════

    private function processSale($row, $partyMap, $customerMap, $itemMap, $user, $warehouse, $lineItemStmt)
    {
        $partyId = isset($row['txn_name_id']) ? ($partyMap[$row['txn_name_id']] ?? null) : null;
        $customerId = isset($row['txn_name_id']) ? ($customerMap[$row['txn_name_id']] ?? null) : null;

        if (!$partyId || !$customerId) {
            $party = Party::firstOrCreate(['phone' => '0000000000'], ['name' => 'Walk-in Customer', 'type' => 'customer']);
            $cust = \App\Models\Customer::firstOrCreate(['phone' => '0000000000'], ['name' => 'Walk-in Customer']);
            $partyId = $party->id;
            $customerId = $cust->id;
        }

        $date = $this->parseDate($row['txn_date'] ?? null);
        $ref = !empty($row['txn_ref_number_char']) ? $row['txn_ref_number_char'] : ('VY-S-' . ($row['txn_id'] ?? Str::random(6)));

        $cashAmt = (float)($row['txn_cash_amount'] ?? 0);
        $balAmt = (float)($row['txn_balance_amount'] ?? 0);
        $total = $cashAmt + $balAmt;
        $tax = (float)($row['txn_tax_amount'] ?? 0);
        $discount = (float)($row['txn_discount_amount'] ?? 0);
        $roundOff = (float)($row['txn_round_off_amount'] ?? 0);

        $sale = Sale::create([
            'reference_number' => $this->uniqueRef(Sale::class, $ref),
            'party_id' => $partyId,
            'customer_id' => $customerId,
            'user_id' => $user->id,
            'warehouse_id' => $warehouse->id,
            'total' => $total,
            'subtotal' => $total - $tax + $discount - $roundOff,
            'tax' => $tax,
            'discount' => $discount,
            'status' => 'completed',
            'payment_status' => ($balAmt <= 0) ? 'paid' : (($balAmt >= $total) ? 'unpaid' : 'partial'),
            'payment_method' => 'cash',
            'notes' => $row['txn_description'] ?? null,
            'created_at' => $date,
            'updated_at' => $date,
        ]);

        $this->processLineItems($lineItemStmt, $row, $sale->id, 'sale', $itemMap, $date);

        // CREATE PAYMENT RECORD IF CASH AMOUNT > 0
        if ($cashAmt > 0) {
            Payment::create([
                'sale_id' => $sale->id,
                'party_id' => $partyId,
                'amount' => $cashAmt,
                'method' => 'cash',
                'reference' => 'VY-CASH-' . $sale->reference_number,
                'type' => 'received',
                'date' => $date,
                'notes' => 'Cash payment at time of sale (Imported)',
                'created_at' => $date,
                'updated_at' => $date,
            ]);
        }
    }

    private function processPurchase($row, $partyMap, $supplierMap, $itemMap, $user, $warehouse, $lineItemStmt)
    {
        $supplierId = isset($row['txn_name_id']) ? ($supplierMap[$row['txn_name_id']] ?? null) : null;

        if (!$supplierId) {
            $supplier = Supplier::firstOrCreate(['name' => 'Unknown Supplier']);
            $supplierId = $supplier->id;
        }

        $date = $this->parseDate($row['txn_date'] ?? null);
        $ref = !empty($row['txn_ref_number_char']) ? $row['txn_ref_number_char'] : ('VY-P-' . ($row['txn_id'] ?? Str::random(6)));

        $cashAmt = (float)($row['txn_cash_amount'] ?? 0);
        $balAmt = (float)($row['txn_balance_amount'] ?? 0);
        $total = $cashAmt + $balAmt;

        $po = PurchaseOrder::create([
            'supplier_id' => $supplierId,
            'warehouse_id' => $warehouse->id,
            'reference_number' => $this->uniqueRef(PurchaseOrder::class, $ref),
            'status' => 'received',
            'order_date' => $date,
            'total_amount' => $total,
            'user_id' => $user->id,
            'notes' => $row['txn_description'] ?? null,
            'created_at' => $date,
            'updated_at' => $date,
        ]);

        $this->processLineItems($lineItemStmt, $row, $po->id, 'purchase', $itemMap, $date);

        // CREATE PAYMENT RECORD IF CASH AMOUNT > 0
        if ($cashAmt > 0) {
            Payment::create([
                'party_id' => $supplierId, // Payments table stores party_id
                'amount' => $cashAmt,
                'method' => 'cash',
                'reference' => 'VY-CASH-' . $po->reference_number,
                'type' => 'sent',
                'date' => $date,
                'notes' => 'Cash payment at time of purchase (Imported)',
                'created_at' => $date,
                'updated_at' => $date,
            ]);
        }
    }

    private function processCreditNote($row, $partyMap, $customerMap, $itemMap, $user, $warehouse, $lineItemStmt)
    {
        // Credit Note = Sale Return: create a negative sale or store as a record
        $partyId = isset($row['txn_name_id']) ? ($partyMap[$row['txn_name_id']] ?? null) : null;
        $customerId = isset($row['txn_name_id']) ? ($customerMap[$row['txn_name_id']] ?? null) : null;

        if (!$partyId) {
            $party = Party::firstOrCreate(['phone' => '0000000000'], ['name' => 'Walk-in Customer', 'type' => 'customer']);
            $cust = \App\Models\Customer::firstOrCreate(['phone' => '0000000000'], ['name' => 'Walk-in Customer']);
            $partyId = $party->id;
            $customerId = $cust->id ?? $customerId;
        }

        $date = $this->parseDate($row['txn_date'] ?? null);
        $ref = !empty($row['txn_ref_number_char']) ? $row['txn_ref_number_char'] : ('VY-CN-' . ($row['txn_id'] ?? Str::random(6)));
        $total = (float)($row['txn_cash_amount'] ?? 0) + (float)($row['txn_balance_amount'] ?? 0);

        Sale::create([
            'reference_number' => $this->uniqueRef(Sale::class, $ref),
            'party_id' => $partyId,
            'customer_id' => $customerId,
            'user_id' => $user->id,
            'warehouse_id' => $warehouse->id,
            'total' => -abs($total), // Negative for returns
            'subtotal' => -abs($total),
            'tax' => 0,
            'status' => 'returned',
            'payment_status' => 'refunded',
            'payment_method' => 'cash',
            'notes' => 'Credit Note (Vyapar Import): ' . ($row['txn_description'] ?? ''),
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }

    private function processDebitNote($row, $partyMap, $supplierMap, $itemMap, $user, $warehouse, $lineItemStmt)
    {
        // Debit Note = Purchase Return
        $supplierId = isset($row['txn_name_id']) ? ($supplierMap[$row['txn_name_id']] ?? null) : null;
        if (!$supplierId) {
            $supplier = Supplier::firstOrCreate(['name' => 'Unknown Supplier']);
            $supplierId = $supplier->id;
        }

        $date = $this->parseDate($row['txn_date'] ?? null);
        $ref = !empty($row['txn_ref_number_char']) ? $row['txn_ref_number_char'] : ('VY-DN-' . ($row['txn_id'] ?? Str::random(6)));
        $total = (float)($row['txn_cash_amount'] ?? 0) + (float)($row['txn_balance_amount'] ?? 0);

        PurchaseOrder::create([
            'supplier_id' => $supplierId,
            'warehouse_id' => $warehouse->id,
            'reference_number' => $this->uniqueRef(PurchaseOrder::class, $ref),
            'status' => 'returned',
            'order_date' => $date,
            'total_amount' => -abs($total),
            'user_id' => $user->id,
            'notes' => 'Debit Note (Vyapar Import): ' . ($row['txn_description'] ?? ''),
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }

    private function processPaymentIn($row, $partyMap, $user)
    {
        $partyId = isset($row['txn_name_id']) ? ($partyMap[$row['txn_name_id']] ?? null) : null;
        $date = $this->parseDate($row['txn_date'] ?? null);
        $amount = (float)($row['txn_cash_amount'] ?? 0);
        $ref = !empty($row['txn_ref_number_char']) ? $row['txn_ref_number_char'] : ('VY-PI-' . ($row['txn_id'] ?? Str::random(6)));

        Payment::create([
            'party_id' => $partyId,
            'amount' => $amount,
            'method' => 'cash',
            'reference' => $ref,
            'type' => 'received',
            'date' => $date,
            'notes' => 'Payment-In (Vyapar Import): ' . ($row['txn_description'] ?? ''),
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }

    private function processPaymentOut($row, $partyMap, $user)
    {
        $partyId = isset($row['txn_name_id']) ? ($partyMap[$row['txn_name_id']] ?? null) : null;
        $date = $this->parseDate($row['txn_date'] ?? null);
        $amount = (float)($row['txn_cash_amount'] ?? 0);
        $ref = !empty($row['txn_ref_number_char']) ? $row['txn_ref_number_char'] : ('VY-PO-' . ($row['txn_id'] ?? Str::random(6)));

        Payment::create([
            'party_id' => $partyId,
            'amount' => $amount,
            'method' => 'cash',
            'reference' => $ref,
            'type' => 'sent',
            'date' => $date,
            'notes' => 'Payment-Out (Vyapar Import): ' . ($row['txn_description'] ?? ''),
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }

    private function processExpense($row, $user, $warehouse)
    {
        $date = $this->parseDate($row['txn_date'] ?? null);
        $ref = !empty($row['txn_ref_number_char']) ? $row['txn_ref_number_char'] : ('VY-E-' . ($row['txn_id'] ?? Str::random(6)));
        $amount = (float)($row['txn_cash_amount'] ?? 0);
        $tax = (float)($row['txn_tax_amount'] ?? 0);

        Expense::create([
            'category' => 'Vyapar Import',
            'amount' => $amount,
            'tax_amount' => $tax,
            'date' => $date,
            'description' => 'Imported from Vyapar: ' . ($row['txn_description'] ?? ''),
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    //  LINE ITEMS PROCESSOR (kb_lineitems - 31 columns)
    // ──────────────────────────────────────────────────────────────

    private function processLineItems($lineItemStmt, $txnRow, $parentId, $parentType, $itemMap, $date)
    {
        if (!$lineItemStmt || !isset($txnRow['txn_id'])) return;

        $lineItemStmt->execute([$txnRow['txn_id']]);

        while ($li = $lineItemStmt->fetch(\PDO::FETCH_ASSOC)) {
            $itemData = isset($li['item_id']) ? ($itemMap[$li['item_id']] ?? null) : null;
            if (!$itemData || !isset($itemData['id'])) continue;

            $qty = (float)($li['quantity'] ?? 1);
            $price = (float)($li['priceperunit'] ?? 0);
            $totalAmt = (float)($li['total_amount'] ?? ($qty * $price));
            $taxAmt = (float)($li['lineitem_tax_amount'] ?? 0);
            $discAmt = (float)($li['lineitem_discount_amount'] ?? 0);

            if ($parentType === 'sale') {
                SaleItem::create([
                    'sale_id' => $parentId,
                    'product_id' => $itemData['id'],
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'cost_price' => $itemData['cost'] ?? 0,
                    'subtotal' => $totalAmt,
                    'created_at' => $date,
                ]);
            } elseif ($parentType === 'purchase') {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $parentId,
                    'product_id' => $itemData['id'],
                    'quantity' => $qty,
                    'unit_cost' => $price,
                    'total_cost' => $totalAmt,
                    'created_at' => $date,
                ]);
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  UTILITY METHODS
    // ══════════════════════════════════════════════════════════════════

    /**
     * Find a table by EXACT name match (case-insensitive).
     * Uses same approach as the installer - no risky partial matching.
     */
    private function findTable($tables, $searches) {
        foreach ($searches as $search) {
            foreach ($tables as $t) {
                if (strtolower($t) === strtolower($search)) return $t;
            }
        }
        return null;
    }

    private function getColumns($pdo, $table) {
        try {
            $stmt = $pdo->query("PRAGMA table_info(\"$table\")");
            return $stmt->fetchAll(\PDO::FETCH_COLUMN, 1);
        } catch(\Exception $e) {
            return [];
        }
    }

    private function findCol($cols, $searches) {
        foreach ($searches as $search) {
            foreach ($cols as $c) {
                $cleanC = str_replace([' ', '_', '-'], '', strtolower($c));
                $cleanS = str_replace([' ', '_', '-'], '', strtolower($search));
                if ($cleanC === $cleanS) return $c;
            }
        }
        return null;
    }

    private function updateProgress($userId, $percent, $msg)
    {
        Cache::put('import_progress_' . $userId, ['percent' => $percent, 'message' => $msg], 300);
    }

    private function parseDate($val)
    {
        if (!$val) return now();
        if (is_numeric($val)) {
            if ($val > 20000000000) $val = $val / 1000;
            return Carbon::createFromTimestamp($val);
        }
        try {
            return Carbon::parse($val);
        } catch (\Exception $e) {
            return now();
        }
    }

    private function uniqueRef($model, $ref)
    {
        if ($model::where('reference_number', $ref)->exists()) {
            return $ref . '-' . Str::random(4);
        }
        return $ref;
    }

    private function safeImport($pdo, $sql, callable $callback, $label = '')
    {
        try {
            $stmt = $pdo->query($sql);
            $count = 0;
            $errors = 0;
            while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                try {
                    $callback($row);
                    $count++;
                } catch (\Exception $e) {
                    $errors++;
                    if ($errors <= 5) { // Log first 5 errors per section
                        Log::warning("Import row error in $label: " . $e->getMessage());
                    }
                }
            }
            if ($errors > 0) {
                Log::info("$label: imported $count rows, $errors errors");
            }
        } catch (\Exception $e) {
            Log::warning("Skipped $label: " . $e->getMessage());
        }
    }

    private function importFromCsv($filePath)
    {
        return ['success' => false, 'message' => 'CSV Import not modernized yet. Please use Vyapar Backup.']; 
    }
}
