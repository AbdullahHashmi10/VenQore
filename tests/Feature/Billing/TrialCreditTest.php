<?php

namespace Tests\Feature\Billing;

use App\Services\TrialCreditService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\Feature\VenQoreTestCase;

/**
 * Trial credit — "pay early, keep your free days".
 *
 * The money-sensitive part of this feature is the percentage: it decides how
 * much of the first invoice we give away. These tests pin the arithmetic at the
 * boundaries (no days left, whole trial left, over-long trial, annual cycle)
 * and prove we never mint a discount when the tenant is not owed one.
 */

beforeEach(function () {
    config()->set('services.lemon_squeezy.api_key', 'test-key');
    config()->set('services.lemon_squeezy.store_id', '1');
    Cache::flush();
});

/** Stub the discount endpoint so no test ever calls Lemon Squeezy for real. */
function fakeDiscountApi(string $code = 'TRIALCREDITABC12345'): void
{
    Http::fake([
        'api.lemonsqueezy.com/v1/discounts' => Http::response([
            'data' => ['attributes' => ['code' => $code]],
        ], 201),
    ]);
}

test('unused trial days become a proportional percentage of the first payment', function () {
    $service = app(TrialCreditService::class);

    // 6 of 30 nominal days = 20%.
    expect($service->creditPercent(6))->toBe(20);
    // 15 days = half a month.
    expect($service->creditPercent(15))->toBe(50);
    // 1 day rounds to the nearest whole percent (3.33% → 3%).
    expect($service->creditPercent(1))->toBe(3);
});

test('no days remaining means no credit', function () {
    $service = app(TrialCreditService::class);

    expect($service->creditPercent(0))->toBe(0);
    expect($service->creditPercent(-5))->toBe(0);
});

test('credit is capped so the charge never falls below the Lemon Squeezy minimum', function () {
    $service = app(TrialCreditService::class);

    // A mis-set trial end date must not be able to hand out a free month.
    expect($service->creditPercent(30))->toBe(95);
    expect($service->creditPercent(900))->toBe(95);
});

test('annual plans prorate against the year, not the month', function () {
    $service = app(TrialCreditService::class);

    // 6 days of 365 is a much smaller share of an annual invoice.
    expect($service->creditPercent(6, true))->toBe(2);
    expect($service->creditPercent(180, true))->toBe(49);
});

test('days remaining is read from the tenant trial and rounded up', function () {
    $tenant = $this->createTenant();
    $tenant->update(['status' => 'trial', 'trial_ends_at' => now()->addDays(6)->addHours(3)]);

    // 6 days and 3 hours left → the part-day counts in the customer's favour.
    expect(app(TrialCreditService::class)->daysRemaining($tenant->fresh()))->toBe(7);
});

test('an expired trial earns nothing', function () {
    $tenant = $this->createTenant();
    $tenant->update(['status' => 'trial', 'trial_ends_at' => now()->subDay()]);

    $service = app(TrialCreditService::class);

    expect($service->daysRemaining($tenant->fresh()))->toBe(0);
    expect($service->summaryFor($tenant->fresh()))->toBeNull();
});

test('a paying tenant earns nothing even if a stale trial date lingers', function () {
    $tenant = $this->createTenant();

    // The exact shape of the bug this feature must not resurrect: status is
    // already active, but trial_ends_at still points at a future date.
    $tenant->update(['status' => 'active', 'trial_ends_at' => now()->addDays(9)]);

    $service = app(TrialCreditService::class);

    expect($service->daysRemaining($tenant->fresh()))->toBe(0);
    expect($service->summaryFor($tenant->fresh()))->toBeNull();
    expect($service->codeFor($tenant->fresh(), '123'))->toBeNull();
});

test('summary exposes both cycles so the UI never recomputes the percentage', function () {
    $tenant = $this->createTenant();
    $tenant->update(['status' => 'trial', 'trial_ends_at' => now()->addDays(10)]);

    $summary = app(TrialCreditService::class)->summaryFor($tenant->fresh());

    expect($summary)->not->toBeNull();
    expect($summary['days_remaining'])->toBe(10);
    expect($summary['percent_monthly'])->toBe(33);
    expect($summary['percent_annual'])->toBe(3);
});

test('the generated discount is single-use, first-payment-only and variant-locked', function () {
    fakeDiscountApi();

    $tenant = $this->createTenant();
    $tenant->update(['status' => 'trial', 'trial_ends_at' => now()->addDays(6)]);

    $credit = app(TrialCreditService::class)->codeFor($tenant->fresh(), '456');

    expect($credit['code'])->toBe('TRIALCREDITABC12345');
    expect($credit['percent'])->toBe(20);

    Http::assertSent(function ($request) {
        $attributes = $request->data()['data']['attributes'];
        $variants   = $request->data()['data']['relationships']['variants']['data'];

        return $attributes['amount'] === 20
            && $attributes['amount_type'] === 'percent'
            // "once" is what keeps renewals at full price.
            && $attributes['duration'] === 'once'
            && $attributes['is_limited_redemptions'] === true
            && $attributes['max_redemptions'] === 1
            && $attributes['is_limited_to_products'] === true
            && $variants[0]['id'] === '456'
            && !empty($attributes['expires_at']);
    });
});

test('repeat clicks reuse one code instead of minting a new discount each time', function () {
    fakeDiscountApi();

    $tenant = $this->createTenant();
    $tenant->update(['status' => 'trial', 'trial_ends_at' => now()->addDays(6)]);

    $service = app(TrialCreditService::class);

    $first  = $service->codeFor($tenant->fresh(), '456');
    $second = $service->codeFor($tenant->fresh(), '456');

    expect($second['code'])->toBe($first['code']);
    Http::assertSentCount(1);
});

test('no credit is issued without Lemon Squeezy credentials', function () {
    Http::fake();
    config()->set('services.lemon_squeezy.api_key', null);

    $tenant = $this->createTenant();
    $tenant->update(['status' => 'trial', 'trial_ends_at' => now()->addDays(6)]);

    expect(app(TrialCreditService::class)->codeFor($tenant->fresh(), '456'))->toBeNull();
    Http::assertNothingSent();
});

test('a failed discount call degrades to full price rather than breaking checkout', function () {
    Http::fake([
        'api.lemonsqueezy.com/v1/discounts' => Http::response(['errors' => [['detail' => 'nope']]], 422),
    ]);

    $tenant = $this->createTenant();
    $tenant->update(['status' => 'trial', 'trial_ends_at' => now()->addDays(6)]);

    expect(app(TrialCreditService::class)->codeFor($tenant->fresh(), '456'))->toBeNull();
});
