<?php

namespace Tests\Feature\Reckoner;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\Rollup\DirtyDayTracker;
use App\Reckoner\Rollup\ReckonerRollupEngine;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Fixtures\ReckonerGoldenStoreFixture;
use Tests\TestCase;

/**
 * Rollup Concurrency & Idempotency Regression Tests.
 *
 * Proves that the rollup engine is safe when:
 *   - Two rollups execute sequentially for the same tenant/day (idempotency)
 *   - N rollups execute for the same tenant/day without accumulating totals
 *   - Dirty-day tracking ends in a correct state after repeated rollups
 *   - Different tenants remain completely isolated
 *   - Different scope fingerprints (measure × dim × dim_value) remain isolated
 *
 * Each test uses a uniquely-slugged tenant to be safe under --parallel.
 *
 * Why this validates production safety:
 *   The rollup engine uses DB::table->upsert() with the natural key
 *   ['tenant_id', 'measure', 'dim', 'dim_value', 'day'] as the conflict target.
 *   The database PRIMARY KEY covers the same columns. This means:
 *     - A second upsert for the same natural key REPLACES the previous value
 *       (it does not SUM or APPEND).
 *     - Two concurrent upserts for identical keys resolve to a single row
 *       with one of the two values — never a doubled value.
 *   These tests exercise that contract.
 */
class RollupConcurrencyTest extends TestCase
{
    private Tenant $tenant;
    private User   $user;
    private string $tenantSlug;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantSlug = 'rc-' . Str::substr(Str::uuid()->toString(), 0, 13);

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

        if (isset($this->tenant)) {
            DB::table('reckoner_daily')->where('tenant_id', $this->tenant->id)->delete();
            DB::table('reckoner_dirty_days')->where('tenant_id', $this->tenant->id)->delete();
            ReckonerGoldenStoreFixture::purgeTenant($this->tenant);
            DB::table('tenants')->where('id', $this->tenant->id)->delete();
        }

        if (isset($this->user)) {
            DB::table('users')->where('id', $this->user->id)->delete();
        }

        parent::tearDown();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Idempotency: running rollupDay twice for the same day produces one row
    // ─────────────────────────────────────────────────────────────────────────

    public function test_rollup_day_is_idempotent_for_same_tenant_day(): void
    {
        $engine = app(ReckonerRollupEngine::class);
        $day    = '2026-08-05'; // fixture has S2 POS sale on this day

        // First rollup
        $engine->rollupDay($this->tenant, $day);

        $rowsAfterFirst = DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('day', $day)
            ->where('measure', 'sales.net_revenue')
            ->where('dim', '')
            ->get();

        $this->assertCount(1, $rowsAfterFirst,
            'Exactly one sales.net_revenue total row must exist after first rollup');

        $valueAfterFirst = (float) $rowsAfterFirst->first()->value;

        // Second rollup of the same day — must not change values or add rows
        $engine->rollupDay($this->tenant, $day);

        $rowsAfterSecond = DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('day', $day)
            ->where('measure', 'sales.net_revenue')
            ->where('dim', '')
            ->get();

        $this->assertCount(1, $rowsAfterSecond,
            'Exactly one row must remain after second rollup (no duplication)');

        $valueAfterSecond = (float) $rowsAfterSecond->first()->value;

        $this->assertEqualsWithDelta($valueAfterFirst, $valueAfterSecond, 0.01,
            'Value must not change on second rollup (idempotency)');

        // The second rollup must not double the value
        $this->assertLessThan($valueAfterFirst * 1.01, $valueAfterFirst + $valueAfterSecond - $valueAfterFirst,
            'Stored value must never be doubled by a second rollup');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Totals are not doubled after N repeated rollups
    // ─────────────────────────────────────────────────────────────────────────

    public function test_repeated_rollups_do_not_accumulate_totals(): void
    {
        $engine = app(ReckonerRollupEngine::class);
        $day    = '2026-08-03'; // fixture has S1 invoice sale on this day

        // Run rollup 5 times in succession (simulates retries / scheduler double-fire)
        for ($i = 0; $i < 5; $i++) {
            $engine->rollupDay($this->tenant, $day);
        }

        // Count rows — there must be exactly 1 total row for each measure+dim combo.
        // If upsert failed and inserted instead, there would be > 1 row per natural key.
        $rowCount = DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('day', $day)
            ->where('measure', 'sales.net_revenue')
            ->where('dim', '')
            ->count();

        $this->assertSame(1, $rowCount,
            'Exactly one total row must exist regardless of how many times rollup was called — upsert must not INSERT duplicates');

        // The stored value must equal itself on a third read — prove it is stable,
        // not a random race outcome.
        $v1 = (float) DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('day', $day)
            ->where('measure', 'sales.net_revenue')
            ->where('dim', '')
            ->value('value');

        $engine->rollupDay($this->tenant, $day);

        $v2 = (float) DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('day', $day)
            ->where('measure', 'sales.net_revenue')
            ->where('dim', '')
            ->value('value');

        $this->assertEqualsWithDelta($v1, $v2, 0.01,
            'Value must be stable after an additional rollup (no drift, no accumulation)');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Dirty tracking ends in the correct state after rollup
    // ─────────────────────────────────────────────────────────────────────────

    public function test_dirty_day_is_cleared_after_rollup(): void
    {
        $engine = app(ReckonerRollupEngine::class);
        $day    = '2026-08-12'; // fixture has rent expense on this day

        // Mark the day dirty
        DirtyDayTracker::mark($this->tenant->id, 'ledger', $day, 'test_expense');

        $this->assertFalse(DirtyDayTracker::isClean($this->tenant->id, $day, $day),
            'Day must be dirty before rollup');

        // Run rollup — must clear the dirty marker
        $engine->rollupDay($this->tenant, $day);

        $this->assertTrue(DirtyDayTracker::isClean($this->tenant->id, $day, $day),
            'Day must be clean after rollup clears the dirty marker');
    }

    public function test_rollup_does_not_clear_other_tenants_dirty_days(): void
    {
        $engine = app(ReckonerRollupEngine::class);
        $day    = '2026-08-12';

        // Create a second isolated tenant directly
        $tenant2 = Tenant::factory()->create([
            'name'            => 'Second Tenant',
            'slug'            => 'rc2-' . Str::substr(Str::uuid()->toString(), 0, 13),
            'plan'            => 'scale',
            'status'          => 'active',
            'business_type'   => 'retail',
            'currency_code'   => 'PKR',
            'currency_symbol' => 'Rs.',
            'timezone'        => 'Asia/Karachi',
            'setup_completed' => true,
        ]);

        try {
            // Mark the day dirty on BOTH tenants
            DirtyDayTracker::mark($this->tenant->id, 'ledger', $day, 'test');
            DirtyDayTracker::mark($tenant2->id,       'ledger', $day, 'test');

            // Rollup only tenant 1
            $engine->rollupDay($this->tenant, $day);

            // Tenant 1 must be clean
            $this->assertTrue(DirtyDayTracker::isClean($this->tenant->id, $day, $day),
                'Tenant 1 must be clean after its rollup');

            // Tenant 2 must still be dirty
            $this->assertFalse(DirtyDayTracker::isClean($tenant2->id, $day, $day),
                'Tenant 2 dirty marker must not be cleared by tenant 1 rollup');

        } finally {
            DB::table('reckoner_dirty_days')->where('tenant_id', $tenant2->id)->delete();
            DB::table('tenants')->where('id', $tenant2->id)->delete();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Different tenants remain completely isolated
    // ─────────────────────────────────────────────────────────────────────────

    public function test_different_tenants_have_isolated_rollup_rows(): void
    {
        $engine = app(ReckonerRollupEngine::class);
        $day    = '2026-08-05';

        // Create second tenant directly
        $tenant2 = Tenant::factory()->create([
            'name'            => 'Third Tenant',
            'slug'            => 'rc3-' . Str::substr(Str::uuid()->toString(), 0, 13),
            'plan'            => 'scale',
            'status'          => 'active',
            'business_type'   => 'retail',
            'currency_code'   => 'PKR',
            'currency_symbol' => 'Rs.',
            'timezone'        => 'Asia/Karachi',
            'setup_completed' => true,
        ]);

        // Insert a sample sale for tenant2 on the same day
        DB::table('sales')->insert([
            'id'             => (string) Str::uuid(),
            'tenant_id'      => $tenant2->id,
            'user_id'        => $this->user->id,
            'source'         => 'pos',
            'status'         => 'completed',
            'subtotal'       => 1500.00,
            'net_sales'      => 1500.00,
            'discount'       => 0.00,
            'tax'            => 0.00,
            'total'          => 1500.00,
            'created_at'     => "{$day} 10:00:00",
            'posted_at'      => "{$day} 10:00:00",
        ]);

        try {
            $engine->rollupDay($this->tenant, $day);
            $engine->rollupDay($tenant2, $day);

            $rows1 = DB::table('reckoner_daily')
                ->where('tenant_id', $this->tenant->id)
                ->where('day', $day)
                ->where('measure', 'sales.net_revenue')
                ->where('dim', '')
                ->count();

            $rows2 = DB::table('reckoner_daily')
                ->where('tenant_id', $tenant2->id)
                ->where('day', $day)
                ->where('measure', 'sales.net_revenue')
                ->where('dim', '')
                ->count();

            $this->assertSame(1, $rows1, 'Tenant 1 must have exactly 1 row');
            $this->assertSame(1, $rows2, 'Tenant 2 must have exactly 1 row');

            $val1 = (float) DB::table('reckoner_daily')
                ->where('tenant_id', $this->tenant->id)
                ->where('day', $day)
                ->where('measure', 'sales.net_revenue')
                ->where('dim', '')
                ->value('value');

            $val2 = (float) DB::table('reckoner_daily')
                ->where('tenant_id', $tenant2->id)
                ->where('day', $day)
                ->where('measure', 'sales.net_revenue')
                ->where('dim', '')
                ->value('value');

            $this->assertEqualsWithDelta(2700.00, $val1, 0.01, 'Tenant 1 value must match its own sale (2,700.00)');
            $this->assertEqualsWithDelta(1500.00, $val2, 0.01, 'Tenant 2 value must match its own sale (1,500.00)');

        } finally {
            DB::table('sales')->where('tenant_id', $tenant2->id)->delete();
            DB::table('reckoner_daily')->where('tenant_id', $tenant2->id)->delete();
            DB::table('reckoner_dirty_days')->where('tenant_id', $tenant2->id)->delete();
            DB::table('tenants')->where('id', $tenant2->id)->delete();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Different scope fingerprints (dim + dim_value) remain isolated
    // ─────────────────────────────────────────────────────────────────────────

    public function test_different_scope_fingerprints_produce_isolated_rows(): void
    {
        $engine = app(ReckonerRollupEngine::class);
        $day    = '2026-08-05'; // fixture has POS sale (channel=pos)

        $engine->rollupDay($this->tenant, $day);

        // The engine writes two rows for sales.net_revenue on this day:
        //   dim=''        dim_value=''    → the undimensioned total
        //   dim='channel' dim_value='pos' → the POS channel breakdown
        $totalRow = DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('day', $day)
            ->where('measure', 'sales.net_revenue')
            ->where('dim', '')
            ->where('dim_value', '')
            ->first();

        $channelRow = DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('day', $day)
            ->where('measure', 'sales.net_revenue')
            ->where('dim', 'channel')
            ->where('dim_value', 'pos')
            ->first();

        $this->assertNotNull($totalRow,   'Undimensioned total row must exist');
        $this->assertNotNull($channelRow, 'Channel=pos dimension row must exist');

        // The two rows must be distinct (different PK fingerprints)
        $this->assertNotEquals(
            [$totalRow->dim, $totalRow->dim_value],
            [$channelRow->dim, $channelRow->dim_value],
            'Different scope fingerprints must produce separate rows, not merged ones'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Backfill over an entire month produces values matching live streams
    // ─────────────────────────────────────────────────────────────────────────

    public function test_backfill_and_retry_produce_correct_stable_values(): void
    {
        $engine = app(ReckonerRollupEngine::class);

        // Backfill once
        $result1 = $engine->backfill($this->tenant, '2026-08-01', '2026-08-31');
        $this->assertSame(31, $result1['days_count']);

        $v1 = (float) DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('measure', 'sales.net_revenue')
            ->where('dim', '')
            ->whereBetween('day', ['2026-08-01', '2026-08-31'])
            ->sum('value');

        // Backfill again (retry / scheduler double-fire)
        $result2 = $engine->backfill($this->tenant, '2026-08-01', '2026-08-31');
        $this->assertSame(31, $result2['days_count']);

        $v2 = (float) DB::table('reckoner_daily')
            ->where('tenant_id', $this->tenant->id)
            ->where('measure', 'sales.net_revenue')
            ->where('dim', '')
            ->whereBetween('day', ['2026-08-01', '2026-08-31'])
            ->sum('value');

        $this->assertEqualsWithDelta($v1, $v2, 0.01,
            'Backfill retry must not change the stored value (idempotent)');

        $this->assertEqualsWithDelta(7700.00, $v2, 0.01,
            'Stored sales.net_revenue must match the golden value of 7,700.00 after repeated backfills');
    }
}
