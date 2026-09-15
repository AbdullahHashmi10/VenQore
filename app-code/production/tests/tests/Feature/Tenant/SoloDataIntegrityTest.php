<?php

namespace Tests\Feature\Tenant;

use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

class SoloDataIntegrityTest extends VenQoreTestCase
{
    public function test_solo_plan_has_30_visible_history_days_and_paid_plans_are_null(): void
    {
        $soloTenant = $this->createTenant('solo-shop-' . uniqid(), 'solo');
        $this->assertSame(30, $soloTenant->visibleHistoryDays());

        $starterTenant = $this->createTenant('starter-shop-' . uniqid(), 'starter');
        $this->assertNull($starterTenant->visibleHistoryDays());

        $coreTenant = $this->createTenant('core-shop-' . uniqid(), 'core');
        $this->assertNull($coreTenant->visibleHistoryDays());

        $scaleTenant = $this->createTenant('scale-shop-' . uniqid(), 'scale');
        $this->assertNull($scaleTenant->visibleHistoryDays());
    }

    public function test_solo_visible_history_filters_view_without_deleting_underlying_data(): void
    {
        $tenant = $this->createTenant('solo-data-' . uniqid(), 'solo');
        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $warehouseId = DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');
        $userId = DB::table('tenant_users')->where('tenant_id', $tenant->id)->value('user_id') ?? 1;

        // Create a recent sale (5 days ago)
        $recentSale = Sale::create([
            'tenant_id'        => $tenant->id,
            'warehouse_id'     => $warehouseId,
            'user_id'          => $userId,
            'reference_number' => 'REF-RECENT-' . uniqid(),
            'subtotal'         => 100.00,
            'tax'              => 0.00,
            'discount'         => 0.00,
            'total'            => 100.00,
            'payment_status'   => 'paid',
            'status'           => 'completed',
            'created_at'       => Carbon::now()->subDays(5),
            'updated_at'       => Carbon::now()->subDays(5),
        ]);

        // Create an older sale (60 days ago) - outside 30-day window
        $olderSale = Sale::create([
            'tenant_id'        => $tenant->id,
            'warehouse_id'     => $warehouseId,
            'user_id'          => $userId,
            'reference_number' => 'REF-OLD-' . uniqid(),
            'subtotal'         => 200.00,
            'tax'              => 0.00,
            'discount'         => 0.00,
            'total'            => 200.00,
            'payment_status'   => 'paid',
            'status'           => 'completed',
            'created_at'       => Carbon::now()->subDays(60),
            'updated_at'       => Carbon::now()->subDays(60),
        ]);

        // 1. Database holds BOTH sales (zero deletion)
        $allSalesCount = Sale::where('tenant_id', $tenant->id)->count();
        $this->assertSame(2, $allSalesCount, 'Underlying database must retain all sales without deletion.');

        // 2. All-time sum is intact for balances ($100 + $200 = $300)
        $allTimeTotal = Sale::where('tenant_id', $tenant->id)->sum('total');
        $this->assertEquals(300.00, (float) $allTimeTotal, 'Cumulative totals must compute from all-time data.');

        // 3. visibleHistory scope only returns the recent sale
        $visibleSales = Sale::where('tenant_id', $tenant->id)->visibleHistory($tenant)->get();
        $this->assertCount(1, $visibleSales);
        $this->assertSame($recentSale->id, $visibleSales->first()->id);

        // 4. Direct invoice lookup by ID / reference_number still works regardless of age
        $fetchedOldSale = Sale::where('tenant_id', $tenant->id)->where('id', $olderSale->id)->first();
        $this->assertNotNull($fetchedOldSale);
        $this->assertSame($olderSale->id, $fetchedOldSale->id);

        // 5. Upgrading the tenant immediately exposes all historical sales in visibleHistory
        $tenant->update(['plan' => 'starter']);
        $tenant->refresh();

        $this->assertNull($tenant->visibleHistoryDays());
        $visibleAfterUpgrade = Sale::where('tenant_id', $tenant->id)->visibleHistory($tenant)->get();
        $this->assertCount(2, $visibleAfterUpgrade, 'Upgrading plan must immediately expose all historical records.');
    }
}