<?php

namespace Tests\Feature\Commerce;

use App\Models\Commerce\Storefront;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

abstract class CommerceTestCase extends VenQoreTestCase
{
    protected Tenant $tenant;
    protected User $owner;
    protected string $warehouseId;
    protected Storefront $store;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = $this->createTenant('shop-' . Str::lower(Str::random(6)), 'growth', 'active');
        $this->owner = $this->createTenantUser($this->tenant, 'owner');
        $this->actingAsTenantUserModel($this->owner, $this->tenant);
        $this->warehouseId = (string) DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');
        $this->store = $this->makeStore($this->tenant, $this->warehouseId);
    }

    protected function makeStore(Tenant $tenant, string $warehouseId, array $over = []): Storefront
    {
        $city = DB::table('commerce_cities')->where('slug', 'lahore')->first();
        return Storefront::create(array_merge([
            'tenant_id' => $tenant->id,
            'slug' => 's-' . Str::lower(Str::random(8)),
            'display_name' => 'Test Shop',
            'country_id' => $city->country_id,
            'city_id' => $city->id,
            'address_line' => '1 Mall Road',
            'phone' => '03001234567',
            'timezone' => 'Asia/Karachi',
            'currency_code' => 'PKR', 'currency_symbol' => 'Rs',
            'supports_pickup' => true, 'supports_delivery' => true, 'delivery_charge' => 100,
            'warehouse_id' => $warehouseId,
            'accept_cod' => true, 'accept_pickup_payment' => true, 'accept_bank_transfer' => true,
            'status' => 'published', 'published_at' => now(),
        ], $over));
    }

    protected function makeProduct(Tenant $tenant, string $warehouseId, array $over = [], float $stock = 50, ?Storefront $store = null, array $spOver = []): string
    {
        $id = (string) Str::uuid();
        DB::table('products')->insert(array_merge([
            'id' => $id, 'tenant_id' => $tenant->id, 'name' => 'Item ' . Str::random(4), 'sku' => 'SKU-' . Str::random(6),
            'type' => 'standard', 'base_unit' => 'PCS', 'unit' => 'PCS', 'price' => 1000, 'cost_price' => 400,
            'tax_rate' => 0, 'price_includes_tax' => 0, 'stock_quantity' => $stock, 'is_active' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ], $over));
        if ($stock > 0) {
            DB::table('inventory_batches')->insert([
                'id' => (string) Str::uuid(), 'tenant_id' => $tenant->id, 'product_id' => $id, 'warehouse_id' => $warehouseId,
                'batch_type' => 'opening', 'original_qty' => $stock, 'remaining_qty' => $stock, 'unit_cost' => $over['cost_price'] ?? 400,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('stocks')->insert([
                'id' => (string) Str::uuid(), 'tenant_id' => $tenant->id, 'product_id' => $id, 'warehouse_id' => $warehouseId,
                'quantity' => $stock, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        if ($store) {
            DB::table('storefront_products')->insert(array_merge([
                'id' => (string) Str::uuid(), 'storefront_id' => $store->id, 'tenant_id' => $tenant->id, 'product_id' => $id,
                'is_published' => 1, 'created_at' => now(), 'updated_at' => now(),
            ], $spOver));
        }
        return $id;
    }

    protected function checkoutInput(array $items, array $over = []): array
    {
        return array_merge([
            'idempotency_key' => (string) Str::uuid(),
            'fulfilment' => 'pickup', 'payment_method' => 'pickup',
            'customer_name' => 'Ali Guest', 'customer_phone' => '0300-1112223',
            'items' => $items,
        ], $over);
    }
}
