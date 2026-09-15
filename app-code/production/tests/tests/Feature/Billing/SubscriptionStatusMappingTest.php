<?php

namespace Tests\Feature\Billing;

use App\Jobs\ProvisionTenantJob;
use App\Services\LemonSqueezyStatus;
use Tests\Feature\VenQoreTestCase;

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
class SubscriptionStatusMappingTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['services.lemon_squeezy.business_variant_id' => '999999']);
    }

    public function test_on_trial_never_maps_to_active(): void
    {
        $this->assertEquals('trial', LemonSqueezyStatus::toTenantStatus('on_trial'));
        $this->assertFalse(LemonSqueezyStatus::isPaying('on_trial'));
    }

    public function test_statuses_that_should_keep_a_store_working_map_to_active(): void
    {
        $this->assertEquals('active', LemonSqueezyStatus::toTenantStatus('active'));

        // Dunning retries — do not lock the customer out mid-retry.
        $this->assertEquals('active', LemonSqueezyStatus::toTenantStatus('past_due'));

        // Cancelled but paid through to the end of the term.
        $this->assertEquals('active', LemonSqueezyStatus::toTenantStatus('cancelled'));
    }

    public function test_dead_statuses_suspend_the_store(): void
    {
        $this->assertEquals('suspended', LemonSqueezyStatus::toTenantStatus('expired'));
        $this->assertEquals('suspended', LemonSqueezyStatus::toTenantStatus('paused'));
        $this->assertEquals('suspended', LemonSqueezyStatus::toTenantStatus('unpaid'));
    }

    public function test_an_unknown_status_never_downgrades_the_store(): void
    {
        // A status Lemon Squeezy adds later must not silently suspend anyone.
        $this->assertEquals('active', LemonSqueezyStatus::toTenantStatus('something_new', 'active'));
        $this->assertEquals('trial', LemonSqueezyStatus::toTenantStatus(null, 'trial'));
    }

    public function test_only_real_charges_count_as_paying(): void
    {
        $this->assertTrue(LemonSqueezyStatus::isPaying('active'));
        $this->assertTrue(LemonSqueezyStatus::isPaying('past_due'));
        $this->assertTrue(LemonSqueezyStatus::isPaying('cancelled'));

        $this->assertFalse(LemonSqueezyStatus::isPaying('on_trial'));
        $this->assertFalse(LemonSqueezyStatus::isPaying('expired'));
        $this->assertFalse(LemonSqueezyStatus::isPaying(null));
    }

    public function test_a_trialling_checkout_provisions_the_store_as_trial_not_active(): void
    {
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

        // Plan upgrades (they picked Business/Scale), but they are NOT a paying customer.
        $this->assertEquals('scale', $tenant->plan);
        $this->assertEquals('trial', $tenant->status);
        $this->assertEquals('555001', $tenant->lemon_squeezy_subscription_id);
    }

    public function test_a_genuinely_paid_checkout_provisions_the_store_as_active(): void
    {
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

        $this->assertEquals('active', $tenant->fresh()->status);
    }
}

