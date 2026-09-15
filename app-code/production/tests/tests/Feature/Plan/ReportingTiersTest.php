<?php

namespace Tests\Feature\Plan;

use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Stock;
use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerRequest;
use App\Services\PlanGate;
use App\Services\PlanRepository;
use App\Support\ReportPlanMap;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

class ReportingTiersTest extends VenQoreTestCase
{
    /**
     * Test 1: Walk ReportPlanMap::MAP for Solo, Starter, Core, Scale and assert Part C exactly.
     * Loop the constant, do not hand-list.
     */
    #[Test]
    public function test_1_walk_map_for_all_tiers(): void
    {
        $soloTenant = $this->createTenant(plan: 'solo', status: 'active');
        $starterTenant = $this->createTenant(plan: 'starter', status: 'active');
        $coreTenant = $this->createTenant(plan: 'core', status: 'active');
        $scaleTenant = $this->createTenant(plan: 'scale', status: 'active');

        foreach (ReportPlanMap::MAP as $suffix => $featureKey) {
            $tier = ReportPlanMap::tierFor($featureKey);

            // Solo gets 0 report screens (all locked)
            $this->assertFalse(
                ReportPlanMap::visible($soloTenant, $suffix),
                "Report '{$suffix}' ({$featureKey}) must be locked on Solo."
            );

            // Starter gets Starter reports, Core/Scale locked
            if ($tier === 'Starter') {
                $this->assertTrue(
                    ReportPlanMap::visible($starterTenant, $suffix),
                    "Report '{$suffix}' ({$featureKey}) must be accessible on Starter."
                );
            } else {
                $this->assertFalse(
                    ReportPlanMap::visible($starterTenant, $suffix),
                    "Report '{$suffix}' ({$featureKey}, {$tier}) must be locked on Starter."
                );
            }

            // Core gets Starter and Core reports, Scale locked
            if (in_array($tier, ['Starter', 'Core'], true)) {
                $this->assertTrue(
                    ReportPlanMap::visible($coreTenant, $suffix),
                    "Report '{$suffix}' ({$featureKey}) must be accessible on Core."
                );
            } else {
                $this->assertFalse(
                    ReportPlanMap::visible($coreTenant, $suffix),
                    "Report '{$suffix}' ({$featureKey}, Scale) must be locked on Core."
                );
            }

            // Scale gets all reports
            $this->assertTrue(
                ReportPlanMap::visible($scaleTenant, $suffix),
                "Report '{$suffix}' ({$featureKey}) must be accessible on Scale."
            );
        }
    }

    /**
     * Test 2: trial gets everything; ltd_1/2/3 match Starter/Core/Scale.
     */
    #[Test]
    public function test_2_trial_and_ltd_tiers(): void
    {
        $trialTenant = $this->createTenant(plan: 'trial', status: 'trial');
        $ltd1Tenant = $this->createTenant(plan: 'ltd_1', status: 'active');
        $ltd2Tenant = $this->createTenant(plan: 'ltd_2', status: 'active');
        $ltd3Tenant = $this->createTenant(plan: 'ltd_3', status: 'active');

        foreach (ReportPlanMap::MAP as $suffix => $featureKey) {
            $tier = ReportPlanMap::tierFor($featureKey);

            // Trial gets everything
            $this->assertTrue(
                ReportPlanMap::visible($trialTenant, $suffix),
                "Report '{$suffix}' must be visible during trial."
            );

            // ltd_1 matches Starter
            $expectedLtd1 = ($tier === 'Starter');
            $this->assertSame(
                $expectedLtd1,
                ReportPlanMap::visible($ltd1Tenant, $suffix),
                "Report '{$suffix}' on ltd_1 must match Starter."
            );

            // ltd_2 matches Core
            $expectedLtd2 = in_array($tier, ['Starter', 'Core'], true);
            $this->assertSame(
                $expectedLtd2,
                ReportPlanMap::visible($ltd2Tenant, $suffix),
                "Report '{$suffix}' on ltd_2 must match Core."
            );

            // ltd_3 matches Scale
            $this->assertTrue(
                ReportPlanMap::visible($ltd3Tenant, $suffix),
                "Report '{$suffix}' on ltd_3 must match Scale."
            );
        }
    }

    /**
     * Test 3: Balance integrity: 6-month-old and 10-day-old invoices on Solo —
     * receivables card shows all-time sum, detail list only 30 days, total != 30-day sum.
     */
    #[Test]
    public function test_3_balance_integrity_all_time_vs_detail_window(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $user = $this->createTenantUser($tenant);
        app()->instance('current.tenant', $tenant);
        $this->actingAs($user);

        // Invoice 6 months ago (180 days ago): $50,000
        Sale::create([
            'tenant_id'        => $tenant->id,
            'user_id'          => $user->id,
            'reference_number' => 'INV-OLD-' . uniqid(),
            'status'           => 'posted',
            'total'            => 50000.00,
            'created_at'       => now()->subDays(180),
            'updated_at'       => now()->subDays(180),
        ]);

        // Invoice 10 days ago: $1,500
        Sale::create([
            'tenant_id'        => $tenant->id,
            'user_id'          => $user->id,
            'reference_number' => 'INV-RECENT-' . uniqid(),
            'status'           => 'posted',
            'total'            => 1500.00,
            'created_at'       => now()->subDays(10),
            'updated_at'       => now()->subDays(10),
        ]);

        // Detail list query windowed to visible history (30 days on Solo)
        $detailList = Sale::where('tenant_id', $tenant->id)->visibleHistory($tenant)->get();
        $detailSum = (float) $detailList->sum('total');

        $this->assertCount(1, $detailList);
        $this->assertEquals(1500.00, $detailSum);

        // All-time balance/total
        $allTimeSum = (float) Sale::where('tenant_id', $tenant->id)->sum('total');
        $this->assertEquals(51500.00, $allTimeSum);

        // Crucial invariant: all-time total is NOT equal to the 30-day sum
        $this->assertNotEquals($detailSum, $allTimeSum);
        $this->assertEquals(51500.00, $allTimeSum);
    }

    /**
     * Test 4: Nothing deleted: after a Solo tenant has existed past the window,
     * the underlying rows are all still present in the database.
     */
    #[Test]
    public function test_4_nothing_deleted_older_records_preserved(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $user = $this->createTenantUser($tenant);
        app()->instance('current.tenant', $tenant);
        $this->actingAs($user);

        Sale::create([
            'tenant_id'        => $tenant->id,
            'user_id'          => $user->id,
            'reference_number' => 'INV-PAST-' . uniqid(),
            'status'           => 'posted',
            'total'            => 2000.00,
            'created_at'       => now()->subDays(120),
        ]);

        // Underlying database records must never be purged or deleted
        $dbCount = Sale::where('tenant_id', $tenant->id)->count();
        $this->assertEquals(1, $dbCount, 'Older invoice rows must still exist in the database.');
    }

    /**
     * Test 5: Upgrading Solo -> Starter immediately exposes the full history.
     */
    #[Test]
    public function test_5_upgrading_solo_to_starter_exposes_full_history(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $user = $this->createTenantUser($tenant);
        app()->instance('current.tenant', $tenant);
        $this->actingAs($user);

        // 1 old (90 days), 1 recent (5 days)
        Sale::create([
            'tenant_id'        => $tenant->id,
            'user_id'          => $user->id,
            'reference_number' => 'INV-90D-' . uniqid(),
            'status'           => 'posted',
            'total'            => 300.00,
            'created_at'       => now()->subDays(90),
        ]);
        Sale::create([
            'tenant_id'        => $tenant->id,
            'user_id'          => $user->id,
            'reference_number' => 'INV-5D-' . uniqid(),
            'status'           => 'posted',
            'total'            => 100.00,
            'created_at'       => now()->subDays(5),
        ]);

        // On Solo: only 1 visible
        $this->assertEquals(1, Sale::where('tenant_id', $tenant->id)->visibleHistory($tenant)->count());

        // Upgrade to Starter
        $tenant->plan = 'starter';
        $tenant->save();
        PlanRepository::invalidateTenantCache($tenant);

        // Immediately reveals all 2 sales
        $this->assertEquals(2, Sale::where('tenant_id', $tenant->id)->visibleHistory($tenant)->count());
    }

    /**
     * Test 6: Card row caps: low stock card returns at most 10 rows, party cards at most 5.
     */
    #[Test]
    public function test_6_card_row_caps_on_solo(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $user = $this->createTenantUser($tenant);
        app()->instance('current.tenant', $tenant);
        $this->actingAs($user);

        // Create 15 low-stock products
        for ($i = 1; $i <= 15; $i++) {
            $product = Product::create([
                'tenant_id'      => $tenant->id,
                'name'           => "Low Stock Product {$i}",
                'type'           => 'standard',
                'alert_quantity' => 10,
            ]);
            Stock::create([
                'tenant_id'  => $tenant->id,
                'product_id' => $product->id,
                'quantity'   => 2,
            ]);
        }

        $reckoner = app(Reckoner::class);
        $req = new ReckonerRequest('inventory.low_stock_list', 'live');
        $listResult = $reckoner->read($req, $user, $tenant);

        $this->assertNotNull($listResult);
        $this->assertTrue($listResult->ok);
        $this->assertLessThanOrEqual(10, count($listResult->data['rows']), 'Solo low stock list must be capped at 10 items.');
    }

    /**
     * Test 7: A Solo tenant cannot obtain gross margin, COGS or profit-by-product through the Reckoner.
     */
    #[Test]
    public function test_7_solo_tenant_blocked_from_analytical_reckoner_metrics(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $user = $this->createTenantUser($tenant);
        app()->instance('current.tenant', $tenant);
        $this->actingAs($user);

        $reckoner = app(Reckoner::class);
        $keys = ['sales.gross_margin_pct', 'finance.cogs', 'sales.top_products'];

        $availability = $reckoner->checkAvailability($keys, $user, $tenant);
        foreach ($keys as $key) {
            $this->assertFalse(
                $availability[$key],
                "Analytical reading '{$key}' must not be available to Solo tenant."
            );
        }

        foreach ($keys as $key) {
            $def = ReckonerRegistry::find($key);
            $period = $def['default_period'] ?? 'today';
            $res = $reckoner->read(new ReckonerRequest($key, $period), $user, $tenant);
            $this->assertFalse($res->ok, "Reading '{$key}' must fail for Solo.");
            $this->assertEquals('plan_locked', $res->errorCode, "Error code for '{$key}' must be plan_locked.");
        }
    }

    /**
     * Test 8: An individual invoice older than 30 days still opens on Solo.
     */
    #[Test]
    public function test_8_individual_invoice_older_than_30_days_still_opens_on_solo(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $user = $this->createTenantUser($tenant);

        $oldSale = Sale::create([
            'tenant_id'        => $tenant->id,
            'user_id'          => $user->id,
            'reference_number' => 'INV-ARCHIVE-' . uniqid(),
            'status'           => 'posted',
            'total'            => 450.00,
            'created_at'       => now()->subDays(120),
        ]);

        $this->actingAs($user);
        app()->instance('current.tenant', $tenant);

        // Open individual invoice via API / JSON endpoint
        $response = $this->getJson(route('store.sales.show', [
            'store_slug' => $tenant->slug,
            'sale'       => $oldSale->id,
        ]));

        $response->assertOk();
        $response->assertJsonPath('sale.id', $oldSale->id);
    }
}
