<?php

namespace Tests\Feature\Commerce;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** The QR menu: guest ordering rules, abuse limits, channel visibility, status and "call a waiter". */
class OnsiteCatalogueTest extends CommerceTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['inertia.testing.ensure_pages_exist' => false]);
        auth()->logout();
        app()->forgetInstance('current.tenant');
        $this->store->update(['onsite_ordering_enabled' => true, 'counter_qr_enabled' => true]);
    }

    private function table(string $code = 'T1', bool $seated = false): array
    {
        $token = Str::random(40);
        $id = DB::table('positions')->insertGetId([
            'tenant_id' => $this->tenant->id, 'zone' => 'Dining', 'code' => $code, 'label' => null,
            'capacity' => 4, 'status' => 'available', 'sort_order' => 1,
            'customer_order_token' => $token, 'customer_ordering_enabled' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        if ($seated) {
            DB::table('occupancies')->insert([
                'id' => (string) Str::uuid(), 'tenant_id' => $this->tenant->id, 'position_id' => $id, 'label' => $code,
                'opened_at' => now(), 'source_type' => 'staff', 'created_at' => now(), 'updated_at' => now(),
                'session_data' => json_encode(['order_type' => 'dine_in', 'covers' => 2, 'cart' => [], 'order_total' => 0, 'note' => '', 'sent_at' => null]),
            ]);
        }

        return [$id, $token];
    }

    private function listing(array $over = [], int $stock = 20): string
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, $over, $stock, $this->store);

        return (string) DB::table('storefront_products')->where('product_id', $pid)->value('id');
    }

    private function order(?string $token, array $items, array $extra = [])
    {
        return $this->postJson('/catalogue/' . $this->store->slug . '/orders', array_filter([
            'idempotency_key' => (string) Str::uuid(), 'table_token' => $token, 'items' => $items,
        ] + $extra, fn ($v) => $v !== null));
    }

    public function test_status_only_answers_for_a_real_reference_and_shows_kitchen_progress(): void
    {
        [, $token] = $this->table();
        $listing = $this->listing();
        $number = $this->order($token, [['item_id' => $listing, 'quantity' => 2, 'notes' => 'no onions']])->assertCreated()->json('order_number');

        $this->getJson('/catalogue/' . $this->store->slug . '/order/SO-000000-ZZZZZ')->assertNotFound();
        $this->getJson('/catalogue/' . $this->store->slug . '/order/' . $number)->assertOk()
            ->assertJsonPath('status', 'waiting')
            ->assertJsonPath('lines.0.qty', 2)
            ->assertJsonPath('lines.0.notes', 'no onions')
            ->assertJsonPath('removed', 0);
    }

    public function test_status_notices_when_staff_removed_the_guests_lines(): void
    {
        [$position, $token] = $this->table();
        $listing = $this->listing();
        $number = $this->order($token, [['item_id' => $listing, 'quantity' => 1]])->assertCreated()->json('order_number');
        $occ = DB::table('occupancies')->where('position_id', $position)->whereNull('closed_at')->first();
        $session = json_decode($occ->session_data, true);
        $session['cart'] = [];
        DB::table('occupancies')->where('id', $occ->id)->update(['session_data' => json_encode($session)]);

        $this->getJson('/catalogue/' . $this->store->slug . '/order/' . $number)->assertOk()
            ->assertJsonPath('status', 'changed')->assertJsonPath('removed', 1);
    }

    public function test_the_same_dish_with_different_notes_is_two_kitchen_lines_and_equal_notes_merge(): void
    {
        [$position, $token] = $this->table();
        $listing = $this->listing();
        $this->order($token, [
            ['item_id' => $listing, 'quantity' => 1, 'notes' => 'no onions'],
            ['item_id' => $listing, 'quantity' => 1, 'notes' => 'extra spicy'],
            ['item_id' => $listing, 'quantity' => 2, 'notes' => 'no onions'],
        ])->assertCreated();
        $occ = DB::table('occupancies')->where('position_id', $position)->whereNull('closed_at')->first();
        $cart = collect(json_decode($occ->session_data, true)['cart']);
        $this->assertCount(2, $cart);
        $this->assertSame(3, (int) $cart->firstWhere('notes', 'no onions')['qty']);
        $this->assertSame(1, (int) $cart->firstWhere('notes', 'extra spicy')['qty']);
    }

    public function test_a_table_cannot_flood_the_floor(): void
    {
        [, $token] = $this->table();
        $listing = $this->listing();
        for ($i = 0; $i < \App\Services\Commerce\OnsiteOrderService::TABLE_BURST; $i++) {
            $this->order($token, [['item_id' => $listing, 'quantity' => 1]])->assertCreated();
        }
        $this->order($token, [['item_id' => $listing, 'quantity' => 1]])->assertStatus(429)->assertJsonPath('reason', 'rate_limited');
    }

    public function test_seated_only_mode_refuses_an_unopened_table_but_takes_a_seated_one(): void
    {
        $this->store->update(['onsite_require_seated' => true]);
        $listing = $this->listing();
        [$closed, $closedToken] = $this->table('T1');
        [, $seatedToken] = $this->table('T2', true);

        $this->order($closedToken, [['item_id' => $listing, 'quantity' => 1]])->assertStatus(409)->assertJsonPath('reason', 'table_not_open');
        $this->assertFalse(DB::table('occupancies')->where('position_id', $closed)->exists());
        $this->order($seatedToken, [['item_id' => $listing, 'quantity' => 1]])->assertCreated();
    }

    public function test_paused_store_still_shows_the_menu_but_refuses_orders(): void
    {
        $this->store->update(['onsite_paused' => true]);
        $listing = $this->listing();
        [, $token] = $this->table();

        $this->get('/catalogue/' . $this->store->slug . '/table/' . $token)->assertOk()->assertInertia(function ($page) {
            $props = $page->toArray()['props'];
            $this->assertFalse($props['store']['accepting_orders']);
            $this->assertNotEmpty($props['store']['onsite_hold']);
            $this->assertCount(1, $props['items']);
        });
        $this->order($token, [['item_id' => $listing, 'quantity' => 1]])->assertStatus(409)->assertJsonPath('reason', 'onsite_held');
    }

    public function test_the_whole_menu_is_on_one_page_not_split_into_pages(): void
    {
        for ($i = 0; $i < 45; $i++) {
            $this->listing(['name' => 'Dish ' . $i, 'sku' => 'D-' . $i]);
        }
        [, $token] = $this->table();
        $this->get('/catalogue/' . $this->store->slug . '/table/' . $token)->assertOk()
            ->assertInertia(fn ($page) => $this->assertCount(45, $page->toArray()['props']['items']));
    }

    public function test_each_dish_can_be_hidden_from_the_qr_menu_or_the_online_store_separately(): void
    {
        $qrOnly = $this->listing(['name' => 'QR only']);
        $shopOnly = $this->listing(['name' => 'Shop only', 'sku' => 'S-2']);
        DB::table('storefront_products')->where('id', $qrOnly)->update(['show_online' => 0]);
        DB::table('storefront_products')->where('id', $shopOnly)->update(['show_onsite' => 0]);
        [, $token] = $this->table();

        $this->get('/catalogue/' . $this->store->slug . '/table/' . $token)->assertInertia(function ($page) {
            $this->assertSame(['QR only'], collect($page->toArray()['props']['items'])->pluck('name')->all());
        });
        $this->order($token, [['item_id' => $shopOnly, 'quantity' => 1]])->assertStatus(422);
        $this->order($token, [['item_id' => $qrOnly, 'quantity' => 1]])->assertCreated();
        $this->get('/shop/' . $this->store->slug)->assertInertia(function ($page) {
            $this->assertSame(['Shop only'], collect($page->toArray()['props']['items'])->pluck('name')->all());
        });
    }

    public function test_call_waiter_and_bill_need_an_open_table_and_show_up_for_staff_and_guest(): void
    {
        $listing = $this->listing();
        [$position, $token] = $this->table();
        $url = '/catalogue/' . $this->store->slug . '/call';

        $this->postJson($url, ['table_token' => $token, 'kind' => 'bill'])->assertStatus(409)->assertJsonPath('reason', 'table_not_open');
        $number = $this->order($token, [['item_id' => $listing, 'quantity' => 1]])->assertCreated()->json('order_number');
        $this->postJson($url, ['table_token' => $token, 'kind' => 'nonsense'])->assertStatus(422);
        $this->postJson($url, ['table_token' => $token, 'kind' => 'bill'])->assertOk();

        $session = json_decode(DB::table('occupancies')->where('position_id', $position)->whereNull('closed_at')->value('session_data'), true);
        $this->assertSame('bill', $session['guest_call']['kind']);
        $this->assertNull($session['guest_call']['handled_at']);
        $this->getJson('/catalogue/' . $this->store->slug . '/order/' . $number)->assertJsonPath('call.kind', 'bill');
    }

    public function test_a_dish_with_inventory_tracking_off_is_never_sold_out_and_can_be_ordered_with_zero_stock(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['name' => 'Made to order'], 0, $this->store);
        DB::table('products')->where('id', $pid)->update(['track_stock' => 0]);
        $listing = (string) DB::table('storefront_products')->where('product_id', $pid)->value('id');
        [, $token] = $this->table();

        $this->get('/catalogue/' . $this->store->slug . '/table/' . $token)->assertInertia(function ($page) {
            $item = $page->toArray()['props']['items'][0];
            $this->assertNull($item['stock']);
        });
        $this->order($token, [['item_id' => $listing, 'quantity' => 3]])->assertCreated();
    }
}
