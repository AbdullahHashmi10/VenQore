<?php

namespace Tests\Feature\Reckoner;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\Engine\MeasureEngine;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerRequest;
use App\Reckoner\Rollup\DirtyDayTracker;
use App\Reckoner\Rollup\ReckonerRollupEngine;
use App\Reckoner\Streams\LedgerStream;
use Carbon\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\Fixtures\ReckonerGoldenStoreFixture;
use Tests\TestCase;

/**
 * Gate 6: History Rollups, Dirty Marking, and Stream Parity Tests (§5.1, §6, Gate 6).
 *
 * Parallel-safety design:
 *   Each test-class instance builds its own tenant under a unique slug
 *   (golden-store-{uuid}). No two parallel workers share a tenant or any
 *   reckoner_daily rows. tearDown() purges all produced rows so the database
 *   stays clean for the next run.
 *
 *   Artisan commands that accept --tenant use $this->tenantSlug (dynamic),
 *   never the literal string 'golden-store'.
 */
class RollupParityGateTest extends TestCase
{
    protected ?Tenant $tenant = null;
    protected ?User   $user   = null;

    /** Unique slug for this worker's private tenant instance. */
    protected string $tenantSlug;

    protected function setUp(): void
    {
        parent::setUp();

        // Give every parallel worker its own private tenant and user so rollup commands
        // and HTTP fixture events never collide across parallel workers.
        $this->tenantSlug = 'gs-' . Str::substr(Str::uuid()->toString(), 0, 13);

        $user = User::factory()->create([
            'email' => "owner-{$this->tenantSlug}@venqore.com",
            'role'  => 'owner',
        ]);

        $tenant = Tenant::factory()->create([
            'name'            => 'Reckoner Golden Store ' . $this->tenantSlug,
            'slug'            => $this->tenantSlug,
            'plan'            => 'scale',
            'status'          => 'active',
            'business_type'   => 'retail',
            'currency_code'   => 'PKR',
            'currency_symbol' => 'Rs.',
            'timezone'        => 'Asia/Karachi',
            'setup_completed' => true,
        ]);

        \Database\Seeders\TenantDefaultSeeder::seedFor($tenant);

        $built = ReckonerGoldenStoreFixture::build(tenant: $tenant, http: $this, user: $user);

        $this->tenant = $built['tenant'];
        $this->user   = $built['user'];
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        // Purge reckoner rows so this worker's data does not affect others.
        if ($this->tenant) {
            DB::table('reckoner_daily')
                ->where('tenant_id', $this->tenant->id)
                ->delete();
            DB::table('reckoner_dirty_days')
                ->where('tenant_id', $this->tenant->id)
                ->delete();

            // Purge the tenant fixture itself via the fixture helper.
            ReckonerGoldenStoreFixture::purgeTenant($this->tenant);

            // Drop the tenant row if it still exists.
            DB::table('tenants')->where('id', $this->tenant->id)->delete();
        }

        if ($this->user) {
            DB::table('users')->where('id', $this->user->id)->delete();
        }

        parent::tearDown();
    }

    /**
     * 1. Schema assertions for Phase 6 tables and columns (§5.1).
     */
    public function test_phase6_tables_and_columns_exist(): void
    {
        $this->assertTrue(Schema::hasTable('reckoner_daily'), 'Table reckoner_daily must exist');
        $this->assertTrue(Schema::hasTable('reckoner_dirty_days'), 'Table reckoner_dirty_days must exist');
        $this->assertTrue(Schema::hasColumn('tenants', 'reckoner_data_version'), 'tenants.reckoner_data_version must exist');

        $dailyCols = Schema::getColumnListing('reckoner_daily');
        foreach (['tenant_id', 'day', 'measure', 'kind', 'dim', 'dim_value', 'value', 'qty', 'n', 'definition_version', 'computed_at'] as $col) {
            $this->assertContains($col, $dailyCols, "reckoner_daily must contain column {$col}");
        }

        $dirtyCols = Schema::getColumnListing('reckoner_dirty_days');
        foreach (['tenant_id', 'stream', 'day', 'reason', 'first_marked_at', 'attempts'] as $col) {
            $this->assertContains($col, $dirtyCols, "reckoner_dirty_days must contain column {$col}");
        }

        // reckoner_daily must have a composite primary key covering the natural key
        // (tenant_id, measure, dim, dim_value, day). Verify this by checking the
        // upsert conflict target columns actually exist and are indexed.
        $indexes = DB::select("SHOW KEYS FROM reckoner_daily WHERE Key_name = 'PRIMARY'");
        $pkCols  = array_column($indexes, 'Column_name');
        foreach (['tenant_id', 'measure', 'dim', 'dim_value', 'day'] as $col) {
            $this->assertContains($col, $pkCols, "reckoner_daily PRIMARY KEY must include column {$col}");
        }
    }

    /**
     * 2. Dirty tracking on journal entry creation and reversal (§6.2).
     */
    public function test_dirty_tracking_on_entry_creation_and_reversal(): void
    {
        DirtyDayTracker::clear($this->tenant->id, 'ledger', '2026-10-15');
        $this->assertTrue(DirtyDayTracker::isClean($this->tenant->id, '2026-10-01', '2026-10-31'));

        $initialVersion = (int) DB::table('tenants')->where('id', $this->tenant->id)->value('reckoner_data_version');

        // 1. Mark dirty directly
        DirtyDayTracker::mark($this->tenant->id, 'ledger', '2026-10-15', 'test_mutation');

        $this->assertFalse(DirtyDayTracker::isClean($this->tenant->id, '2026-10-01', '2026-10-31'));
        $this->assertTrue(DirtyDayTracker::isClean($this->tenant->id, '2026-11-01', '2026-11-30'));

        $versionAfter = (int) DB::table('tenants')->where('id', $this->tenant->id)->value('reckoner_data_version');
        $this->assertGreaterThan($initialVersion, $versionAfter, 'Marking dirty must increment tenants.reckoner_data_version');

        // Clean up marker
        DirtyDayTracker::clear($this->tenant->id, 'ledger', '2026-10-15');
        $this->assertTrue(DirtyDayTracker::isClean($this->tenant->id, '2026-10-01', '2026-10-31'));
    }

    /**
     * 3. Rollup and Backfill parity against live streams (§6.3, §6.5).
     *
     * Stored values in reckoner_daily must exactly equal live stream values
     * to 0.01 across August 2026.
     */
    public function test_backfill_and_rollup_exact_parity_with_live_streams(): void
    {
        // 1. Run backfill command on this worker's private tenant slug
        $exitCode = Artisan::call('reckoner:backfill', [
            '--tenant' => $this->tenantSlug,
            '--from'   => '2026-08-01',
            '--to'     => '2026-08-31',
        ]);
        $this->assertSame(0, $exitCode, 'reckoner:backfill must exit with 0');

        $dailyCount = DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->whereBetween('day', ['2026-08-01', '2026-08-31'])
            ->count();
        $this->assertGreaterThan(0, $dailyCount, 'reckoner_daily must contain backfilled rows');

        // 2. Parity check for gl.sales_revenue ($7,700.00)
        $storedRevenue = (float) DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('measure', 'gl.sales_revenue')
            ->where('dim', '')
            ->whereBetween('day', ['2026-08-01', '2026-08-31'])
            ->sum('value');

        $ledgerStream = app(LedgerStream::class);
        $liveRevenue  = (float) $ledgerStream->flows(['gl.sales_revenue'], ['w' => ['from' => '2026-08-01', 'to' => '2026-08-31']], [], $this->tenant->id)['w']['gl.sales_revenue'];

        $this->assertEqualsWithDelta(7700.00, $storedRevenue, 0.01, 'Stored revenue must match golden value $7,700.00');
        $this->assertEqualsWithDelta($liveRevenue, $storedRevenue, 0.01, 'Stored revenue must equal live stream revenue');

        // 3. Parity check for gl.cogs ($3,200.00)
        $storedCogs = (float) DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('measure', 'gl.cogs')
            ->where('dim', '')
            ->whereBetween('day', ['2026-08-01', '2026-08-31'])
            ->sum('value');
        $liveCogs = (float) $ledgerStream->flows(['gl.cogs'], ['w' => ['from' => '2026-08-01', 'to' => '2026-08-31']], [], $this->tenant->id)['w']['gl.cogs'];

        $this->assertEqualsWithDelta(3200.00, $storedCogs, 0.01, 'Stored cogs must match golden value $3,200.00');
        $this->assertEqualsWithDelta($liveCogs, $storedCogs, 0.01, 'Stored cogs must equal live stream cogs');

        // 4. Parity check for sales.net_revenue ($7,700.00)
        $storedSalesNet = (float) DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('measure', 'sales.net_revenue')
            ->where('dim', '')
            ->whereBetween('day', ['2026-08-01', '2026-08-31'])
            ->sum('value');

        $this->assertEqualsWithDelta(7700.00, $storedSalesNet, 0.01, 'Stored sales net revenue must equal $7,700.00');

        // 5. Parity check for purchases.total_spend ($2,500.00)
        $storedPurchases = (float) DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('measure', 'purchases.total_spend')
            ->where('dim', '')
            ->whereBetween('day', ['2026-08-01', '2026-08-31'])
            ->sum('value');

        $this->assertEqualsWithDelta(2500.00, $storedPurchases, 0.01, 'Stored purchases spend must equal $2,500.00');
    }

    /**
     * 4. MeasureEngine accelerated resolution and freshness reporting (§6.4).
     */
    public function test_measure_engine_reports_stored_freshness_for_closed_clean_periods(): void
    {
        $engine = app(MeasureEngine::class);
        $ctx    = new ReckonerContext($this->tenant, $this->user, 'scale');

        // First backfill so there is something stored to read.
        Artisan::call('reckoner:backfill', [
            '--tenant' => $this->tenantSlug,
            '--from'   => '2026-08-01',
            '--to'     => '2026-08-31',
        ]);

        // Ensure August 2026 is rolled up and clean
        Artisan::call('reckoner:rollup', ['--tenant' => $this->tenantSlug]);
        DB::table('reckoner_dirty_days')
            ->where('tenant_id', $this->tenant->id)
            ->whereBetween('day', ['2026-08-01', '2026-08-31'])
            ->delete();

        // Set clock to 2026-09-01 so August 2026 is a closed past period ($to < $today)
        Carbon::setTestNow(Carbon::parse('2026-09-01 12:00:00', 'Asia/Karachi'));

        // Request core.revenue for closed clean August 2026
        $req = new ReckonerRequest('core.revenue', 'custom', ['from' => '2026-08-01', 'to' => '2026-08-31']);
        $res = $engine->resolve([$req], $ctx);

        $cardResult = $res[$req->getCompositeId()];
        $this->assertTrue($cardResult->ok);
        $this->assertSame('stored', $cardResult->meta['freshness'], 'Closed clean period must report freshness: stored');
        $this->assertEqualsWithDelta(7700.00, (float) $cardResult->data['value'], 0.01);
    }

    /**
     * 5. Nightly snapshot command writes positions clean (§6.3).
     */
    public function test_reckoner_snapshot_command_records_positions(): void
    {
        $exitCode = Artisan::call('reckoner:snapshot', [
            '--tenant' => $this->tenantSlug,
            '--date'   => '2026-08-31',
        ]);
        $this->assertSame(0, $exitCode);

        $snapshotRows = DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('day', '2026-08-31')
            ->whereIn('kind', ['closing', 'snapshot'])
            ->get();

        $this->assertNotEmpty($snapshotRows);
        $measures = $snapshotRows->pluck('measure')->all();
        $this->assertContains('gl.receivables_balance', $measures);
        $this->assertContains('gl.payables_balance', $measures);
        $this->assertContains('gl.cash_balance', $measures);
        $this->assertContains('stock.total_value', $measures);
    }
}
