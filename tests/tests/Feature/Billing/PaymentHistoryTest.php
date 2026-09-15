<?php

namespace Tests\Feature\Billing;

uses(\Tests\Feature\VenQoreTestCase::class);

use App\Services\BillingHistoryService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\Feature\VenQoreTestCase;

/**
 * Payment history.
 *
 * The load-bearing logic here is period derivation: Lemon Squeezy does not tell
 * us what span an invoice paid for, so we compute it from the gaps between
 * invoices and the subscription's renewal date. That number is what proves a
 * "30-day plan" actually billed for 30 days, so it gets pinned hard.
 */

beforeEach(function () {
    config()->set('services.lemon_squeezy.api_key', 'test-key');
    config()->set('services.lemon_squeezy.store_id', '1');
    Cache::flush();
});

/**
 * Stub the two endpoints the service calls.
 *
 * @param  array  $invoices  Raw invoice attribute arrays (id + attributes merged).
 */
function fakeLemonSqueezy(array $subAttributes, array $invoices): void
{
    $subscription = [
        'id'         => '99',
        'type'       => 'subscriptions',
        'attributes' => array_merge([
            'user_email'       => 'owner@example.com',
            'status'           => 'active',
            'status_formatted' => 'Active',
            'cancelled'        => false,
            'created_at'       => '2026-06-09T10:00:00.000000Z',
        ], $subAttributes),
    ];

    Http::fake([
        // Listed first: Laravel uses the first matching pattern, and this is the
        // path production actually takes (tenant has a stored subscription ID).
        'api.lemonsqueezy.com/v1/subscriptions/99' => Http::response(['data' => $subscription], 200),

        // Fallback lookup by owner email, used when the local ID is missing.
        'api.lemonsqueezy.com/v1/subscriptions*' => Http::response(['data' => [$subscription]], 200),

        'api.lemonsqueezy.com/v1/subscription-invoices*' => Http::response([
            'data' => array_map(fn ($inv) => [
                'id'         => (string) $inv['id'],
                'type'       => 'subscription-invoices',
                'attributes' => array_merge([
                    'subscription_id'          => '99',
                    'user_email'               => 'owner@example.com',
                    'status'                   => 'paid',
                    'status_formatted'         => 'Paid',
                    'refunded'                 => false,
                    'billing_reason'           => 'renewal',
                    'discount_total'           => 0,
                    'discount_total_formatted' => '$0.00',
                    'subtotal_formatted'       => '$30.00',
                    'total_formatted'          => '$30.00',
                    'total_usd'                => 3000,
                    'currency'                 => 'USD',
                    'urls'                     => ['invoice_url' => 'https://example.test/inv.pdf'],
                ], $inv['attributes']),
            ], $invoices),
        ], 200),
    ]);
}

/** A tenant whose owner email matches the stubbed invoices. */
function tenantWithOwner(object $test)
{
    $tenant = $test->createTenant();
    $test->createTenantUser($tenant, 'owner');
    $tenant->ownerMembership()->first()->user->update(['email' => 'owner@example.com']);
    $tenant->update(['lemon_squeezy_subscription_id' => '99', 'status' => 'active']);

    return $tenant->fresh();
}

test('a single payment covers the span from purchase to the renewal date', function () {
    fakeLemonSqueezy(
        ['renews_at' => '2026-07-09T10:00:00.000000Z', 'ends_at' => null],
        [['id' => 1, 'attributes' => [
            'billing_reason' => 'initial',
            'created_at'     => '2026-06-09T10:00:00.000000Z',
        ]]]
    );

    $history = app(BillingHistoryService::class)->forTenant(tenantWithOwner($this));

    expect($history['invoices'])->toHaveCount(1);

    // June 9 → July 9 is exactly 30 days. This is the assertion that would have
    // caught a monthly variant misconfigured with a fortnightly interval.
    expect($history['invoices'][0]['period_days'])->toBe(30);
    expect($history['invoices'][0]['billing_reason'])->toBe('initial');
});

test('each earlier payment ends where the next one begins', function () {
    fakeLemonSqueezy(
        ['renews_at' => '2026-08-08T10:00:00.000000Z', 'ends_at' => null],
        [
            ['id' => 1, 'attributes' => ['billing_reason' => 'initial', 'created_at' => '2026-06-09T10:00:00.000000Z']],
            ['id' => 2, 'attributes' => ['created_at' => '2026-07-09T10:00:00.000000Z']],
        ]
    );

    $history = app(BillingHistoryService::class)->forTenant(tenantWithOwner($this));

    // Newest first for display.
    expect($history['invoices'][0]['id'])->toBe('2');
    expect($history['invoices'][1]['id'])->toBe('1');

    // Jun 9 → Jul 9 = 30 days; Jul 9 → Aug 8 = 30 days.
    expect($history['invoices'][1]['period_days'])->toBe(30);
    expect($history['invoices'][0]['period_days'])->toBe(30);
});

test('a cancelled subscription reports its grace-period end, not a renewal', function () {
    fakeLemonSqueezy(
        [
            'status'    => 'cancelled',
            'cancelled' => true,
            'renews_at' => '2026-08-08T10:00:00.000000Z',
            'ends_at'   => '2026-07-09T10:00:00.000000Z',
        ],
        [['id' => 1, 'attributes' => ['billing_reason' => 'initial', 'created_at' => '2026-06-09T10:00:00.000000Z']]]
    );

    $history = app(BillingHistoryService::class)->forTenant(tenantWithOwner($this));

    expect($history['subscription']['is_cancelled'])->toBeTrue();
    // ends_at wins over renews_at — that is the date the customer loses access.
    expect($history['subscription']['expires_at'])->toStartWith('2026-07-09');
    expect($history['invoices'][0]['period_days'])->toBe(30);
});

test('an applied trial credit is visible on the invoice', function () {
    fakeLemonSqueezy(
        ['renews_at' => '2026-08-08T10:00:00.000000Z'],
        [['id' => 1, 'attributes' => [
            'billing_reason'           => 'initial',
            'created_at'               => '2026-07-09T10:00:00.000000Z',
            'discount_total'           => 600,
            'discount_total_formatted' => '$6.00',
            'subtotal_formatted'       => '$30.00',
            'total_formatted'          => '$24.00',
            'total_usd'                => 2400,
        ]]]
    );

    $history = app(BillingHistoryService::class)->forTenant(tenantWithOwner($this));

    // This is the end-to-end proof that TrialCreditService reached the invoice.
    expect($history['invoices'][0]['has_discount'])->toBeTrue();
    expect($history['invoices'][0]['discount_total'])->toBe('$6.00');
    expect($history['invoices'][0]['total'])->toBe('$24.00');
    expect($history['lifetime_usd'])->toBe('$24.00');
});

test('another customer invoice can never appear on this store', function () {
    fakeLemonSqueezy(
        ['renews_at' => '2026-08-08T10:00:00.000000Z'],
        [
            ['id' => 1, 'attributes' => ['created_at' => '2026-07-09T10:00:00.000000Z']],
            // Same subscription filter, wrong owner — must be dropped locally.
            ['id' => 2, 'attributes' => ['created_at' => '2026-07-10T10:00:00.000000Z', 'user_email' => 'someone.else@example.com']],
        ]
    );

    $history = app(BillingHistoryService::class)->forTenant(tenantWithOwner($this));

    expect($history['invoices'])->toHaveCount(1);
    expect($history['invoices'][0]['id'])->toBe('1');
});

test('refunded invoices are excluded from the lifetime total', function () {
    fakeLemonSqueezy(
        ['renews_at' => '2026-08-08T10:00:00.000000Z'],
        [
            ['id' => 1, 'attributes' => ['created_at' => '2026-06-09T10:00:00.000000Z']],
            ['id' => 2, 'attributes' => [
                'created_at' => '2026-07-09T10:00:00.000000Z',
                'refunded'   => true,
                'status'     => 'refunded',
            ]],
        ]
    );

    $history = app(BillingHistoryService::class)->forTenant(tenantWithOwner($this));

    expect($history['invoice_count'])->toBe(2);
    // Only the one genuinely-kept payment counts.
    expect($history['lifetime_usd'])->toBe('$30.00');
});

test('a trial store is told it has no payments rather than shown an empty table', function () {
    Http::fake([
        'api.lemonsqueezy.com/v1/subscriptions*' => Http::response(['data' => []], 200),
    ]);

    $tenant = $this->createTenant();
    $this->createTenantUser($tenant, 'owner');

    $history = app(BillingHistoryService::class)->forTenant($tenant->fresh());

    expect($history['invoices'])->toBe([]);
    expect($history['message'])->toContain('free trial');
});

test('an unreachable Lemon Squeezy degrades to a message, not an exception', function () {
    Http::fake([
        'api.lemonsqueezy.com/*' => Http::response('gateway timeout', 504),
    ]);

    $history = app(BillingHistoryService::class)->forTenant(tenantWithOwner($this));

    expect($history['invoices'])->toBe([]);
    expect($history['message'])->not->toBeNull();
});

test('missing credentials produce a clear message and no API calls', function () {
    Http::fake();
    config()->set('services.lemon_squeezy.api_key', null);

    $history = app(BillingHistoryService::class)->forTenant(tenantWithOwner($this));

    expect($history['message'])->toContain('not configured');
    Http::assertNothingSent();
});

test('the endpoint returns history plus the locally stored dates for comparison', function () {
    fakeLemonSqueezy(
        ['renews_at' => '2026-08-08T10:00:00.000000Z'],
        [['id' => 1, 'attributes' => ['created_at' => '2026-07-09T10:00:00.000000Z']]]
    );

    $tenant = tenantWithOwner($this);
    $this->actingAsTenantUser($tenant, 'owner');

    $response = $this->getJson("/s/{$tenant->slug}/billing/payment-history");

    $response->assertOk()
        ->assertJsonStructure([
            'subscription' => ['status', 'expires_at', 'days_until_expiry'],
            'invoices'     => [['paid_at', 'period_days', 'total', 'has_discount']],
            'local'        => ['status', 'subscription_ends_at', 'has_subscription_id'],
        ]);
});
