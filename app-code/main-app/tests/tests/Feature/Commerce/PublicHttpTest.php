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
        $this->get('/shop/' . $this->store->slug . '/products')->assertInertia(fn ($p) => $this->assertEquals(1100.0, $p->toArray()['props']['items'][0]['price']));
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

    public function test_catalogue_only_store_is_browsable_but_cannot_quote_or_checkout(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Catalogue Item'], 10, $this->store);
        $listing = DB::table('storefront_products')->where('product_id', $pid)->value('id');
        $this->store->update(['customer_mode' => 'catalogue', 'catalogue_theme' => 'editorial-ledger']);
        $ordersBefore = CommerceOrder::count();

        $this->get('/shop/' . $this->store->slug)->assertOk()->assertInertia(function ($page) {
            $store = $page->toArray()['props']['store'];
            $this->assertSame('catalogue', $store['customer_mode']);
            $this->assertSame('editorial-ledger', $store['catalogue_theme']);
            $this->assertFalse($store['ordering_enabled']);
            $this->assertFalse($store['accepting_orders']);
        });
        $this->postJson('/shop/' . $this->store->slug . '/quote', ['items' => [['item_id' => $listing, 'quantity' => 1]]])->assertNotFound();
        $this->postJson('/shop/' . $this->store->slug . '/checkout', $this->body([['item_id' => $listing, 'quantity' => 1]]))->assertNotFound();
        $this->assertSame($ordersBefore, CommerceOrder::count());
    }

    public function test_table_qr_order_opens_the_table_and_adds_server_priced_pending_lines(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Table Burger', 'price' => 1250], 10, $this->store);
        $listing = DB::table('storefront_products')->where('product_id', $pid)->value('id');
        $token = Str::random(40);
        $position = DB::table('positions')->insertGetId([
            'tenant_id' => $this->tenant->id, 'zone' => 'Dining', 'code' => 'T7', 'label' => 'Window 7',
            'capacity' => 4, 'status' => 'available', 'sort_order' => 7,
            'customer_order_token' => $token, 'customer_ordering_enabled' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        // Public catalogue mode and onsite ordering are independent: a business
        // can refuse remote orders while still accepting orders from its tables.
        $this->store->update(['customer_mode' => 'catalogue', 'onsite_ordering_enabled' => true]);

        $this->get('/catalogue/' . $this->store->slug . '/table/' . $token . '?q=burger')->assertOk()
            ->assertInertia(function ($page) {
                $props = $page->toArray()['props'];
                $this->assertSame('T7', $props['onsite']['table_code']);
                $this->assertSame('catalogue', $props['store']['customer_mode']);
                $this->assertSame('burger', $props['filters']['q']);
            });

        $body = ['idempotency_key' => (string) Str::uuid(), 'table_token' => $token,
            'items' => [['item_id' => $listing, 'quantity' => 2, 'price' => 1]]];
        $first = $this->postJson('/catalogue/' . $this->store->slug . '/orders', $body)->assertCreated();
        $this->postJson('/catalogue/' . $this->store->slug . '/orders', $body)->assertOk()
            ->assertJsonPath('order_number', $first->json('order_number'));

        $occupancy = DB::table('occupancies')->where('position_id', $position)->whereNull('closed_at')->first();
        $session = json_decode($occupancy->session_data, true);
        $this->assertSame('table_qr', $occupancy->source_type);
        $this->assertSame(1, count($session['cart']));
        $this->assertEquals(1250.0, $session['cart'][0]['price']);
        $this->assertSame(2, $session['cart'][0]['qty']);
        $this->assertTrue($session['cart'][0]['customer_pending']);
        $this->assertEquals(2500.0, $session['order_total']);
        $this->assertSame(1, DB::table('onsite_order_requests')->where('position_id', $position)->count());
    }

    public function test_counter_qr_order_creates_a_takeaway_pos_tab(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Walk-in Coffee'], 10, $this->store);
        $listing = DB::table('storefront_products')->where('product_id', $pid)->value('id');
        $this->store->update(['onsite_ordering_enabled' => true, 'counter_qr_enabled' => true]);

        $this->get('/catalogue/' . $this->store->slug)->assertOk()
            ->assertInertia(fn ($page) => $this->assertSame('counter_qr', $page->toArray()['props']['onsite']['channel']));
        $response = $this->postJson('/catalogue/' . $this->store->slug . '/orders', [
            'idempotency_key' => (string) Str::uuid(), 'customer_name' => 'Ayesha',
            'items' => [['item_id' => $listing, 'quantity' => 1]],
        ])->assertCreated();
        $request = DB::table('onsite_order_requests')->where('public_number', $response->json('order_number'))->first();
        $occupancy = DB::table('occupancies')->where('id', $request->occupancy_id)->first();
        $session = json_decode($occupancy->session_data, true);
        $this->assertNull($occupancy->position_id);
        $this->assertSame('counter_qr', $occupancy->source_type);
        $this->assertSame('takeaway', $session['order_type']);
        $this->assertSame('Ayesha', $session['customer_name']);
    }

    public function test_onsite_order_rechecks_stock_before_opening_a_pos_tab(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Sold Out'], 0, $this->store);
        $listing = DB::table('storefront_products')->where('product_id', $pid)->value('id');
        $token = Str::random(40);
        $position = DB::table('positions')->insertGetId([
            'tenant_id' => $this->tenant->id, 'zone' => 'Dining', 'code' => 'T8', 'label' => null,
            'capacity' => 2, 'status' => 'available', 'sort_order' => 8,
            'customer_order_token' => $token, 'customer_ordering_enabled' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->store->update(['onsite_ordering_enabled' => true]);

        $this->postJson('/catalogue/' . $this->store->slug . '/orders', [
            'idempotency_key' => (string) Str::uuid(), 'table_token' => $token,
            'items' => [['item_id' => $listing, 'quantity' => 1]],
        ])->assertStatus(422)->assertJsonPath('reason', 'cart_changed');

        $this->assertFalse(DB::table('occupancies')->where('position_id', $position)->whereNull('closed_at')->exists());
        $this->assertSame('available', DB::table('positions')->where('id', $position)->value('status'));
        $this->assertSame(0, DB::table('onsite_order_requests')->where('position_id', $position)->count());
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

    public function test_live_status_reports_changes_and_an_optional_countdown_estimate(): void
    {
        $this->store->update(['prep_minutes' => 30]);
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $listing = DB::table('storefront_products')->where('product_id', $pid)->value('id');
        $placed = $this->postJson('/shop/' . $this->store->slug . '/checkout', $this->body([['item_id' => $listing, 'quantity' => 1]]))->assertCreated();
        $token = basename($placed->json('status_url'));
        $confirmedAt = now()->subMinutes(5)->startOfSecond();
        CommerceOrder::first()->update(['status' => 'confirmed', 'version' => 2, 'confirmed_at' => $confirmedAt]);

        $page = $this->get($placed->json('status_url'))->assertOk()->viewData('page')['props'];
        $this->assertSame(2, $page['order']['version']);
        $this->assertSame($confirmedAt->copy()->addMinutes(30)->toIso8601String(), $page['order']['estimated_ready_at']);
        $this->assertSame(url('/order-status/' . $token . '/live'), $page['live_url']);

        $live = $this->getJson('/order-status/' . $token . '/live')
            ->assertOk()
            ->assertJsonPath('version', 2)
            ->assertJsonPath('status', 'confirmed')
            ->assertJsonPath('estimated_ready_at', $confirmedAt->copy()->addMinutes(30)->toIso8601String());
        $this->assertStringContainsString('no-store', $live->headers->get('Cache-Control'));

        $this->store->update(['prep_minutes' => null]);
        $this->getJson('/order-status/' . $token . '/live')->assertOk()->assertJsonPath('estimated_ready_at', null);
        $this->getJson('/order-status/' . Str::random(48) . '/live')->assertNotFound();
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

    public function test_listing_photo_overrides_product_photo_and_store_can_hide_photos(): void
    {
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Pic', 'image_path' => 'products/own.jpg'], 5, $this->store);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Pic2', 'image_path' => 'products/own2.jpg'], 5, $this->store, ['image_path' => 'commerce/products/online.jpg']);
        $urls = fn () => collect($this->get('/shop/' . $this->store->slug . '/products')->viewData('page')['props']['items'])->pluck('image_url', 'name');
        $u = $urls();
        $this->assertStringContainsString('products/own.jpg', $u['Pic']);
        $this->assertStringContainsString('commerce/products/online.jpg', $u['Pic2']);
        $this->store->update(['show_images' => false]);
        $this->assertSame([null, null], $urls()->values()->all());
    }

    public function test_search_and_category_filters_only_use_published_products(): void
    {
        $cat = (string) Str::uuid();
        DB::table('categories')->insert(['id' => $cat, 'tenant_id' => $this->tenant->id, 'name' => 'Drinks', 'created_at' => now(), 'updated_at' => now()]);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Cola', 'category_id' => $cat], 5, $this->store);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Colander'], 5, $this->store);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Cola Secret', 'category_id' => $cat], 5, $this->store, ['is_published' => 0]);
        $get = fn ($qs) => $this->get('/shop/' . $this->store->slug . $qs)->viewData('page')['props'];
        $names = fn ($qs) => collect($get($qs)['items'])->pluck('name')->sort()->values()->all();
        $this->assertSame(['Cola', 'Colander'], $names('?q=cola'));
        $this->assertSame(['Cola'], $names('?category=' . $cat));
        $this->assertSame([], $names('?q=%25'));
        $this->assertSame([['id' => $cat, 'name' => 'Drinks', 'count' => 1]], $get('')['categories']);
    }

    public function test_featured_items_come_first_and_reorder_returns_only_live_lines(): void
    {
        $a = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Alpha'], 9, $this->store);
        $z = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Zeta'], 9, $this->store, ['is_featured' => 1]);
        $gone = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Gone'], 9, $this->store);
        $names = collect($this->get('/shop/' . $this->store->slug . '/products')->viewData('page')['props']['items'])->pluck('name')->all();
        $this->assertSame('Zeta', $names[0]);
        $res = $this->postJson('/shop/' . $this->store->slug . '/checkout', $this->body([['item_id' => DB::table('storefront_products')->where('product_id', $a)->value('id'), 'quantity' => 2], ['item_id' => DB::table('storefront_products')->where('product_id', $gone)->value('id'), 'quantity' => 1]]))->assertCreated();
        $token = basename($res->json('status_url'));
        DB::table('storefront_products')->where('product_id', $gone)->update(['is_published' => 0]);
        $r = $this->getJson('/order-status/' . $token . '/reorder')->assertOk();
        $this->assertSame(1, count($r->json('lines')));
        $this->assertSame(2, $r->json('lines.0.quantity'));
        $this->assertSame(1, $r->json('skipped'));
        $this->assertStringContainsString('no-store', $r->headers->get('Cache-Control'));
        $this->getJson('/order-status/' . Str::random(48) . '/reorder')->assertNotFound();
        $this->store->update(['status' => 'unpublished']);
        $this->getJson('/order-status/' . $token . '/reorder')->assertNotFound();
    }

    public function test_quote_endpoint_applies_coupon_and_reports_invalid_code(): void
    {
        $a = $this->makeProduct($this->tenant, $this->warehouseId, [], 9, $this->store);
        DB::table('commerce_promotions')->insert(['id' => (string) Str::uuid(), 'tenant_id' => $this->tenant->id, 'storefront_id' => $this->store->id, 'name' => 'C', 'code' => 'HI', 'percent' => 10,
            'scope' => 'store', 'min_order' => 0, 'uses' => 0, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $lid = DB::table('storefront_products')->where('product_id', $a)->value('id');
        $ok = $this->postJson('/shop/' . $this->store->slug . '/quote', ['items' => [['item_id' => $lid, 'quantity' => 1]], 'coupon' => 'hi'])->assertOk();
        $this->assertEquals(900.0, $ok->json('total'));
        $this->postJson('/shop/' . $this->store->slug . '/quote', ['items' => [['item_id' => $lid, 'quantity' => 1]], 'coupon' => 'zzz'])->assertStatus(422)->assertJsonPath('reason', 'invalid_coupon');
    }

    public function test_catalogue_shows_factual_low_and_sold_out_labels_without_leaking_counts(): void
    {
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Plenty'], 40, $this->store);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Few'], 3, $this->store);
        $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'None'], 0, $this->store);
        $by = collect($this->get('/shop/' . $this->store->slug . '/products')->viewData('page')['props']['items'])->keyBy('name');
        $this->assertNull($by['Plenty']['stock']);
        $this->assertNull($by['Plenty']['left']);
        $this->assertSame('low', $by['Few']['stock']);
        $this->assertSame(3, $by['Few']['left']);
        $this->assertSame('out', $by['None']['stock']);
    }

    public function test_options_group_into_one_card_with_per_option_stock_and_price(): void
    {
        $s = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Tee Small'], 10, $this->store);
        $l = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Tee Large', 'price' => 1200], 0, $this->store);
        DB::table('storefront_products')->where('product_id', $s)->update(['option_group' => 'Cotton Tee', 'option_label' => 'Small']);
        DB::table('storefront_products')->where('product_id', $l)->update(['option_group' => 'Cotton Tee', 'option_label' => 'Large']);
        $props = $this->get('/shop/' . $this->store->slug . '/products')->viewData('page')['props'];
        $tees = collect($props['items'])->filter(fn ($i) => ($i['name'] ?? '') === 'Cotton Tee')->values();
        $this->assertCount(1, $tees, 'two options are one card');
        $opts = collect($tees[0]['options']);
        $this->assertCount(2, $opts);
        $this->assertSame('out', $opts->firstWhere('label', 'Large')['stock']);
        $this->assertNull($opts->firstWhere('label', 'Small')['stock']);
        $this->assertGreaterThan($opts->firstWhere('label', 'Small')['price'], $opts->firstWhere('label', 'Large')['price']);
        // each option is a real, separately orderable listing
        $listing = $opts->firstWhere('label', 'Small')['id'];
        $q = $this->postJson('/shop/' . $this->store->slug . '/quote', ['items' => [['item_id' => $listing, 'quantity' => 1]], 'fulfilment' => 'pickup'])->assertOk();
        $this->assertSame($listing, $q->json('items.0.item_id'));
    }

    public function test_customer_answers_a_proposed_change_over_http(): void
    {
        $a = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $placed = app(\App\Services\Commerce\CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $a, 'quantity' => 3]]));
        $item = DB::table('commerce_order_items')->where('order_id', $placed['order']->id)->value('id');
        app(\App\Services\Commerce\OrderRevisions::class)->propose($placed['order']->id, $this->tenant->id, $this->owner->id, [['item' => $item, 'action' => 'qty', 'quantity' => 1]], 'Only one left');
        $page = $this->get('/order-status/' . $placed['token'])->viewData('page')['props'];
        $this->assertSame('proposed', $page['revision']['status']);
        $this->assertSame('Only one left', $page['revision']['note']);
        $this->post('/order-status/' . $placed['token'] . '/revision', ['answer' => 'accept'])->assertRedirect();
        $this->assertEquals(1000.0, (float) DB::table('commerce_orders')->where('id', $placed['order']->id)->value('total'));
        // answering twice, or with a wrong token, does nothing
        $this->post('/order-status/' . $placed['token'] . '/revision', ['answer' => 'decline'])->assertSessionHasErrors('revision');
        $this->post('/order-status/' . str_repeat('a', 48) . '/revision', ['answer' => 'accept'])->assertNotFound();
    }
}
