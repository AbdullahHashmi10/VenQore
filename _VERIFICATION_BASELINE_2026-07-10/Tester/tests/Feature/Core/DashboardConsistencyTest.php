<?php

namespace Tester\Tests\Feature\Core;

use Tests\Feature\VenQoreTestCase;
use App\Models\Product;
use App\Models\Party;
use App\Models\Stock;
use App\Models\Account;
use App\Services\FinancialReportingService;
use App\Services\V3\AccountingService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardConsistencyTest extends VenQoreTestCase
{
    public function test_dashboard_reconciles_exactly_to_reporting_service_and_direct_db()
    {
        date_default_timezone_set('UTC');
        $tenant = $this->createTenant('dash-recon-store', 'ltd_3');
        $tenant->update(['timezone' => 'UTC']);
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);
        DB::table('settings')->where('tenant_id', $tenant->id)->where('key', 'timezone')->update(['value' => 'UTC']);
        $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');

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

        $today = now()->toDateString();
        $yesterday = Carbon::yesterday()->toDateString();

        // 1. Purchase 10 @ 50 on credit
        $purchasePayload1 = [
            'supplier_id' => $supplier->id,
            'warehouse_id' => $warehouseId,
            'payment_method' => 'credit',
            'purchase_date' => $today,
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
        $this->postJson("/s/{$tenant->slug}/v3/purchases", $purchasePayload1)->assertStatus(302);

        // 2. Purchase 10 @ 100 on credit
        $purchasePayload2 = [
            'supplier_id' => $supplier->id,
            'warehouse_id' => $warehouseId,
            'payment_method' => 'credit',
            'purchase_date' => $today,
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
        $this->postJson("/s/{$tenant->slug}/v3/purchases", $purchasePayload2)->assertStatus(302);

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
            'reason' => 'dashboard parity return',
        ];
        $this->postJson("/s/{$tenant->slug}/sales/{$saleId}/return", $returnPayload)->assertStatus(302);

        // 5. Post a backdated sale dated YESTERDAY (je.date = yesterday) but created today.
        $user = \App\Models\User::find($tenant->owner_id) ?? \App\Models\User::factory()->create();
        $incomeAcc = Account::where('tenant_id', $tenant->id)->where('type', 'income')->firstOrFail();
        $receivableAcc = Account::where('tenant_id', $tenant->id)->where('code', '1200')->firstOrFail();
        
        DB::transaction(function() use ($tenant, $yesterday, $user, $incomeAcc, $receivableAcc) {
            app(\App\Services\V3\AccountingService::class)->createEntry([
                'date' => $yesterday,
                'reference_type' => 'manual',
                'reference' => 'BACKDATED-SALE',
                'description' => 'Backdated sale for bucketing check',
                'user_id' => $user->id
            ], [
                ['account_id' => $receivableAcc->id, 'debit' => 500.00, 'credit' => 0],
                ['account_id' => $incomeAcc->id, 'debit' => 0, 'credit' => 500.00],
            ]);
        });

        // Re-authenticate dashboard requests context
        $this->actingAsOwner($tenant);

        $frs = app(FinancialReportingService::class);
        $plToday = $frs->getProfitAndLoss($today, $today);
        $this->assertEquals(2600.00, $plToday['revenue']);
        $this->assertEquals(800.00, $plToday['cogs']);
        $this->assertEquals(1800.00, $plToday['net_profit']);

        // Range covering yesterday and today: total revenue must be 2600 + 500 = 3100
        $plTotal = $frs->getProfitAndLoss($yesterday, $today);
        $this->assertEquals(3100.00, $plTotal['revenue']);

        // Enable Query Log before hitting dashboard to verify bounded queries (no N+1 loops)
        DB::enableQueryLog();

        $response = $this->getJson("/s/{$tenant->slug}/dashboard");
        $response->assertStatus(200);

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        // There are daily, monthly, and hourly charts. Total period-based query count should be small and constant (e.g. <= 4)
        // proving getProfitByPeriod solved the N+1.
        $chartQueriesCount = collect($queries)->filter(function($q) {
            return str_contains($q['query'], 'SUM(CASE WHEN ji.account_id');
        })->count();
        $this->assertLessThanOrEqual(3, $chartQueriesCount, "Chart queries must not exceed 3 (one per range: Today, Month, Year)");

        // Extract Inertia props
        $props = $response->original->getData()['page']['props'];

        // C3.2: Net Profit card must come from the one engine (today net profit = 1800)
        $this->assertEquals(1800.00, (float) $props['netProfit']['Today']['value'],
            "Dashboard Net Profit (Today) card must equal engine net profit (1800)");

        // Verify chart data bucketing by BUSINESS DATE (je.date)
        $chartData = $props['salesData']['Month']; // SubDays(29) to Today
        
        // Assert backdated yesterday sale (500) appears in YESTERDAY's bar
        $yesterdayLabel = Carbon::yesterday()->format('d M');
        $yesterdayBar = collect($chartData)->firstWhere('name', $yesterdayLabel);
        $this->assertNotNull($yesterdayBar);
        $this->assertEquals(500.00, $yesterdayBar['sales'], "Yesterday's bar must contain the backdated sale revenue (500.00)");

        // Assert today's bar contains the golden transaction revenue (2600.00)
        $todayLabel = Carbon::today()->format('d M');
        $todayBar = collect($chartData)->firstWhere('name', $todayLabel);
        $this->assertNotNull($todayBar);
        $this->assertEquals(2600.00, $todayBar['sales'], "Today's bar must contain the golden transaction net revenue (2600.00)");

        // Assert SUM(chart bars) == getProfitAndLoss(revenue) for the Month range
        $sumChartRevenues = collect($chartData)->sum('sales');
        $plMonth = $frs->getProfitAndLoss(Carbon::now()->subDays(29), Carbon::now());
        $this->assertEquals($plMonth['revenue'], $sumChartRevenues, "SUM(chart bars) must equal FRS Month revenue");
    }
}
