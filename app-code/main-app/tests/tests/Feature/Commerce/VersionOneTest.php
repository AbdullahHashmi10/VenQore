<?php

namespace Tests\Feature\Commerce;

use App\Services\Commerce\CheckoutService;
use App\Services\Commerce\CommerceException;
use App\Services\Commerce\OrderService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VersionOneTest extends CommerceTestCase
{
    private function promo(array $o = []): string
    {
        $id = (string) Str::uuid();
        DB::table('commerce_promotions')->insert(array_merge([
            'id' => $id, 'tenant_id' => $this->tenant->id, 'storefront_id' => $this->store->id, 'name' => 'Sale', 'code' => null,
            'kind' => 'percent', 'amount' => null, 'percent' => 10, 'scope' => 'store', 'category_id' => null, 'starts_at' => null, 'ends_at' => null, 'min_order' => 0,
            'max_uses' => null, 'uses' => 0, 'is_active' => 1, 'created_at' => now(), 'updated_at' => now(),
        ], $o));
        return $id;
    }

    private function quote(array $items, string $f = 'pickup', array $opts = []): array
    {
        return app(CheckoutService::class)->quote($this->store->fresh(), $items, $f, $opts);
    }

    private function cat(string $name): string
    {
        $id = (string) Str::uuid();
        DB::table('categories')->insert(['id' => $id, 'tenant_id' => $this->tenant->id, 'name' => $name, 'created_at' => now(), 'updated_at' => now()]);
        return $id;
    }

    public function test_auto_offer_discounts_lines_and_snapshots_on_the_order(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $this->promo(['name' => 'Autumn 10', 'percent' => 10]);
        $q = $this->quote([['product_id' => $pid, 'quantity' => 2]]);
        $this->assertEquals(1800.0, $q['total']);
        $this->assertEquals(200.0, $q['discount_total']);
        $this->assertSame('Autumn 10', $q['promo_name']);
        $o = app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 2]]))['order'];
        $this->assertEquals(1800.0, $o->total);
        $this->assertEquals(1000.0, $o->items[0]->list_price);
        $this->assertEquals(10.0, $o->items[0]->discount_percent);
        // later promo edits never change the order
        DB::table('commerce_promotions')->update(['percent' => 50]);
        $this->assertEquals(1800.0, $o->fresh()->total);
    }

    public function test_posted_sale_total_equals_discounted_order_total(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['tax_rate' => 10, 'price_includes_tax' => 0], 10, $this->store);
        $this->promo(['percent' => 20]);
        $o = app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 3]]))['order'];
        $svc = app(OrderService::class);
        $svc->confirm($o->id, $this->tenant->id, $this->owner->id);
        $svc->advance($o->id, $this->tenant->id, $this->owner->id, 'preparing');
        $svc->advance($o->id, $this->tenant->id, $this->owner->id, 'ready');
        $o = $svc->complete($o->id, $this->tenant->id, $this->owner->id, collectNow: true);
        $this->assertEquals((float) $o->total, (float) DB::table('sales')->where('id', $o->sale_id)->value('invoice_total'));
        $this->assertEquals(2640.0, (float) $o->total); // 3 x 800 net + 10% tax
    }

    public function test_dated_window_boundaries_are_utc_exact(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $this->promo(['name' => 'Future', 'starts_at' => now('UTC')->addMinute()->format('Y-m-d H:i:s')]);
        $this->promo(['name' => 'Past', 'ends_at' => now('UTC')->subSecond()->format('Y-m-d H:i:s')]);
        $this->promo(['name' => 'Off', 'is_active' => 0]);
        $this->assertEquals(1000.0, $this->quote([['product_id' => $pid, 'quantity' => 1]])['total']);
        $this->promo(['name' => 'Now', 'starts_at' => now('UTC')->subMinute()->format('Y-m-d H:i:s'), 'ends_at' => now('UTC')->addMinute()->format('Y-m-d H:i:s'), 'percent' => 5]);
        $this->assertEquals(950.0, $this->quote([['product_id' => $pid, 'quantity' => 1]])['total']);
    }

    public function test_precedence_best_auto_per_line_category_wins_tie_and_coupon_replaces_auto(): void
    {
        $c = $this->cat('Drinks');
        $a = $this->makeProduct($this->tenant, $this->warehouseId, ['category_id' => $c], 10, $this->store);
        $b = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $this->promo(['name' => 'Store 10', 'percent' => 10]);
        $this->promo(['name' => 'Drinks 25', 'percent' => 25, 'scope' => 'category', 'category_id' => $c]);
        $q = $this->quote([['product_id' => $a, 'quantity' => 1], ['product_id' => $b, 'quantity' => 1]]);
        $this->assertEquals(750.0 + 900.0, $q['total']);
        $this->promo(['name' => 'Code 5', 'code' => 'SAVE5', 'percent' => 5]);
        $q = $this->quote([['product_id' => $a, 'quantity' => 1], ['product_id' => $b, 'quantity' => 1]], 'pickup', ['coupon' => 'save5']);
        $this->assertEquals(950.0 * 2, $q['total']); // coupon replaces the automatic offers entirely
        $this->assertSame('SAVE5', $q['promo_code']);
    }

    public function test_coupon_validation_min_order_cap_and_category_mismatch(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $id = $this->promo(['code' => 'ONCE', 'percent' => 10, 'max_uses' => 1, 'min_order' => 1500]);
        foreach ([['NOPE', 2], ['ONCE', 1]] as [$code, $qty]) {
            try {
                $this->quote([['product_id' => $pid, 'quantity' => $qty]], 'pickup', ['coupon' => $code]);
                $this->fail('expected invalid_coupon');
            } catch (CommerceException $e) {
                $this->assertSame('invalid_coupon', $e->reason);
            }
        }
        $in = $this->checkoutInput([['product_id' => $pid, 'quantity' => 2]], ['coupon' => 'once']);
        app(CheckoutService::class)->place($this->store->fresh(), $in);
        $this->assertSame(1, (int) DB::table('commerce_promotions')->where('id', $id)->value('uses'));
        $this->expectException(CommerceException::class);
        app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 2]], ['coupon' => 'ONCE', 'customer_phone' => '0300-9998887']));
    }

    public function test_offer_never_pushes_a_line_below_cost_without_approval(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['price' => 1000, 'cost_price' => 900], 10, $this->store);
        $this->promo(['percent' => 50]);
        $this->assertEquals(1000.0, $this->quote([['product_id' => $pid, 'quantity' => 1]])['total']);
        DB::table('storefront_products')->where('product_id', $pid)->update(['allow_below_cost' => 1]);
        $this->assertEquals(500.0, $this->quote([['product_id' => $pid, 'quantity' => 1]])['total']);
    }

    public function test_delivery_zones_set_fee_and_minimum_and_reject_unknown_areas(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $this->store->update(['supports_delivery' => true, 'accept_cod' => true, 'delivery_charge' => 100, 'delivery_zones' => [
            ['name' => 'Gulberg', 'fee' => 150, 'min_order' => 0], ['name' => 'DHA', 'fee' => 300, 'min_order' => 2500]]]);
        $q = $this->quote([['product_id' => $pid, 'quantity' => 1]], 'delivery', ['zone' => 'gulberg']);
        $this->assertEquals(1150.0, $q['total']);
        $this->assertSame('Gulberg', $q['delivery_zone']);
        $this->assertTrue($this->quote([['product_id' => $pid, 'quantity' => 1]], 'delivery')['zone_required']);
        try {
            $this->quote([['product_id' => $pid, 'quantity' => 1]], 'delivery', ['zone' => 'Mars']);
            $this->fail('bad zone');
        } catch (CommerceException $e) {
            $this->assertSame('bad_zone', $e->reason);
        }
        $base = ['fulfilment' => 'delivery', 'payment_method' => 'cod', 'delivery_address' => '1 Road'];
        foreach ([[[], 'zone_required'], [['delivery_zone' => 'DHA'], 'below_minimum']] as [$extra, $reason]) {
            try {
                app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 1]], $base + $extra + ['idempotency_key' => (string) Str::uuid()]));
                $this->fail($reason);
            } catch (CommerceException $e) {
                $this->assertSame($reason, $e->reason);
            }
        }
        $o = app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 3]], $base + ['delivery_zone' => 'DHA']))['order'];
        $this->assertSame('DHA', $o->delivery_zone);
        $this->assertEquals(3300.0, $o->total);
    }

    public function test_fixed_amount_offer_is_spread_pro_rata_and_totals_exactly(): void
    {
        $a = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $b = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $this->promo(['name' => 'Rs 200 off', 'kind' => 'amount', 'amount' => 200, 'percent' => 0, 'min_order' => 1500]);
        $q = $this->quote([['product_id' => $a, 'quantity' => 1], ['product_id' => $b, 'quantity' => 1]]);
        $this->assertEquals(200.0, $q['discount_total']);
        $this->assertEquals(1800.0, $q['total']);
        // below the minimum order the offer does not apply
        $this->assertEquals(1000.0, $this->quote([['product_id' => $a, 'quantity' => 1]])['total']);
        // a bigger percent offer still wins per line when it saves more
        $this->promo(['name' => '30%', 'percent' => 30]);
        $this->assertEquals(1400.0, $this->quote([['product_id' => $a, 'quantity' => 1], ['product_id' => $b, 'quantity' => 1]])['total']);
    }

    public function test_held_stock_cannot_be_transferred_or_adjusted_away(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $o = app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 8]]))['order'];
        app(OrderService::class)->confirm($o->id, $this->tenant->id, $this->owner->id); // 8 of 10 now held
        $other = (string) Str::uuid();
        DB::table('warehouses')->insert(['id' => $other, 'tenant_id' => $this->tenant->id, 'name' => 'Back room', 'is_default' => 0, 'created_at' => now(), 'updated_at' => now()]);
        $inv = app(\App\Engines\InventoryService::class);
        $threw = fn (callable $f) => (function () use ($f) { try { $f(); } catch (\App\Exceptions\InsufficientStockException $e) { return true; } return false; })();
        $this->assertTrue($threw(fn () => $inv->transferStock($pid, $this->warehouseId, $other, 5)));
        $this->assertTrue($threw(fn () => $inv->adjustStock($pid, $this->warehouseId, 5, 'decrease', 0, 'test')));
        $this->assertEquals(10.0, (float) DB::table('inventory_batches')->where('product_id', $pid)->sum('remaining_qty'));
        $inv->transferStock($pid, $this->warehouseId, $other, 2); // the free 2 can move
        $this->assertEquals(8.0, (float) DB::table('inventory_batches')->where('product_id', $pid)->where('warehouse_id', $this->warehouseId)->sum('remaining_qty'));
    }

    private function lineIds(string $orderId): array
    {
        return DB::table('commerce_order_items')->where('order_id', $orderId)->pluck('id', 'product_id')->all();
    }

    public function test_revision_reduce_substitute_and_customer_accepts(): void
    {
        $a = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $b = $this->makeProduct($this->tenant, $this->warehouseId, ['price' => 500], 10, $this->store);
        $c = $this->makeProduct($this->tenant, $this->warehouseId, ['price' => 700], 10, $this->store);
        $o = app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $a, 'quantity' => 4], ['product_id' => $b, 'quantity' => 2]]))['order'];
        $this->assertEquals(5000.0, (float) $o->total);
        $ids = $this->lineIds($o->id);
        $listingC = DB::table('storefront_products')->where('product_id', $c)->value('id');
        $rev = app(\App\Services\Commerce\OrderRevisions::class);
        $o = $rev->propose($o->id, $this->tenant->id, $this->owner->id, [
            ['item' => $ids[$a], 'action' => 'qty', 'quantity' => 3],
            ['item' => $ids[$b], 'action' => 'substitute', 'quantity' => 2, 'listing_id' => $listingC],
        ], 'Out of one item');
        $this->assertSame('proposed', $o->revision_status);
        $this->assertEquals(4400.0, (float) $o->revision['total']); // 3x1000 + 2x700
        $this->assertEquals(5000.0, (float) $o->total, 'nothing changes before the customer answers');
        // the business cannot accept while a proposal is waiting
        try {
            app(OrderService::class)->confirm($o->id, $this->tenant->id, $this->owner->id);
            $this->fail('should wait for the customer');
        } catch (CommerceException $e) {
            $this->assertSame('awaiting_customer', $e->reason);
        }
        $o = $rev->respond($o, true);
        $this->assertSame('accepted', $o->revision_status);
        $this->assertEquals(4400.0, (float) $o->total);
        $this->assertEquals(2, $o->items->count());
        $this->assertEqualsCanonicalizing([$a, $c], $o->items->pluck('product_id')->all());
        // now it can be accepted, holding the reduced quantities
        app(OrderService::class)->confirm($o->id, $this->tenant->id, $this->owner->id);
        $this->assertEquals(3.0, (float) DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('product_id', $a)->value('quantity'));
        $this->assertEquals(0.0, (float) DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('product_id', $b)->sum('quantity'));
    }

    public function test_revision_decline_keeps_order_and_bad_changes_are_refused(): void
    {
        $a = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $o = app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $a, 'quantity' => 2]]))['order'];
        $id = $this->lineIds($o->id)[$a];
        $rev = app(\App\Services\Commerce\OrderRevisions::class);
        foreach ([[['item' => $id, 'action' => 'qty', 'quantity' => 5]], [['item' => $id, 'action' => 'remove']], [['item' => 'nope', 'action' => 'remove']]] as $bad) {
            try {
                $rev->propose($o->id, $this->tenant->id, $this->owner->id, $bad, null);
                $this->fail('bad change accepted');
            } catch (CommerceException $e) {
                $this->assertSame('bad_change', $e->reason);
            }
        }
        $o = $rev->propose($o->id, $this->tenant->id, $this->owner->id, [['item' => $id, 'action' => 'qty', 'quantity' => 1]], null);
        $o = $rev->respond($o, false);
        $this->assertSame('declined', $o->revision_status);
        $this->assertEquals(2000.0, (float) $o->total);
        $this->assertEquals(2.0, (float) $o->items->first()->quantity);
        // another tenant cannot touch it
        $this->expectException(CommerceException::class);
        $rev->propose($o->id, $this->tenant->id + 999, 1, [['item' => $id, 'action' => 'qty', 'quantity' => 1]], null);
    }

    public function test_the_real_sales_endpoint_cannot_sell_units_an_online_order_holds(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $o = app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 2]]))['order'];
        app(OrderService::class)->confirm($o->id, $this->tenant->id, $this->owner->id); // 2 of 3 held
        $sale = fn (string $source, int $qty) => $this->postJson('/s/' . $this->tenant->slug . '/sales', [
            'warehouse_id' => $this->warehouseId, 'payment_method' => 'cash', 'amount_paid' => 5000, 'source' => $source,
            'items' => [['product_id' => $pid, 'quantity' => $qty, 'price' => 1000, 'discount' => 0]],
        ]);
        foreach (['pos', 'manual'] as $source) {
            $r = $sale($source, 2);
            $this->assertNotSame(200, $r->status(), "$source sale of held units must be refused");
            $this->assertEquals(3.0, (float) DB::table('inventory_batches')->where('product_id', $pid)->sum('remaining_qty'), "$source left stock untouched");
        }
        $this->assertSame(200, $sale('pos', 1)->status(), 'the one free unit still sells');
        $this->assertEquals(2.0, (float) DB::table('inventory_batches')->where('product_id', $pid)->sum('remaining_qty'));
        // the order itself can still be completed from its own hold
        app(OrderService::class)->advance($o->id, $this->tenant->id, $this->owner->id, 'preparing');
        app(OrderService::class)->advance($o->id, $this->tenant->id, $this->owner->id, 'ready');
        $done = app(OrderService::class)->complete($o->id, $this->tenant->id, $this->owner->id, collectNow: true);
        $this->assertSame('completed', $done->status);
        $this->assertEquals(0.0, (float) DB::table('inventory_batches')->where('product_id', $pid)->sum('remaining_qty'));
    }

    public function test_prepaid_order_cannot_be_cancelled_or_rejected_without_a_confirmed_refund(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $svc = app(OrderService::class);
        $place = fn () => app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 2]], ['payment_method' => 'bank']))['order'];

        $o = $place();
        $svc->confirm($o->id, $this->tenant->id, $this->owner->id);
        $svc->markCollected($o->id, $this->tenant->id, $this->owner->id);
        try {
            $svc->cancel($o->id, $this->tenant->id, $this->owner->id, 'Out of stock');
            $this->fail('cancelled a prepaid order without a refund');
        } catch (CommerceException $e) {
            $this->assertSame('refund_required', $e->reason);
        }
        $this->assertSame('confirmed', $o->fresh()->status);
        $this->assertEquals(2.0, (float) DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('status', 'active')->sum('quantity'), 'hold kept until settled');
        $c = $svc->cancel($o->id, $this->tenant->id, $this->owner->id, 'Out of stock', null, true);
        $this->assertSame('cancelled', $c->status);
        $this->assertSame('refunded', $c->payment_status);
        $this->assertSame(1, DB::table('commerce_order_events')->where('order_id', $o->id)->where('type', 'payment_refunded')->count());
        $this->assertSame(0, DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('status', 'active')->count());

        // a reported (unverified) transfer on a pending order: rejecting needs the same acknowledgement
        $p = $place();
        $svc->reportTransfer($p->id, $this->tenant->id, 'TXN12345');
        try {
            $svc->reject($p->id, $this->tenant->id, $this->owner->id, 'Sorry');
            $this->fail('rejected without handling the reported transfer');
        } catch (CommerceException $e) {
            $this->assertSame('refund_required', $e->reason);
        }
        $this->assertSame('rejected', $svc->reject($p->id, $this->tenant->id, $this->owner->id, 'Sorry', null, true)->status);

        // an unpaid order closes as before, no tick needed
        $u = $place();
        $this->assertSame('rejected', $svc->reject($u->id, $this->tenant->id, $this->owner->id, 'No')->status);
    }

    public function test_expiry_with_a_reported_transfer_alerts_the_business(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $o = app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 1]], ['payment_method' => 'bank']))['order'];
        app(OrderService::class)->reportTransfer($o->id, $this->tenant->id, 'TXN99999');
        DB::table('commerce_orders')->where('id', $o->id)->update(['accept_by' => now('UTC')->subMinute()->format('Y-m-d H:i:s')]);
        app(OrderService::class)->expireDue();
        $this->assertSame('expired', $o->fresh()->status);
        $this->assertSame(1, DB::table('commerce_notifications')->where('order_id', $o->id)->where('type', 'refund_due')->count());
    }

    public function test_checkout_closes_outside_opening_hours_unless_advance_orders_are_enabled(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $closed = array_fill_keys(\App\Services\Commerce\OpeningHours::DAYS, null);
        DB::table('storefronts')->where('id', $this->store->id)->update(['opening_hours' => json_encode($closed)]);
        try {
            app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 1]]));
            $this->fail('order accepted while closed');
        } catch (CommerceException $e) {
            $this->assertSame('closed_hours', $e->reason);
        }
        $this->assertSame(0, DB::table('commerce_orders')->where('storefront_id', $this->store->id)->count());
        // the public page tells the customer why
        $props = $this->get('/shop/' . $this->store->slug)->viewData('page')['props'];
        $this->assertFalse($props['store']['accepting_orders']);
        $this->assertTrue($props['store']['closed_by_hours']);
        // merchant opt-in: advance orders are allowed
        DB::table('storefronts')->where('id', $this->store->id)->update(['orders_outside_hours' => 1]);
        $this->assertNotNull(app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 1]]))['order']);
        // no hours configured at all: open (unknown is not closed)
        DB::table('storefronts')->where('id', $this->store->id)->update(['opening_hours' => null, 'orders_outside_hours' => 0]);
        $this->assertFalse($this->store->fresh()->isClosedByHours());
    }

    public function test_opening_hours_use_the_store_timezone_and_overnight_windows(): void
    {
        // Mon 18:00 - 02:00 (overnight), store in Asia/Karachi (UTC+5)
        $hours = array_fill_keys(\App\Services\Commerce\OpeningHours::DAYS, null);
        $hours['mon'] = ['open' => '18:00', 'close' => '02:00'];
        DB::table('storefronts')->where('id', $this->store->id)->update(['opening_hours' => json_encode($hours)]);
        $at = fn (string $utc) => $this->store->fresh()->isClosedByHours(\Carbon\CarbonImmutable::parse($utc, 'UTC'));
        $this->assertFalse($at('2026-10-05 18:00:00'), 'Mon 23:00 PKT is open');
        $this->assertFalse($at('2026-10-05 20:30:00'), 'Tue 01:30 PKT is still open (overnight)');
        $this->assertTrue($at('2026-10-05 22:30:00'), 'Tue 03:30 PKT is closed');
        $this->assertTrue($at('2026-10-05 10:00:00'), 'Mon 15:00 PKT is before opening');
        $this->assertTrue($at('2026-10-06 18:00:00'), 'Tuesday has no hours');
    }
}
