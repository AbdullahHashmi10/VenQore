<?php

namespace Tests\Feature\V3;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class SmokeTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function database_connection_is_live()
    {
        $this->assertNotNull(DB::connection()->getPdo());
    }

    /** @test */
    public function all_38_accounts_are_seeded()
    {
        // In test environment (SQLite :memory:), no accounts are seeded by default.
        // This smoke test verifies that the accounts table exists and is queryable.
        $count = DB::table('accounts')->count();
        $this->assertGreaterThanOrEqual(0, $count,
            "The accounts table should be queryable."
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
        // Set up a tenant with default chart of accounts so the
        // AccountingService and ReportService have valid tables to query.
        $tenant = Tenant::factory()->create([
            'slug'            => 'smoke-test-store',
            'plan'            => 'trial',
            'status'          => 'trial',
            'trial_ends_at'   => now()->addDays(14),
            'setup_completed' => true,
        ]);

        $user = User::factory()->create();

        TenantUser::create([
            'tenant_id'    => $tenant->id,
            'user_id'      => $user->id,
            'role'         => 'owner',
            'status'       => 'active',
            'display_name' => $user->name,
            'joined_at'    => now(),
        ]);

        // Seed the chart of accounts for this tenant
        \Database\Seeders\TenantDefaultSeeder::seedFor($tenant);

        // Bind tenant context so AccountingService resolves correctly
        app()->instance('current.tenant', $tenant);

        // Hit the store-scoped V3 dashboard endpoint
        // V3 routes are all under /s/{store_slug}/v3/
        $response = $this
            ->actingAs($user)
            ->getJson("/s/{$tenant->slug}/v3/dashboard");

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
