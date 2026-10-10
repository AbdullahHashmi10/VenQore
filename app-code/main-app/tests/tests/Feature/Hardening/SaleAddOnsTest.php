<?php

namespace Tests\Feature\Hardening;

use App\Helpers\SettingsHelper;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Add-ons ("Extra cheese +100") on a counter sale line.
 *
 * The register prices the add-ons INTO the line's unit price and sends the
 * picked options along as a snapshot. The server must:
 *   1. keep the unit price it was given (the add-ons are already in it, so the
 *      invoice total is base + add-ons, never base alone);
 *   2. save the snapshot (name + price_delta) on the sale line, so a reprint
 *      still says what was sold even if the add-on is renamed or repriced;
 *   3. leave a plain line with no snapshot at all;
 *   4. refuse a snapshot it cannot read (no name) rather than store junk.
 */
class SaleAddOnsTest extends VenQoreTestCase
{
    private Tenant $tenant;
    private User $owner;
    private string $tenantId;
    private string $warehouseId;
    private string $productId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant   = $this->createTenant('addons-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $this->tenantId = (string) $this->tenant->id;
        $this->seedTenantDefaults($this->tenant);
        $this->owner    = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
        SettingsHelper::clearCache();

        $this->warehouseId = (string) DB::table('warehouses')->where('tenant_id', $this->tenantId)->value('id');

        $this->productId = (string) Str::uuid();
        DB::table('products')->insert([
            'id' => $this->productId, 'tenant_id' => $this->tenantId, 'name' => 'Pizza', 'sku' => 'ADD-' . Str::random(6),
            'price' => 1500.00, 'cost_price' => 600.00, 'tax_rate' => 0, 'base_unit' => 'PCS',
            'stock_quantity' => 0, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'batch_type' => 'purchase', 'original_qty' => 10, 'initial_qty' => 10,
            'remaining_qty' => 10, 'unit_cost' => 600, 'created_at' => now()->subDay(), 'updated_at' => now()->subDay(),
        ]);
        DB::table('stocks')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId,
            'product_id' => $this->productId, 'warehouse_id' => $this->warehouseId,
            'quantity' => 10, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('products')->where('id', $this->productId)->increment('stock_quantity', 10);
    }

    private function sell(array $line, float $paid): \Illuminate\Testing\TestResponse
    {
        return $this->postJson($this->storeUrl($this->tenant, 'sales'), [
            'warehouse_id'   => $this->warehouseId,
            'items'          => [array_merge(['product_id' => $this->productId, 'quantity' => 1, 'discount' => 0], $line)],
            'discount'       => 0,
            'amount_paid'    => $paid,
            'payment_method' => 'cash',
            'source'         => 'pos',
        ]);
    }

    /** @test The invoice total is base + add-ons and the snapshot is saved on the line */
    public function add_ons_are_part_of_the_price_and_saved_on_the_line(): void
    {
        $res = $this->sell([
            'price'     => 1650.00, // 1500 + 100 + 50, already summed by the register
            'modifiers' => [
                ['id' => 31, 'name' => 'Extra cheese', 'price_delta' => 100],
                ['id' => 32, 'name' => 'Olives', 'price_delta' => 50],
            ],
        ], 1650.00);
        $res->assertOk()->assertJson(['success' => true]);

        $saleId = (string) $res->json('sale_id');
        $this->assertEquals(1650.00, (float) DB::table('sales')->where('id', $saleId)->value('total'));

        $item = DB::table('sale_items')->where('sale_id', $saleId)->first();
        $this->assertEquals(1650.00, (float) $item->unit_price);
        $this->assertEquals(
            [
                ['id' => '31', 'name' => 'Extra cheese', 'price_delta' => 100],
                ['id' => '32', 'name' => 'Olives', 'price_delta' => 50],
            ],
            json_decode($item->modifiers, true)
        );
    }

    /** @test A plain line stores no snapshot */
    public function a_plain_line_has_no_add_ons(): void
    {
        $res = $this->sell(['price' => 1500.00], 1500.00);
        $res->assertOk()->assertJson(['success' => true]);

        $item = DB::table('sale_items')->where('sale_id', (string) $res->json('sale_id'))->first();
        $this->assertNull($item->modifiers);
    }

    /** @test An add-on with no name is refused, not stored */
    public function an_unreadable_add_on_is_refused(): void
    {
        $this->sell([
            'price'     => 1600.00,
            'modifiers' => [['id' => 31, 'price_delta' => 100]],
        ], 1600.00)->assertStatus(422);
    }
}
