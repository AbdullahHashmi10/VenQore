<?php

namespace Tests\Feature\Hardening;

use App\Helpers\SettingsHelper;
use App\Models\Occupancy;
use App\Models\Position;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use App\Models\WorkOrder;
use App\Support\FohSettings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * FOH plan, Phase 2 (backend).
 *
 *  - products.track_stock = false skips FIFO deduction
 *  - FOH sales skip deduction ONLY when the store chose foh_stock=never,
 *    and the client cannot force it
 *  - dine-in -> takeaway frees the table and keeps the cart
 *  - a paid takeaway with food still cooking stays open until collected
 *  - /foh needs foh.access
 *  - FohSettings falls back to the legacy keys
 */
class FohBackendTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $owner;
    private string $tenantId;
    private string $warehouseId;
    private string $productId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant   = $this->createTenant('foh-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $this->tenantId = (string) $this->tenant->id;
        $this->seedTenantDefaults($this->tenant);
        $this->owner    = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
        SettingsHelper::clearCache();

        $this->warehouseId = (string) DB::table('warehouses')->where('tenant_id', $this->tenantId)->value('id');
        $this->productId = $this->makeProduct('Karahi', true);
    }

    private function makeProduct(string $name, bool $track): string
    {
        $id = (string) Str::uuid();
        DB::table('products')->insert([
            'id' => $id, 'tenant_id' => $this->tenantId, 'name' => $name, 'sku' => 'FOH-' . Str::random(6),
            'price' => 500.00, 'cost_price' => 200.00, 'tax_rate' => 0, 'base_unit' => 'PCS',
            'stock_quantity' => 0, 'track_stock' => $track, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $id, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 10, 'initial_qty' => 10,
            'remaining_qty' => 10, 'unit_cost' => 200, 'created_at' => now()->subDay(), 'updated_at' => now()->subDay(),
        ]);
        DB::table('stocks')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $id, 'warehouse_id' => $this->warehouseId,
            'quantity' => 10, 'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    private function sell(string $productId, array $extra = [])
    {
        return $this->postJson($this->storeUrl($this->tenant, 'sales'), array_merge([
            'warehouse_id'   => $this->warehouseId,
            'items'          => [['product_id' => $productId, 'quantity' => 2, 'price' => 500, 'discount' => 0]],
            'discount'       => 0,
            'amount_paid'    => 1000,
            'payment_method' => 'cash',
            'source'         => 'pos',
        ], $extra));
    }

    private function stockOf(string $productId): float
    {
        return (float) DB::table('stocks')->where('product_id', $productId)->where('warehouse_id', $this->warehouseId)->value('quantity');
    }

    /** @test */
    public function an_untracked_product_does_not_deduct_stock(): void
    {
        $id = $this->makeProduct('Made to order', false);
        $this->sell($id)->assertOk();
        $this->assertEquals(10.0, $this->stockOf($id));
    }

    /** @test */
    public function a_tracked_product_still_deducts_by_default(): void
    {
        $this->sell($this->productId)->assertOk();
        $this->assertEquals(8.0, $this->stockOf($this->productId));
    }

    /** @test */
    public function foh_stock_never_skips_deduction_only_for_foh_channel_sales(): void
    {
        Setting::updateOrCreate(['tenant_id' => $this->tenantId, 'key' => 'foh_stock'], ['value' => 'never']);

        // A plain counter sale is untouched by the FOH setting.
        $this->sell($this->productId)->assertOk();
        $this->assertEquals(8.0, $this->stockOf($this->productId));

        // A FOH sale skips.
        $this->sell($this->productId, ['channel' => 'foh'])->assertOk();
        $this->assertEquals(8.0, $this->stockOf($this->productId));
    }

    /** @test */
    public function the_client_cannot_switch_deduction_off_when_the_store_did_not(): void
    {
        // foh_stock is the default (per_item): channel=foh alone must not skip.
        $this->sell($this->productId, ['channel' => 'foh'])->assertOk();
        $this->assertEquals(8.0, $this->stockOf($this->productId));
    }

    /** @test */
    public function a_sale_records_its_occupancy_and_order_type(): void
    {
        $occ = Occupancy::create([
            'tenant_id' => $this->tenantId, 'position_id' => null, 'label' => 'TA-001',
            'opened_at' => now(), 'session_data' => ['order_type' => 'takeaway', 'cart' => []],
        ]);
        $res = $this->sell($this->productId, ['occupancy_id' => $occ->id, 'order_type' => 'takeaway'])->assertOk();
        $row = DB::table('sales')->where('id', $res->json('sale_id'))->first();
        $this->assertEquals($occ->id, (int) $row->occupancy_id);
        $this->assertSame('takeaway', $row->order_type);
    }

    /** @test */
    public function a_sale_cannot_point_at_another_stores_occupancy(): void
    {
        $other = $this->createTenant('other-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $occ = Occupancy::create([
            'tenant_id' => $other->id, 'position_id' => null, 'label' => 'TA-001',
            'opened_at' => now(), 'session_data' => ['order_type' => 'takeaway', 'cart' => []],
        ]);
        $res = $this->sell($this->productId, ['occupancy_id' => $occ->id])->assertOk();
        $this->assertNull(DB::table('sales')->where('id', $res->json('sale_id'))->value('occupancy_id'));
    }

    private function openTable(): array
    {
        $pos = Position::create([
            'tenant_id' => $this->tenantId, 'zone' => 'Main', 'code' => 'T1', 'label' => 'T1', 'capacity' => 4, 'status' => 'active',
        ]);
        $occ = Occupancy::create([
            'tenant_id' => $this->tenantId, 'position_id' => $pos->id, 'label' => 'T1', 'opened_at' => now(),
            'session_data' => [
                'order_type' => 'dine_in', 'covers' => 2, 'order_total' => 1000, 'sent_at' => now()->toIso8601String(),
                'cart' => [['id' => $this->productId, 'name' => 'Karahi', 'price' => 500, 'qty' => 2, 'sent' => true, 'sent_qty' => 2]],
            ],
        ]);
        return [$pos, $occ];
    }

    /** @test */
    public function converting_dine_in_to_takeaway_frees_the_table_and_keeps_the_order(): void
    {
        [$pos, $occ] = $this->openTable();

        $res = $this->postJson($this->storeUrl($this->tenant, 'tables/convert'), [
            'occupancy_id' => $occ->id, 'to' => 'takeaway', 'customer_name' => 'Ali',
        ])->assertOk();

        $occ->refresh();
        $this->assertNull($occ->position_id);
        $this->assertStringStartsWith('TA-', (string) $occ->label);
        $this->assertSame('takeaway', $occ->session_data['order_type']);
        $this->assertEquals(2, $occ->session_data['cart'][0]['sent_qty']);
        $this->assertEquals('available', $pos->fresh()->status);
        $this->assertNull($occ->closed_at);
        $this->assertNotEmpty($res->json('ticket'));
    }

    /** @test */
    public function converting_a_takeaway_back_to_dine_in_needs_a_free_table(): void
    {
        [$pos, $occ] = $this->openTable();
        $this->postJson($this->storeUrl($this->tenant, 'tables/convert'), ['occupancy_id' => $occ->id, 'to' => 'takeaway'])->assertOk();

        $this->postJson($this->storeUrl($this->tenant, 'tables/convert'), ['occupancy_id' => $occ->id, 'to' => 'dine_in'])
            ->assertStatus(422);

        $this->postJson($this->storeUrl($this->tenant, 'tables/convert'), ['occupancy_id' => $occ->id, 'to' => 'dine_in', 'position_id' => $pos->id])
            ->assertOk();
        $this->assertEquals($pos->id, $occ->fresh()->position_id);
    }

    private function paidTakeawayWithCooking(): Occupancy
    {
        Setting::updateOrCreate(['tenant_id' => $this->tenantId, 'key' => 'foh_takeaway'], ['value' => '1']);
        $occ = Occupancy::create([
            'tenant_id' => $this->tenantId, 'position_id' => null, 'label' => 'TA-001', 'opened_at' => now(),
            'session_data' => [
                'order_type' => 'takeaway', 'cart' => [['id' => $this->productId, 'name' => 'Karahi', 'price' => 500, 'qty' => 1, 'sent' => true, 'sent_qty' => 1]],
            ],
        ]);
        WorkOrder::create([
            'tenant_id' => $this->tenantId, 'occupancy_id' => $occ->id, 'status' => 'preparing', 'items' => [],
        ]);
        return $occ;
    }

    /** @test */
    public function a_paid_takeaway_with_food_still_cooking_stays_open_until_collected(): void
    {
        $occ = $this->paidTakeawayWithCooking();

        $res = $this->postJson($this->storeUrl($this->tenant, 'tables/settled'), ['occupancy_id' => $occ->id, 'sale_id' => 'x'])->assertOk();
        $this->assertFalse($res->json('closed'));
        $this->assertTrue($res->json('awaiting_collection'));
        $occ->refresh();
        $this->assertNull($occ->closed_at);
        $this->assertNotEmpty($occ->session_data['paid_at']);

        $this->postJson($this->storeUrl($this->tenant, 'tables/collected'), ['occupancy_id' => $occ->id])->assertOk();
        $occ->refresh();
        $this->assertNotNull($occ->closed_at);
        $this->assertNotEmpty($occ->session_data['collected_at']);
    }

    /** @test */
    public function bumping_the_last_ticket_to_served_closes_a_paid_takeaway(): void
    {
        $occ = $this->paidTakeawayWithCooking();
        $this->postJson($this->storeUrl($this->tenant, 'tables/settled'), ['occupancy_id' => $occ->id, 'sale_id' => 'x'])->assertOk();

        $wo = WorkOrder::where('occupancy_id', $occ->id)->first();
        $this->postJson($this->storeUrl($this->tenant, "restaurant/order/{$wo->id}/status"), ['status' => 'served'])->assertOk();

        $this->assertNotNull($occ->fresh()->closed_at);
    }

    /** @test */
    public function a_store_that_never_opted_in_keeps_close_on_pay(): void
    {
        $occ = Occupancy::create([
            'tenant_id' => $this->tenantId, 'position_id' => null, 'label' => 'TA-001', 'opened_at' => now(),
            'session_data' => ['order_type' => 'takeaway', 'cart' => [['id' => $this->productId, 'name' => 'Karahi', 'price' => 500, 'qty' => 1, 'sent' => true, 'sent_qty' => 1]]],
        ]);
        WorkOrder::create(['tenant_id' => $this->tenantId, 'occupancy_id' => $occ->id, 'status' => 'preparing', 'items' => []]);

        $res = $this->postJson($this->storeUrl($this->tenant, 'tables/settled'), ['occupancy_id' => $occ->id, 'sale_id' => 'x'])->assertOk();
        $this->assertTrue($res->json('closed'));
    }

    /** @test */
    public function the_floor_state_carries_kitchen_progress_and_paid_at(): void
    {
        $occ = $this->paidTakeawayWithCooking();
        $state = $this->getJson($this->storeUrl($this->tenant, 'tables/state'))->assertOk()->json();
        $ticket = collect($state['tickets'])->firstWhere('occupancy_id', $occ->id);
        $this->assertSame(['fired' => 1, 'ready' => 0, 'served' => 0], $ticket['kitchen_progress']);
        $this->assertArrayHasKey('paid_at', $ticket);
        $this->assertArrayHasKey('collected_at', $ticket);
    }

    /** @test */
    public function foh_needs_foh_access(): void
    {
        $viewer = $this->createTenantUser($this->tenant, 'viewer');
        $this->actingAsTenantUserModel($viewer, $this->tenant);
        $this->get($this->storeUrl($this->tenant, 'foh/tables'))->assertStatus(403);
    }

    /** @test */
    public function a_cashier_has_foh_access_by_role(): void
    {
        $this->assertContains('foh.access', config('permissions.cashier'));
        $this->assertContains('foh.access', config('permissions.manager'));
        $this->assertNotContains('foh.access', config('permissions.viewer'));
    }

    /** @test */
    public function foh_settings_fall_back_to_the_legacy_keys(): void
    {
        $tid = (int) $this->tenant->id;

        // No rows at all: today's defaults (service_mode both, both lanes on).
        $a = FohSettings::all($tid);
        $this->assertTrue($a['tables']);
        $this->assertTrue($a['takeaway']);
        $this->assertTrue($a['delivery']);
        $this->assertSame('per_item', $a['stock']);
        $this->assertFalse($a['takeaway_collect']);

        Setting::updateOrCreate(['tenant_id' => $tid, 'key' => 'service_mode'], ['value' => 'counter']);
        Setting::updateOrCreate(['tenant_id' => $tid, 'key' => 'lane_delivery'], ['value' => '0']);
        $b = FohSettings::all($tid);
        $this->assertFalse($b['tables']);
        $this->assertFalse($b['delivery']);

        // A new key wins over the legacy one, and opts the store in to collection.
        Setting::updateOrCreate(['tenant_id' => $tid, 'key' => 'foh_tables'], ['value' => '1']);
        $c = FohSettings::all($tid);
        $this->assertTrue($c['tables']);
        $this->assertTrue($c['takeaway_collect']);
        $this->assertSame(['overview', 'tables', 'takeaway'], FohSettings::enabledTabs($tid));
    }
}
