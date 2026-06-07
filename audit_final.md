| File | Line | Query | Table Queried | Has tenant_id? | Classification |
|---|---|---|---|---|---|
| app/Console/Commands/CleanDemoData.php | 79 | DB::table($table)->truncate(); | dynamic | NO | REVIEW |
| app/Console/Commands/CleanExpiredDemoSessions.php | 1 | <?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\ | dynamic | YES | REVIEW |
| app/Console/Commands/CleanupDeadAccounts.php | 1 | <?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Co | dynamic | YES | REVIEW |
| app/Console/Commands/ConcurrencyTest.php | 36 | DB::table('inventory_batches')->where('notes', 'concurrency_test')->delete(); | inventory_batches | NO | LEAK |
| app/Console/Commands/MigrateOpeningBalances.php | 1 | <?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illu | accounts | NO | LEAK |
| app/Console/Commands/RepairInventoryBatches.php | 1 | <?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illu | products | NO | LEAK |
| app/Console/Commands/RunShadowMigration.php | 19 | $varianceAccount = DB::table('accounts')->where('code', '3999')->first(); | accounts | NO | LEAK |
| app/Console/Commands/RunShadowMigration.php | 21 | DB::table('accounts')->insert([ | accounts | NO | LEAK |
| app/Console/Commands/RunShadowMigration.php | 30 | $varianceAccount = DB::table('accounts')->where('code', '3999')->first(); | accounts | NO | LEAK |
| app/Console/Commands/RunShadowMigration.php | 43 | DB::table('sales')->orderBy('id')->chunk(500, function ($sales) use (&$errorCoun | sales | NO | LEAK |
| app/Console/Commands/RunShadowMigration.php | 47 | $items = DB::table('sale_items')->where('sale_id', $sale->id)->get(); | sale_items | NO | LEAK |
| app/Console/Commands/RunShadowMigration.php | 83 | $exists = DB::table('journal_entries')->where('source_id', $sale->id)->where('so | journal_entries | NO | LEAK |
| app/Console/Commands/RunShadowMigration.php | 86 | DB::table('journal_entries')->insert([ | journal_entries | NO | LEAK |
| app/Console/Commands/RunShadowMigration.php | 101 | DB::table('journal_items')->insert([ | journal_items | NO | LEAK |
| app/Console/Commands/RunShadowMigration.php | 106 | DB::table('journal_items')->insert([ | journal_items | NO | LEAK |
| app/Exports/ProductsExport.php | 1 | <?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Con | Product | NO | LEAK |
| app/Http/Controllers/Admin/SystemResetController.php | 128 | DB::table($table)->delete(); | dynamic | NO | REVIEW |
| app/Http/Controllers/Admin/SystemResetController.php | 134 | DB::table('accounts')->update(['balance' => 0]); | accounts | NO | LEAK |
| app/Http/Controllers/Admin/SystemResetController.php | 181 | if (Schema::hasTable($table)) DB::table($table)->delete(); | dynamic | NO | REVIEW |
| app/Http/Controllers/Admin/SystemResetController.php | 186 | DB::table('activity_log')->where('subject_type', 'like', '%Product%')->delete(); | activity_log | NO | LEAK |
| app/Http/Controllers/Admin/SystemResetController.php | 189 | DB::table('activities')->where('reference_type', 'like', '%Product%')->delete(); | activities | NO | LEAK |
| app/Http/Controllers/Admin/SystemResetController.php | 207 | if (Schema::hasTable($table)) DB::table($table)->delete(); | dynamic | NO | REVIEW |
| app/Http/Controllers/Admin/SystemResetController.php | 212 | DB::table('transactions')->whereIn('type', ['sale', 'payment_in', 'invoice', 'cr | transactions | NO | LEAK |
| app/Http/Controllers/Admin/SystemResetController.php | 217 | DB::table('payments')->delete(); // Safer to clear logic if selective | payments | NO | LEAK |
| app/Http/Controllers/Admin/SystemResetController.php | 222 | DB::table('activities')->whereIn('type', ['sale', 'payment_in', 'invoice', 'retu | activities | NO | LEAK |
| app/Http/Controllers/Admin/SystemResetController.php | 225 | DB::table('activity_log')->where('subject_type', 'like', '%Sale%')->orWhere('sub | activity_log | NO | LEAK |
| app/Http/Controllers/Admin/SystemResetController.php | 237 | DB::table('stocks')->update(['quantity' => 0]); | stocks | NO | LEAK |
| app/Http/Controllers/Admin/SystemResetController.php | 240 | DB::table('products')->update(['stock_quantity' => 0]); | products | NO | LEAK |
| app/Http/Controllers/Admin/SystemResetController.php | 243 | DB::table('product_variants')->update(['stock_quantity' => 0]); | product_variants | NO | LEAK |
| app/Http/Controllers/Admin/SystemResetController.php | 249 | if (Schema::hasTable($table)) DB::table($table)->delete(); | dynamic | NO | REVIEW |
| app/Http/Controllers/Admin/SystemResetController.php | 254 | DB::table('activities')->whereIn('type', ['adjustment', 'transfer', 'stock_take' | activities | NO | LEAK |
| app/Http/Controllers/Admin/SystemResetController.php | 262 | if (Schema::hasTable($table)) DB::table($table)->delete(); | dynamic | NO | REVIEW |
| app/Http/Controllers/Admin/SystemResetController.php | 265 | if (Schema::hasTable('accounts')) DB::table('accounts')->update(['balance' => 0] | accounts | NO | LEAK |
| app/Http/Controllers/AdminController.php | 1 | <?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Hel | Product | NO | LEAK |
| app/Http/Controllers/AiController.php | 1 | <?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illumin | sale_items | NO | LEAK |
| app/Http/Controllers/Api/BankAccountController.php | 1 | <?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller; | bank_accounts | NO | LEAK |
| app/Http/Controllers/Api/HeartbeatController.php | 1 | <?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller; | products | NO | LEAK |
| app/Http/Controllers/CookbookController.php | 1 | <?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use App\Models\Re | Warehouse | NO | LEAK |
| app/Http/Controllers/DataManagementController.php | 185 | }, \App\Models\Category::all()->take(50)->all()), | Category | NO | LEAK |
| app/Http/Controllers/DebitNoteController.php | 1 | <?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia | Warehouse | NO | LEAK |
| app/Http/Controllers/ExpenseController.php | 1 | <?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\E | journal_items | NO | LEAK |
| app/Http/Controllers/FinanceController.php | 28 | $receivables = (float) \Illuminate\Support\Facades\DB::table('journal_items') | journal_items | NO | LEAK |
| app/Http/Controllers/FinanceController.php | 37 | $payables = (float) \Illuminate\Support\Facades\DB::table('journal_items') | journal_items | NO | LEAK |
| app/Http/Controllers/FinanceController.php | 56 | $topReceivables = \Illuminate\Support\Facades\DB::table('journal_items') | journal_items | NO | LEAK |
| app/Http/Controllers/FinanceController.php | 69 | $topPayables = \Illuminate\Support\Facades\DB::table('journal_items') | journal_items | NO | LEAK |
| app/Http/Controllers/FinanceController.php | 111 | $parties = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Http/Controllers/FinanceController.php | 142 | $parties = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Http/Controllers/FinanceController.php | 319 | $fundIns = DB::table('fund_transactions') | fund_transactions | NO | LEAK |
| app/Http/Controllers/FinanceController.php | 323 | $fundOuts = DB::table('fund_transactions') | fund_transactions | NO | LEAK |
| app/Http/Controllers/FinanceController.php | 327 | $expenses = DB::table('expenses') | expenses | NO | LEAK |
| app/Http/Controllers/FinanceController.php | 337 | $deposits = DB::table('payments') | payments | NO | LEAK |
| app/Http/Controllers/FinanceController.php | 343 | $withdrawals = DB::table('payments') | payments | NO | LEAK |
| app/Http/Controllers/GrowthEngineController.php | 172 | $settings = DB::table('ai_settings')->pluck('value', 'key'); | ai_settings | NO | LEAK |
| app/Http/Controllers/GrowthEngineController.php | 195 | DB::table('ai_settings')->updateOrInsert( | ai_settings | NO | LEAK |
| app/Http/Controllers/GrowthEngineController.php | 267 | $rate = DB::table('ai_settings')->where('key', 'loyalty_redemption_rate')->value | ai_settings | NO | LEAK |
| app/Http/Controllers/HealthController.php | 1 | <?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Il | raw sql | NO | LEAK |
| app/Http/Controllers/InventoryController.php | 1 | <?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\C | Warehouse | NO | LEAK |
| app/Http/Controllers/PartyController.php | 1 | <?php

namespace App\Http\Controllers;

use App\Models\Party;
use App\Models\Inv | journal_items | NO | LEAK |
| app/Http/Controllers/ProposalController.php | 1 | <?php

namespace App\Http\Controllers;

use App\Models\Proposal;
use App\Models\ | journal_items | NO | LEAK |
| app/Http/Controllers/PurchaseController.php | 1 | <?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\P | journal_items | NO | LEAK |
| app/Http/Controllers/ReturnController.php | 1 | <?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Services\V3 | journal_items | NO | LEAK |
| app/Http/Controllers/SaleController.php | 275 | DB::table('sale_item_batches')->insert([ | sale_item_batches | NO | LEAK |
| app/Http/Controllers/SaleController.php | 585 | $totalPaid = (float) DB::table('payments') | payments | NO | LEAK |
| app/Http/Controllers/SaleController.php | 932 | $netAR = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Http/Controllers/SaleController.php | 940 | $netAP = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Http/Controllers/SalesOrderController.php | 1 | <?php

namespace App\Http\Controllers;

use App\Models\SalesOrder;
use App\Model | stocks | NO | LEAK |
| app/Http/Controllers/StockOperationsController.php | 1 | <?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\W | Warehouse | NO | LEAK |
| app/Http/Controllers/StockTakeController.php | 1 | <?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia | Warehouse | NO | LEAK |
| app/Http/Controllers/StockTransferController.php | 47 | 'warehouses' => \App\Models\Warehouse::all(), | Warehouse | NO | LEAK |
| app/Http/Controllers/TransactionController.php | 1 | <?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia | sales | NO | LEAK |
| app/Http/Controllers/V3/BadDebtController.php | 23 | $sale = DB::table('sales')->where('id', $saleId)->firstOrFail(); | sales | NO | LEAK |
| app/Http/Controllers/V3/BadDebtController.php | 38 | $allocated = (float) DB::table('payment_allocations') | payment_allocations | NO | LEAK |
| app/Http/Controllers/V3/BadDebtController.php | 82 | DB::table('sales') | sales | NO | LEAK |
| app/Http/Controllers/V3/BomController.php | 36 | DB::table('bill_of_materials') | bill_of_materials | NO | LEAK |
| app/Http/Controllers/V3/BomController.php | 45 | DB::table('bill_of_materials')->insert([ | bill_of_materials | NO | LEAK |
| app/Http/Controllers/V3/BomController.php | 57 | DB::table('bom_items')->insert([ | bom_items | NO | LEAK |
| app/Http/Controllers/V3/BomController.php | 69 | DB::table('products') | products | NO | LEAK |
| app/Http/Controllers/V3/BomController.php | 81 | $bom = DB::table('bill_of_materials')->where('id', $id)->firstOrFail(); | bill_of_materials | NO | LEAK |
| app/Http/Controllers/V3/BomController.php | 93 | $bom = DB::table('bill_of_materials')->where('id', $id)->firstOrFail(); | bill_of_materials | NO | LEAK |
| app/Http/Controllers/V3/BomController.php | 95 | $hasRuns = DB::table('production_runs') | production_runs | NO | LEAK |
| app/Http/Controllers/V3/BomController.php | 105 | DB::table('bom_items')->where('bom_id', $id)->delete(); | bom_items | NO | LEAK |
| app/Http/Controllers/V3/BomController.php | 106 | DB::table('bill_of_materials')->where('id', $id)->delete(); | bill_of_materials | NO | LEAK |
| app/Http/Controllers/V3/BounceController.php | 23 | $entry = DB::table('journal_entries') | journal_entries | NO | LEAK |
| app/Http/Controllers/V3/CustomerStatementController.php | 23 | $customer = DB::table('parties')->where('id', $customerId)->firstOrFail(); | parties | NO | LEAK |
| app/Http/Controllers/V3/CustomerStatementController.php | 29 | $transactions = DB::table('journal_entries as je') | journal_entries | NO | LEAK |
| app/Http/Controllers/V3/CustomerStatementController.php | 53 | $outstanding = DB::table('sales') | sales | NO | LEAK |
| app/Http/Controllers/V3/CustomerStatementController.php | 60 | $paid = (float) DB::table('payment_allocations') | payment_allocations | NO | LEAK |
| app/Http/Controllers/V3/DisasterClaimController.php | 58 | DB::table('disaster_claims')->insert([ | disaster_claims | NO | LEAK |
| app/Http/Controllers/V3/DisasterClaimController.php | 84 | $claim = DB::table('disaster_claims')->where('id', $id)->firstOrFail(); | disaster_claims | NO | LEAK |
| app/Http/Controllers/V3/DisasterClaimController.php | 106 | DB::table('disaster_claims')->where('id', $id)->update([ | disaster_claims | NO | LEAK |
| app/Http/Controllers/V3/EmployeeController.php | 21 | DB::table('employees')->insert([ | employees | NO | LEAK |
| app/Http/Controllers/V3/EmployeeController.php | 43 | $employee = DB::table('employees')->where('id', $id)->firstOrFail(); | employees | NO | LEAK |
| app/Http/Controllers/V3/EmployeeController.php | 51 | DB::table('employees')->where('id', $id)->update([ | employees | NO | LEAK |
| app/Http/Controllers/V3/InvoicePdfController.php | 13 | $sale = DB::table('sales as s') | sales | NO | LEAK |
| app/Http/Controllers/V3/InvoicePdfController.php | 27 | $items = DB::table('sale_items as si') | sale_items | NO | LEAK |
| app/Http/Controllers/V3/OpeningBalanceController.php | 120 | $entries = DB::table('journal_entries') | journal_entries | NO | LEAK |
| app/Http/Controllers/V3/OpeningBalanceController.php | 137 | $account = DB::table('accounts')->where('code', '7000')->first(); | accounts | NO | LEAK |
| app/Http/Controllers/V3/OpeningBalanceController.php | 140 | $row = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Http/Controllers/V3/PartyController.php | 27 | DB::table('parties')->insert([ | parties | NO | LEAK |
| app/Http/Controllers/V3/PriceTierController.php | 15 | $product = DB::table('products')->where('id', $productId)->firstOrFail(); | products | NO | LEAK |
| app/Http/Controllers/V3/PriceTierController.php | 17 | $tiers = DB::table('product_price_tiers') | product_price_tiers | NO | LEAK |
| app/Http/Controllers/V3/PriceTierController.php | 37 | $overlap = DB::table('product_price_tiers') | product_price_tiers | NO | LEAK |
| app/Http/Controllers/V3/PriceTierController.php | 58 | DB::table('product_price_tiers')->insert([ | product_price_tiers | NO | LEAK |
| app/Http/Controllers/V3/PriceTierController.php | 73 | DB::table('product_price_tiers') | product_price_tiers | NO | LEAK |
| app/Http/Controllers/V3/ProductController.php | 54 | DB::table('products')->insert([ | products | NO | LEAK |
| app/Http/Controllers/V3/ProductController.php | 88 | $priceTiers = DB::table('product_price_tiers') | product_price_tiers | NO | LEAK |
| app/Http/Controllers/V3/ProductController.php | 142 | $product = DB::table('products')->where('id', $id)->first(); | products | NO | LEAK |
| app/Http/Controllers/V3/PurchaseController.php | 170 | DB::table('purchases')->insert([ | purchases | NO | LEAK |
| app/Http/Controllers/V3/PurchaseController.php | 192 | DB::table('purchase_items')->insert([ | purchase_items | NO | LEAK |
| app/Http/Controllers/V3/PurchaseController.php | 216 | DB::table('purchase_items') | purchase_items | NO | LEAK |
| app/Http/Controllers/V3/PurchaseController.php | 221 | return DB::table('purchases') | purchases | NO | LEAK |
| app/Http/Controllers/V3/PurchaseController.php | 243 | $items = DB::table('purchase_items') | purchase_items | NO | LEAK |
| app/Http/Controllers/V3/PurchaseController.php | 254 | $journalEntry = DB::table('journal_entries') | journal_entries | NO | LEAK |
| app/Http/Controllers/V3/PurchaseController.php | 258 | $journalLines = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Http/Controllers/V3/PurchaseReturnController.php | 22 | $purchase = DB::table('purchases') | purchases | NO | LEAK |
| app/Http/Controllers/V3/PurchaseReturnController.php | 28 | $items = DB::table('purchase_items') | purchase_items | NO | LEAK |
| app/Http/Controllers/V3/PurchaseReturnController.php | 65 | $purchase = DB::table('purchases')->where('id', $purchaseId)->firstOrFail(); | purchases | NO | LEAK |
| app/Http/Controllers/V3/PurchaseReturnController.php | 73 | $batch = DB::table('inventory_batches') | inventory_batches | NO | LEAK |
| app/Http/Controllers/V3/PurchaseReturnController.php | 94 | DB::table('inventory_batches') | inventory_batches | NO | LEAK |
| app/Http/Controllers/V3/PurchaseReturnController.php | 127 | DB::table('purchase_returns')->insert([ | purchase_returns | NO | LEAK |
| app/Http/Controllers/V3/RoleController.php | 58 | DB::table('discount_limits') | discount_limits | NO | LEAK |
| app/Http/Controllers/V3/SalesOrderController.php | 137 | DB::table('sales')->where('id', $sale->id)->update([ | sales | NO | LEAK |
| app/Http/Controllers/V3/StockTransferController.php | 26 | $batches = DB::table('inventory_batches') | inventory_batches | NO | LEAK |
| app/Http/Controllers/V3/StockTransferController.php | 53 | DB::table('inventory_batches') | inventory_batches | NO | LEAK |
| app/Http/Controllers/V3/StockTransferController.php | 59 | DB::table('inventory_batches')->insert([ | inventory_batches | NO | LEAK |
| app/Http/Controllers/V3/SupplierPaymentController.php | 71 | $purchase = DB::table('purchases')->where('id', $purchaseId)->first(); | purchases | NO | LEAK |
| app/Http/Controllers/V3/SupplierPaymentController.php | 74 | $allocated = (float) DB::table('payment_allocations') | payment_allocations | NO | LEAK |
| app/Http/Controllers/V3/SupplierPaymentController.php | 94 | DB::table('purchases') | purchases | NO | LEAK |
| app/Http/Controllers/V3/UomConversionController.php | 15 | $product = DB::table('products')->where('id', $productId)->firstOrFail(); | products | NO | LEAK |
| app/Http/Controllers/V3/UomConversionController.php | 62 | $inUse = DB::table('sale_items') | sale_items | NO | LEAK |
| app/Http/Controllers/V3/WarehouseController.php | 60 | DB::table('warehouses')->insert([ | warehouses | NO | LEAK |
| app/Http/Requests/V3/StoreSaleRequest.php | 52 | $maxDiscount = \Illuminate\Support\Facades\DB::table('discount_limits') | discount_limits | NO | LEAK |
| app/Models/BankAccount.php | 1 | <?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illumi | journal_items | NO | LEAK |
| app/Services/BackupService.php | 61 | $createTable = DB::select("SHOW CREATE TABLE `$table`"); | raw sql | NO | LEAK |
| app/Services/BackupService.php | 72 | DB::table($table)->orderBy(DB::raw('1'))->chunk(100, function ($rows) use (&$out | dynamic | NO | REVIEW |
| app/Services/DataImportService.php | 128 | DB::table('warehouses')->where('id', $warehouse->id)->update(['is_default' => tr | warehouses | NO | LEAK |
| app/Services/FinancialReportingService.php | 567 | $items = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Services/FinancialReportingService.php | 639 | $details = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Services/FinancialReportingService.php | 680 | $inflow = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Services/FinancialReportingService.php | 688 | $outflow = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Services/V3/AccountingService.php | 215 | $original = DB::table('journal_entries') | journal_entries | NO | LEAK |
| app/Services/V3/AccountingService.php | 233 | $originalLines = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Services/V3/AccountingService.php | 239 | 'account_code' => DB::table('accounts')->where('id', $line->account_id)->value(' | accounts | NO | LEAK |
| app/Services/V3/AccountingService.php | 257 | DB::table('journal_entries') | journal_entries | NO | LEAK |
| app/Services/V3/AuditService.php | 25 | DB::table('audit_logs')->insert([ | audit_logs | NO | LEAK |
| app/Services/V3/FifoService.php | 31 | $totalAvailable = DB::table('inventory_batches') | inventory_batches | NO | LEAK |
| app/Services/V3/FifoService.php | 44 | $batches = DB::table('inventory_batches') | inventory_batches | NO | LEAK |
| app/Services/V3/FifoService.php | 62 | DB::table('inventory_batches') | inventory_batches | NO | LEAK |
| app/Services/V3/FifoService.php | 88 | $rows = DB::table('sale_item_batches') | sale_item_batches | NO | LEAK |
| app/Services/V3/FifoService.php | 94 | DB::table('inventory_batches') | inventory_batches | NO | LEAK |
| app/Services/V3/FifoService.php | 98 | DB::table('sale_item_batches') | sale_item_batches | NO | LEAK |
| app/Services/V3/FifoService.php | 121 | DB::table('inventory_batches')->insert([ | inventory_batches | NO | LEAK |
| app/Services/V3/FifoService.php | 137 | return DB::table('inventory_batches')->where('id', $id)->first(); | inventory_batches | NO | LEAK |
| app/Services/V3/FifoService.php | 157 | $batches = DB::table('inventory_batches') | inventory_batches | NO | LEAK |
| app/Services/V3/FifoService.php | 174 | DB::table('inventory_batches') | inventory_batches | NO | LEAK |
| app/Services/V3/FifoService.php | 200 | $available = DB::table('inventory_batches') | inventory_batches | NO | LEAK |
| app/Services/V3/InventoryService.php | 29 | $purchase = DB::table('purchases')->where('id', $purchaseId)->first(); | purchases | NO | LEAK |
| app/Services/V3/InventoryService.php | 34 | $items = DB::table('purchase_items') | purchase_items | NO | LEAK |
| app/Services/V3/InventoryService.php | 49 | DB::table('purchase_items') | purchase_items | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 31 | $bom = DB::table('bill_of_materials') | bill_of_materials | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 36 | $bomItems = DB::table('bom_items') | bom_items | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 63 | DB::table('production_run_materials')->insertOrIgnore([ | production_run_materials | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 113 | DB::table('production_runs')->insert([ | production_runs | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 134 | return DB::table('production_runs')->where('id', $runId)->first(); | production_runs | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 155 | $run = DB::table('production_runs') | production_runs | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 161 | $bom      = DB::table('bill_of_materials')->where('id', $run->bom_id)->first(); | bill_of_materials | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 162 | $bomItems = DB::table('bom_items')->where('bom_id', $bom->id)->get(); | bom_items | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 242 | DB::table('production_runs')->where('id', $runId)->update([ | production_runs | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 264 | $run = DB::table('production_runs') | production_runs | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 286 | productId:   DB::table('bill_of_materials') | bill_of_materials | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 307 | DB::table('production_runs')->where('id', $runId)->update([ | production_runs | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 325 | $disassemblyBom = DB::table('disassembly_boms') | disassembly_boms | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 329 | $components = DB::table('disassembly_bom_items') | disassembly_bom_items | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 389 | $runBatchIds = DB::table('inventory_batches') | inventory_batches | NO | LEAK |
| app/Services/V3/ManufacturingService.php | 394 | return (float) DB::table('sale_item_batches') | sale_item_batches | NO | LEAK |
| app/Services/V3/PartyService.php | 24 | $account = DB::table('accounts')->where('code', $accountCode)->first(); | accounts | NO | LEAK |
| app/Services/V3/PartyService.php | 28 | $accountIds = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Services/V3/PartyService.php | 48 | $account = DB::table('accounts')->where('code', $accountCode)->first(); | accounts | NO | LEAK |
| app/Services/V3/PartyService.php | 51 | $snapshot = DB::table('party_snapshots') | party_snapshots | NO | LEAK |
| app/Services/V3/PartyService.php | 63 | $rebuilt = DB::table('party_snapshots') | party_snapshots | NO | LEAK |
| app/Services/V3/PartyService.php | 78 | $totals = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Services/V3/PartyService.php | 93 | $existing = DB::table('party_snapshots') | party_snapshots | NO | LEAK |
| app/Services/V3/PartyService.php | 99 | DB::table('party_snapshots') | party_snapshots | NO | LEAK |
| app/Services/V3/PartyService.php | 107 | DB::table('party_snapshots')->insert([ | party_snapshots | NO | LEAK |
| app/Services/V3/PaymentService.php | 45 | DB::table('payment_allocations')->insert([ | payment_allocations | NO | LEAK |
| app/Services/V3/PaymentService.php | 70 | $sale = DB::table('sales')->where('id', $saleId)->first(); | sales | NO | LEAK |
| app/Services/V3/PaymentService.php | 76 | $allocated = (float) DB::table('payment_allocations') | payment_allocations | NO | LEAK |
| app/Services/V3/PaymentService.php | 97 | DB::table('sales') | sales | NO | LEAK |
| app/Services/V3/PaymentService.php | 118 | $affected = DB::table('payment_allocations') | payment_allocations | NO | LEAK |
| app/Services/V3/PaymentService.php | 124 | DB::table('payment_allocations') | payment_allocations | NO | LEAK |
| app/Services/V3/PaymentService.php | 151 | $invoice = DB::table($table)->where('id', $invoiceId)->first(); | dynamic | NO | REVIEW |
| app/Services/V3/PaymentService.php | 158 | $alreadyAllocated = (float) DB::table('payment_allocations') | payment_allocations | NO | LEAK |
| app/Services/V3/ReportService.php | 248 | $rows = DB::table('journal_items as ji') | journal_items | NO | LEAK |
| app/Services/V3/ReportService.php | 377 | $allocated = (float) DB::table('payment_allocations') | payment_allocations | NO | LEAK |
| app/Services/V3/ReportService.php | 434 | $allocated = (float) DB::table('payment_allocations') | payment_allocations | NO | LEAK |
| app/Services/V3/ReportService.php | 735 | $openingBalance = (float) DB::table('journal_items as ji') | journal_items | NO | LEAK |
| app/Services/V3/ReportService.php | 769 | $inflows = DB::table('inventory_batches as ib') | inventory_batches | NO | LEAK |
| app/Services/V3/ReportService.php | 791 | $outflows = DB::table('sale_item_batches as sib') | sale_item_batches | NO | LEAK |
| app/Services/V3/ReportService.php | 847 | $account = DB::table('accounts')->where('code', $code)->first(); | accounts | NO | LEAK |
| app/Services/V3/ReportService.php | 850 | $result = DB::table('journal_items as ji') | journal_items | NO | LEAK |
| app/Services/V3/SaleService.php | 228 | DB::table('sales')->insert([ | sales | NO | LEAK |
| app/Services/V3/SaleService.php | 259 | DB::table('sale_items')->insert([ | sale_items | NO | LEAK |
| app/Services/V3/SaleService.php | 280 | DB::table('sale_item_batches')->insert([ | sale_item_batches | NO | LEAK |
| app/Services/V3/SaleService.php | 310 | $advanceBalance = (float) (DB::table('journal_items as ji') | journal_items | NO | LEAK |
| app/Services/V3/SaleService.php | 350 | return DB::table('sales')->where('id', $saleId)->first(); | sales | NO | LEAK |
| app/Services/V3/SaleService.php | 372 | $sale = DB::table('sales')->where('id', $saleId)->lockForUpdate()->firstOrFail() | sales | NO | LEAK |
| app/Services/V3/SaleService.php | 379 | $saleItems = DB::table('sale_items')->where('sale_id', $saleId)->get(); | sale_items | NO | LEAK |
| app/Services/V3/SaleService.php | 388 | DB::table('sales')->where('id', $saleId)->update([ | sales | NO | LEAK |
| app/Services/V3/SaleService.php | 393 | return DB::table('sales')->where('id', $saleId)->first(); | sales | NO | LEAK |
| app/Services/V3/SaleService.php | 408 | $tiers = DB::table('product_price_tiers') | product_price_tiers | NO | LEAK |
| app/Services/V3/SettlementService.php | 31 | $employee = DB::table('employees') | employees | NO | LEAK |
| app/Services/V3/SettlementService.php | 118 | DB::table('employees') | employees | NO | LEAK |
| app/Services/V3/TaxService.php | 87 | $account2200 = DB::table('accounts')->where('code', '2200')->first(); | accounts | NO | LEAK |
| app/Services/V3/TaxService.php | 88 | $account2300 = DB::table('accounts')->where('code', '2300')->first(); | accounts | NO | LEAK |
| app/Services/V3/TaxService.php | 93 | $row = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Services/V3/TaxService.php | 113 | $row = DB::table('journal_items') | journal_items | NO | LEAK |
| app/Services/V3/UomService.php | 34 | $product = DB::table('products')->where('id', $productId)->first(); | products | NO | LEAK |


Total LEAK count: 207
Total SAFE count: 105
Total REVIEW count: 10

Exact fixes needed for leaks:
- app/Console/Commands/ConcurrencyTest.php:36 -> [Fix A]
- app/Console/Commands/MigrateOpeningBalances.php:1 -> [Fix A]
- app/Console/Commands/RepairInventoryBatches.php:1 -> [Fix A]
- app/Console/Commands/RunShadowMigration.php:19 -> [Fix A]
- app/Console/Commands/RunShadowMigration.php:21 -> [Fix A]
- app/Console/Commands/RunShadowMigration.php:30 -> [Fix A]
- app/Console/Commands/RunShadowMigration.php:43 -> [Fix A]
- app/Console/Commands/RunShadowMigration.php:47 -> [Fix A]
- app/Console/Commands/RunShadowMigration.php:83 -> [Fix A]
- app/Console/Commands/RunShadowMigration.php:86 -> [Fix A]
- app/Console/Commands/RunShadowMigration.php:101 -> [Fix A]
- app/Console/Commands/RunShadowMigration.php:106 -> [Fix A]
- app/Exports/ProductsExport.php:1 -> [Fix B]
- app/Http/Controllers/Admin/SystemResetController.php:134 -> [Fix A]
- app/Http/Controllers/Admin/SystemResetController.php:186 -> [Fix A]
- app/Http/Controllers/Admin/SystemResetController.php:189 -> [Fix A]
- app/Http/Controllers/Admin/SystemResetController.php:212 -> [Fix A]
- app/Http/Controllers/Admin/SystemResetController.php:217 -> [Fix A]
- app/Http/Controllers/Admin/SystemResetController.php:222 -> [Fix A]
- app/Http/Controllers/Admin/SystemResetController.php:225 -> [Fix A]
- app/Http/Controllers/Admin/SystemResetController.php:237 -> [Fix A]
- app/Http/Controllers/Admin/SystemResetController.php:240 -> [Fix A]
- app/Http/Controllers/Admin/SystemResetController.php:243 -> [Fix A]
- app/Http/Controllers/Admin/SystemResetController.php:254 -> [Fix A]
- app/Http/Controllers/Admin/SystemResetController.php:265 -> [Fix A]
- app/Http/Controllers/AdminController.php:1 -> [Fix B]
- app/Http/Controllers/AiController.php:1 -> [Fix A]
- app/Http/Controllers/Api/BankAccountController.php:1 -> [Fix A]
- app/Http/Controllers/Api/HeartbeatController.php:1 -> [Fix A]
- app/Http/Controllers/CookbookController.php:1 -> [Fix B]
- app/Http/Controllers/DataManagementController.php:185 -> [Fix B]
- app/Http/Controllers/DebitNoteController.php:1 -> [Fix B]
- app/Http/Controllers/ExpenseController.php:1 -> [Fix A]
- app/Http/Controllers/FinanceController.php:28 -> [Fix A]
- app/Http/Controllers/FinanceController.php:37 -> [Fix A]
- app/Http/Controllers/FinanceController.php:56 -> [Fix A]
- app/Http/Controllers/FinanceController.php:69 -> [Fix A]
- app/Http/Controllers/FinanceController.php:111 -> [Fix A]
- app/Http/Controllers/FinanceController.php:142 -> [Fix A]
- app/Http/Controllers/FinanceController.php:319 -> [Fix A]
- app/Http/Controllers/FinanceController.php:323 -> [Fix A]
- app/Http/Controllers/FinanceController.php:327 -> [Fix A]
- app/Http/Controllers/FinanceController.php:337 -> [Fix A]
- app/Http/Controllers/FinanceController.php:343 -> [Fix A]
- app/Http/Controllers/GrowthEngineController.php:172 -> [Fix A]
- app/Http/Controllers/GrowthEngineController.php:195 -> [Fix A]
- app/Http/Controllers/GrowthEngineController.php:267 -> [Fix A]
- app/Http/Controllers/HealthController.php:1 -> [Fix A]
- app/Http/Controllers/InventoryController.php:1 -> [Fix B]
- app/Http/Controllers/PartyController.php:1 -> [Fix A]
- app/Http/Controllers/ProposalController.php:1 -> [Fix A]
- app/Http/Controllers/PurchaseController.php:1 -> [Fix A]
- app/Http/Controllers/ReturnController.php:1 -> [Fix A]
- app/Http/Controllers/SaleController.php:275 -> [Fix A]
- app/Http/Controllers/SaleController.php:585 -> [Fix A]
- app/Http/Controllers/SaleController.php:932 -> [Fix A]
- app/Http/Controllers/SaleController.php:940 -> [Fix A]
- app/Http/Controllers/SalesOrderController.php:1 -> [Fix A]
- app/Http/Controllers/StockOperationsController.php:1 -> [Fix B]
- app/Http/Controllers/StockTakeController.php:1 -> [Fix B]
- app/Http/Controllers/StockTransferController.php:47 -> [Fix B]
- app/Http/Controllers/TransactionController.php:1 -> [Fix A]
- app/Http/Controllers/V3/BadDebtController.php:23 -> [Fix A]
- app/Http/Controllers/V3/BadDebtController.php:38 -> [Fix A]
- app/Http/Controllers/V3/BadDebtController.php:82 -> [Fix A]
- app/Http/Controllers/V3/BomController.php:36 -> [Fix A]
- app/Http/Controllers/V3/BomController.php:45 -> [Fix A]
- app/Http/Controllers/V3/BomController.php:57 -> [Fix A]
- app/Http/Controllers/V3/BomController.php:69 -> [Fix A]
- app/Http/Controllers/V3/BomController.php:81 -> [Fix A]
- app/Http/Controllers/V3/BomController.php:93 -> [Fix A]
- app/Http/Controllers/V3/BomController.php:95 -> [Fix A]
- app/Http/Controllers/V3/BomController.php:105 -> [Fix A]
- app/Http/Controllers/V3/BomController.php:106 -> [Fix A]
- app/Http/Controllers/V3/BounceController.php:23 -> [Fix A]
- app/Http/Controllers/V3/CustomerStatementController.php:23 -> [Fix A]
- app/Http/Controllers/V3/CustomerStatementController.php:29 -> [Fix A]
- app/Http/Controllers/V3/CustomerStatementController.php:53 -> [Fix A]
- app/Http/Controllers/V3/CustomerStatementController.php:60 -> [Fix A]
- app/Http/Controllers/V3/DisasterClaimController.php:58 -> [Fix A]
- app/Http/Controllers/V3/DisasterClaimController.php:84 -> [Fix A]
- app/Http/Controllers/V3/DisasterClaimController.php:106 -> [Fix A]
- app/Http/Controllers/V3/EmployeeController.php:21 -> [Fix A]
- app/Http/Controllers/V3/EmployeeController.php:43 -> [Fix A]
- app/Http/Controllers/V3/EmployeeController.php:51 -> [Fix A]
- app/Http/Controllers/V3/InvoicePdfController.php:13 -> [Fix A]
- app/Http/Controllers/V3/InvoicePdfController.php:27 -> [Fix A]
- app/Http/Controllers/V3/OpeningBalanceController.php:120 -> [Fix A]
- app/Http/Controllers/V3/OpeningBalanceController.php:137 -> [Fix A]
- app/Http/Controllers/V3/OpeningBalanceController.php:140 -> [Fix A]
- app/Http/Controllers/V3/PartyController.php:27 -> [Fix A]
- app/Http/Controllers/V3/PriceTierController.php:15 -> [Fix A]
- app/Http/Controllers/V3/PriceTierController.php:17 -> [Fix A]
- app/Http/Controllers/V3/PriceTierController.php:37 -> [Fix A]
- app/Http/Controllers/V3/PriceTierController.php:58 -> [Fix A]
- app/Http/Controllers/V3/PriceTierController.php:73 -> [Fix A]
- app/Http/Controllers/V3/ProductController.php:54 -> [Fix A]
- app/Http/Controllers/V3/ProductController.php:88 -> [Fix A]
- app/Http/Controllers/V3/ProductController.php:142 -> [Fix A]
- app/Http/Controllers/V3/PurchaseController.php:170 -> [Fix A]
- app/Http/Controllers/V3/PurchaseController.php:192 -> [Fix A]
- app/Http/Controllers/V3/PurchaseController.php:216 -> [Fix A]
- app/Http/Controllers/V3/PurchaseController.php:221 -> [Fix A]
- app/Http/Controllers/V3/PurchaseController.php:243 -> [Fix A]
- app/Http/Controllers/V3/PurchaseController.php:254 -> [Fix A]
- app/Http/Controllers/V3/PurchaseController.php:258 -> [Fix A]
- app/Http/Controllers/V3/PurchaseReturnController.php:22 -> [Fix A]
- app/Http/Controllers/V3/PurchaseReturnController.php:28 -> [Fix A]
- app/Http/Controllers/V3/PurchaseReturnController.php:65 -> [Fix A]
- app/Http/Controllers/V3/PurchaseReturnController.php:73 -> [Fix A]
- app/Http/Controllers/V3/PurchaseReturnController.php:94 -> [Fix A]
- app/Http/Controllers/V3/PurchaseReturnController.php:127 -> [Fix A]
- app/Http/Controllers/V3/RoleController.php:58 -> [Fix A]
- app/Http/Controllers/V3/SalesOrderController.php:137 -> [Fix A]
- app/Http/Controllers/V3/StockTransferController.php:26 -> [Fix A]
- app/Http/Controllers/V3/StockTransferController.php:53 -> [Fix A]
- app/Http/Controllers/V3/StockTransferController.php:59 -> [Fix A]
- app/Http/Controllers/V3/SupplierPaymentController.php:71 -> [Fix A]
- app/Http/Controllers/V3/SupplierPaymentController.php:74 -> [Fix A]
- app/Http/Controllers/V3/SupplierPaymentController.php:94 -> [Fix A]
- app/Http/Controllers/V3/UomConversionController.php:15 -> [Fix A]
- app/Http/Controllers/V3/UomConversionController.php:62 -> [Fix A]
- app/Http/Controllers/V3/WarehouseController.php:60 -> [Fix A]
- app/Http/Requests/V3/StoreSaleRequest.php:52 -> [Fix A]
- app/Models/BankAccount.php:1 -> [Fix A]
- app/Services/BackupService.php:61 -> [Fix A]
- app/Services/DataImportService.php:128 -> [Fix A]
- app/Services/FinancialReportingService.php:567 -> [Fix A]
- app/Services/FinancialReportingService.php:639 -> [Fix A]
- app/Services/FinancialReportingService.php:680 -> [Fix A]
- app/Services/FinancialReportingService.php:688 -> [Fix A]
- app/Services/V3/AccountingService.php:215 -> [Fix A]
- app/Services/V3/AccountingService.php:233 -> [Fix A]
- app/Services/V3/AccountingService.php:239 -> [Fix A]
- app/Services/V3/AccountingService.php:257 -> [Fix A]
- app/Services/V3/AuditService.php:25 -> [Fix A]
- app/Services/V3/FifoService.php:31 -> [Fix A]
- app/Services/V3/FifoService.php:44 -> [Fix A]
- app/Services/V3/FifoService.php:62 -> [Fix A]
- app/Services/V3/FifoService.php:88 -> [Fix A]
- app/Services/V3/FifoService.php:94 -> [Fix A]
- app/Services/V3/FifoService.php:98 -> [Fix A]
- app/Services/V3/FifoService.php:121 -> [Fix A]
- app/Services/V3/FifoService.php:137 -> [Fix A]
- app/Services/V3/FifoService.php:157 -> [Fix A]
- app/Services/V3/FifoService.php:174 -> [Fix A]
- app/Services/V3/FifoService.php:200 -> [Fix A]
- app/Services/V3/InventoryService.php:29 -> [Fix A]
- app/Services/V3/InventoryService.php:34 -> [Fix A]
- app/Services/V3/InventoryService.php:49 -> [Fix A]
- app/Services/V3/ManufacturingService.php:31 -> [Fix A]
- app/Services/V3/ManufacturingService.php:36 -> [Fix A]
- app/Services/V3/ManufacturingService.php:63 -> [Fix A]
- app/Services/V3/ManufacturingService.php:113 -> [Fix A]
- app/Services/V3/ManufacturingService.php:134 -> [Fix A]
- app/Services/V3/ManufacturingService.php:155 -> [Fix A]
- app/Services/V3/ManufacturingService.php:161 -> [Fix A]
- app/Services/V3/ManufacturingService.php:162 -> [Fix A]
- app/Services/V3/ManufacturingService.php:242 -> [Fix A]
- app/Services/V3/ManufacturingService.php:264 -> [Fix A]
- app/Services/V3/ManufacturingService.php:286 -> [Fix A]
- app/Services/V3/ManufacturingService.php:307 -> [Fix A]
- app/Services/V3/ManufacturingService.php:325 -> [Fix A]
- app/Services/V3/ManufacturingService.php:329 -> [Fix A]
- app/Services/V3/ManufacturingService.php:389 -> [Fix A]
- app/Services/V3/ManufacturingService.php:394 -> [Fix A]
- app/Services/V3/PartyService.php:24 -> [Fix A]
- app/Services/V3/PartyService.php:28 -> [Fix A]
- app/Services/V3/PartyService.php:48 -> [Fix A]
- app/Services/V3/PartyService.php:51 -> [Fix A]
- app/Services/V3/PartyService.php:63 -> [Fix A]
- app/Services/V3/PartyService.php:78 -> [Fix A]
- app/Services/V3/PartyService.php:93 -> [Fix A]
- app/Services/V3/PartyService.php:99 -> [Fix A]
- app/Services/V3/PartyService.php:107 -> [Fix A]
- app/Services/V3/PaymentService.php:45 -> [Fix A]
- app/Services/V3/PaymentService.php:70 -> [Fix A]
- app/Services/V3/PaymentService.php:76 -> [Fix A]
- app/Services/V3/PaymentService.php:97 -> [Fix A]
- app/Services/V3/PaymentService.php:118 -> [Fix A]
- app/Services/V3/PaymentService.php:124 -> [Fix A]
- app/Services/V3/PaymentService.php:158 -> [Fix A]
- app/Services/V3/ReportService.php:248 -> [Fix A]
- app/Services/V3/ReportService.php:377 -> [Fix A]
- app/Services/V3/ReportService.php:434 -> [Fix A]
- app/Services/V3/ReportService.php:735 -> [Fix A]
- app/Services/V3/ReportService.php:769 -> [Fix A]
- app/Services/V3/ReportService.php:791 -> [Fix A]
- app/Services/V3/ReportService.php:847 -> [Fix A]
- app/Services/V3/ReportService.php:850 -> [Fix A]
- app/Services/V3/SaleService.php:228 -> [Fix A]
- app/Services/V3/SaleService.php:259 -> [Fix A]
- app/Services/V3/SaleService.php:280 -> [Fix A]
- app/Services/V3/SaleService.php:310 -> [Fix A]
- app/Services/V3/SaleService.php:350 -> [Fix A]
- app/Services/V3/SaleService.php:372 -> [Fix A]
- app/Services/V3/SaleService.php:379 -> [Fix A]
- app/Services/V3/SaleService.php:388 -> [Fix A]
- app/Services/V3/SaleService.php:393 -> [Fix A]
- app/Services/V3/SaleService.php:408 -> [Fix A]
- app/Services/V3/SettlementService.php:31 -> [Fix A]
- app/Services/V3/SettlementService.php:118 -> [Fix A]
- app/Services/V3/TaxService.php:87 -> [Fix A]
- app/Services/V3/TaxService.php:88 -> [Fix A]
- app/Services/V3/TaxService.php:93 -> [Fix A]
- app/Services/V3/TaxService.php:113 -> [Fix A]
- app/Services/V3/UomService.php:34 -> [Fix A]
