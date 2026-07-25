<?php

namespace Tests\Feature\Billing;

use App\Jobs\ProvisionTenantJob;
use App\Services\LemonSqueezyStatus;

/**
 * Status mapping.
 *
 * The regression these lock down: a Lemon Squeezy variant with a free-trial
 * period opens its subscription as `on_trial` and bills $0. Provisioning used
 * to record that store as 'active', i.e. a paying customer, which then hid
 * every payment control on the billing page — including the Pay Now button and
 * the "Already Paid?" re-sync that would have repaired the row.
 *
 * `on_trial` must never map to 'active'.
 */

test('on_trial never maps to active', function () {
    expect(LemonSqueezyStatus::toTenantStatus('on_trial'))->toBe('trial');
    expect(LemonSqueezyStatus::isPaying('on_trial'))->toBeFalse();
});

test('statuses that should keep a store working map to active', function () {
    expect(LemonSqueezyStatus::toTenantStatus('active'))->toBe('active');

    // Dunning retries — do not lock the customer out mid-retry.
    expect(LemonSqueezyStatus::toTenantStatus('past_due'))->toBe('active');

    // Cancelled but paid through to the end of the term.
    expect(LemonSqueezyStatus::toTenantStatus('cancelled'))->toBe('active');
});

test('dead statuses suspend the store', function () {
    expect(LemonSqueezyStatus::toTenantStatus('expired'))->toBe('suspended');
    expect(LemonSqueezyStatus::toTenantStatus('paused'))->toBe('suspended');
    expect(LemonSqueezyStatus::toTenantStatus('unpaid'))->toBe('suspended');
});

test('an unknown status never downgrades the store', function () {
    // A status Lemon Squeezy adds later must not silently suspend anyone.
    expect(LemonSqueezyStatus::toTenantStatus('something_new', 'active'))->toBe('active');
    expect(LemonSqueezyStatus::toTenantStatus(null, 'trial'))->toBe('trial');
});

test('only real charges count as paying', function () {
    expect(LemonSqueezyStatus::isPaying('active'))->toBeTrue();
    expect(LemonSqueezyStatus::isPaying('past_due'))->toBeTrue();
    expect(LemonSqueezyStatus::isPaying('cancelled'))->toBeTrue();

    expect(LemonSqueezyStatus::isPaying('on_trial'))->toBeFalse();
    expect(LemonSqueezyStatus::isPaying('expired'))->toBeFalse();
    expect(LemonSqueezyStatus::isPaying(null))->toBeFalse();
});

test('a trialling checkout provisions the store as trial, not active', function () {
    $tenant = $this->createTenant(null, 'starter', 'trial');
    $this->createTenantUser($tenant, 'owner');

    ProvisionTenantJob::dispatchSync([
        'meta' => [
            'event_name'  => 'subscription_created',
            'custom_data' => ['tenant_id' => (string) $tenant->id],
        ],
        'data' => [
            'id'         => '555001',
            'type'       => 'subscriptions',
            'attributes' => [
                'user_email'      => $tenant->ownerEmail(),
                'variant_id'      => config('services.lemon_squeezy.business_variant_id'),
                'subscription_id' => '555001',
                // The variant carries a free trial, so Lemon Squeezy has taken
                // a card but charged nothing.
                'status'          => 'on_trial',
            ],
        ],
    ]);

    $tenant->refresh();

    // Plan upgrades (they picked Business), but they are NOT a paying customer.
    expect($tenant->plan)->toBe('business');
    expect($tenant->status)->toBe('trial');
    expect($tenant->lemon_squeezy_subscription_id)->toBe('555001');
});

test('a genuinely paid checkout provisions the store as active', function () {
    $tenant = $this->createTenant(null, 'starter', 'trial');
    $this->createTenantUser($tenant, 'owner');

    ProvisionTenantJob::dispatchSync([
        'meta' => [
            'event_name'  => 'subscription_created',
            'custom_data' => ['tenant_id' => (string) $tenant->id],
        ],
        'data' => [
            'id'         => '555002',
            'type'       => 'subscriptions',
            'attributes' => [
                'user_email'      => $tenant->ownerEmail(),
                'variant_id'      => config('services.lemon_squeezy.business_variant_id'),
                'subscription_id' => '555002',
                'status'          => 'active',
            ],
        ],
    ]);

    expect($tenant->fresh()->status)->toBe('active');
});
