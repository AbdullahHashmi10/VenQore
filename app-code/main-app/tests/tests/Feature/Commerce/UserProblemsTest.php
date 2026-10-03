<?php

namespace Tests\Feature\Commerce;

use App\Exceptions\ReservedStockException;
use App\Models\Commerce\CommerceOrder;
use App\Services\Commerce\CheckoutService;
use App\Services\Commerce\CommerceException;
use App\Services\Commerce\OpeningHours;
use App\Services\Commerce\OrderService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Fixes from the user-problems audit (COMMERCE_USER_PROBLEMS_AUDIT.md). */
class UserProblemsTest extends CommerceTestCase
{
    private function place(string $pid, int $qty = 1, array $over = []): array
    {
        return app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => $qty]], $over));
    }

    public function test_checkout_refuses_sold_out_and_over_stock_lines(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 2, $this->store);
        try {
            $this->place($pid, 3);
            $this->fail('ordered more than exists');
        } catch (CommerceException $e) {
            $this->assertSame('cart_changed', $e->reason);
            $this->assertStringContainsString('Only 2 left', $e->payload['problems'][0]['message']);
        }
        $this->assertSame(0, DB::table('commerce_orders')->count());
        $this->assertSame('pending', $this->place($pid, 2)['order']->status);
    }

    public function test_held_stock_is_not_orderable_by_the_next_customer(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $o = $this->place($pid, 3)['order'];
        app(OrderService::class)->confirm($o->id, $this->tenant->id, $this->owner->id);
        $this->expectException(CommerceException::class);
        $this->place($pid, 1, ['customer_phone' => '0300-9998887']);
    }

    public function test_retried_checkout_keeps_the_first_status_link_working(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $in = $this->checkoutInput([['product_id' => $pid, 'quantity' => 1]]);
        $svc = app(CheckoutService::class);
        $a = $svc->place($this->store->fresh(), $in);
        $b = $svc->place($this->store->fresh(), $in);
        $this->assertTrue($b['replayed']);
        $this->assertNotSame($a['token'], $b['token']);
        $this->get('/order-status/' . $a['token'])->assertOk();
        $this->get('/order-status/' . $b['token'])->assertOk();
    }

    public function test_lost_link_is_recovered_with_order_number_and_phone(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $o = $this->place($pid)['order'];
        $this->post('/order-lookup', ['number' => $o->public_number, 'phone' => '0300 1112 223'])->assertRedirectContains('/order-status/');
        $this->post('/order-lookup', ['number' => $o->public_number, 'phone' => '03000000000'])->assertSessionHasErrors('number');
    }

    public function test_customer_can_cancel_an_unpaid_order_and_the_coupon_use_comes_back(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $promo = (string) Str::uuid();
        DB::table('commerce_promotions')->insert(['id' => $promo, 'tenant_id' => $this->tenant->id, 'storefront_id' => $this->store->id, 'name' => 'C', 'code' => 'ONE', 'kind' => 'percent', 'percent' => 10, 'scope' => 'store', 'min_order' => 0, 'max_uses' => 1, 'uses' => 0, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $r = $this->place($pid, 1, ['coupon' => 'ONE']);
        $this->assertSame(1, (int) DB::table('commerce_promotions')->where('id', $promo)->value('uses'));
        $this->post('/order-status/' . $r['token'] . '/cancel')->assertRedirect();
        $this->assertSame('cancelled', $r['order']->fresh()->status);
        $this->assertSame(0, (int) DB::table('commerce_promotions')->where('id', $promo)->value('uses'), 'coupon use returned');
        // the same coupon is usable again
        $this->assertSame('pending', $this->place($pid, 1, ['coupon' => 'ONE', 'customer_phone' => '0300-7776665'])['order']->status);
    }

    public function test_customer_cannot_cancel_after_paying_or_reporting_a_transfer(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $r = $this->place($pid, 1, ['payment_method' => 'bank']);
        app(OrderService::class)->reportTransfer($r['order']->id, $this->tenant->id, 'TX123');
        $this->post('/order-status/' . $r['token'] . '/cancel')->assertSessionHasErrors('cancel');
        $this->assertSame('pending', $r['order']->fresh()->status);
    }

    public function test_reject_and_expiry_return_the_coupon_use_exactly_once(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $promo = (string) Str::uuid();
        DB::table('commerce_promotions')->insert(['id' => $promo, 'tenant_id' => $this->tenant->id, 'storefront_id' => $this->store->id, 'name' => 'C', 'code' => 'TWO', 'kind' => 'percent', 'percent' => 10, 'scope' => 'store', 'min_order' => 0, 'max_uses' => 5, 'uses' => 0, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $o = $this->place($pid, 1, ['coupon' => 'TWO'])['order'];
        app(OrderService::class)->reject($o->id, $this->tenant->id, $this->owner->id, 'No');
        $this->assertSame(0, (int) DB::table('commerce_promotions')->where('id', $promo)->value('uses'));

        $o2 = $this->place($pid, 1, ['coupon' => 'TWO', 'customer_phone' => '0300-5554443'])['order'];
        DB::table('commerce_orders')->where('id', $o2->id)->update(['accept_by' => now('UTC')->subMinute()->format('Y-m-d H:i:s')]);
        app(OrderService::class)->expireDue();
        app(OrderService::class)->expireDue(); // idempotent
        $this->assertSame(0, (int) DB::table('commerce_promotions')->where('id', $promo)->value('uses'));
    }

    public function test_stale_accepted_orders_are_reminded_then_unpaid_ones_released(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $svc = app(OrderService::class);
        $a = $this->place($pid, 2)['order'];
        $svc->confirm($a->id, $this->tenant->id, $this->owner->id);
        DB::table('commerce_orders')->where('id', $a->id)->update(['confirmed_at' => now('UTC')->subHours(30)->format('Y-m-d H:i:s')]);
        $this->assertSame([1, 0], $svc->sweepStale());
        $this->assertSame([0, 0], $svc->sweepStale(), 'reminded only once');
        $this->assertSame('confirmed', $a->fresh()->status);

        DB::table('commerce_orders')->where('id', $a->id)->update(['confirmed_at' => now('UTC')->subHours(80)->format('Y-m-d H:i:s')]);
        $this->assertSame([0, 1], $svc->sweepStale());
        $this->assertSame('cancelled', $a->fresh()->status);
        $this->assertSame(0, DB::table('commerce_stock_holds')->where('order_id', $a->id)->where('status', 'active')->count(), 'stock released');
    }

    public function test_stale_paid_order_is_never_auto_cancelled(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $svc = app(OrderService::class);
        $a = $this->place($pid, 1, ['payment_method' => 'bank'])['order'];
        $svc->confirm($a->id, $this->tenant->id, $this->owner->id);
        $svc->markCollected($a->id, $this->tenant->id, $this->owner->id);
        DB::table('commerce_orders')->where('id', $a->id)->update(['confirmed_at' => now('UTC')->subHours(100)->format('Y-m-d H:i:s')]);
        $this->assertSame([1, 0], $svc->sweepStale());
        $this->assertSame('confirmed', $a->fresh()->status);
    }

    public function test_change_proposal_extends_the_accept_deadline(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 9, $this->store);
        $o = $this->place($pid, 2)['order'];
        DB::table('commerce_orders')->where('id', $o->id)->update(['accept_by' => now('UTC')->addMinutes(2)->format('Y-m-d H:i:s')]);
        $line = DB::table('commerce_order_items')->where('order_id', $o->id)->value('id');
        app(\App\Services\Commerce\OrderRevisions::class)->propose($o->id, $this->tenant->id, $this->owner->id, [['item' => $line, 'action' => 'qty', 'quantity' => 1]], 'Only 1 available');
        $this->assertTrue($o->fresh()->accept_by->gt(now('UTC')->addMinutes(30)));
    }

    public function test_sale_is_dated_in_the_store_timezone(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $o = $this->place($pid)['order'];
        $svc = app(OrderService::class);
        $svc->confirm($o->id, $this->tenant->id, $this->owner->id);
        $svc->advance($o->id, $this->tenant->id, $this->owner->id, 'ready');
        // 21:00 UTC on the 2nd is already 02:00 on the 3rd in Karachi
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-02 21:00:00', 'UTC'));
        try {
            $done = $svc->complete($o->id, $this->tenant->id, $this->owner->id, collectNow: true);
        } finally {
            CarbonImmutable::setTestNow();
        }
        $this->assertSame('2026-10-03', substr((string) DB::table('journal_entries')->where('reference_type', 'sale')->where('reference', $done->sale_id)->value('date'), 0, 10));
    }

    public function test_advance_order_waits_for_the_next_opening_time(): void
    {
        $hours = ['mon' => ['open' => '09:00', 'close' => '17:00'], 'tue' => ['open' => '09:00', 'close' => '17:00'], 'wed' => ['open' => '09:00', 'close' => '17:00'], 'thu' => ['open' => '09:00', 'close' => '17:00'], 'fri' => ['open' => '09:00', 'close' => '17:00'], 'sat' => ['open' => '09:00', 'close' => '17:00'], 'sun' => ['open' => '09:00', 'close' => '17:00']];
        $this->store->update(['opening_hours' => $hours, 'orders_outside_hours' => true, 'accept_deadline_minutes' => 30]);
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        // 23:00 Karachi (18:00 UTC): closed. Next opening = 09:00 Karachi = 04:00 UTC next day.
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-05 18:00:00', 'UTC'));
        \Illuminate\Support\Carbon::setTestNow(\Illuminate\Support\Carbon::parse('2026-10-05 18:00:00', 'UTC'));
        try {
            $o = $this->place($pid)['order'];
        } finally {
            CarbonImmutable::setTestNow();
            \Illuminate\Support\Carbon::setTestNow();
        }
        $this->assertSame('2026-10-06 04:30:00', $o->fresh()->accept_by->setTimezone('UTC')->format('Y-m-d H:i:s'));
        $this->assertNotNull(OpeningHours::nextOpening($hours, 'Asia/Karachi'));
    }

    public function test_blocked_phone_cannot_order(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        DB::table('commerce_blocked_phones')->insert(['tenant_id' => $this->tenant->id, 'phone' => '03001112223', 'created_at' => now()]);
        try {
            $this->place($pid);
            $this->fail('blocked number ordered');
        } catch (CommerceException $e) {
            $this->assertSame('blocked', $e->reason);
        }
    }

    public function test_old_shop_link_redirects_after_the_slug_changes(): void
    {
        $old = $this->store->slug;
        DB::table('storefront_slug_history')->insert(['storefront_id' => $this->store->id, 'slug' => $old, 'created_at' => now()]);
        $this->store->update(['slug' => 'brand-new-name']);
        $this->get('/shop/' . $old)->assertStatus(301)->assertRedirect('/shop/brand-new-name');
        $this->get('/shop/brand-new-name')->assertOk();
    }

    public function test_unpublished_shop_is_only_visible_through_a_signed_preview_link(): void
    {
        $this->store->update(['status' => 'unpublished']);
        $this->get('/shop/' . $this->store->slug)->assertNotFound();
        $url = \Illuminate\Support\Facades\URL::temporarySignedRoute('commerce.store', now()->addHour(), ['slug' => $this->store->slug, 'preview' => 1]);
        $this->get($url)->assertOk();
        $this->get('/shop/' . $this->store->slug . '?preview=1')->assertNotFound(); // unsigned
    }

    public function test_pos_error_names_the_online_order_that_holds_the_stock(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $o = $this->place($pid, 3)['order'];
        app(OrderService::class)->confirm($o->id, $this->tenant->id, $this->owner->id);
        try {
            \App\Services\Commerce\HoldGuard::assertSellable($pid, $this->warehouseId, 1);
            $this->fail('sold reserved stock');
        } catch (ReservedStockException $e) {
            $this->assertStringContainsString($o->public_number, $e->getMessage());
        }
    }

    public function test_shop_page_has_real_server_side_title_for_link_previews_and_sitemap_lists_it(): void
    {
        $this->store->update(['display_name' => 'Blue Door Bakery', 'description' => 'Single-origin coffee.']);
        $html = $this->get('/shop/' . $this->store->slug)->assertOk()->getContent();
        $this->assertStringContainsString('Blue Door Bakery', $html);
        $this->assertStringContainsString('og:title', $html);
    }

    public function test_notification_mail_covers_every_notification_type(): void
    {
        DB::table('storefronts')->where('id', $this->store->id)->update(['email' => 'owner@example.test']);
        DB::table('commerce_notifications')->insert(['tenant_id' => $this->tenant->id, 'type' => 'refund_due', 'title' => 'Refund due', 'created_at' => now(), 'updated_at' => now()]);
        \Illuminate\Support\Facades\Mail::fake();
        $this->artisan('commerce:send-notifications')->assertSuccessful();
        $this->assertNotNull(DB::table('commerce_notifications')->where('type', 'refund_due')->value('emailed_at'));
    }

    public function test_waiting_orders_reserve_units_for_the_next_customer(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $this->place($pid, 3); // pending, not accepted yet
        try {
            $this->place($pid, 1, ['customer_phone' => '0300-9998887']);
            $this->fail('last units were already claimed by a waiting order');
        } catch (CommerceException $e) {
            $this->assertSame('cart_changed', $e->reason);
        }
    }

    public function test_customer_email_gets_updates_and_never_blocks_the_order(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $o = $this->place($pid, 1, ['customer_email' => 'ali@example.test'])['order'];
        app(OrderService::class)->confirm($o->id, $this->tenant->id, $this->owner->id);
        \Illuminate\Support\Facades\Mail::assertSentCount(0); // raw mail is "sent" via send(), not Mailable
        $this->assertSame('ali@example.test', $o->fresh()->customer_email);
        // a broken mailer must not break the transition
        config(['mail.default' => 'nonexistent-driver']);
        $this->assertSame('preparing', app(OrderService::class)->advance($o->id, $this->tenant->id, $this->owner->id, 'preparing')->status);
    }

    public function test_bot_check_blocks_honeypot_and_instant_submissions(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $base = $this->checkoutInput([['item_id' => DB::table('storefront_products')->where('product_id', $pid)->value('id'), 'quantity' => 1]]);
        $this->postJson('/shop/' . $this->store->slug . '/checkout', $base + ['company_site' => 'x'])->assertStatus(422)->assertJson(['reason' => 'bot_check']);
        $this->postJson('/shop/' . $this->store->slug . '/checkout', $base + ['opened_at' => now()->getTimestampMs() - 500])->assertStatus(422)->assertJson(['reason' => 'bot_check']);
        $this->postJson('/shop/' . $this->store->slug . '/checkout', $base + ['opened_at' => now()->getTimestampMs() - 60000])->assertStatus(201);
    }

    public function test_complete_can_attach_an_existing_customer_instead_of_creating_one(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $party = (string) Str::uuid();
        DB::table('parties')->insert(['id' => $party, 'tenant_id' => $this->tenant->id, 'name' => 'Ali Regular', 'phone' => '0300 1112223', 'type' => 'customer', 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $o = $this->place($pid)['order'];
        $svc = app(OrderService::class);
        $svc->confirm($o->id, $this->tenant->id, $this->owner->id);
        $svc->advance($o->id, $this->tenant->id, $this->owner->id, 'ready');
        $before = DB::table('parties')->where('tenant_id', $this->tenant->id)->count();
        $done = $svc->complete($o->id, $this->tenant->id, $this->owner->id, collectNow: true, partyId: $party);
        $this->assertSame($party, $done->party_id);
        $this->assertSame($before, DB::table('parties')->where('tenant_id', $this->tenant->id)->count(), 'no duplicate customer');
        try {
            $o2 = $this->place($pid, 1, ['customer_phone' => '0300-4445556'])['order'];
            $svc->confirm($o2->id, $this->tenant->id, $this->owner->id);
            $svc->advance($o2->id, $this->tenant->id, $this->owner->id, 'ready');
            $svc->complete($o2->id, $this->tenant->id, $this->owner->id, partyId: (string) Str::uuid());
            $this->fail('foreign party accepted');
        } catch (CommerceException $e) {
            $this->assertSame('bad_party', $e->reason);
        }
    }

    public function test_locked_out_business_orders_are_closed_and_refund_alerted(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $a = $this->place($pid, 1)['order'];
        $b = $this->place($pid, 1, ['payment_method' => 'bank', 'customer_phone' => '0300-1010101'])['order'];
        app(OrderService::class)->reportTransfer($b->id, $this->tenant->id, 'TX9');
        DB::table('tenants')->where('id', $this->tenant->id)->update(['view_only_since' => now()]);
        $this->assertSame(2, app(OrderService::class)->sweepUnavailable());
        $this->assertSame('expired', $a->fresh()->status);
        $this->assertSame(1, DB::table('commerce_notifications')->where('order_id', $b->id)->where('type', 'refund_due')->count());
    }

    public function test_closed_orders_lose_personal_details_after_the_retention_period(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $o = $this->place($pid, 1, ['customer_email' => 'x@example.test', 'customer_note' => 'Ring twice'])['order'];
        app(OrderService::class)->reject($o->id, $this->tenant->id, $this->owner->id, 'No');
        $this->assertSame(0, app(OrderService::class)->purgeCustomerData(180));
        DB::table('commerce_orders')->where('id', $o->id)->update(['updated_at' => now('UTC')->subDays(200)->format('Y-m-d H:i:s')]);
        $this->assertSame(1, app(OrderService::class)->purgeCustomerData(180));
        $p = $o->fresh();
        $this->assertSame('Customer', $p->customer_name);
        $this->assertStringStartsWith('***', $p->customer_phone);
        $this->assertNull($p->customer_email);
        $this->assertNull($p->customer_note);
        $this->assertEquals((float) $o->total, (float) $p->total, 'money is kept for accounting');
    }

    public function test_status_page_lists_the_customers_other_orders_here(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 9, $this->store);
        $a = $this->place($pid, 1);
        $this->place($pid, 1);
        $this->get('/order-status/' . $a['token'])->assertOk()->assertInertia(fn ($pg) => $pg->has('history', 1));
    }

    public function test_delivery_charge_product_is_hidden_from_product_lists(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $o = $this->place($pid, 1, ['fulfilment' => 'delivery', 'payment_method' => 'cod', 'delivery_address' => 'House 1'])['order'];
        $svc = app(OrderService::class);
        $svc->confirm($o->id, $this->tenant->id, $this->owner->id);
        $svc->advance($o->id, $this->tenant->id, $this->owner->id, 'out_for_delivery');
        $svc->complete($o->id, $this->tenant->id, $this->owner->id);
        $this->assertSame(0, (int) DB::table('products')->where('tenant_id', $this->tenant->id)->where('sku', 'ONLINE-DELIVERY')->value('is_active'));
    }

    public function test_offline_sale_is_recorded_and_the_short_online_order_is_flagged(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $o = $this->place($pid, 3)['order'];
        app(OrderService::class)->confirm($o->id, $this->tenant->id, $this->owner->id);

        // online (normal) sale of a held unit is refused...
        try {
            \App\Services\Commerce\HoldGuard::assertSellable($pid, $this->warehouseId, 1);
            $this->fail('should be refused');
        } catch (ReservedStockException) {
        }
        // ...but an offline sale already happened and must be recorded
        \App\Services\Commerce\HoldGuard::$offlineSale = true;
        try {
            \App\Services\Commerce\HoldGuard::assertSellable($pid, $this->warehouseId, 1);
            \App\Services\Commerce\HoldGuard::assertUnderLock($pid, $this->warehouseId, 1, 3.0);
        } finally {
            \App\Services\Commerce\HoldGuard::$offlineSale = false;
        }
        DB::table('inventory_batches')->where('product_id', $pid)->update(['remaining_qty' => 2]); // the offline sale took one
        $this->assertSame(1, \App\Services\Commerce\HoldGuard::reportConflicts($this->tenant->id));
        $this->assertSame(0, \App\Services\Commerce\HoldGuard::reportConflicts($this->tenant->id), 'flagged once');
        $this->assertSame(1, DB::table('commerce_notifications')->where('order_id', $o->id)->where('type', 'stock_conflict')->count());
    }
}
