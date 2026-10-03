<?php

namespace Tests\Feature\Commerce;

use App\Models\Commerce\CommerceOrder;
use App\Models\Commerce\Storefront;
use App\Services\Commerce\CheckoutService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MerchantHttpTest extends CommerceTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['inertia.testing.ensure_pages_exist' => false]);
    }

    private function u(string $path = ''): string
    {
        return $this->storeUrl($this->tenant, 'online-store' . ($path ? '/' . ltrim($path, '/') : ''));
    }

    private function settingsPayload(array $over = []): array
    {
        $city = DB::table('commerce_cities')->where('slug', 'lahore')->first();
        return array_merge([
            'display_name' => 'My Public Shop', 'slug' => 'my-public-shop-' . Str::lower(Str::random(4)),
            'country_id' => $city->country_id, 'city_id' => $city->id, 'address_line' => '5 Main Road', 'phone' => '0300111',
            'supports_pickup' => true, 'supports_delivery' => true, 'delivery_charge' => 150, 'min_order_amount' => 0,
            'warehouse_id' => $this->warehouseId, 'pricing_mode' => 'increase', 'pricing_percent' => 10,
            'accept_cod' => true, 'accept_pickup_payment' => true, 'accept_bank_transfer' => false,
        ], $over);
    }

    public function test_home_creates_a_draft_storefront_for_the_tenant(): void
    {
        Storefront::where('tenant_id', $this->tenant->id)->delete();
        $this->get($this->u())->assertOk()->assertInertia(function ($p) {
            $pr = $p->toArray()['props'];
            $this->assertSame('draft', $pr['store']['status']);
            $this->assertNotEmpty($pr['problems']);
            $this->assertStringContainsString('<svg', $pr['qr_svg']);
            $this->assertStringContainsString('/shop/', $pr['public_url']);
        });
        $this->assertSame(1, Storefront::where('tenant_id', $this->tenant->id)->count());
    }

    public function test_settings_persist_and_never_touch_core_prices(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5);
        $p = $this->settingsPayload();
        $this->post($this->u('settings'), $p)->assertSessionHasNoErrors()->assertRedirect();
        $s = Storefront::where('tenant_id', $this->tenant->id)->first();
        $this->assertSame('My Public Shop', $s->display_name);
        $this->assertSame($p['slug'], $s->slug);
        $this->assertSame('increase', $s->pricing_mode);
        $this->assertEquals(10.0, $s->pricing_percent);
        $this->assertEquals(1000, DB::table('products')->where('id', $pid)->value('price'));
        $this->assertSame($this->tenant->currency_code, $s->currency_code); // from the business, not the request
    }

    public function test_settings_validation(): void
    {
        $lahore = DB::table('commerce_cities')->where('slug', 'lahore')->first();
        $this->post($this->u('settings'), $this->settingsPayload(['slug' => 'Bad Slug!']))->assertSessionHasErrors('slug');
        $this->post($this->u('settings'), $this->settingsPayload(['slug' => 'checkout']))->assertSessionHasErrors('slug');
        $this->post($this->u('settings'), $this->settingsPayload(['pricing_mode' => 'decrease', 'pricing_percent' => 95]))->assertSessionHasErrors('pricing_percent');
        $this->post($this->u('settings'), $this->settingsPayload(['pricing_mode' => 'increase', 'pricing_percent' => 0]))->assertSessionHasErrors('pricing_percent');
        $this->post($this->u('settings'), $this->settingsPayload(['warehouse_id' => (string) Str::uuid()]))->assertSessionHasErrors('warehouse_id');
        $this->post($this->u('settings'), $this->settingsPayload(['country_id' => 99999]))->assertSessionHasErrors('country_id');
        $other = DB::table('commerce_countries')->insertGetId(['code' => 'XX', 'name' => 'Elsewhere', 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $this->post($this->u('settings'), $this->settingsPayload(['country_id' => $other, 'city_id' => $lahore->id]))->assertSessionHasErrors('city_id');
    }

    public function test_slug_must_be_unique_across_tenants(): void
    {
        $t2 = $this->createTenant('shop-' . Str::lower(Str::random(6)), 'growth', 'active');
        $this->makeStore($t2, (string) DB::table('warehouses')->where('tenant_id', $t2->id)->value('id'), ['slug' => 'taken-slug']);
        $this->post($this->u('settings'), $this->settingsPayload(['slug' => 'taken-slug']))->assertSessionHasErrors('slug');
    }

    public function test_cannot_use_another_tenants_warehouse(): void
    {
        $t2 = $this->createTenant('shop-' . Str::lower(Str::random(6)), 'growth', 'active');
        $foreignWh = (string) DB::table('warehouses')->where('tenant_id', $t2->id)->value('id');
        $this->post($this->u('settings'), $this->settingsPayload(['warehouse_id' => $foreignWh]))->assertSessionHasErrors('warehouse_id');
    }

    public function test_publish_requires_readiness_then_goes_live_then_unpublish(): void
    {
        Storefront::where('tenant_id', $this->tenant->id)->delete();
        $this->post($this->u('publish'))->assertSessionHasErrors('store'); // nothing set up yet
        $this->post($this->u('settings'), $this->settingsPayload())->assertSessionHasNoErrors();
        $this->post($this->u('publish'))->assertSessionHasErrors('store'); // no products yet
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5);
        $this->post($this->u('products/bulk'), ['ids' => [$pid], 'action' => 'publish'])->assertSessionHasNoErrors();
        $this->post($this->u('publish'))->assertSessionHasNoErrors();
        $s = Storefront::where('tenant_id', $this->tenant->id)->first();
        $this->assertSame('published', $s->status);
        $this->get('/shop/' . $s->slug)->assertOk();

        $this->post($this->u('unpublish'));
        $this->assertSame('unpublished', $s->fresh()->status);
        $this->get('/shop/' . $s->slug)->assertNotFound();
    }

    public function test_bulk_publish_skips_unsupported_products_with_reasons(): void
    {
        $this->post($this->u('settings'), $this->settingsPayload())->assertSessionHasNoErrors();
        $good = $this->makeProduct($this->tenant, $this->warehouseId, [], 5);
        $svc = $this->makeProduct($this->tenant, $this->warehouseId, ['type' => 'service'], 0);
        $var = $this->makeProduct($this->tenant, $this->warehouseId, ['has_variants' => 1], 5);
        $free = $this->makeProduct($this->tenant, $this->warehouseId, ['price' => 0], 5);
        $res = $this->post($this->u('products/bulk'), ['ids' => [$good, $svc, $var, $free], 'action' => 'publish'])->assertRedirect();
        $skipped = session('skipped');
        $this->assertCount(3, $skipped);
        $store = Storefront::where('tenant_id', $this->tenant->id)->first();
        $published = DB::table('storefront_products')->where('storefront_id', $store->id)->where('is_published', 1)->pluck('product_id')->all();
        $this->assertSame([$good], $published);
    }

    public function test_below_cost_online_price_blocks_publication_until_allowed(): void
    {
        $this->post($this->u('settings'), $this->settingsPayload(['pricing_mode' => 'decrease', 'pricing_percent' => 80]))->assertSessionHasNoErrors();
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5); // 200 online < cost 400
        $this->post($this->u('products/bulk'), ['ids' => [$pid], 'action' => 'publish']);
        $this->assertCount(1, session('skipped'));
        $this->post($this->u('products/bulk'), ['ids' => [$pid], 'action' => 'publish', 'allow_below_cost' => true]);
        $this->assertNull(session('skipped') ?: null);
        $this->assertSame(1, DB::table('storefront_products')->where('product_id', $pid)->where('is_published', 1)->count());
    }

    public function test_fixed_override_saved_and_previewed(): void
    {
        $this->post($this->u('settings'), $this->settingsPayload())->assertSessionHasNoErrors();
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5);
        $this->post($this->u('products/bulk'), ['ids' => [$pid], 'action' => 'publish', 'override_price' => 1050]);
        $this->get($this->u('products'))->assertOk()->assertInertia(function ($p) use ($pid) {
            $row = collect($p->toArray()['props']['products'])->firstWhere('id', $pid);
            $this->assertEquals(1050.0, $row['online_price']);
            $this->assertSame('fixed_override', $row['rule']);
            $this->assertEquals(1000.0, $row['regular_price']);
        });
    }

    public function test_product_list_is_scoped_to_the_tenant(): void
    {
        $this->post($this->u('settings'), $this->settingsPayload())->assertSessionHasNoErrors();
        $t2 = $this->createTenant('shop-' . Str::lower(Str::random(6)), 'growth', 'active');
        $foreign = $this->makeProduct($t2, (string) DB::table('warehouses')->where('tenant_id', $t2->id)->value('id'), ['name' => 'Foreign Product'], 5);
        $this->get($this->u('products'))->assertOk()->assertDontSee('Foreign Product');
        $this->post($this->u('products/bulk'), ['ids' => [$foreign], 'action' => 'publish']);
        $this->assertSame(0, DB::table('storefront_products')->where('product_id', $foreign)->count());
    }

    public function test_inbox_lifecycle_over_http_and_cross_tenant_isolation(): void
    {
        $this->post($this->u('settings'), $this->settingsPayload())->assertSessionHasNoErrors();
        $store = Storefront::where('tenant_id', $this->tenant->id)->first();
        $store->update(['status' => 'published']);
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $store);
        $order = app(CheckoutService::class)->place($store, $this->checkoutInput([['product_id' => $pid, 'quantity' => 2]]))['order'];

        $this->get($this->u('orders'))->assertOk()->assertInertia(fn ($p) => $this->assertSame(1, $p->toArray()['props']['counts']['new']));
        $this->get($this->u('orders/alerts'))->assertOk()->assertJsonPath('unread', 1);

        $this->post($this->u("orders/{$order->id}/accept"))->assertSessionHasNoErrors();
        $this->post($this->u("orders/{$order->id}/advance"), ['to' => 'preparing'])->assertSessionHasNoErrors();
        $this->post($this->u("orders/{$order->id}/advance"), ['to' => 'ready'])->assertSessionHasNoErrors();
        $this->post($this->u("orders/{$order->id}/complete"), ['collect_now' => true])->assertSessionHasNoErrors();
        $o = $order->fresh();
        $this->assertSame('completed', $o->status);
        $this->assertNotNull($o->sale_id);
        $this->get($this->u("orders/{$order->id}"))->assertOk()->assertInertia(fn ($p) => $this->assertSame($o->sale_id, $p->toArray()['props']['sale']['id']));

        // another business can neither see nor act on it
        $t2 = $this->createTenant('shop-' . Str::lower(Str::random(6)), 'growth', 'active');
        $u2 = $this->createTenantUser($t2, 'owner');
        $this->actingAsTenantUserModel($u2, $t2);
        $other = fn (string $p) => $this->storeUrl($t2, 'online-store/' . $p);
        $this->get($other("orders/{$order->id}"))->assertNotFound();
        $this->post($other("orders/{$order->id}/cancel"), ['reason' => 'x'])->assertSessionHasErrors('order');
        $this->get($other('orders'))->assertOk()->assertInertia(fn ($p) => $this->assertSame(0, $p->toArray()['props']['counts']['completed']));
        $this->assertSame('completed', $order->fresh()->status);
    }

    public function test_stock_shortage_surfaces_as_a_form_error_not_a_crash(): void
    {
        $this->post($this->u('settings'), $this->settingsPayload())->assertSessionHasNoErrors();
        $store = Storefront::where('tenant_id', $this->tenant->id)->first();
        $store->update(['status' => 'published']);
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $store);
        $order = app(CheckoutService::class)->place($store, $this->checkoutInput([['product_id' => $pid, 'quantity' => 3]]))['order'];
        DB::table('inventory_batches')->where('product_id', $pid)->update(['remaining_qty' => 1]); // stock dropped after the customer ordered
        $this->post($this->u("orders/{$order->id}/accept"))->assertSessionHasErrors('order');
        $this->assertSame('pending', $order->fresh()->status);
    }

    public function test_low_privilege_staff_cannot_manage_settings_or_complete_orders(): void
    {
        $t = $this->tenant;
        $cashier = $this->createTenantUser($t, 'viewer');
        $this->actingAsTenantUserModel($cashier, $t);
        $this->post($this->u('settings'), $this->settingsPayload())->assertForbidden();
        $this->post($this->u('publish'))->assertForbidden();
        $this->post($this->u('orders/' . Str::uuid() . '/complete'), ['collect_now' => true])->assertForbidden();
    }

    public function test_old_online_store_url_redirects_to_the_new_home(): void
    {
        $this->get($this->storeUrl($this->tenant, 'online-store-manager'))->assertRedirect(route('store.commerce.home', ['store_slug' => $this->tenant->slug]));
    }

    public function test_merchant_can_upload_and_remove_an_online_photo_and_toggle_photos(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Snap'], 5);
        $file = \Illuminate\Http\UploadedFile::fake()->image('p.jpg', 300, 300);
        $this->post($this->u("products/{$pid}/photo"), ['photo' => $file])->assertSessionHasNoErrors();
        $path = DB::table('storefront_products')->where('product_id', $pid)->value('image_path');
        $this->assertNotNull($path);
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists($path);
        $this->post($this->u("products/{$pid}/photo"), ['photo' => \Illuminate\Http\UploadedFile::fake()->create('x.pdf', 10, 'application/pdf')])->assertSessionHasErrors('photo');
        $this->post($this->u("products/{$pid}/photo"), ['remove' => true]);
        $this->assertNull(DB::table('storefront_products')->where('product_id', $pid)->value('image_path'));
        $this->post($this->u("products/" . Str::uuid() . "/photo"), ['remove' => true])->assertNotFound();
    }

    public function test_settings_save_zones_announcement_and_reject_duplicate_zone_names(): void
    {
        $zones = [['name' => 'Gulberg', 'fee' => 120, 'min_order' => 500], ['name' => 'DHA', 'fee' => 250]];
        $this->post($this->u('settings'), $this->settingsPayload(['announcement' => 'Eid hours: 10-6', 'prep_minutes' => 30, 'delivery_zones' => $zones]))->assertSessionHasNoErrors();
        $st = Storefront::where('tenant_id', $this->tenant->id)->first();
        $this->assertSame('Eid hours: 10-6', $st->announcement);
        $this->assertSame(30, (int) $st->prep_minutes);
        $this->assertSame(['Gulberg', 'DHA'], collect($st->delivery_zones)->pluck('name')->all());
        $this->post($this->u('settings'), $this->settingsPayload(['delivery_zones' => [['name' => 'A', 'fee' => 1], ['name' => 'a', 'fee' => 2]]]))->assertSessionHasErrors('delivery_zones');
        $this->post($this->u('settings'), $this->settingsPayload())->assertSessionHasNoErrors();
        $this->assertNull(Storefront::where('tenant_id', $this->tenant->id)->first()->delivery_zones);
    }

    public function test_promotions_crud_timezone_conversion_and_isolation(): void
    {
        $this->get($this->u('/'))->assertOk(); // creates the draft store
        $this->tenant->update(['timezone' => 'Asia/Karachi']);
        Storefront::where('tenant_id', $this->tenant->id)->update(['timezone' => 'Asia/Karachi']);
        $this->post($this->u('promotions'), ['name' => 'Eid', 'code' => ' eid 25 ', 'percent' => 25, 'scope' => 'store', 'starts_at' => '2026-10-10T09:00', 'ends_at' => '2026-10-12T09:00', 'max_uses' => 5])->assertSessionHasNoErrors();
        $p = DB::table('commerce_promotions')->first();
        $this->assertSame('EID25', $p->code);
        $this->assertSame('2026-10-10 04:00:00', $p->starts_at); // 09:00 PKT = 04:00 UTC
        $this->post($this->u('promotions'), ['name' => 'Dup', 'code' => 'eid25', 'percent' => 5, 'scope' => 'store'])->assertSessionHasErrors('code');
        $this->post($this->u('promotions'), ['name' => 'Bad', 'percent' => 5, 'scope' => 'store', 'starts_at' => '2026-10-12T09:00', 'ends_at' => '2026-10-10T09:00'])->assertSessionHasErrors('ends_at');
        $this->post($this->u('promotions'), ['name' => 'Cat', 'percent' => 5, 'scope' => 'category', 'category_id' => (string) Str::uuid()])->assertSessionHasErrors('category_id');
        $this->get($this->u('promotions'))->assertOk()->assertInertia(function ($pg) {
            $props = $pg->toArray()['props'];
            $this->assertCount(1, $props['promotions']);
            $this->assertSame(Storefront::where('tenant_id', $this->tenant->id)->value('slug'), $props['store']['slug']); // same shape as the other merchant pages (layout needs store.slug)
        });
        $this->post($this->u("promotions/{$p->id}/toggle"));
        $this->assertSame(0, (int) DB::table('commerce_promotions')->where('id', $p->id)->value('is_active'));
        // another tenant cannot touch it
        $t2 = $this->createTenant('shop-' . Str::lower(Str::random(6)), 'growth', 'active');
        $u2 = $this->createTenantUser($t2, 'owner');
        $this->actingAsTenantUserModel($u2, $t2);
        $this->get($this->storeUrl($t2, 'online-store/'))->assertOk();
        $this->delete($this->storeUrl($t2, "online-store/promotions/{$p->id}"))->assertNotFound();
        $this->assertSame(1, DB::table('commerce_promotions')->count());
    }

    public function test_featured_products_cap_and_home_insights(): void
    {
        $this->get($this->u('/'))->assertOk();
        $ids = collect(range(1, 13))->map(fn () => $this->makeProduct($this->tenant, $this->warehouseId, [], 1))->all();
        $this->post($this->u('products/bulk'), ['ids' => $ids, 'action' => 'feature']);
        $this->assertSame(12, DB::table('storefront_products')->where('is_featured', 1)->count());
        $this->get($this->u('/'))->assertInertia(fn ($pg) => $this->assertSame(0, $pg->toArray()['props']['insights']['placed']));
    }
}
