<?php

namespace Tester\tests\Feature\Money;

use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Party;
use App\Models\Sale;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Tests\Feature\VenQoreTestCase;

class TenantTimezoneTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_B2_a_sale_at_02_point_00_tenant_local_counts_on_the_tenant_local_date_not_the_UTC_date()
    {
        // Karachi timezone has a UTC offset of +5.
        // A sale made on 2026-06-21 at 02:30 AM Karachi time has a UTC created_at equivalent of 2026-06-20 09:30 PM (21:30).
        $tenant = $this->createTenant("karachi-shop", "ltd_3");
        $tenant->update(['timezone' => 'Asia/Karachi']);

        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $warehouseId = DB::table("warehouses")->where("tenant_id", $tenant->id)->value("id");
        $customer = Party::factory()->customer()->create(["tenant_id" => $tenant->id]);

        $product = Product::factory()->create([
            "tenant_id" => $tenant->id,
            "cost_price" => 50.00,
            "price" => 100.00,
            "tax_rate" => 0,
        ]);

        Stock::create([
            "tenant_id" => $tenant->id,
            "product_id" => $product->id,
            "warehouse_id" => $warehouseId,
            "quantity" => 100.00,
        ]);

        // Seed a sale created at 2026-06-21 02:30 AM Karachi local time = 2026-06-20 21:30:00 UTC.
        $utcCreatedAt = Carbon::create(2026, 6, 20, 21, 30, 0, 'UTC');
        Carbon::setTestNow($utcCreatedAt);

        $sale = app(\App\Services\V3\SaleService::class)->post([
            'customer_id'     => $customer->id,
            'warehouse_id'    => $warehouseId,
            'sale_date'       => '2026-06-21',
            'payment_method'  => 'cash',
            'amount_received' => 100.00,
            'items' => [[
                'product_id'       => $product->id,
                'qty'              => 1,
                'sale_uom'         => 'pcs',
                'unit_price'       => 100.00,
                'discount_percent' => 0,
                'tax_rate'         => 0,
            ]],
        ]);

        // Mock current time of the request to be 2026-06-21 10:00:00 Karachi time (05:00:00 UTC).
        $karachiNow = Carbon::create(2026, 6, 21, 10, 0, 0, 'Asia/Karachi');
        Carbon::setTestNow($karachiNow);

        // Hit the dashboard path
        $response = $this->getJson("/s/{$tenant->slug}/sales");
        $response->assertStatus(200);

        // Today's total revenue should be 100.00 (since 2026-06-21 02:30 Karachi is today)
        $todayRevenue = (float)$response->json('stats.sales_today');
        $this->assertEquals(100.00, $todayRevenue);

        Carbon::setTestNow();
    }

    public function test_B2_a_UTC_tenant_is_unaffected()
    {
        $tenant = $this->createTenant("utc-shop", "ltd_3");
        $tenant->update(['timezone' => 'UTC']);

        $this->actingAsOwner($tenant);
        $this->seedTenantDefaults($tenant);

        $warehouseId = DB::table("warehouses")->where("tenant_id", $tenant->id)->value("id");
        $customer = Party::factory()->customer()->create(["tenant_id" => $tenant->id]);

        $product = Product::factory()->create([
            "tenant_id" => $tenant->id,
            "cost_price" => 50.00,
            "price" => 100.00,
            "tax_rate" => 0,
        ]);

        Stock::create([
            "tenant_id" => $tenant->id,
            "product_id" => $product->id,
            "warehouse_id" => $warehouseId,
            "quantity" => 100.00,
        ]);

        // Seed a sale yesterday (2026-06-20 21:30:00 UTC) which should not count for today since tenant is UTC
        $utcCreatedAt = Carbon::create(2026, 6, 20, 21, 30, 0, 'UTC');
        Carbon::setTestNow($utcCreatedAt);

        $sale = app(\App\Services\V3\SaleService::class)->post([
            'customer_id'     => $customer->id,
            'warehouse_id'    => $warehouseId,
            'sale_date'       => '2026-06-20',
            'payment_method'  => 'cash',
            'amount_received' => 100.00,
            'items' => [[
                'product_id'       => $product->id,
                'qty'              => 1,
                'sale_uom'         => 'pcs',
                'unit_price'       => 100.00,
                'discount_percent' => 0,
                'tax_rate'         => 0,
            ]],
        ]);

        $utcNow = Carbon::create(2026, 6, 21, 10, 0, 0, 'UTC');
        Carbon::setTestNow($utcNow);

        $response = $this->getJson("/s/{$tenant->slug}/sales");
        $response->assertStatus(200);

        // Today's total revenue should be 0.00 for UTC timezone
        $todayRevenue = (float)$response->json('stats.sales_today');
        $this->assertEquals(0.00, $todayRevenue);

        Carbon::setTestNow();
    }
}
