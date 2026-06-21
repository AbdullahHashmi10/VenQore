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

        // Mock current time of the request to be 2026-06-21 10:00:00 Karachi time (05:00:00 UTC).
        $karachiNow = Carbon::create(2026, 6, 21, 10, 0, 0, 'Asia/Karachi');
        Carbon::setTestNow($karachiNow);

        // Seed a sale created at 2026-06-21 02:30 AM Karachi local time = 2026-06-20 21:30:00 UTC.
        // Note: Sale controller stores created_at as UTC, so we insert the sale with explicit UTC timestamps.
        $utcCreatedAt = Carbon::create(2026, 6, 20, 21, 30, 0, 'UTC');

        $sale = Sale::create([
            'tenant_id' => $tenant->id,
            'reference_number' => 'SAL-TZ-TEST-0001',
            'source' => 'manual',
            'party_id' => $customer->id,
            'user_id' => auth()->id() ?? 1,
            'warehouse_id' => $warehouseId,
            'subtotal' => 100.00,
            'tax' => 0.00,
            'discount' => 0.00,
            'total' => 100.00,
            'subtotal_gross' => 100.00,
            'total_item_discounts' => 0.00,
            'global_discount' => 0.00,
            'net_sales' => 100.00,
            'total_tax' => 0.00,
            'invoice_total' => 100.00,
            'status' => 'posted',
            'posted_at' => $utcCreatedAt,
            'created_at' => $utcCreatedAt,
            'updated_at' => $utcCreatedAt,
        ]);

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

        $utcNow = Carbon::create(2026, 6, 21, 10, 0, 0, 'UTC');
        Carbon::setTestNow($utcNow);

        // Seed a sale yesterday (2026-06-20 21:30:00 UTC) which should not count for today since tenant is UTC
        $utcCreatedAt = Carbon::create(2026, 6, 20, 21, 30, 0, 'UTC');

        $sale = Sale::create([
            'tenant_id' => $tenant->id,
            'reference_number' => 'SAL-TZ-TEST-0002',
            'source' => 'manual',
            'party_id' => $customer->id,
            'user_id' => auth()->id() ?? 1,
            'warehouse_id' => $warehouseId,
            'subtotal' => 100.00,
            'tax' => 0.00,
            'discount' => 0.00,
            'total' => 100.00,
            'subtotal_gross' => 100.00,
            'total_item_discounts' => 0.00,
            'global_discount' => 0.00,
            'net_sales' => 100.00,
            'total_tax' => 0.00,
            'invoice_total' => 100.00,
            'status' => 'posted',
            'posted_at' => $utcCreatedAt,
            'created_at' => $utcCreatedAt,
            'updated_at' => $utcCreatedAt,
        ]);

        $response = $this->getJson("/s/{$tenant->slug}/sales");
        $response->assertStatus(200);

        // Today's total revenue should be 0.00 for UTC timezone
        $todayRevenue = (float)$response->json('stats.sales_today');
        $this->assertEquals(0.00, $todayRevenue);

        Carbon::setTestNow();
    }
}
