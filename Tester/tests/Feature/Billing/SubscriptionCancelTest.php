<?php

namespace Tests\Feature\Billing;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * In-app subscription cancel / resume.
 *
 * The rule these protect: cancelling stops future renewals but must NEVER take
 * away the period the customer already paid for. Lemon Squeezy keeps a
 * cancelled subscription running to `ends_at`, and LemonSqueezyStatus maps
 * `cancelled` → 'active' for exactly that reason.
 */

beforeEach(function () {
    config()->set('services.lemon_squeezy.api_key', 'test-key');
    config()->set('services.lemon_squeezy.store_id', '1');
    Cache::flush();
});

function payingTenant(object $test)
{
    $tenant = $test->createTenant(null, 'business', 'active');
    $test->createTenantUser($tenant, 'owner');
    $tenant->update([
        'lemon_squeezy_subscription_id' => '77001',
        'lemon_squeezy_customer_id'     => '4242',
        'subscription_ends_at'          => now()->addDays(31),
    ]);

    return $tenant->fresh();
}

test('the owner can cancel and keeps access until the paid period ends', function () {
    $endsAt = now()->addDays(31)->startOfSecond();

    Http::fake([
        'api.lemonsqueezy.com/v1/subscriptions/77001' => Http::response([
            'data' => [
                'id'         => '77001',
                'attributes' => [
                    'status'    => 'cancelled',
                    'cancelled' => true,
                    'ends_at'   => $endsAt->toIso8601String(),
                    'renews_at' => $endsAt->toIso8601String(),
                ],
            ],
        ], 200),
    ]);

    $tenant = payingTenant($this);
    $this->actingAsTenantUser($tenant, 'owner');

    $this->post("/s/{$tenant->slug}/billing/cancel-subscription")
        ->assertRedirect()
        ->assertSessionHas('success');

    $tenant->refresh();

    // Access is NOT revoked — they paid for this time.
    expect($tenant->status)->toBe('active');
    expect($tenant->subscription_ends_at->toDateString())->toBe($endsAt->toDateString());

    // Cancellation must reach Lemon Squeezy as a DELETE.
    Http::assertSent(fn ($request) => $request->method() === 'DELETE'
        && str_contains($request->url(), '/subscriptions/77001'));
});

test('cancelling clears the payment-history cache so the tab is not stale', function () {
    Http::fake([
        'api.lemonsqueezy.com/v1/subscriptions/77001' => Http::response([
            'data' => ['id' => '77001', 'attributes' => ['status' => 'cancelled', 'cancelled' => true]],
        ], 200),
    ]);

    $tenant = payingTenant($this);
    Cache::put("billing_history:{$tenant->id}", ['stale' => true], 120);

    $this->actingAsTenantUser($tenant, 'owner');
    $this->post("/s/{$tenant->slug}/billing/cancel-subscription");

    expect(Cache::has("billing_history:{$tenant->id}"))->toBeFalse();
});

test('a non-owner cannot cancel the subscription', function () {
    Http::fake();

    $tenant = payingTenant($this);
    $this->createTenantUser($tenant, 'manager');
    $this->actingAsTenantUser($tenant, 'manager');

    // Cancel/resume are now gated TWICE, and the outer gate answers first:
    //   1. route middleware `permission:admin.billing_store` -> 403
    //   2. BillingController::cancelSubscription()'s owner-only check
    //      -> back()->with('error', ...)
    // A manager holds no billing permission, so the middleware rejects the
    // request before the controller runs and the response is a hard 403 rather
    // than the friendly redirect this test used to expect. 403 is the stricter
    // outcome, so the security property is unchanged — only its shape is.
    $this->post("/s/{$tenant->slug}/billing/cancel-subscription")
        ->assertForbidden();

    // Nothing may reach Lemon Squeezy on a rejected attempt.
    Http::assertNothingSent();

    // And the store must be left exactly as it was. The original test never
    // checked this, so a rejection that still mutated local state would have
    // passed.
    $tenant->refresh();
    expect($tenant->status)->toBe('active');
    expect($tenant->lemon_squeezy_subscription_id)->toBe('77001');
});

test('the controller blocks a non-owner even when the permission gate lets them through', function () {
    // Defence in depth. The middleware is a COARSE gate over a permission an
    // admin can hand out from the staff screen, so it is BillingController's
    // owner-only rule that actually protects the subscription. Without this
    // test, granting one checkbox to a manager would silently hand them the
    // cancel button and nothing in the suite would notice — the test above
    // stops at the middleware and never reaches the controller.
    Http::fake();

    $tenant  = payingTenant($this);
    $manager = $this->createTenantUser($tenant, 'manager');

    // Explicitly grant the billing permission this manager would not normally
    // hold. User::getPermissionsAttribute() prefers a non-empty pivot array
    // over the config/permissions.php role map, so this clears the middleware.
    \App\Models\TenantUser::where('tenant_id', $tenant->id)
        ->where('user_id', $manager->id)
        ->update(['permissions' => json_encode(['admin.billing_store'])]);

    $this->actingAsTenantUserModel($manager, $tenant);

    $this->post("/s/{$tenant->slug}/billing/cancel-subscription")
        ->assertRedirect()
        ->assertSessionHas('error');

    Http::assertNothingSent();

    $tenant->refresh();
    expect($tenant->status)->toBe('active');
    expect($tenant->lemon_squeezy_subscription_id)->toBe('77001');
});

test('a store with no subscription is told there is nothing to cancel', function () {
    Http::fake();

    $tenant = $this->createTenant(null, 'trial', 'trial');
    $this->createTenantUser($tenant, 'owner');
    $this->actingAsTenantUser($tenant, 'owner');

    $this->post("/s/{$tenant->slug}/billing/cancel-subscription")
        ->assertRedirect()
        ->assertSessionHas('error');

    Http::assertNothingSent();
});

test('a Lemon Squeezy failure leaves the subscription untouched', function () {
    Http::fake([
        'api.lemonsqueezy.com/*' => Http::response('server error', 500),
    ]);

    $tenant = payingTenant($this);
    $this->actingAsTenantUser($tenant, 'owner');

    $this->post("/s/{$tenant->slug}/billing/cancel-subscription")
        ->assertRedirect()
        ->assertSessionHas('error');

    // No optimistic local write on a failed cancel.
    expect($tenant->fresh()->status)->toBe('active');
});

test('the owner can resume a cancelled subscription', function () {
    $renewsAt = now()->addDays(31)->startOfSecond();

    Http::fake([
        'api.lemonsqueezy.com/v1/subscriptions/77001' => Http::response([
            'data' => [
                'id'         => '77001',
                'attributes' => ['status' => 'active', 'cancelled' => false, 'renews_at' => $renewsAt->toIso8601String()],
            ],
        ], 200),
    ]);

    $tenant = payingTenant($this);
    $this->actingAsTenantUser($tenant, 'owner');

    $this->post("/s/{$tenant->slug}/billing/resume-subscription")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($tenant->fresh()->status)->toBe('active');

    Http::assertSent(fn ($request) => $request->method() === 'PATCH'
        && data_get($request->data(), 'data.attributes.cancelled') === false);
});
