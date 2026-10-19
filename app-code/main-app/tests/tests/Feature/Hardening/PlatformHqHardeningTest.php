<?php

namespace Tests\Feature\Hardening;

use App\Models\Plan;
use App\Models\TenantPlanOverride;
use App\Models\User;
use App\Support\PlatformActionPasscode;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * Hashmi Dashboard audit (2026-10-11): role gate on write routes, working
 * "Remove override" and "Exit impersonation", action passcode on the user,
 * and a dashboard MRR that is not always zero.
 */
class PlatformHqHardeningTest extends VenQoreTestCase
{
    private function platformUser(string $role): User
    {
        return User::factory()->create([
            'is_platform_admin' => true,
            'platform_role'     => $role,
            'last_store_id'     => null,
        ]);
    }

    #[Test]
    public function a_support_agent_cannot_change_a_stores_plan(): void
    {
        $tenant = $this->createTenant(plan: 'starter', status: 'active');

        $this->actingAs($this->platformUser('support_agent'))
            ->patch(route('platform.tenants.overrides.update', ['tenant' => $tenant->id]), ['plan' => 'scale'])
            ->assertForbidden();

        $this->assertSame('starter', $tenant->fresh()->plan);
    }

    #[Test]
    public function a_platform_manager_can_change_a_stores_plan(): void
    {
        $tenant = $this->createTenant(plan: 'starter', status: 'active');

        $this->actingAs($this->platformUser('platform_manager'))
            ->patch(route('platform.tenants.overrides.update', ['tenant' => $tenant->id]), ['plan' => 'scale'])
            ->assertRedirect();

        $this->assertSame('scale', $tenant->fresh()->plan);
    }

    #[Test]
    public function remove_override_deletes_only_this_tenants_override(): void
    {
        $tenant = $this->createTenant(plan: 'starter', status: 'active');
        $other  = $this->createTenant(plan: 'starter', status: 'active');
        $mine = TenantPlanOverride::withoutTenantScope()->create(['tenant_id' => $tenant->id, 'override_key' => 'sku_limit', 'override_value' => '9000']);
        $theirs = TenantPlanOverride::withoutTenantScope()->create(['tenant_id' => $other->id, 'override_key' => 'sku_limit', 'override_value' => '9000']);

        $this->actingAsSuperAdmin()
            ->delete("/VenQore/tenant-overrides/{$tenant->id}/{$theirs->id}")
            ->assertNotFound();

        $this->delete("/VenQore/tenant-overrides/{$tenant->id}/{$mine->id}")->assertRedirect();

        $this->assertNull(TenantPlanOverride::withoutTenantScope()->find($mine->id));
        $this->assertNotNull(TenantPlanOverride::withoutTenantScope()->find($theirs->id));
    }

    #[Test]
    public function the_impersonated_user_can_exit_impersonation(): void
    {
        $admin  = $this->platformUser('platform_owner');
        $tenant = $this->createTenant(plan: 'starter', status: 'active');
        $owner  = $this->createTenantUser($tenant, 'owner');

        $this->actingAs($owner)
            ->withSession(['impersonator_id' => $admin->id, 'impersonating_user_id' => $owner->id])
            ->post('/VenQore/impersonate/end')
            ->assertRedirect(route('platform.dashboard'));

        $this->assertAuthenticatedAs($admin);
    }

    #[Test]
    public function the_action_passcode_lives_on_the_user_and_creates_no_store_membership(): void
    {
        $admin = $this->platformUser('platform_owner');
        $before = \App\Models\TenantUser::where('user_id', $admin->id)->count();

        PlatformActionPasscode::set($admin, '4321');

        $this->assertTrue(PlatformActionPasscode::check($admin->fresh(), '4321'));
        $this->assertFalse(PlatformActionPasscode::check($admin->fresh(), '0000'));
        $this->assertSame($before, \App\Models\TenantUser::where('user_id', $admin->id)->count());
    }

    #[Test]
    public function dashboard_mrr_counts_a_paying_store(): void
    {
        $tenant = $this->createTenant(plan: 'core', status: 'active');
        $tenant->forceFill(['lemon_squeezy_subscription_id' => 'sub_test_' . $tenant->id, 'is_internal' => false, 'is_demo' => false])->save();

        $price = (float) Plan::where('slug', 'core')->value('price_monthly');
        $this->assertGreaterThan(0, $price, 'Core plan should have a monthly price in the test database.');

        $mrr = app(\App\Services\Platform\PlatformRevenueService::class)->couponAdjustedMrr();
        $this->assertGreaterThanOrEqual($price, $mrr);
    }
}
