<?php

namespace Tests\Feature\Hardening;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * 2026-09-10 — two small scoping bugs found while hardening:
 *  - deleting a UOM conversion threw (it queried a non-existent sale_items.sale_uom);
 *  - serial/IMEI numbers were unique across ALL stores.
 */
class SerialAndUomHousekeepingTest extends VenQoreTestCase
{
    private function product(string $tenantId): string
    {
        $id = (string) Str::uuid();
        DB::table('products')->insert([
            'id' => $id, 'tenant_id' => $tenantId, 'name' => 'Phone ' . Str::random(4),
            'sku' => 'P-' . Str::random(8), 'price' => 100, 'cost_price' => 60,
            'base_unit' => 'PCS', 'stock_quantity' => 0, 'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    private function conversion(string $tenantId, string $productId, $createdAt): string
    {
        $id = (string) Str::uuid();
        DB::table('product_uom_conversions')->insert([
            'id' => $id, 'tenant_id' => $tenantId, 'product_id' => $productId,
            'sale_uom' => 'CTN', 'conversion_factor' => 0.083333,
            'created_at' => $createdAt, 'updated_at' => $createdAt,
        ]);
        return $id;
    }

    #[Test]
    public function an_unused_uom_conversion_can_be_deleted_and_a_used_one_cannot(): void
    {
        $store = $this->createTenant('uom-del', 'ltd_3', 'active');
        $owner = $this->createTenantUser($store, 'owner');
        $this->actingAsTenantUserModel($owner, $store);

        $unused = $this->product($store->id);
        $c1 = $this->conversion($store->id, $unused, now()->subDay());
        $this->delete($this->storeUrl($store, "v3/products/{$unused}/uom/{$c1}"))->assertSessionHasNoErrors();
        $this->assertNull(DB::table('product_uom_conversions')->where('id', $c1)->first());

        $sold = $this->product($store->id);
        $c2 = $this->conversion($store->id, $sold, now()->subDay());
        $saleId = (string) Str::uuid();
        DB::table('sales')->insert(['id' => $saleId, 'tenant_id' => $store->id, 'reference_number' => 'S-' . Str::random(6), 'user_id' => $owner->id, 'subtotal' => 100, 'total' => 100, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('sale_items')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $store->id, 'sale_id' => $saleId, 'product_id' => $sold,
            'quantity' => 1, 'unit_price' => 100, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->delete($this->storeUrl($store, "v3/products/{$sold}/uom/{$c2}"))->assertSessionHasErrors('sale_uom');
        $this->assertNotNull(DB::table('product_uom_conversions')->where('id', $c2)->first());

        // Another store's conversion id: 404, nothing deleted.
        $other = $this->createTenant('uom-del-other', 'ltd_3', 'active');
        $theirs = $this->conversion($other->id, $this->product($other->id), now()->subDay());
        $this->actingAsTenantUserModel($owner, $store);
        $this->delete($this->storeUrl($store, "v3/products/{$unused}/uom/{$theirs}"))->assertNotFound();
        $this->assertNotNull(DB::table('product_uom_conversions')->where('id', $theirs)->first());
    }

    #[Test]
    public function the_same_serial_can_exist_in_two_stores_but_not_twice_in_one(): void
    {
        $a = $this->createTenant('serial-a', 'ltd_3', 'active');
        $b = $this->createTenant('serial-b', 'ltd_3', 'active');
        $row = fn (string $tid, string $pid) => [
            'id' => (string) Str::uuid(), 'tenant_id' => $tid, 'product_id' => $pid,
            'serial_number' => 'IMEI-356938035643809', 'status' => 'available',
            'created_at' => now(), 'updated_at' => now(),
        ];

        DB::table('product_serials')->insert($row($a->id, $this->product($a->id)));
        DB::table('product_serials')->insert($row($b->id, $this->product($b->id)));
        $this->assertSame(2, DB::table('product_serials')->where('serial_number', 'IMEI-356938035643809')->whereIn('tenant_id', [$a->id, $b->id])->count());

        $this->expectException(QueryException::class);
        DB::table('product_serials')->insert($row($a->id, $this->product($a->id)));
    }
}
