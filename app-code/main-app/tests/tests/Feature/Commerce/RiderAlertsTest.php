<?php

namespace Tests\Feature\Commerce;

use App\Jobs\SendWebPush;
use App\Services\Commerce\CheckoutService;
use App\Services\Commerce\DeliveryService;
use App\Services\Commerce\OrderService;
use App\Services\Delivery\RiderNotifier;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

/** Master plan B0/B1: one rider alert for every assignment, WhatsApp share link, browser push, safe subscriptions. */
class RiderAlertsTest extends CommerceTestCase
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

    private function deliveryOrder(): object
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['price' => 500, 'cost_price' => 100], 20, $this->store);
        $o = app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 2]], [
            'fulfilment' => 'delivery', 'payment_method' => 'cod', 'delivery_address' => 'House 5, Gulberg, Lahore',
        ]))['order'];
        app(OrderService::class)->confirm($o->id, $this->tenant->id, $this->owner->id);
        return $o->fresh();
    }

    private function pushOn(): void
    {
        config(['webpush.public_key' => 'BPublicKeyForTests', 'webpush.private_key' => 'PrivateKeyForTests']);
    }

    private function subscription(string $host = 'fcm.googleapis.com'): array
    {
        return ['endpoint' => "https://{$host}/fcm/send/" . Str::random(40), 'keys' => ['p256dh' => Str::random(60), 'auth' => Str::random(20)]];
    }

    public function test_assigning_a_rider_builds_a_whatsapp_message_without_the_street_address(): void
    {
        $r = $this->rider('Ali', ['rider_phone' => '0300 1234567']);
        \App\Models\Setting::updateOrCreate(['tenant_id' => $this->tenant->id, 'key' => 'country_calling_code'], ['value' => '92']);
        $o = $this->deliveryOrder();

        $svc = app(DeliveryService::class);
        $svc->assign($o->id, $this->tenant->id, $r, $this->owner->id);

        $n = $svc->lastRiderNotice;
        $this->assertSame('notified', $n['status']);
        $this->assertStringStartsWith('https://wa.me/923001234567?text=', $n['whatsapp_share_url']);
        $this->assertStringContainsString($o->public_number, $n['message_preview']);
        $this->assertStringContainsString('Gulberg, Lahore', $n['message_preview']);
        $this->assertStringNotContainsString('House 5', $n['message_preview'], 'no street line in the message');
        $this->assertStringContainsString('Cash to collect', $n['message_preview']);
    }

    public function test_a_local_number_with_no_store_country_code_is_not_guessed(): void
    {
        $r = $this->rider('Ali', ['rider_phone' => '0300 1234567']);
        $res = RiderNotifier::assigned($this->tenant->id, $r, ['order_number' => 'A1', 'pickup_name' => 'Shop', 'cash_expected' => 0]);
        $this->assertStringStartsWith('https://wa.me/?text=', $res['whatsapp_share_url']);
    }

    public function test_an_international_number_is_used_as_is(): void
    {
        $r = $this->rider('Sam', ['rider_phone' => '+1 415 555 0132']);
        $res = RiderNotifier::assigned($this->tenant->id, $r, ['order_number' => 'A1', 'pickup_name' => 'Shop']);
        $this->assertStringStartsWith('https://wa.me/14155550132?text=', $res['whatsapp_share_url']);
    }

    public function test_push_is_queued_on_assign_and_the_old_rider_is_told_on_reassign(): void
    {
        $this->pushOn();
        Queue::fake();
        $a = $this->rider('A');
        $b = $this->rider('B');
        $o = $this->deliveryOrder();
        $svc = app(DeliveryService::class);

        $svc->assign($o->id, $this->tenant->id, $a, $this->owner->id);
        Queue::assertPushed(SendWebPush::class, fn ($j) => $j->employeeId === $a && str_contains($j->message['title'], 'New delivery'));

        $svc->assign($o->id, $this->tenant->id, $b, $this->owner->id);
        Queue::assertPushed(SendWebPush::class, fn ($j) => $j->employeeId === $b && str_contains($j->message['title'], 'New delivery'));
        Queue::assertPushed(SendWebPush::class, fn ($j) => $j->employeeId === $a && str_contains($j->message['title'], 'reassigned'));
    }

    public function test_no_push_job_when_the_server_has_no_keys(): void
    {
        Queue::fake();
        $r = $this->rider();
        app(DeliveryService::class)->assign($this->deliveryOrder()->id, $this->tenant->id, $r, $this->owner->id);
        Queue::assertNotPushed(SendWebPush::class);
    }

    public function test_push_text_never_carries_address_or_customer_phone(): void
    {
        $this->pushOn();
        Queue::fake();
        $r = $this->rider();
        app(DeliveryService::class)->assign($this->deliveryOrder()->id, $this->tenant->id, $r, $this->owner->id);
        Queue::assertPushed(SendWebPush::class, function ($j) {
            $text = json_encode($j->message);
            return ! str_contains($text, 'House 5') && ! str_contains($text, 'Gulberg');
        });
    }

    public function test_a_rider_link_can_subscribe_and_only_for_its_own_rider(): void
    {
        $this->pushOn();
        $r = $this->rider();
        $token = app(DeliveryService::class)->issueRiderLink($this->tenant->id, $r, $this->owner->id);
        $sub = $this->subscription();

        $this->postJson("/rider/{$token}/push", $sub)->assertOk();
        $row = DB::table('push_subscriptions')->where('endpoint_hash', hash('sha256', $sub['endpoint']))->first();
        $this->assertSame($r, $row->employee_id);
        $this->assertEquals($this->tenant->id, $row->tenant_id);

        // Same browser again updates the row instead of adding one.
        $this->postJson("/rider/{$token}/push", $sub)->assertOk();
        $this->assertSame(1, DB::table('push_subscriptions')->count());

        $this->postJson('/rider/' . str_repeat('a', 48) . '/push', $this->subscription())->assertNotFound();
    }

    public function test_an_unknown_push_service_address_is_refused(): void
    {
        $this->pushOn();
        $r = $this->rider();
        $token = app(DeliveryService::class)->issueRiderLink($this->tenant->id, $r, $this->owner->id);

        // The server calls this address later, so an internal or unknown host must never be stored.
        $this->postJson("/rider/{$token}/push", $this->subscription('169.254.169.254'))->assertStatus(422);
        $this->postJson("/rider/{$token}/push", $this->subscription('evil.example.com'))->assertStatus(422);
        $this->postJson("/rider/{$token}/push", ['endpoint' => 'http://fcm.googleapis.com/x', 'keys' => ['p256dh' => 'a', 'auth' => 'b']])->assertStatus(422);
        $this->assertSame(0, DB::table('push_subscriptions')->count());
    }

    public function test_subscribing_is_unavailable_when_the_server_has_no_keys(): void
    {
        $r = $this->rider();
        $token = app(DeliveryService::class)->issueRiderLink($this->tenant->id, $r, $this->owner->id);
        $this->postJson("/rider/{$token}/push", $this->subscription())->assertStatus(503);
    }

    public function test_turning_alerts_off_revokes_only_that_browser(): void
    {
        $this->pushOn();
        $r = $this->rider();
        $token = app(DeliveryService::class)->issueRiderLink($this->tenant->id, $r, $this->owner->id);
        $a = $this->subscription();
        $b = $this->subscription();
        $this->postJson("/rider/{$token}/push", $a)->assertOk();
        $this->postJson("/rider/{$token}/push", $b)->assertOk();

        $this->postJson("/rider/{$token}/push/off", ['endpoint' => $a['endpoint']])->assertOk();

        $this->assertNotNull(DB::table('push_subscriptions')->where('endpoint_hash', hash('sha256', $a['endpoint']))->value('revoked_at'));
        $this->assertNull(DB::table('push_subscriptions')->where('endpoint_hash', hash('sha256', $b['endpoint']))->value('revoked_at'));
    }
}
