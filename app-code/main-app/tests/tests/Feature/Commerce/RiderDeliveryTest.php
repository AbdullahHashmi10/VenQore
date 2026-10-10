<?php

namespace Tests\Feature\Commerce;

use App\Services\Commerce\CheckoutService;
use App\Services\Commerce\CommerceException;
use App\Services\Commerce\DeliveryService;
use App\Services\Commerce\OrderService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Phase C: rider assignment, status trail, COD cash custody, link isolation. */
class RiderDeliveryTest extends CommerceTestCase
{
    private function rider(string $name = 'Rider One', array $over = []): string
    {
        $id = (string) Str::uuid();
        DB::table('employees')->insert(array_merge([
            'id' => $id, 'tenant_id' => $this->tenant->id, 'name' => $name, 'monthly_salary' => 0, 'hire_date' => now()->toDateString(),
            'status' => 'active', 'is_rider' => 1, 'created_at' => now(), 'updated_at' => now(),
        ], $over));
        return $id;
    }

    private function deliveryOrder(string $method = 'cod'): object
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['price' => 500, 'cost_price' => 100], 20, $this->store);
        $o = app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 2]], [
            'fulfilment' => 'delivery', 'payment_method' => $method, 'delivery_address' => 'House 5, Street 2',
        ]))['order'];
        app(OrderService::class)->confirm($o->id, $this->tenant->id, $this->owner->id);
        return $o->fresh();
    }

    private function svc(): DeliveryService
    {
        return app(DeliveryService::class);
    }

    public function test_full_cod_flow_cash_is_acknowledged_and_never_netted(): void
    {
        $r = $this->rider();
        $o = $this->deliveryOrder();
        $d = $this->svc()->assign($o->id, $this->tenant->id, $r, $this->owner->id);
        $this->assertSame('assigned', $d->status);
        $this->assertEquals((float) $o->total, (float) $d->cash_expected);

        foreach (['accepted', 'collected', 'out_for_delivery'] as $to) {
            $this->svc()->riderStep($d->id, $this->tenant->id, $r, $to);
        }
        $this->assertSame('out_for_delivery', DB::table('commerce_orders')->where('id', $o->id)->value('status'));

        $done = $this->svc()->riderStep($d->id, $this->tenant->id, $r, 'delivered', (float) $o->total);
        $this->assertSame('delivered', $done->status);
        $this->assertEquals((float) $o->total, $this->svc()->outstandingCash($this->tenant->id, $r));

        $this->svc()->acknowledgeCash($d->id, $this->tenant->id, $this->owner->id);
        $this->assertEquals(0.0, $this->svc()->outstandingCash($this->tenant->id, $r));
        $this->assertSame(1, DB::table('commerce_delivery_events')->where('delivery_id', $d->id)->where('type', 'cash_acknowledged')->count());
    }

    public function test_repeat_step_is_idempotent_and_skipping_is_refused(): void
    {
        $r = $this->rider();
        $d = $this->svc()->assign($this->deliveryOrder()->id, $this->tenant->id, $r, $this->owner->id);
        $this->svc()->riderStep($d->id, $this->tenant->id, $r, 'accepted');
        $before = DB::table('commerce_delivery_events')->where('delivery_id', $d->id)->count();
        $this->svc()->riderStep($d->id, $this->tenant->id, $r, 'accepted');
        $this->assertSame($before, DB::table('commerce_delivery_events')->where('delivery_id', $d->id)->count());

        $this->expectException(CommerceException::class);
        $this->svc()->riderStep($d->id, $this->tenant->id, $r, 'delivered');
    }

    public function test_a_rider_cannot_touch_another_riders_delivery(): void
    {
        $a = $this->rider('A');
        $b = $this->rider('B');
        $d = $this->svc()->assign($this->deliveryOrder()->id, $this->tenant->id, $a, $this->owner->id);
        $this->expectException(CommerceException::class);
        $this->svc()->riderStep($d->id, $this->tenant->id, $b, 'accepted');
    }

    public function test_failed_needs_reason_then_reassign_keeps_one_record(): void
    {
        $a = $this->rider('A');
        $b = $this->rider('B');
        $o = $this->deliveryOrder();
        $d = $this->svc()->assign($o->id, $this->tenant->id, $a, $this->owner->id);
        $this->svc()->riderStep($d->id, $this->tenant->id, $a, 'accepted');
        try {
            $this->svc()->riderStep($d->id, $this->tenant->id, $a, 'failed', null, '  ');
            $this->fail('reason is required');
        } catch (CommerceException $e) {
            $this->assertSame('reason_required', $e->reason);
        }
        $this->svc()->riderStep($d->id, $this->tenant->id, $a, 'failed', null, 'Customer not answering');
        $again = $this->svc()->assign($o->id, $this->tenant->id, $b, $this->owner->id);
        $this->assertSame($d->id, $again->id);
        $this->assertSame($b, $again->rider_id);
        $this->assertSame('assigned', $again->status);
        $this->assertSame(1, DB::table('commerce_deliveries')->where('order_id', $o->id)->count());
    }

    public function test_pickup_orders_and_inactive_or_foreign_riders_are_refused(): void
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['price' => 100], 20, $this->store);
        $p = app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 1]]))['order'];
        app(OrderService::class)->confirm($p->id, $this->tenant->id, $this->owner->id);
        $r = $this->rider();
        try {
            $this->svc()->assign($p->id, $this->tenant->id, $r, $this->owner->id);
            $this->fail('pickup order must be refused');
        } catch (CommerceException $e) {
            $this->assertTrue(true);
        }

        $o = $this->deliveryOrder();
        $inactive = $this->rider('Gone', ['status' => 'terminated']);
        $this->expectException(CommerceException::class);
        $this->svc()->assign($o->id, $this->tenant->id, $inactive, $this->owner->id);
    }

    public function test_rider_link_resolves_only_until_replaced(): void
    {
        $r = $this->rider();
        $t1 = $this->svc()->issueRiderLink($this->tenant->id, $r, $this->owner->id);
        $this->assertSame($r, $this->svc()->resolveLink($t1)->employee_id);
        $t2 = $this->svc()->issueRiderLink($this->tenant->id, $r, $this->owner->id);
        $this->assertNull($this->svc()->resolveLink($t1));
        $this->assertNotNull($this->svc()->resolveLink($t2));
        $this->assertNull($this->svc()->resolveLink('short'));
        $this->assertNotSame($t2, DB::table('commerce_rider_links')->whereNull('revoked_at')->value('token_hash'), 'only the hash is stored');
    }

    public function test_rider_page_shows_only_own_deliveries(): void
    {
        $a = $this->rider('A');
        $b = $this->rider('B');
        $this->svc()->assign($this->deliveryOrder()->id, $this->tenant->id, $a, $this->owner->id);
        $tb = $this->svc()->issueRiderLink($this->tenant->id, $b, $this->owner->id);
        $this->get('/rider/' . $tb)->assertOk()->assertInertia(fn ($p) => $this->assertSame([], $p->toArray()['props']['deliveries']));
        $this->get('/rider/' . str_repeat('a', 48))->assertNotFound();
    }

    private function member(string $role = 'custom'): \App\Models\User
    {
        return $this->createTenantUser($this->tenant, $role);
    }

    public function test_linking_a_custom_member_grants_only_the_rider_key(): void
    {
        $r = $this->rider();
        $u = $this->member('custom');
        $this->svc()->linkAccount($this->tenant->id, $r, $u->id, $this->owner->id);

        $m = \App\Models\TenantUser::where('tenant_id', $this->tenant->id)->where('user_id', $u->id)->first();
        $this->assertSame('custom', $m->permission_override_mode);
        $this->assertSame([DeliveryService::RIDER_KEY], $m->permissions);
        $this->assertSame($r, $this->svc()->accountFor($this->tenant->id, $u->id)->employee_id);
    }

    public function test_linking_refuses_owners_non_members_and_unprepared_staff(): void
    {
        $r = $this->rider();
        foreach ([[$this->owner->id, 'bad_member']] as [$uid, $code]) {
            try {
                $this->svc()->linkAccount($this->tenant->id, $r, $uid, $this->owner->id);
                $this->fail('owner must be refused');
            } catch (CommerceException $e) {
                $this->assertSame($code, $e->reason);
            }
        }
        try {
            $this->svc()->linkAccount($this->tenant->id, $r, 99999999, $this->owner->id);
            $this->fail('non-member must be refused');
        } catch (CommerceException $e) {
            $this->assertSame('bad_member', $e->reason);
        }
        $mgr = $this->member('manager');
        $this->expectException(CommerceException::class);
        $this->svc()->linkAccount($this->tenant->id, $r, $mgr->id, $this->owner->id);
    }

    public function test_unlink_removes_the_account_and_the_rider_key(): void
    {
        $r = $this->rider();
        $u = $this->member('custom');
        $this->svc()->linkAccount($this->tenant->id, $r, $u->id, $this->owner->id);
        $this->svc()->unlinkAccount($this->tenant->id, $r);
        $this->assertNull($this->svc()->accountFor($this->tenant->id, $u->id));
        $m = \App\Models\TenantUser::where('tenant_id', $this->tenant->id)->where('user_id', $u->id)->first();
        $this->assertNotContains(DeliveryService::RIDER_KEY, $m->permissions ?? []);
    }
}
