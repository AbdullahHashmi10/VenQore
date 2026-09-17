<?php

namespace Tests\Feature\Reckoner;

use App\Exceptions\MissingFinancialAccountException;
use App\Models\Account;
use App\Models\Tenant;
use App\Reckoner\Streams\LedgerStream;
use App\Services\FinancialReportingService;
use Illuminate\Support\Facades\DB;
use Tests\Fixtures\ReckonerGoldenStoreFixture;
use Tests\TestCase;

class LedgerFoundationGateTest extends TestCase
{
    /**
     * 1. Assert all accounts have non-null role and is_current.
     */
    public function test_all_accounts_have_non_null_role_and_is_current(): void
    {
        $fixture = ReckonerGoldenStoreFixture::build(http: $this);
        $tenantId = $fixture['tenant']->id;

        $nullRoleCount = DB::table('accounts')
            ->where('tenant_id', $tenantId)
            ->whereNull('role')
            ->count();
        $this->assertEquals(0, $nullRoleCount, "Found accounts with role NULL");

        $nullIsCurrentCount = DB::table('accounts')
            ->where('tenant_id', $tenantId)
            ->whereNull('is_current')
            ->count();
        $this->assertEquals(0, $nullIsCurrentCount, "Found accounts with is_current NULL");
    }

    /**
     * 2. Assert §8.1 golden values match exactly through LedgerStream.
     */
    public function test_golden_values_match_via_ledger_stream(): void
    {
        $fixture = ReckonerGoldenStoreFixture::build(http: $this);
        $tenantId = $fixture['tenant']->id;
        $stream = new LedgerStream();

        $flows = $stream->flows(
            [
                'gl.sales_revenue',
                'gl.cogs',
                'gl.opex',
                'gl.cash_in',
                'gl.cash_out',
                'gl.tax_collected',
                'gl.tax_paid',
                'gl.journal_count',
                'gl.reversal_count',
            ],
            ['august' => ['from' => '2026-08-01', 'to' => '2026-08-31']],
            [],
            $tenantId
        )['august'];

        $this->assertEquals(7700.0, $flows['gl.sales_revenue'], "Sales revenue via LedgerStream mismatch");
        $this->assertEquals(3200.0, $flows['gl.cogs'], "COGS via LedgerStream mismatch");
        $this->assertEquals(4000.0, $flows['gl.opex'], "OPEX via LedgerStream mismatch");
        $this->assertEquals(5700.0, $flows['gl.cash_in'], "Cash in via LedgerStream mismatch");
        $this->assertEquals(11500.0, $flows['gl.cash_out'], "Cash out via LedgerStream mismatch");
        $this->assertEquals(500.0, $flows['gl.tax_collected'], "Tax collected via LedgerStream mismatch");
        $this->assertEquals(0.0, $flows['gl.tax_paid'], "Tax paid via LedgerStream mismatch");
        $this->assertEquals(7.0, $flows['gl.journal_count'], "Journal count mismatch");
        $this->assertEquals(1.0, $flows['gl.reversal_count'], "Reversal count mismatch");

        $balances = $stream->closingBalances(
            ['cash', 'bank', 'ar', 'ap', 'inventory', 'tax_output', 'assets', 'liabilities', 'equity'],
            ['2026-08-31'],
            ['bank_account'],
            $tenantId
        )['2026-08-31'];

        $this->assertEquals(148200.0, $balances['cash'], "Cash closing balance mismatch");
        $this->assertEquals(48000.0, $balances['bank'], "Bank closing balance mismatch");
        $this->assertEquals(2500.0, $balances['ar'], "AR closing balance mismatch");
        $this->assertEquals(3000.0, $balances['ap'], "AP closing balance mismatch");
        $this->assertEquals(6500.0, $balances['inventory'], "Inventory closing balance mismatch");
        $this->assertEquals(500.0, $balances['tax_output'], "Tax output closing balance mismatch");
        $this->assertEquals(205200.0, $balances['assets'], "Total assets mismatch");
        $this->assertEquals(3500.0, $balances['liabilities'], "Total liabilities mismatch");
        $this->assertEquals(201700.0, $balances['equity'], "Total equity mismatch");
    }

    /**
     * 3. Assert bank_subledger_control invariant passes.
     */
    public function test_bank_subledger_control_invariant(): void
    {
        $fixture = ReckonerGoldenStoreFixture::build(http: $this);
        $tenantId = $fixture['tenant']->id;
        $bankAccount = \App\Models\BankAccount::where('tenant_id', $tenantId)->where('type', 'bank')->first();

        // Run backfill to ensure historical rows carry bank_account_id
        $this->artisan('reckoner:backfill-bank-dimension', ['--tenant' => $tenantId])->assertSuccessful();

        $stream = new LedgerStream();
        $balances = $stream->closingBalances(['bank'], ['2026-08-31'], ['bank_account'], $tenantId)['2026-08-31'];

        $totalBank = $balances['bank'];
        $byBank = $balances['bank_by_bank'] ?? [];
        $sumByBank = array_sum($byBank);

        $this->assertEquals(48000.0, $totalBank, "GL bank balance expected 48,000");
        $this->assertEquals($totalBank, $sumByBank, "bank_subledger_control failed: GL bank ({$totalBank}) != Σ bank_account ({$sumByBank})");
        $this->assertEquals(48000.0, $byBank[$bankAccount->id] ?? 0.0, "Expected bank account balance mismatch");
    }

    /**
     * 4. Query log test proving tenant_id is on every statement.
     */
    public function test_tenant_id_in_every_statement_during_reads(): void
    {
        $fixture = ReckonerGoldenStoreFixture::build(http: $this);
        $tenantId = (string) $fixture['tenant']->id;
        $stream = new LedgerStream();

        DB::enableQueryLog();

        $stream->flows(['gl.sales_revenue', 'gl.cogs', 'gl.cash_in'], ['w' => ['from' => '2026-08-01', 'to' => '2026-08-31']], [], $tenantId);
        $stream->closingBalances(['cash', 'bank', 'ar'], ['2026-08-31'], ['bank_account'], $tenantId);

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $this->assertNotEmpty($queries, "Queries should have been logged");

        foreach ($queries as $q) {
            $sql = strtolower($q['query']);
            $this->assertStringContainsString('tenant_id', $sql, "Query missing tenant_id predicate: {$q['query']}");
        }
    }

    /**
     * 5. Dashboard / reporting read for tenant with no chart writes 0 rows and throws MissingFinancialAccountException.
     */
    public function test_tenant_with_no_chart_writes_zero_rows_and_throws(): void
    {
        $emptyTenant = Tenant::create([
            'name' => 'Empty Tenant Test',
            'slug' => 'empty-tenant-test-' . uniqid(),
            'business_type' => 'retail',
            'country' => 'PK',
            'currency' => 'PKR',
            'timezone' => 'Asia/Karachi',
            'status' => 'active',
        ]);

        $initialAccountCount = DB::table('accounts')->where('tenant_id', $emptyTenant->id)->count();
        $this->assertEquals(0, $initialAccountCount, "Tenant should have no accounts");

        $reporting = app(FinancialReportingService::class);

        $this->expectException(MissingFinancialAccountException::class);

        try {
            $reporting->getProfitAndLoss('2026-08-01', '2026-08-31', $emptyTenant->id);
        } finally {
            $afterAccountCount = DB::table('accounts')->where('tenant_id', $emptyTenant->id)->count();
            $this->assertEquals(0, $afterAccountCount, "Read-on-empty should not have seeded accounts (seed-on-read eliminated)");
            $emptyTenant->forceDelete();
        }
    }
}
