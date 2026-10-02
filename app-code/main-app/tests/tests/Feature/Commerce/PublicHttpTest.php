<?php

namespace Tests\Feature\Commerce;

use App\Models\Commerce\CommerceOrder;
use App\Models\Commerce\Storefront;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PublicHttpTest extends CommerceTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['inertia.testing.ensure_pages_exist' => false]);
        // public requests are guests with no ambient tenant
        auth()->logout();
        app()->forgetInstance('current.tenant');
    }

    private function body(array $items, array $over = []): array
    {
        return $this->checkoutInput($items, $over);
    }

    public function test_directory_lists_only_published_stores_in_the_selected_city(): void
    {
        $other = $this->createTenant('shop-' . Str::lower(Str::random(6)), 'growth', 'active');
        $wh = (string) DB::table('warehouses')->where('tenant_id', $other->id)->value('id');
        $draft = $this->makeStore($other, $wh, ['status' => 'draft', 'display_name' => 'Draft Shop']);
        $t3 = $this->createTenant('shop-' . Str::lower(Str::random(6)), 'growth', 'active');
        $this->makeStore($t3, (string) DB::table('warehouses')->where('tenant_id', $t3->id)->value('id'), ['status' => 'suspended', 'display_name' => 'Suspended Shop']);
        $t4 = $this->createTenant('shop-' . Str::lower(Str::random(6)), 'growth', 'active');
        $this->makeStore($t4, (string) DB::table('warehouses')->where('tenant_id', $t4->id)->value('id'), ['status' => 'unpublished', 'display_name' => 'Hidden Shop']);
        $t5 = $this->createTenant('shop-' . Str::lower(Str::random(6)), 'growth', 'active');
        $karachi = DB::table('commerce_cities')->where('slug', 'karachi')->first();
        $this->makeStore($t5, (string) DB::table('warehouses')->where('tenant_id', $t5->id)->value('id'), ['city_id' => $karachi->id, 'display_name' => 'Karachi Shop']);

        $this->get('/shop?country=PK&city=lahore')->assertOk()->assertInertia(function ($page) {
            $names = collect($page->toArray()['props']['stores']['data'])->pluck('name')->all();
            $this->assertSame(['Test Shop'], $names);
        });
        $this->get('/shop?country=PK&city=karachi')->assertInertia(fn ($p) => $this->assertSame(['Karachi Shop'], collect($p->toArray()['props']['stores']['data'])->pluck('name')->all()));
    }

    public function test_empty_city_returns_honest_empty_list(): void
    {
        $this->get('/shop?country=PK&city=multan')->assertOk()->assertInertia(fn ($p) => $this->assertSame([], $p->toArray()['props']['stores']['data']));
    }

    public function test_non_published_store_pages_are_404(): void
    {
        foreach (['draft', 'unpublished', 'suspended'] as $st) {
            $this->store->update(['status' => $st]);
            $this->get('/shop/' . $this->store->slug)->assertNotFound();
        }
    }

    public function test_store_page_shows_only_published_products_and_leaks_no_internals(): void
    {
        $shown = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Visible Thing', 'cost_price' => 123.45], 5, $this->store);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Hidden Thing'], 5, $this->store, ['is_published' => 0]);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Unlisted Thing'], 5);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Service Thing', 'type' => 'service'], 0, $this->store);

        $res = $this->get('/shop/' . $this->store->slug)->assertOk();
        $html = $res->getContent();
        $this->assertStringContainsString('Visible Thing', $html);
        foreach (['Hidden Thing', 'Unlisted Thing', 'Service Thing', '123.45', 'cost_price', $shown, $this->warehouseId, 'tenant_id'] as $leak) {
            $this->assertStringNotContainsString($leak, $html, "leaked: {$leak}");
        }
    }

    public function test_online_price_is_shown_with_the_storefront_rule(): void
    {
        $this->store->update(['pricing_mode' => 'increase', 'pricing_percent' => 10]);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Priced', 'price' => 1000], 5, $this->store);
        $this->get('/shop/' . $this->store->slug)->assertInertia(fn ($p) => $this->assertEquals(1100.0, $p->toArray()['props']['items'][0]['price']));
    }

    public function test_cross_tenant_listing_cannot_be_ordered_or_shown(): void
    {
        $other = $this->createTenant('shop-' . Str::lower(Str::random(6)), 'growth', 'active');
        $otherWh = (string) DB::table('warehouses')->where('tenant_id', $other->id)->value('id');
        $foreign = $this->makeProduct($other, $otherWh, ['name' => 'Foreign Item'], 5);
        // malicious/corrupt listing: this store's tenant, someone else's product
        $listingId = (string) Str::uuid();
        DB::table('storefront_products')->insert(['id' => $listingId, 'storefront_id' => $this->store->id, 'tenant_id' => $this->tenant->id, 'product_id' => $foreign, 'is_published' => 1, 'created_at' => now(), 'updated_at' => now()]);

        $this->get('/shop/' . $this->store->slug)->assertOk()->assertDontSee('Foreign Item');
        $this->postJson('/shop/' . $this->store->slug . '/checkout', $this->body([['item_id' => $listingId, 'quantity' => 1]]))->assertStatus(422);
        $this->postJson('/shop/' . $this->store->slug . '/checkout', $this->body([['item_id' => $foreign, 'quantity' => 1]]))->assertStatus(422);
    }

    public function test_quote_and_checkout_over_http_with_idempotent_replay(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $listing = DB::table('storefront_products')->where('product_id', $pid)->value('id');

        $q = $this->postJson('/shop/' . $this->store->slug . '/quote', ['items' => [['item_id' => $listing, 'quantity' => 2]]])->assertOk();
        $this->assertEquals(2000.0, $q->json('total'));

        $body = $this->body([['item_id' => $listing, 'quantity' => 2]], ['expected_total' => 2000]);
        $a = $this->postJson('/shop/' . $this->store->slug . '/checkout', $body)->assertCreated();
        $b = $this->postJson('/shop/' . $this->store->slug . '/checkout', $body)->assertOk();
        $this->assertSame($a->json('order_number'), $b->json('order_number'));
        $this->assertSame(1, CommerceOrder::where('storefront_id', $this->store->id)->count());
        $this->assertStringStartsWith(url('/order-status/'), $a->json('status_url'));
    }

    public function test_forged_expected_total_and_forged_prices_are_rejected(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $listing = DB::table('storefront_products')->where('product_id', $pid)->value('id');
        $res = $this->postJson('/shop/' . $this->store->slug . '/checkout', $this->body([['item_id' => $listing, 'quantity' => 1, 'price' => 1, 'unit_price' => 1]], ['expected_total' => 1]));
        $res->assertStatus(409)->assertJsonPath('reason', 'quote_changed');
        $this->assertEquals(1000.0, $res->json('quote.total'));
        $this->assertSame(0, CommerceOrder::count());
    }

    public function test_validation_edges(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $listing = DB::table('storefront_products')->where('product_id', $pid)->value('id');
        $ok = [['item_id' => $listing, 'quantity' => 1]];
        $u = '/shop/' . $this->store->slug . '/checkout';
        $this->postJson($u, $this->body([]))->assertStatus(422);
        $this->postJson($u, $this->body([['item_id' => $listing, 'quantity' => 0]]))->assertStatus(422);
        $this->postJson($u, $this->body([['item_id' => $listing, 'quantity' => 9999]]))->assertStatus(422);
        $this->postJson($u, $this->body($ok, ['customer_phone' => '12']))->assertStatus(422);
        $this->postJson($u, $this->body($ok, ['fulfilment' => 'delivery', 'payment_method' => 'cod']))->assertStatus(422)->assertJsonPath('reason', 'address_required');
        $this->postJson($u, $this->body($ok, ['payment_method' => 'cod']))->assertStatus(422)->assertJsonPath('reason', 'bad_payment'); // COD is delivery-only
        $this->store->update(['accept_bank_transfer' => false]);
        $this->postJson($u, $this->body($ok, ['payment_method' => 'bank']))->assertStatus(422);
        $this->store->update(['supports_delivery' => false]);
        $this->postJson($u, $this->body($ok, ['fulfilment' => 'delivery', 'payment_method' => 'cod', 'delivery_address' => 'x']))->assertStatus(422);
        $this->assertSame(0, CommerceOrder::count());
    }

    public function test_paused_or_unpublished_store_takes_no_orders_but_old_status_links_still_work(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $listing = DB::table('storefront_products')->where('product_id', $pid)->value('id');
        $first = $this->postJson('/shop/' . $this->store->slug . '/checkout', $this->body([['item_id' => $listing, 'quantity' => 1]]))->assertCreated();

        $this->store->update(['intake_paused' => true]);
        $this->postJson('/shop/' . $this->store->slug . '/checkout', $this->body([['item_id' => $listing, 'quantity' => 1]]))->assertStatus(409)->assertJsonPath('reason', 'intake_paused');
        $this->store->update(['intake_paused' => false, 'status' => 'unpublished']);
        $this->postJson('/shop/' . $this->store->slug . '/checkout', $this->body([['item_id' => $listing, 'quantity' => 1]]))->assertStatus(409);

        $this->get($first->json('status_url'))->assertOk(); // customers keep access to their own order
    }

    public function test_status_page_is_private_noindex_and_token_gated(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $listing = DB::table('storefront_products')->where('product_id', $pid)->value('id');
        $res = $this->postJson('/shop/' . $this->store->slug . '/checkout', $this->body([['item_id' => $listing, 'quantity' => 1]]))->assertCreated();
        $order = CommerceOrder::first();

        $page = $this->get($res->json('status_url'))->assertOk();
        $this->assertStringContainsString('noindex', $page->headers->get('X-Robots-Tag'));
        $this->assertStringContainsString('no-store', $page->headers->get('Cache-Control'));
        $this->assertSame('no-referrer', $page->headers->get('Referrer-Policy'));
        $this->assertStringNotContainsString('status_token_hash', $page->getContent());

        $this->get('/order-status/' . $order->public_number)->assertNotFound();           // order number alone grants nothing
        $this->get('/order-status/' . $order->id)->assertNotFound();                      // nor does the internal id
        $this->get('/order-status/' . Str::random(48))->assertNotFound();
        $this->get('/order-status/' . hash('sha256', 'x'))->assertNotFound();
    }

    public function test_customer_transfer_report_does_not_mark_paid(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $listing = DB::table('storefront_products')->where('product_id', $pid)->value('id');
        $res = $this->postJson('/shop/' . $this->store->slug . '/checkout', $this->body([['item_id' => $listing, 'quantity' => 1]], ['payment_method' => 'bank']))->assertCreated();
        $this->post($res->json('status_url') . '/transfer', ['reference' => 'TXN-9988'])->assertRedirect();
        $o = CommerceOrder::first();
        $this->assertSame('transfer_reported', $o->payment_status);
        $this->assertEquals(0.0, $o->amount_collected);
    }

    public function test_checkout_is_rate_limited(): void
    {
        $codes = [];
        for ($i = 0; $i < 12; $i++) {
            $codes[] = $this->postJson('/shop/' . $this->store->slug . '/checkout', ['idempotency_key' => 'k'])->getStatusCode();
        }
        $this->assertContains(429, $codes);
    }

    public function test_open_order_cap_per_phone(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 100, $this->store);
        $listing = DB::table('storefront_products')->where('product_id', $pid)->value('id');
        $svc = app(\App\Services\Commerce\CheckoutService::class);
        for ($i = 0; $i < 5; $i++) {
            $svc->place($this->store->fresh(), $this->checkoutInput([['item_id' => $listing, 'quantity' => 1]]));
        }
        $this->expectException(\App\Services\Commerce\CommerceException::class);
        $svc->place($this->store->fresh(), $this->checkoutInput([['item_id' => $listing, 'quantity' => 1]]));
    }
}
