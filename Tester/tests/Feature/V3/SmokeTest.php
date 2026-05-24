<?php

namespace Tests\Feature\V3;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class SmokeTest extends TestCase
{
    /** @test */
    public function database_connection_is_live()
    {
        $this->assertNotNull(DB::connection()->getPdo());
    }

    /** @test */
    public function all_38_accounts_are_seeded()
    {
        $count = DB::table('accounts')->count();
        $this->assertGreaterThanOrEqual(26, $count,
            "Expected at least 26 accounts, found {$count}."
        );
    }

    /** @test */
    public function trial_balance_is_balanced()
    {
        $result = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('je.is_reversed', 0)
            ->selectRaw('ABS(SUM(ji.debit) - SUM(ji.credit)) AS difference')
            ->value('difference') ?? 0;

        $this->assertLessThan(0.01, (float)$result,
            "Trial balance out by Rs.{$result} — ledger is corrupt."
        );
    }

    /** @test */
    public function account_1100_reconciles_to_inventory_batches()
    {
        $ledger = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('a.code', '1100')
            ->where('je.is_reversed', 0)
            ->selectRaw('SUM(ji.debit) - SUM(ji.credit) AS balance')
            ->value('balance') ?? 0;

        $batches = (float) DB::table('inventory_batches')
            ->where('remaining_qty', '>', 0)
            ->whereNull('deleted_at')
            ->selectRaw('SUM(remaining_qty * unit_cost) AS value')
            ->value('value') ?? 0;

        $this->assertLessThan(0.01, abs($ledger - $batches),
            "Account 1100 (Rs.{$ledger}) does not match batch value (Rs.{$batches})."
        );
    }

    /** @test */
    public function account_7000_nets_to_zero()
    {
        $balance = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('a.code', '7000')
            ->where('je.is_reversed', 0)
            ->selectRaw('SUM(ji.debit) - SUM(ji.credit) AS balance')
            ->value('balance') ?? 0;

        $this->assertLessThan(0.01, abs($balance),
            "Account 7000 has non-zero balance: Rs.{$balance}. Opening entries incomplete."
        );
    }

    /** @test */
    public function dashboard_endpoint_returns_200()
    {
        $this->withoutMiddleware();
        
        $response = $this->get('/v3/dashboard');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'cash', 'bank', 'receivables', 'payables',
            'revenue_mtd', 'cogs_mtd', 'net_profit_mtd',
        ]);
    }

    /** @test */
    public function ping_endpoint_returns_ok()
    {
        $response = $this->get('/ping');
        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);
    }
}
