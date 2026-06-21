<?php

namespace Tester\tests\Feature\Money;

use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Party;
use App\Models\Sale;
use App\Models\Stock;
use App\Models\Account;
use App\Models\Category;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Tests\Feature\VenQoreTestCase;

class ReportReconciliationTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    /**
     * Helper to seed standard reconciliation scenario data.
     */
    private function seedScenario($tenant, $tz = 'UTC')
    {
        $tenant->update(['timezone' => $tz]);
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        // Force enable stock management
        \App\Models\Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'manage_stock'],
            ['value' => '1']
        );
        SettingsHelper::clearCache();

        $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

        $customer = Party::factory()->create([
            'tenant_id' => $tenant->id,
            'type' => 'customer',
            'credit_limit' => null
        ]);

        $supplier = Party::factory()->create([
            'tenant_id' => $tenant->id,
            'type' => 'supplier'
        ]);

        $productA = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'price' => 100.00,
            'cost_price' => 40.00,
            'tax_rate' => 10,
        ]);

        $productB = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'price' => 200.00,
            'cost_price' => 100.00,
            'tax_rate' => 10,
        ]);

        Stock::updateOrCreate(['product_id' => $productA->id, 'warehouse_id' => $warehouseId], ['quantity' => 100]);
        Stock::updateOrCreate(['product_id' => $productB->id, 'warehouse_id' => $warehouseId], ['quantity' => 100]);

        // Seed FIFO batches
        DB::table('inventory_batches')->insert([
            [
                'id' => Str::uuid()->toString(),
                'tenant_id' => $tenant->id,
                'product_id' => $productA->id,
                'warehouse_id' => $warehouseId,
                'unit_cost' => 40.00,
                'original_qty' => 100,
                'initial_qty' => 100,
                'remaining_qty' => 100,
                'created_at' => now()->subMinutes(10),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid()->toString(),
                'tenant_id' => $tenant->id,
                'product_id' => $productB->id,
                'warehouse_id' => $warehouseId,
                'unit_cost' => 100.00,
                'original_qty' => 100,
                'initial_qty' => 100,
                'remaining_qty' => 100,
                'created_at' => now()->subMinutes(5),
                'updated_at' => now(),
            ]
        ]);

        return [$warehouseId, $customer, $supplier, $productA, $productB];
    }

    /**
     * TIER 1 - profitLoss
     */
    public function test_profitLoss_reconciles_to_direct_db_aggregate()
    {
        $tenant = $this->createTenant('pnl-recon', 'ltd_3');
        [$warehouseId, $customer, $supplier, $productA, $productB] = $this->seedScenario($tenant);

        // Sale 1: Cash sale
        $response1 = $this->post($this->storeUrl($tenant, 'sales'), [
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouseId,
            'items' => [
                ['product_id' => $productA->id, 'quantity' => 5, 'price' => 100.00, 'discount' => 0.00],
                ['product_id' => $productB->id, 'quantity' => 2, 'price' => 200.00, 'discount' => 0.00]
            ],
            'discount' => 100.00,
            'payment_method' => 'cash',
            'amount_paid' => 880.00, // 800 net + 80 tax
        ]);
        $response1->assertStatus(200);
        $sale1Id = $response1->json('sale_id');

        // Sale 2: Credit sale
        $response2 = $this->post($this->storeUrl($tenant, 'sales'), [
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouseId,
            'items' => [
                ['product_id' => $productA->id, 'quantity' => 2, 'price' => 100.00, 'discount' => 0.00]
            ],
            'discount' => 0.00,
            'payment_method' => 'credit',
            'amount_paid' => 0.00,
            'add_to_ledger' => true,
        ]);
        $response2->assertStatus(200);

        // Return 1 from Sale 1
        $sale1ItemAId = DB::table('sale_items')->where('sale_id', $sale1Id)->where('product_id', $productA->id)->value('id');
        $returnResponse = $this->post($this->storeUrl($tenant, "sales/{$sale1Id}/return"), [
            'items' => [['id' => $sale1ItemAId, 'quantity' => 1]],
            'refund_method' => 'cash',
            'refund_source' => 'cash_drawer',
            'reason' => 'return unit',
        ]);
        $returnResponse->assertSessionHasNoErrors();
        $returnResponse->assertRedirect();

        // Sale 3: Cancelled sale instead of manual soft-delete
        $response3 = $this->post($this->storeUrl($tenant, 'sales'), [
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouseId,
            'items' => [
                ['product_id' => $productA->id, 'quantity' => 10, 'price' => 100.00, 'discount' => 0.00]
            ],
            'discount' => 0.00,
            'payment_method' => 'cash',
            'amount_paid' => 1100.00,
        ]);
        $response3->assertStatus(200);
        $sale3Id = $response3->json('sale_id');
        
        // Correctly cancel/void Sale 3 to reverse journal entries as well
        $this->post($this->storeUrl($tenant, "sales/{$sale3Id}/cancel"))->assertStatus(302);

        // Get report
        $start = Carbon::now()->startOfMonth()->toDateString();
        $end = Carbon::now()->endOfMonth()->toDateString();
        $reportResponse = $this->get($this->storeUrl($tenant, "reports/profit-loss?start_date={$start}&end_date={$end}&range=custom"));
        $reportResponse->assertStatus(200);
        $props = $reportResponse->viewData('page')['props'];
        $stats = $props['stats'];

        // Compute independent DB aggregates
        $items = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.tenant_id', $tenant->id)
            ->whereNull('sales.deleted_at')
            ->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
            ->whereBetween('sales.posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->select('sale_items.*')
            ->get();

        $dbRevenue = 0.0;
        $dbCogs = 0.0;
        foreach ($items as $item) {
            $net = $item->net_amount ?: $item->subtotal;
            $keptQty = $item->quantity - ($item->returned_quantity ?? 0);
            $dbRevenue += $net * ($keptQty / $item->quantity);

            $fifoCogs = DB::table('sale_item_batches')
                ->where('sale_item_id', $item->id)
                ->where('is_reversed', 0)
                ->sum('total_cogs');
            
            if ($fifoCogs == 0) {
                $fifoCogs = $item->cost_price * $item->quantity;
            }

            // Scale COGS for returned units
            $dbCogs += $fifoCogs * ($keptQty / $item->quantity);
        }

        // Subtract global discount from P&L revenue to align with the ledger and reports
        $globalDiscountTotal = DB::table('sales')
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->whereIn('status', ['posted', 'partially_returned', 'returned'])
            ->whereBetween('posted_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->sum('global_discount');
        $dbRevenue -= $globalDiscountTotal;

        $dbGrossProfit = $dbRevenue - $dbCogs;

        $this->assertEquals($dbRevenue, (float)$stats['revenue'], "Revenue mismatch");
        $this->assertEquals($dbCogs, (float)$stats['cogs'], "COGS mismatch");
        $this->assertEquals($dbGrossProfit, (float)$stats['gross_profit'], "Gross Profit mismatch");
    }

    /**
     * TIER 1 - itemWiseProfit
     */
    public function test_itemWiseProfit_reconciles_to_direct_db_aggregate()
    {
        $tenant = $this->createTenant('item-recon', 'ltd_3');
        [$warehouseId, $customer, $supplier, $productA, $productB] = $this->seedScenario($tenant);

        // Sale 1
        $response1 = $this->post($this->storeUrl($tenant, 'sales'), [
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouseId,
            'items' => [
                ['product_id' => $productA->id, 'quantity' => 15, 'price' => 200.00, 'discount' => 0.00]
            ],
            'discount' => 0.00,
            'payment_method' => 'cash',
            'amount_paid' => 3000.00,
        ]);
        $response1->assertStatus(200);
        $sale1Id = $response1->json('sale_id');
        $itemId = DB::table('sale_items')->where('sale_id', $sale1Id)->value('id');

        // Return 2 units
        $this->post($this->storeUrl($tenant, "sales/{$sale1Id}/return"), [
            'items' => [['id' => $itemId, 'quantity' => 2]],
            'refund_method' => 'cash',
            'refund_source' => 'cash_drawer',
            'reason' => 'partial return',
        ])->assertStatus(302);

        // Get report
        $start = Carbon::now()->startOfMonth()->toDateString();
        $end = Carbon::now()->endOfMonth()->toDateString();
        $reportResponse = $this->get($this->storeUrl($tenant, "reports/item-wise-profit?start_date={$start}&end_date={$end}&range=custom"));
        $reportResponse->assertStatus(200);
        $props = $reportResponse->viewData('page')['props'];

        $reportItem = collect($props['items'])->firstWhere('sku', $productA->sku);
        $this->assertNotNull($reportItem);

        // Direct DB aggregate
        $dbItem = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.tenant_id', $tenant->id)
            ->whereNull('sales.deleted_at')
            ->whereIn('sales.status', ['posted', 'partially_returned', 'returned'])
            ->where('sale_items.product_id', $productA->id)
            ->select('sale_items.*')
            ->first();

        $keptQty = $dbItem->quantity - $dbItem->returned_quantity;
        $net = $dbItem->net_amount ?: $dbItem->subtotal;
        $dbRevenue = $net * ($keptQty / $dbItem->quantity);

        $dbCogs = DB::table('sale_item_batches')
            ->where('sale_item_id', $dbItem->id)
            ->where('is_reversed', 0)
            ->sum('total_cogs');
        
        // Scale COGS for returned units
        $dbCogs = $dbCogs * ($keptQty / $dbItem->quantity);

        $this->assertEquals(13.0, (float)$reportItem['quantity']);
        $this->assertEquals($dbRevenue, (float)$reportItem['revenue']);
        $this->assertEquals($dbRevenue - $dbCogs, (float)$reportItem['profit']);
    }

    /**
     * TIER 1 - billWiseProfit and partyWiseProfitLoss
     */
    public function test_billWiseProfit_and_partyWiseProfitLoss_reconcile()
    {
        $tenant = $this->createTenant('bill-party-recon', 'ltd_3');
        [$warehouseId, $customer, $supplier, $productA, $productB] = $this->seedScenario($tenant);

        // Sale 1
        $response1 = $this->post($this->storeUrl($tenant, 'sales'), [
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouseId,
            'items' => [
                ['product_id' => $productA->id, 'quantity' => 5, 'price' => 100.00, 'discount' => 0.00],
                ['product_id' => $productB->id, 'quantity' => 2, 'price' => 200.00, 'discount' => 0.00]
            ],
            'discount' => 100.00,
            'payment_method' => 'cash',
            'amount_paid' => 880.00,
        ]);
        $response1->assertStatus(200);

        $start = Carbon::now()->startOfMonth()->toDateString();
        $end = Carbon::now()->endOfMonth()->toDateString();

        // 1. Bill wise profit check
        $billResponse = $this->get($this->storeUrl($tenant, "reports/bill-wise-profit?start_date={$start}&end_date={$end}"));
        $billResponse->assertStatus(200);
        $billProps = $billResponse->viewData('page')['props'];
        
        $billProfitSum = collect($billProps['invoices'])->sum('gross_profit');

        // 2. Party wise profit check
        $partyResponse = $this->get($this->storeUrl($tenant, "reports/party-wise-profit-loss?start_date={$start}&end_date={$end}&range=custom"));
        $partyResponse->assertStatus(200);
        $partyProps = $partyResponse->viewData('page')['props'];
        $partyProfitSum = collect($partyProps['data'])->sum('gross_profit');

        // 3. Profit & Loss check
        $pnlResponse = $this->get($this->storeUrl($tenant, "reports/profit-loss?start_date={$start}&end_date={$end}&range=custom"));
        $pnlResponse->assertStatus(200);
        $pnlProps = $pnlResponse->viewData('page')['props'];
        $pnlProfit = $pnlProps['stats']['gross_profit'];

        $this->assertEquals($pnlProfit, $billProfitSum, "Bill Wise Profit sum does not equal P&L Gross Profit");
        $this->assertEquals($pnlProfit, $partyProfitSum, "Party Wise Profit sum does not equal P&L Gross Profit");
    }

    /**
     * TIER 1 - tax
     */
    public function test_tax_reconciles_to_direct_db_aggregate()
    {
        $tenant = $this->createTenant('tax-recon', 'ltd_3');
        [$warehouseId, $customer, $supplier, $productA, $productB] = $this->seedScenario($tenant);

        // Sale 1
        $response1 = $this->post($this->storeUrl($tenant, 'sales'), [
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouseId,
            'items' => [
                ['product_id' => $productA->id, 'quantity' => 10, 'price' => 100.00, 'discount' => 0.00]
            ],
            'discount' => 0.00,
            'payment_method' => 'cash',
            'amount_paid' => 1100.00,
        ]);
        $response1->assertStatus(200);

        $start = Carbon::now()->startOfMonth()->toDateString();
        $end = Carbon::now()->endOfMonth()->toDateString();

        $taxResponse = $this->get($this->storeUrl($tenant, "reports/tax?start_date={$start}&end_date={$end}"));
        $taxResponse->assertStatus(200);
        $props = $taxResponse->viewData('page')['props'];

        $taxAccount = Account::where('tenant_id', $tenant->id)->where('code', '2100')->first();

        $dbOutputTax = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.tenant_id', $tenant->id)
            ->where('journal_items.account_id', $taxAccount->id)
            ->where('journal_entries.is_reversed', 0)
            ->whereBetween('journal_entries.date', [$start, $end])
            ->sum('journal_items.credit');

        $this->assertEquals((float)$dbOutputTax, (float)$props['stats']['total_output_tax']);
    }

    /**
     * TIER 1 - stockValuation
     */
    public function test_stockValuation_reconciles_to_direct_db_aggregate()
    {
        $tenant = $this->createTenant('stock-recon', 'ltd_3');
        [$warehouseId, $customer, $supplier, $productA, $productB] = $this->seedScenario($tenant);

        $stockResponse = $this->get($this->storeUrl($tenant, 'reports/stock-valuation'));
        $stockResponse->assertStatus(200);
        $props = $stockResponse->viewData('page')['props'];

        $dbValuation = DB::table('inventory_batches')
            ->where('tenant_id', $tenant->id)
            ->sum(DB::raw('remaining_qty * unit_cost'));

        $this->assertEquals((float)$dbValuation, (float)$props['stats']['total_cost_value']);
    }

    /**
     * TIER 1 - trialBalance
     */
    public function test_trialBalance_reconciles()
    {
        $tenant = $this->createTenant('tb-recon', 'ltd_3');
        [$warehouseId, $customer, $supplier, $productA, $productB] = $this->seedScenario($tenant);

        // Post a sale to generate ledger items
        $this->post($this->storeUrl($tenant, 'sales'), [
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouseId,
            'items' => [['product_id' => $productA->id, 'quantity' => 2, 'price' => 100.00, 'discount' => 0.00]],
            'discount' => 0.00,
            'payment_method' => 'cash',
            'amount_paid' => 220.00,
        ])->assertStatus(200);

        $tbResponse = $this->get($this->storeUrl($tenant, 'reports/trial-balance'));
        $tbResponse->assertStatus(200);
        $props = $tbResponse->viewData('page')['props'];

        $this->assertTrue($props['isBalanced']);
        $this->assertEquals($props['totalDebits'], $props['totalCredits']);

        $dbDebits = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.tenant_id', $tenant->id)
            ->sum('journal_items.debit');

        $dbCredits = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.tenant_id', $tenant->id)
            ->sum('journal_items.credit');

        $this->assertEquals(round($dbDebits, 2), round($dbCredits, 2));
    }

    /**
     * TIER 1 - dailySales
     */
    public function test_dailySales_reconciles_to_direct_db_aggregate()
    {
        // Test in Karachi Timezone
        $tenant = $this->createTenant('daily-sales-recon', 'ltd_3');
        [$warehouseId, $customer, $supplier, $productA, $productB] = $this->seedScenario($tenant, 'Asia/Karachi');

        // Karachi timezone sale at local 2026-06-21 02:30 AM = 2026-06-20 21:30:00 UTC.
        $utcCreatedAt = Carbon::create(2026, 6, 20, 21, 30, 0, 'UTC');

        $sale = Sale::create([
            'tenant_id' => $tenant->id,
            'reference_number' => 'SAL-DS-RECON-0001',
            'source' => 'manual',
            'party_id' => $customer->id,
            'user_id' => auth()->id() ?? 1,
            'warehouse_id' => $warehouseId,
            'subtotal' => 100.00,
            'tax' => 10.00,
            'discount' => 0.00,
            'total' => 110.00,
            'subtotal_gross' => 100.00,
            'total_item_discounts' => 0.00,
            'global_discount' => 0.00,
            'net_sales' => 100.00,
            'total_tax' => 10.00,
            'invoice_total' => 110.00,
            'status' => 'posted',
            'posted_at' => $utcCreatedAt,
            'created_at' => $utcCreatedAt,
            'updated_at' => $utcCreatedAt,
        ]);

        $start = '2026-06-21';
        $end = '2026-06-21';

        $dsResponse = $this->get($this->storeUrl($tenant, "reports/daily-sales?start_date={$start}&end_date={$end}&range=custom"));
        $dsResponse->assertStatus(200);
        $props = $dsResponse->viewData('page')['props'];

        // Since the sale was posted at 2026-06-21 02:30:00 Karachi local time,
        // it must show up on 2026-06-21.
        $reportItem = collect($props['reports'])->firstWhere('date', '2026-06-21');
        
        $this->assertNotNull($reportItem, "Daily sales report missed the Karachi timezone sale on local date 2026-06-21");
        $this->assertEquals(100.00, (float)$reportItem->revenue);
    }

    /**
     * TIER 1 - partyStatement
     */
    public function test_partyStatement_reconciles_to_direct_db_aggregate()
    {
        $tenant = $this->createTenant('party-stmt-recon', 'ltd_3');
        [$warehouseId, $customer, $supplier, $productA, $productB] = $this->seedScenario($tenant);

        // Posted credit sale
        $this->post($this->storeUrl($tenant, 'sales'), [
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouseId,
            'items' => [['product_id' => $productA->id, 'quantity' => 1, 'price' => 100.00, 'discount' => 0.00]],
            'discount' => 0.00,
            'payment_method' => 'credit',
            'amount_paid' => 0.00,
            'add_to_ledger' => true,
        ])->assertStatus(200);

        $start = Carbon::now()->startOfMonth()->toDateString();
        $end = Carbon::now()->endOfMonth()->toDateString();

        $stmtResponse = $this->get($this->storeUrl($tenant, "reports/party-statement?party_id={$customer->id}&start_date={$start}&end_date={$end}"));
        $stmtResponse->assertStatus(200);
        $props = $stmtResponse->viewData('page')['props'];

        $arAccount = Account::where('tenant_id', $tenant->id)->where('code', '1200')->first();
        $debits = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.tenant_id', $tenant->id)
            ->where('journal_items.account_id', $arAccount->id)
            ->where('journal_entries.party_id', $customer->id)
            ->where('journal_entries.is_reversed', 0)
            ->sum('journal_items.debit');
        $credits = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('journal_entries.tenant_id', $tenant->id)
            ->where('journal_items.account_id', $arAccount->id)
            ->where('journal_entries.party_id', $customer->id)
            ->where('journal_entries.is_reversed', 0)
            ->sum('journal_items.credit');

        $this->assertEquals((float)($debits - $credits), (float)$props['closingBalance']);
    }

    /**
     * TIER 1 Edge Case: Empty / Null Data (No crash)
     */
    public function test_empty_reconciliation_no_crash()
    {
        $tenant = $this->createTenant('empty-recon', 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $reports = [
            'reports/profit-loss',
            'reports/item-wise-profit',
            'reports/party-wise-profit-loss',
            'reports/bill-wise-profit',
            'reports/tax',
            'reports/stock-valuation',
            'reports/trial-balance',
            'reports/daily-sales',
            'reports/party-statement',
        ];

        foreach ($reports as $route) {
            $response = $this->get($this->storeUrl($tenant, $route));
            $response->assertStatus(200);
        }
    }

    /**
     * TIER 2 - Smoke cover the remaining ~30 reports
     */
    public function test_tier2_smoke_tests()
    {
        $tenant = $this->createTenant('tier2-smoke', 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $category = Category::create(['tenant_id' => $tenant->id, 'name' => 'General']);
        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'category_id' => $category->id,
            'price' => 100.00
        ]);

        $tier2Routes = [
            'reports/sales',
            'reports/purchases',
            'reports/day-book',
            'reports/transactions',
            'reports/expenses',
            'reports/account-ledger',
            'reports/bank-statement',
            'reports/low-stock',
            'reports/movement-history',
            'reports/expiry',
            'reports/balance-sheet',
            'reports/all-parties',
            'reports/discount',
            'reports/cash-flow',
            'reports/sale-aging',
            'reports/sale-orders',
            'reports/expense-by-category',
            'reports/expense-by-item',
            'reports/stock-summary-by-category',
            'reports/item-detail',
            'reports/loan-statement',
            'reports/tax-rate',
            'reports/sale-purchase-by-party',
            'reports/item-report-by-party',
            'reports/party-report-by-item',
            'reports/sale-purchase-by-item-category',
            'reports/item-category-wise-profit-loss',
            'reports/item-wise-discount',
            'reports/sale-order-items',
        ];

        foreach ($tier2Routes as $route) {
            $response = $this->get($this->storeUrl($tenant, $route));
            $response->assertStatus(200);
            $props = $response->viewData('page')['props'];
            $this->assertNotNull($props);
        }
    }
}
