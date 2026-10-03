<?php

namespace Tests\Feature\Commerce;

use App\Models\Commerce\CommerceOrder;
use App\Services\Commerce\CheckoutService;
use App\Services\Commerce\CommerceException;
use App\Services\Commerce\OrderService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderFlowTest extends CommerceTestCase
{
    private function place(array $items, array $over = []): array
    {
        return app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput($items, $over));
    }

    private function remaining(string $pid): float
    {
        return (float) DB::table('inventory_batches')->where('product_id', $pid)->sum('remaining_qty');
    }

    public function test_full_journey_publish_order_confirm_fulfil_reconcile(): void
    {
        $this->store->update(['pricing_mode' => 'increase', 'pricing_percent' => 10]);
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 20, $this->store);

        $r = $this->place([['product_id' => $pid, 'quantity' => 2]]);
        $o = $r['order'];
        $this->assertSame('pending', $o->status);
        $this->assertEquals(2200.0, $o->total);                // 2 x (1000 + 10%)
        $this->assertSame('percent', $o->items[0]->price_rule);
        $this->assertEquals(1000.0, $o->items[0]->base_price); // provenance kept
        $this->assertEquals(20.0, $this->remaining($pid));     // browsing/ordering holds nothing

        $svc = app(OrderService::class);
        $o = $svc->confirm($o->id, $this->tenant->id, $this->owner->id);
        $this->assertSame('confirmed', $o->status);
        $this->assertEquals(2.0, (float) DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('status', 'active')->sum('quantity'));
        $this->assertEquals(20.0, $this->remaining($pid));     // hold is not a deduction

        $o = $svc->advance($o->id, $this->tenant->id, $this->owner->id, 'preparing');
        $o = $svc->advance($o->id, $this->tenant->id, $this->owner->id, 'ready');
        $o = $svc->complete($o->id, $this->tenant->id, $this->owner->id, collectNow: true);

        $this->assertSame('completed', $o->status);
        $this->assertSame('collected', $o->payment_status);
        $this->assertNotNull($o->sale_id);

        $sale = DB::table('sales')->where('id', $o->sale_id)->first();
        $this->assertEquals(2200.0, (float) $sale->invoice_total);          // posted total == agreed total
        $this->assertSame('paid', $sale->payment_status);
        $this->assertEquals(18.0, $this->remaining($pid));                  // stock consumed exactly once
        $this->assertSame(0, DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('status', 'active')->count());
        $this->assertSame(1, DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('status', 'consumed')->count());
        $this->assertEquals(2200.0, (float) DB::table('journal_items as ji')->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', $this->tenant->id)->where('a.code', '1000')->sum('ji.debit'));  // cash received
        $this->assertSame($this->tenant->id, (int) DB::table('sales')->where('id', $o->sale_id)->value('tenant_id'));
        $this->assertGreaterThanOrEqual(4, DB::table('commerce_order_events')->where('order_id', $o->id)->count());
    }

    public function test_completing_twice_posts_exactly_one_sale(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 1]])['order'];
        $svc = app(OrderService::class);
        $svc->confirm($o->id, $this->tenant->id, 1);
        $svc->advance($o->id, $this->tenant->id, 1, 'ready');
        $a = $svc->complete($o->id, $this->tenant->id, $this->owner->id, true);
        $b = $svc->complete($o->id, $this->tenant->id, $this->owner->id, true);
        $this->assertSame($a->sale_id, $b->sale_id);
        $this->assertSame(1, DB::table('sales')->where('idempotency_key', 'commerce-' . $o->id)->count());
        $this->assertEquals(9.0, $this->remaining($pid));
    }

    public function test_cod_not_collected_posts_receivable_not_cash(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 1]], ['fulfilment' => 'delivery', 'payment_method' => 'cod', 'delivery_address' => 'House 5'])['order'];
        $this->assertEquals(1100.0, $o->total); // 1000 + 100 delivery
        $svc = app(OrderService::class);
        $svc->confirm($o->id, $this->tenant->id, 1);
        $svc->advance($o->id, $this->tenant->id, 1, 'out_for_delivery');
        $o = $svc->complete($o->id, $this->tenant->id, $this->owner->id, collectNow: false);
        $this->assertSame('completed', $o->status);
        $this->assertSame('unpaid', $o->payment_status);   // COD before collection is not income received
        $sale = DB::table('sales')->where('id', $o->sale_id)->first();
        $this->assertSame('credit', $sale->payment_method);
        $this->assertSame('unpaid', $sale->payment_status);
        $this->assertEquals(1100.0, (float) $sale->invoice_total);
        $cash = DB::table('journal_items as ji')->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', $this->tenant->id)->where('a.code', '1000')->sum('ji.debit');
        $this->assertEquals(0.0, (float) $cash);
    }

    public function test_confirm_rejects_when_stock_insufficient_and_holds_nothing(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 2, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 2]])['order'];
        DB::table('inventory_batches')->where('product_id', $pid)->update(['remaining_qty' => 1]); // stock dropped after the customer ordered
        try {
            app(OrderService::class)->confirm($o->id, $this->tenant->id, 1);
            $this->fail('expected insufficient stock');
        } catch (CommerceException $e) {
            $this->assertSame('insufficient_stock', $e->reason);
        }
        $this->assertSame('pending', $o->fresh()->status);
        $this->assertSame(0, DB::table('commerce_stock_holds')->where('order_id', $o->id)->count());
    }

    public function test_second_order_cannot_double_book_the_last_unit(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 2, $this->store);
        $a = $this->place([['product_id' => $pid, 'quantity' => 1]])['order'];
        $b = $this->place([['product_id' => $pid, 'quantity' => 1]])['order'];
        DB::table('inventory_batches')->where('product_id', $pid)->update(['remaining_qty' => 1]); // a unit left the shelf after both ordered
        $svc = app(OrderService::class);
        $svc->confirm($a->id, $this->tenant->id, 1);
        $this->expectException(CommerceException::class);
        $svc->confirm($b->id, $this->tenant->id, 1);
    }

    public function test_existing_presale_reservation_is_respected(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 2]])['order']; // ordered while all 5 were free
        $soId = (string) Str::uuid();
        $cols = DB::getSchemaBuilder()->getColumnListing('sales_orders');
        $row = ['id' => $soId, 'user_id' => $this->owner->id, 'tenant_id' => $this->tenant->id, 'status' => 'open', 'created_at' => now(), 'updated_at' => now()];
        foreach (DB::select('describe sales_orders') as $c) {
            if ($c->Null === 'NO' && $c->Default === null && $c->Extra === '' && ! isset($row[$c->Field])) {
                $row[$c->Field] = str_contains($c->Type, 'int') || str_contains($c->Type, 'decimal') ? 0 : (str_contains($c->Type, 'date') ? now() : (str_contains($c->Type, 'char') ? (string) Str::uuid() : 'x'));
            }
        }
        DB::table('sales_orders')->insert($row);
        $si = ['id' => (string) Str::uuid(), 'tenant_id' => $this->tenant->id, 'sales_order_id' => $soId, 'product_id' => $pid, 'quantity_reserved' => 4, 'created_at' => now(), 'updated_at' => now()];
        foreach (DB::select('describe sales_order_items') as $c) {
            if ($c->Null === 'NO' && $c->Default === null && $c->Extra === '' && ! isset($si[$c->Field])) {
                $si[$c->Field] = str_contains($c->Type, 'int') || str_contains($c->Type, 'decimal') ? 0 : (str_contains($c->Type, 'char') && $c->Field !== 'name' ? (string) Str::uuid() : 'x');
            }
        }
        DB::table('sales_order_items')->insert($si);

        $this->expectException(CommerceException::class);
        app(OrderService::class)->confirm($o->id, $this->tenant->id, 1);
    }

    public function test_cancel_releases_holds_and_blocks_completion(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 3]])['order'];
        $svc = app(OrderService::class);
        $svc->confirm($o->id, $this->tenant->id, 1);
        $o = $svc->cancel($o->id, $this->tenant->id, 1, 'Customer called');
        $this->assertSame('cancelled', $o->status);
        $this->assertSame(0, DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('status', 'active')->count());
        $this->assertSame(1, DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('status', 'released')->count());
        $this->expectException(CommerceException::class);
        $svc->complete($o->id, $this->tenant->id, 1, true);
    }

    public function test_illegal_transitions_are_refused(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 1]])['order'];
        $svc = app(OrderService::class);
        try {
            $svc->advance($o->id, $this->tenant->id, 1, 'preparing');
            $this->fail('pending cannot jump to preparing');
        } catch (CommerceException $e) {
            $this->assertSame('bad_transition', $e->reason);
        }
        $svc->confirm($o->id, $this->tenant->id, 1);
        try {
            $svc->advance($o->id, $this->tenant->id, 1, 'out_for_delivery'); // pickup order
            $this->fail('pickup order cannot go out for delivery');
        } catch (CommerceException $e) {
            $this->assertSame('bad_transition', $e->reason);
        }
        try {
            $svc->complete($o->id, $this->tenant->id, 1, true); // not ready yet
            $this->fail('cannot complete before ready');
        } catch (CommerceException $e) {
            $this->assertSame('bad_state', $e->reason);
        }
        $this->assertSame(0, DB::table('sales')->where('idempotency_key', 'commerce-' . $o->id)->count());
    }

    public function test_stale_version_is_rejected(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 1]])['order'];
        $this->expectException(CommerceException::class);
        app(OrderService::class)->confirm($o->id, $this->tenant->id, 1, 999);
    }

    public function test_reject_and_expiry(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $a = $this->place([['product_id' => $pid, 'quantity' => 1]])['order'];
        $svc = app(OrderService::class);
        $this->assertSame('rejected', $svc->reject($a->id, $this->tenant->id, 1, 'Out of stock')->status);

        $b = $this->place([['product_id' => $pid, 'quantity' => 1]])['order'];
        CommerceOrder::where('id', $b->id)->update(['accept_by' => now()->subMinute()]);
        $this->assertSame(1, $svc->expireDue());
        $this->assertSame('expired', $b->fresh()->status);
        try {
            $svc->confirm($b->id, $this->tenant->id, 1);
            $this->fail();
        } catch (CommerceException $e) {
            $this->assertSame('bad_state', $e->reason);
        }
    }

    public function test_bank_transfer_report_never_marks_paid(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 1]], ['payment_method' => 'bank'])['order'];
        $svc = app(OrderService::class);
        $o = $svc->reportTransfer($o->id, $this->tenant->id, 'TXN123');
        $this->assertSame('transfer_reported', $o->payment_status);
        $this->assertEquals(0.0, $o->amount_collected);
        $svc->confirm($o->id, $this->tenant->id, 1);
        $o = $svc->markCollected($o->id, $this->tenant->id, 1);
        $this->assertSame('collected', $o->payment_status);
    }

    public function test_below_cost_needs_explicit_merchant_approval(): void
    {
        $this->store->update(['pricing_mode' => 'decrease', 'pricing_percent' => 70]);
        $blocked = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);          // 300 < cost 400
        try {
            $this->place([['product_id' => $blocked, 'quantity' => 1]]);
            $this->fail('below-cost line must be refused for shoppers');
        } catch (CommerceException $e) {
            $this->assertSame('cart_changed', $e->reason);
        }
        $allowed = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store, ['allow_below_cost' => 1]);
        $o = $this->place([['product_id' => $allowed, 'quantity' => 1]])['order'];
        $svc = app(OrderService::class);
        $svc->confirm($o->id, $this->tenant->id, 1);
        $svc->advance($o->id, $this->tenant->id, 1, 'ready');
        $o = $svc->complete($o->id, $this->tenant->id, $this->owner->id, true, null, approveBelowCost: true);
        $this->assertSame('completed', $o->status);
    }

    public function test_tax_inclusive_order_total_equals_posted_sale_total(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['tax_rate' => 17, 'price_includes_tax' => 1, 'price' => 999], 10, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 3]])['order'];
        $svc = app(OrderService::class);
        $svc->confirm($o->id, $this->tenant->id, 1);
        $svc->advance($o->id, $this->tenant->id, 1, 'ready');
        $o = $svc->complete($o->id, $this->tenant->id, $this->owner->id, true);
        $this->assertEqualsWithDelta((float) $o->total, (float) DB::table('sales')->where('id', $o->sale_id)->value('invoice_total'), 0.001);
        $this->assertEqualsWithDelta(2997.0, (float) $o->total, 0.05);
    }

    public function test_pos_sale_cannot_consume_stock_held_by_accepted_online_order(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 2]])['order'];
        app(OrderService::class)->confirm($o->id, $this->tenant->id, $this->owner->id); // holds 2 of 3

        $this->expectException(\App\Exceptions\InsufficientStockException::class);
        app(\App\Services\V3\SaleService::class)->post([
            'warehouse_id' => $this->warehouseId, 'payment_method' => 'cash', 'amount_received' => 2000, 'user_id' => $this->owner->id,
            'items' => [['product_id' => $pid, 'qty' => 2, 'unit_price' => 1000, 'discount_percent' => 0, 'tax_rate' => 0]],
        ]);
    }

    public function test_pos_sale_of_unheld_stock_still_works(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 2]])['order'];
        app(OrderService::class)->confirm($o->id, $this->tenant->id, $this->owner->id);

        app(\App\Services\V3\SaleService::class)->post([
            'warehouse_id' => $this->warehouseId, 'payment_method' => 'cash', 'amount_received' => 1000, 'user_id' => $this->owner->id,
            'items' => [['product_id' => $pid, 'qty' => 1, 'unit_price' => 1000, 'discount_percent' => 0, 'tax_rate' => 0]],
        ]);
        $this->assertEquals(2.0, $this->remaining($pid));
    }

    public function test_order_payment_follows_the_sale_once_receivable_is_settled(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 1]], ['fulfilment' => 'delivery', 'payment_method' => 'cod', 'delivery_address' => 'House 5'])['order'];
        $svc = app(OrderService::class);
        $svc->confirm($o->id, $this->tenant->id, 1);
        $svc->advance($o->id, $this->tenant->id, 1, 'out_for_delivery');
        $o = $svc->complete($o->id, $this->tenant->id, $this->owner->id, collectNow: false);

        $this->assertSame('unpaid', $svc->syncPaymentFromSale($o->id, $this->tenant->id)->payment_status);
        DB::table('sales')->where('id', $o->sale_id)->update(['payment_status' => 'paid']); // what PaymentService::allocate writes
        $this->assertSame('collected', $svc->syncPaymentFromSale($o->id, $this->tenant->id)->payment_status);
    }

    public function test_full_sale_return_marks_order_payment_refunded(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 10, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 1]])['order'];
        $svc = app(OrderService::class);
        $svc->confirm($o->id, $this->tenant->id, 1);
        $svc->advance($o->id, $this->tenant->id, 1, 'ready');
        $o = $svc->complete($o->id, $this->tenant->id, $this->owner->id, collectNow: true);
        DB::table('sales')->where('id', $o->sale_id)->update(['status' => 'returned']);
        $this->assertSame('refunded', $svc->syncPaymentFromSale($o->id, $this->tenant->id)->payment_status);
    }

    public function test_notification_outbox_emails_once_and_survives_failure(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $this->store->update(['email' => 'shop@example.test']);
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $this->place([['product_id' => $pid, 'quantity' => 1]]);
        $this->artisan('commerce:send-notifications')->assertSuccessful();
        $this->artisan('commerce:send-notifications')->assertSuccessful();
        $this->assertSame(1, DB::table('commerce_notifications')->whereNotNull('emailed_at')->count());
    }

    public function test_order_placed_in_utc_is_not_expired_when_staff_request_runs_in_store_timezone(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 5, $this->store);
        $o = $this->place([['product_id' => $pid, 'quantity' => 1]])['order']; // public request: PHP tz = UTC
        $prev = date_default_timezone_get();
        date_default_timezone_set('Asia/Karachi'); // what TenantMiddleware does on staff pages
        try {
            $this->assertSame('confirmed', app(OrderService::class)->confirm($o->id, $this->tenant->id, 1)->status);
        } finally {
            date_default_timezone_set($prev);
        }
    }
}
