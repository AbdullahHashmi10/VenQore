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

    /**
     * FIXED 2026-08-02: all four tests below used to run tenant-UNSCOPED global
     * aggregate queries under RefreshDatabase. On a freshly migrated, empty
     * database every one of those aggregates is 0, so "0 == 0" / ">= 0" passed
     * regardless of whether the underlying ledger logic was correct — these
     * tests could never fail on their own. They only ever showed a real
     * problem when run as part of the FULL suite, because GoldenAuditSeeder
     * (used by GoldenAuditTestsTest) commits its own data via a DB::transaction()
     * with no outer test-transaction wrapper, so its rows survived into whatever
     * ran afterward in the same process — including this file's then-vacuous
     * global queries.
     *
     * Each test below now builds its own explicit, minimal, seeded fixture
     * (mirroring the pattern already used by dashboard_endpoint_returns_200()
     * further down this file) and asserts against a SPECIFIC tenant, so it is
     * self-contained regardless of what else is in the database, and it can
     * actually fail on a genuine regression rather than only ever passing.
     */

    /** @test */
    public function all_38_accounts_are_seeded()
    {
        $tenant = $this->seededSmokeTenant('accounts-smoke-store');

        // Derived from TenantDefaultSeeder's own source rather than hardcoded —
        // see LAUNCH_VERIFICATION_AUDIT_2026-08-02.md item D2 for why a fixed
        // number here previously went stale when the seeder gained two new
        // accounts (1205, 5410) without this assertion being updated.
        $seederSource = file_get_contents(
            (new \ReflectionClass(\Database\Seeders\TenantDefaultSeeder::class))->getFileName()
        );
        $expectedAccountCount = preg_match_all("/\['code'\s*=>\s*'\d+'/", $seederSource);

        $count = DB::table('accounts')->where('tenant_id', $tenant->id)->count();

        $this->assertEquals($expectedAccountCount, $count,
            "Expected {$expectedAccountCount} seeded accounts for a fresh tenant, found {$count}."
        );
    }

    /** @test */
    public function trial_balance_is_balanced()
    {
        $tenant = $this->seededSmokeTenant('trial-balance-smoke-store');
        $this->postSmokeSaleAndPurchase($tenant);

        $result = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('je.tenant_id', $tenant->id)
            ->where('je.is_reversed', 0)
            ->selectRaw('ABS(SUM(ji.debit) - SUM(ji.credit)) AS difference')
            ->value('difference') ?? 0;

        $this->assertLessThan(0.01, (float) $result,
            "Trial balance out by Rs.{$result} — ledger is corrupt."
        );
    }

    /** @test */
    public function account_1100_reconciles_to_inventory_batches()
    {
        $tenant = $this->seededSmokeTenant('inventory-smoke-store');
        $this->postSmokeSaleAndPurchase($tenant);

        $ledger = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('a.tenant_id', $tenant->id)
            ->where('a.code', '1100')
            ->where('je.is_reversed', 0)
            ->selectRaw('SUM(ji.debit) - SUM(ji.credit) AS balance')
            ->value('balance') ?? 0;

        $batches = (float) DB::table('inventory_batches')
            ->where('tenant_id', $tenant->id)
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
        $tenant = $this->seededSmokeTenant('opening-balance-smoke-store');
        $this->postSmokeSaleAndPurchase($tenant);

        $balance = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('a.tenant_id', $tenant->id)
            ->where('a.code', '7000')
            ->where('je.is_reversed', 0)
            ->selectRaw('SUM(ji.debit) - SUM(ji.credit) AS balance')
            ->value('balance') ?? 0;

        $this->assertLessThan(0.01, abs($balance),
            "Account 7000 has non-zero balance: Rs.{$balance}. Opening entries incomplete."
        );
    }

    /**
     * A fresh tenant with the standard chart of accounts seeded, and current.tenant
     * bound so tenant-scoped models/services resolve correctly within the test.
     */
    private function seededSmokeTenant(string $slug): Tenant
    {
        $tenant = Tenant::factory()->create([
            'slug'            => $slug,
            'plan'            => 'trial',
            'status'          => 'trial',
            'trial_ends_at'   => now()->addDays(14),
            'setup_completed' => true,
        ]);

        \Database\Seeders\TenantDefaultSeeder::seedFor($tenant);
        app()->instance('current.tenant', $tenant);

        return $tenant;
    }

    /**
     * Posts one purchase (DR 1100, CR 2000) and one sale against it (DR COGS/CR
     * 1100, DR cash/CR revenue), with a matching inventory_batches row that gets
     * correctly decremented — i.e. a MINIMAL version of the exact pattern
     * GoldenAuditSeeder posts hundreds of times, used here to prove that when
     * done correctly, ledger and batches stay in agreement and 7000 stays untouched.
     */
    private function postSmokeSaleAndPurchase(Tenant $tenant): void
    {
        $accounting = app(\App\Services\V3\AccountingService::class);
        $user = User::factory()->create();

        $product = \App\Models\Product::create([
            'tenant_id'  => $tenant->id,
            'name'       => 'Smoke Test Widget',
            'sku'        => 'SMOKE-WIDGET-' . $tenant->id,
            'price'      => 100,
            'cost_price' => 60,
        ]);

        $warehouse = DB::table('warehouses')->where('tenant_id', $tenant->id)->first();

        $batchId = (string) \Illuminate\Support\Str::uuid();
        DB::table('inventory_batches')->insert([
            'id'             => $batchId,
            'tenant_id'      => $tenant->id,
            'product_id'     => $product->id,
            'warehouse_id'   => $warehouse->id,
            'batch_type'     => 'purchase',
            'original_qty'   => 10,
            'initial_qty'    => 10,
            'remaining_qty'  => 10,
            'unit_cost'      => 60,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $accounting->createEntry([
            'date'            => now()->toDateString(),
            'reference_type'  => 'purchase',
            'reference'       => 'SMOKE-PUR-1',
            'description'     => 'Smoke test purchase',
            'created_by'      => $user->id,
        ], [
            ['account_code' => '1100', 'debit' => 600, 'credit' => 0],
            ['account_code' => '2000', 'debit' => 0, 'credit' => 600],
        ]);

        // Sell 4 of the 10 units at the batch's real unit_cost — COGS must match
        // exactly what's decremented from the batch for 1100 to reconcile.
        DB::table('inventory_batches')->where('id', $batchId)->decrement('remaining_qty', 4);

        $accounting->createEntry([
            'date'            => now()->toDateString(),
            'reference_type'  => 'sale',
            'reference'       => 'SMOKE-SAL-1',
            'description'     => 'Smoke test sale',
            'created_by'      => $user->id,
        ], [
            ['account_code' => '4000', 'debit' => 0, 'credit' => 400],
            ['account_code' => '5000', 'debit' => 240, 'credit' => 0],
            ['account_code' => '1100', 'debit' => 0, 'credit' => 240],
            ['account_code' => '1000', 'debit' => 400, 'credit' => 0],
        ]);
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
