<?php

namespace Tester\tests\Feature\Core;

use Tests\Feature\VenQoreTestCase;
use App\Models\Product;
use App\Models\Party;
use App\Models\Stock;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Services\FinancialReportingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class CalculatorParityTest extends VenQoreTestCase
{
    public function test_calculator_parity_on_golden_transaction()
    {
        $tenant = $this->createTenant('parity-store', 'ltd_3');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);
        $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

        // Resolve customer, supplier and product
        $customer = Party::factory()->create([
            'tenant_id' => $tenant->id,
            'type' => 'customer',
            'credit_limit' => 100000.00
        ]);

        $supplier = Party::factory()->create([
            'tenant_id' => $tenant->id,
            'type' => 'supplier',
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'price' => 200.00,
            'cost_price' => 50.00,
            'tax_rate' => 0.0,
        ]);

        Stock::updateOrCreate(
            ['product_id' => $product->id, 'warehouse_id' => $warehouseId],
            ['quantity' => 0]
        );

        // 1. Purchase 10 @ 50 on credit
        $purchasePayload1 = [
            'supplier_id' => $supplier->id,
            'warehouse_id' => $warehouseId,
            'payment_method' => 'credit',
            'purchase_date' => now()->toDateString(),
            'items' => [
                [
                    'product_id' => $product->id,
                    'qty' => 10,
                    'unit_cost' => 50.00,
                    'tax_rate' => 0,
                    'business_pct' => 100,
                ]
            ],
        ];
        $res = $this->postJson("/s/{$tenant->slug}/v3/purchases", $purchasePayload1);
        $res->assertStatus(302); // Redirect back on success

        // 2. Purchase 10 @ 100 on credit
        $purchasePayload2 = [
            'supplier_id' => $supplier->id,
            'warehouse_id' => $warehouseId,
            'payment_method' => 'credit',
            'purchase_date' => now()->toDateString(),
            'items' => [
                [
                    'product_id' => $product->id,
                    'qty' => 10,
                    'unit_cost' => 100.00,
                    'tax_rate' => 0,
                    'business_pct' => 100,
                ]
            ],
        ];
        $res = $this->postJson("/s/{$tenant->slug}/v3/purchases", $purchasePayload2);
        $res->assertStatus(302);

        // 3. Sell 15 @ 200 on credit
        $salePayload = [
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouseId,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 15,
                    'price' => 200.00,
                    'discount' => 0,
                ]
            ],
            'discount' => 0,
            'amount_paid' => 0,
            'payment_method' => 'credit',
            'add_to_ledger' => true,
        ];
        $res = $this->postJson("/s/{$tenant->slug}/sales", $salePayload);
        $res->assertStatus(200);

        $saleId = $res->json('sale_id');
        $saleItemId = DB::table('sale_items')->where('sale_id', $saleId)->value('id');

        // 4. Return 2 items
        $returnPayload = [
            'items' => [['id' => $saleItemId, 'quantity' => 2]],
            'refund_method' => 'ledger',
            'refund_source' => 'cash_drawer',
            'reason' => 'parity return',
        ];
        $res = $this->postJson("/s/{$tenant->slug}/sales/{$saleId}/return", $returnPayload);
        $res->assertStatus(302);

        // Compute Date Range
        $today = now()->toDateString();
        $todayCarbon = Carbon::today();

        // ─────────────────────────────────────────────────────────────────
        // (A) FinancialReportingService
        // ─────────────────────────────────────────────────────────────────
        $frs = app(FinancialReportingService::class);
        $frsPL = $frs->getProfitAndLoss($today, $today);
        
        $frsRevenue = (float) $frsPL['revenue'];
        $frsCogs = (float) $frsPL['cogs'];
        $frsNetProfit = (float) $frsPL['net_profit'];
        $frsGrossProfit = (float) $frsPL['gross_profit'];
        $frsTaxPayable = (float) $frs->getTaxSummary($today, $today)['net_payable'];
        $frsReceivables = (float) $frs->getReceivables($today);
        $frsPayables = (float) $frs->getPayables($today);
        $frsInventory = (float) $frs->getInventoryValue();

        // V3\ReportService has been deleted. Comparing FRS directly to Referee DB aggregates.

        // ─────────────────────────────────────────────────────────────────
        // (C) Referee (Direct DB Aggregate)
        // ─────────────────────────────────────────────────────────────────
        $refereeRevenue = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$today, $today])
            ->where('a.type', 'income')
            ->selectRaw('SUM(ji.credit) - SUM(ji.debit) as bal')
            ->value('bal') ?? 0.0;

        $refereeCogs = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$today, $today])
            ->where('a.code', '5000')
            ->selectRaw('SUM(ji.debit) - SUM(ji.credit) as bal')
            ->value('bal') ?? 0.0;

        $refereeGrossProfit = $refereeRevenue - $refereeCogs;

        $refereeOpex = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$today, $today])
            ->where('a.type', 'expense')
            ->where('a.code', '!=', '5000')
            ->selectRaw('SUM(ji.debit) - SUM(ji.credit) as bal')
            ->value('bal') ?? 0.0;

        $refereeNetProfit = $refereeGrossProfit - $refereeOpex;

        $refereeTaxPayable = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$today, $today])
            ->where('a.code', '2100')
            ->selectRaw('SUM(ji.credit) - SUM(ji.debit) as bal')
            ->value('bal') ?? 0.0;

        $refereeReceivables = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('je.is_reversed', 0)
            ->where('je.date', '<=', $today)
            ->where('a.code', '1200')
            ->selectRaw('SUM(ji.debit) - SUM(ji.credit) as bal')
            ->value('bal') ?? 0.0;

        $refereePayables = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenant->id)
            ->where('je.tenant_id', $tenant->id)
            ->where('je.is_reversed', 0)
            ->where('je.date', '<=', $today)
            ->where('a.code', '2000')
            ->selectRaw('SUM(ji.credit) - SUM(ji.debit) as bal')
            ->value('bal') ?? 0.0;

        $refereeInventory = (float) DB::table('inventory_batches')
            ->where('tenant_id', $tenant->id)
            ->where('remaining_qty', '>', 0)
            ->whereNull('deleted_at')
            ->selectRaw('SUM(remaining_qty * unit_cost) as bal')
            ->value('bal') ?? 0.0;

        // Print comparative markdown table to stdout/logs
        $metrics = [
            'total_revenue'  => [$frsRevenue, $refereeRevenue],
            'total_cogs'     => [$frsCogs, $refereeCogs],
            'gross_profit'   => [$frsGrossProfit, $refereeGrossProfit],
            'net_profit'     => [$frsNetProfit, $refereeNetProfit],
            'tax_payable'    => [$frsTaxPayable, $refereeTaxPayable],
            'receivables'    => [$frsReceivables, $refereeReceivables],
            'payables'       => [$frsPayables, $refereePayables],
            'inventory_val'  => [$frsInventory, $refereeInventory],
        ];

        echo "\n\n| Metric | FRS (A) | DirectDB (C) | Matches |\n";
        echo "| --- | --- | --- | --- |\n";
        foreach ($metrics as $name => [$a, $c]) {
            $matches = ($a == $c ? 'FRS' : 'None');
            echo sprintf("| %s | %.2f | %.2f | %s |\n", $name, $a, $c, $matches);
        }
        echo "\n";

        // Assertions: FRS must match direct DB (referee) to the cent.
        $this->assertEquals($refereeRevenue, $frsRevenue);
        $this->assertEquals($refereeCogs, $frsCogs);
        $this->assertEquals($refereeGrossProfit, $frsGrossProfit);
        $this->assertEquals($refereeNetProfit, $frsNetProfit);
        $this->assertEquals($refereeTaxPayable, $frsTaxPayable);
        $this->assertEquals($refereeReceivables, $frsReceivables);
        $this->assertEquals($refereePayables, $frsPayables);
        $this->assertEquals($refereeInventory, $frsInventory);

        // ── INDEPENDENT first-principles expected values (golden transaction) ──
        // These literals are the MATHEMATICAL TRUTH, derived by hand from the inputs.
        // DO NOT change these to match output. If FRS disagrees, FRS/the engine is wrong.
        $this->assertEquals(2600.00, $frsRevenue,      'Revenue must be 2600 (13 net units @200)');
        $this->assertEquals( 800.00, $frsCogs,         'COGS must be 800 (FIFO: 10@50 + 5@100, less 2@100 returned)');
        $this->assertEquals(1800.00, $frsGrossProfit,  'Gross profit must be 1800 (2600 - 800)');
        $this->assertEquals(1800.00, $frsNetProfit,    'Net profit must be 1800 (no opex)');
        $this->assertEquals(   0.00, $frsTaxPayable,   'Tax must be 0');
        $this->assertEquals(2600.00, $frsReceivables,  'AR must be 2600');
        $this->assertEquals(1500.00, $frsPayables,     'AP must be 1500 (500 + 1000 on credit)');
        $this->assertEquals( 700.00, $frsInventory,    'Inventory must be 700 (7 units @100)');

        // ── C3.2b: per-cashier net revenue (returns-netted) reconciles to the P&L ──
        $saleUserId = DB::table('sales')->where('id', $saleId)->value('user_id');
        $byUser = $frs->getNetRevenueByUser($today, $today);
        $this->assertEquals(2600.00, (float) ($byUser[$saleUserId] ?? 0),
            "Seller's net revenue must be 2600 (returns-netted: 13 net units @200)");
        $this->assertEquals($frsRevenue, (float) collect($byUser)->sum(),
            "Sum of per-user net revenue must equal the P&L revenue (one source)");

        // ── C3.2b-3b: controller windows reconcile to the engine for the golden seller ──
        $netAll   = $frs->getNetRevenueByUser('1970-01-01', $today);
        $netMonth = $frs->getNetRevenueByUser(
            \Carbon\Carbon::parse($today)->startOfMonth()->format('Y-m-d'),
            \Carbon\Carbon::parse($today)->endOfMonth()->format('Y-m-d')
        );
        $this->assertEquals(2600.00, (float) ($netAll[$saleUserId]   ?? 0),
            "All-time net revenue for the seller must be 2600 in the golden scenario");
        $this->assertEquals(2600.00, (float) ($netMonth[$saleUserId] ?? 0),
            "Current-month net revenue for the seller must be 2600 in the golden scenario");
    }
}
