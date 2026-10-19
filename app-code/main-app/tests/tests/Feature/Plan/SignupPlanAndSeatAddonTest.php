<?php

use App\Models\StoreLicense;
use App\Models\Tenant;
use App\Models\TenantPlanOverride;
use App\Models\User;
use App\Services\PlanRepository;
use App\Services\SeatAllocationService;
use App\Services\StoreProvisioner;
use Tests\Feature\VenQoreTestCase;

uses(VenQoreTestCase::class);

/*
 * Live-customer regressions (2026-10-18):
 *  1. The plan picked at signup was saved only as billing intent; the store
 *     ran on the trial/Starter limits instead.
 *  2. Admin seat add-ons (staff_limit / pos_staff_limit overrides) never
 *     reached the Users page, which read seat_capacity.full / .pos — keys the
 *     server did not send — and so always showed "0 remaining".
 */

test('the plan chosen at signup is the plan the new store runs on', function () {
    $user = User::factory()->create(['last_store_id' => null]);

    $tenant = app(StoreProvisioner::class)->create($user, [
        'name' => 'Core Signup Store',
        'plan' => 'core',
        'setup_completed' => true,
    ]);

    $tenant = Tenant::withoutGlobalScopes()->find($tenant->id);
    expect($tenant->plan)->toBe('core')
        ->and($tenant->status)->toBe('trial')                       // still unpaid
        ->and($tenant->plan_limits['billing_intent']['plan'])->toBe('core');

    $coreStaff = PlanRepository::getLimits('core')['staff_limit'] ?? null;
    expect($tenant->getLimit('staff_limit'))->toBe($coreStaff === null ? null : (int) $coreStaff);

    $license = StoreLicense::withoutTenantScope()->where('tenant_id', $tenant->id)->first();
    expect($license->plan)->toBe('core')->and($license->type)->toBe('trial');
});

test('signup with no plan chosen still starts on the trial plan', function () {
    $user = User::factory()->create(['last_store_id' => null]);

    $tenant = app(StoreProvisioner::class)->create($user, ['name' => 'Decide Later Store']);

    expect(Tenant::withoutGlobalScopes()->find($tenant->id)->plan)->toBe('trial');
});

test('admin seat add-ons with and without an end date reach the Users page seat counts', function () {
    $user = User::factory()->create(['last_store_id' => null]);
    $tenant = app(StoreProvisioner::class)->create($user, ['name' => 'Seat Addon Store', 'plan' => 'starter']);
    $tenant = Tenant::withoutGlobalScopes()->find($tenant->id);
    app()->instance('current.tenant', $tenant);

    // Warm the caches first so the test proves they are cleared.
    SeatAllocationService::getUsageSummary($tenant);

    foreach ([
        ['staff_limit', 'add-on: extra_seat x1', '2030-12-31 23:59:59'],
        ['pos_staff_limit', 'add-on: extra_pos_seat x1', null],
    ] as [$key, $reason, $expires]) {
        TenantPlanOverride::withoutTenantScope()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'override_key' => $key],
            ['override_value' => '2', 'original_value' => '1', 'reason' => $reason, 'expires_at' => $expires]
        );
    }
    PlanRepository::invalidateTenantCache($tenant->id);

    $summary = SeatAllocationService::getUsageSummary($tenant);

    // Owner holds one full seat: 2 total → 1 left.
    expect($summary['full']['total'])->toBe(2)
        ->and($summary['full']['active'])->toBe(1)
        ->and($summary['full']['available'])->toBe(1)
        ->and($summary['full']['is_at_capacity'])->toBeFalse();

    expect($summary['pos']['total'])->toBe(2);
    if ($summary['pos_seats']['is_pos_enabled']) {
        expect($summary['pos']['available'])->toBe(2);
    }

    // Enforcement agrees with what the page shows.
    SeatAllocationService::enforceCanAllocate($tenant, SeatAllocationService::TYPE_FULL);
});

test('a store on each plan gets that plan\'s full and POS seats, and invites stop at the limit', function (string $plan) {
    $user = User::factory()->create(['last_store_id' => null]);
    $tenant = app(StoreProvisioner::class)->create($user, ['name' => ucfirst($plan) . ' Seats Store', 'plan' => $plan]);
    $tenant = Tenant::withoutGlobalScopes()->find($tenant->id);
    app()->instance('current.tenant', $tenant);
    expect($tenant->plan)->toBe($plan)->and($tenant->status)->toBe('trial');

    $limits = PlanRepository::getLimits($plan);
    $full = (int) $limits['staff_limit'];
    $pos = (int) $limits['pos_staff_limit'];

    $summary = SeatAllocationService::getUsageSummary($tenant);
    expect($summary['full']['total'])->toBe($full)
        ->and($summary['full']['available'])->toBe($full - 1)   // owner holds one
        ->and($summary['pos']['total'])->toBe($pos);

    // Fill every remaining full seat with invitations; the next one is refused.
    for ($i = 1; $i < $full; $i++) {
        SeatAllocationService::enforceCanAllocate($tenant, SeatAllocationService::TYPE_FULL);
        \App\Models\StaffInvitation::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id, 'invitee_email' => "staff{$i}@example.test",
            'membership_type' => 'full', 'status' => 'pending', 'token' => \Illuminate\Support\Str::random(40),
            'expires_at' => now()->addDays(7), 'invited_by' => $user->id,
        ]);
    }
    expect(SeatAllocationService::getUsageSummary($tenant)['full']['available'])->toBe(0);
    expect(fn () => SeatAllocationService::enforceCanAllocate($tenant, SeatAllocationService::TYPE_FULL))
        ->toThrow(Exception::class);
})->with(['starter', 'core', 'scale']);

test('an expired seat add-on no longer counts', function () {
    $user = User::factory()->create(['last_store_id' => null]);
    $tenant = app(StoreProvisioner::class)->create($user, ['name' => 'Expired Addon Store', 'plan' => 'starter']);
    $tenant = Tenant::withoutGlobalScopes()->find($tenant->id);
    app()->instance('current.tenant', $tenant);

    TenantPlanOverride::withoutTenantScope()->create([
        'tenant_id' => $tenant->id, 'override_key' => 'staff_limit', 'override_value' => '9',
        'original_value' => '1', 'reason' => 'add-on: extra_seat x8', 'expires_at' => now()->subDay(),
    ]);
    PlanRepository::invalidateTenantCache($tenant->id);

    expect(SeatAllocationService::getUsageSummary($tenant)['full']['total'])->not->toBe(9);
});
