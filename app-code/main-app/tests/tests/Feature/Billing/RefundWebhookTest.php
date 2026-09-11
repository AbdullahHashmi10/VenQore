<?php

namespace Tests\Feature\Billing;

uses(\Tests\Feature\VenQoreTestCase::class);

use App\Mail\OrderRefundNeedsReviewMail;
use App\Mail\PaymentFailedMail;
use App\Mail\SubscriptionPaymentRefundedMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

/**
 * Section 6 item 2 of docs/security-audit-2026-09-10/OWNER-TODO.md:
 * "Refund events aren't handled. The webhook doesn't process
 * `order_refunded` or refunded subscription payments, so a refunded
 * customer keeps access until the subscription expires."
 *
 * These tests cover the fix: HandleSubscriptionPaymentRefundedJob and
 * HandleOrderRefundedJob, wired into LemonSqueezyWebhookController.
 */

function postWebhook(object $test, array $payload)
{
    config(['services.lemon_squeezy.signing_secret' => 'test_signing_secret']);
    $signature = hash_hmac('sha256', json_encode($payload), 'test_signing_secret');

    return $test->postJson('/api/webhooks/lemon-squeezy', $payload, [
        'X-Signature' => $signature,
    ]);
}

test('a refunded subscription payment suspends the tenant and notifies the admin', function () {
    Mail::fake();

    $tenant = $this->createTenant(null, 'core', 'active');
    $admin  = $this->createTenantUser($tenant, 'platform_admin');
    $tenant->update(['lemon_squeezy_subscription_id' => '77001']);

    DB::table('tenant_plan_overrides')->insert([
        'tenant_id'      => $tenant->id,
        'override_key'   => 'smart_capture',
        'override_value' => '1',
        'reason'         => 'Purchased AI add-on (managed) via Lemon Squeezy',
        'created_at'     => now(),
        'updated_at'     => now(),
    ]);

    $payload = [
        'meta' => ['event_name' => 'subscription_payment_refunded'],
        'data' => [
            'id'         => '999-invoice-id', // the invoice's OWN id — must NOT be used as the subscription id
            'attributes' => [
                'subscription_id'       => '77001',
                'customer_id'           => '4242',
                'refunded'              => true,
                'refunded_amount_usd'   => 9900,
            ],
        ],
    ];

    postWebhook($this, $payload)->assertOk();

    $tenant->refresh();
    expect($tenant->status)->toBe('suspended');

    expect(DB::table('tenant_plan_overrides')
        ->where('tenant_id', $tenant->id)
        ->where('override_key', 'smart_capture')
        ->exists())->toBeFalse();

    Mail::assertSent(SubscriptionPaymentRefundedMail::class, fn ($mail) => $mail->hasTo($admin->email));
});

test('a refund for an unknown subscription is a safe no-op', function () {
    Mail::fake();

    $payload = [
        'meta' => ['event_name' => 'subscription_payment_refunded'],
        'data' => [
            'id'         => 'inv-1',
            'attributes' => ['subscription_id' => 'does-not-exist'],
        ],
    ];

    postWebhook($this, $payload)->assertOk();

    Mail::assertNothingSent();
});

test('refunding an AI top-up order reverses exactly the pages it granted', function () {
    Mail::fake();
    config(['services.lemon_squeezy.ai_topup_addon_id' => '1740650']);

    $tenant = $this->createTenant(null, 'core', 'active');
    $tenant->update(['ai_pages_limit' => 350]);

    $payload = [
        'meta' => ['event_name' => 'order_refunded', 'custom_data' => ['tenant_id' => $tenant->id]],
        'data' => [
            'id'         => 'order-1',
            'attributes' => ['variant_id' => '1740650', 'customer_id' => '4242'],
        ],
    ];

    postWebhook($this, $payload)->assertOk();

    // 350 - 200 (the fixed grant LemonSqueezyCheckoutService::incrementAiPages
    // used for this same variant) = 150.
    expect($tenant->fresh()->ai_pages_limit)->toBe(150);
    Mail::assertNothingSent();
});

test('refunding an AI top-up never takes the limit below zero', function () {
    config(['services.lemon_squeezy.ai_topup_addon_id' => '1740650']);

    $tenant = $this->createTenant(null, 'core', 'active');
    $tenant->update(['ai_pages_limit' => 80]);

    $payload = [
        'meta' => ['event_name' => 'order_refunded', 'custom_data' => ['tenant_id' => $tenant->id]],
        'data' => [
            'id'         => 'order-2',
            'attributes' => ['variant_id' => '1740650', 'customer_id' => '4242'],
        ],
    ];

    postWebhook($this, $payload)->assertOk();

    expect($tenant->fresh()->ai_pages_limit)->toBe(0);
});

test('refunding a BYOK unlock drops the tenant off unlimited AI', function () {
    Mail::fake();
    config(['pricing.add_ons.byok.variant_id' => '1740648']);

    $tenant = $this->createTenant(null, 'core', 'active');
    $tenant->update(['ai_status' => 'byok', 'ai_queries_limit' => 999999, 'ai_pages_limit' => 999999]);

    DB::table('tenant_plan_overrides')->insert([
        'tenant_id'      => $tenant->id,
        'override_key'   => 'smart_capture',
        'override_value' => '1',
        'reason'         => 'Purchased AI add-on (byok) via Lemon Squeezy',
        'created_at'     => now(),
        'updated_at'     => now(),
    ]);

    $payload = [
        'meta' => ['event_name' => 'order_refunded', 'custom_data' => ['tenant_id' => $tenant->id]],
        'data' => [
            'id'         => 'order-3',
            'attributes' => ['variant_id' => '1740648', 'customer_id' => '4242'],
        ],
    ];

    postWebhook($this, $payload)->assertOk();

    $tenant->refresh();
    expect($tenant->ai_status)->not->toBe('byok');
    expect($tenant->ai_queries_limit)->not->toBe(999999);
    expect($tenant->ai_pages_limit)->not->toBe(999999);
    expect(DB::table('tenant_plan_overrides')
        ->where('tenant_id', $tenant->id)
        ->where('override_key', 'smart_capture')
        ->exists())->toBeFalse();

    Mail::assertNothingSent();
});

test('refunding a purchase type with no safe auto-reversal flags it for manual review instead of guessing', function () {
    Mail::fake();
    config(['services.lemon_squeezy.ai_topup_addon_id' => '1740650']);
    config(['pricing.add_ons.byok.variant_id' => '1740648']);

    $tenant = $this->createTenant(null, 'core', 'active');

    // e.g. a lifetime-deal / extra-seat variant — not top-up, not BYOK.
    $payload = [
        'meta' => ['event_name' => 'order_refunded', 'custom_data' => ['tenant_id' => $tenant->id]],
        'data' => [
            'id'         => 'order-4',
            'attributes' => ['variant_id' => '1737679', 'customer_id' => '4242'],
        ],
    ];

    postWebhook($this, $payload)->assertOk();

    // No entitlement was silently mutated.
    expect($tenant->fresh()->status)->toBe('active');

    Mail::assertSent(OrderRefundNeedsReviewMail::class, fn ($mail) => $mail->hasTo(config('mail.notifications.contact')));
});

test('a failed subscription payment now actually finds the tenant and emails the admin', function () {
    // Regression test for the pre-existing bug this fix uncovered:
    // HandlePaymentFailedJob read the Subscription Invoice's own `id`
    // (the invoice id) as the subscription id, so it could never match
    // tenants.lemon_squeezy_subscription_id and the email never sent.
    Mail::fake();

    $tenant = $this->createTenant(null, 'core', 'active');
    $admin  = $this->createTenantUser($tenant, 'platform_admin');
    $tenant->update(['lemon_squeezy_subscription_id' => '77001']);

    $payload = [
        'meta' => ['event_name' => 'subscription_payment_failed'],
        'data' => [
            'id'         => '999-invoice-id',
            'attributes' => ['subscription_id' => '77001', 'customer_id' => '4242'],
        ],
    ];

    postWebhook($this, $payload)->assertOk();

    Mail::assertSent(PaymentFailedMail::class, fn ($mail) => $mail->hasTo($admin->email));
});
