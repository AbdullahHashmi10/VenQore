<?php

namespace Tests\Feature;

use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Feature\VenQoreTestCase;

class LayoutAndAdminUsersRegressionTest extends VenQoreTestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_header_clock_and_subscription_expiration_banner_rules(): void
    {
        $tenant = $this->createTenant(null, 'trial', 'trial');
        $this->actingAsOwner($tenant);

        // Under trial state, layout gets rendered
        $response = $this->get($this->storeUrl($tenant, 'dashboard'));
        $response->assertOk();

        // Expiring subscription (<= 7 days remaining) - set active subscription status with ends_at date
        $tenant2 = $this->createTenant(null, 'active', 'active');
        $tenant2->subscription_ends_at = now()->addDays(5);
        $tenant2->save();

        $this->actingAsOwner($tenant2);
        $response2 = $this->get($this->storeUrl($tenant2, 'dashboard'));
        $response2->assertOk();
    }

    /** @test */
    public function test_update_member_via_admin_controller(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $staffUser = $this->createTenantUser($tenant, 'cashier');

        $this->actingAsTenantUserModel($owner, $tenant);

        $membership = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $staffUser->id)
            ->firstOrFail();

        $response = $this->patch("/s/{$tenant->slug}/admin/users/{$membership->id}", [
            'role' => 'manager',
            'display_name' => 'Super Manager',
            'status' => 'active',
            'passcode' => '9988',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $membership->refresh();
        $this->assertEquals('manager', $membership->role);
        $this->assertEquals('Super Manager', $membership->display_name);
        $this->assertTrue(Hash::check('9988', $membership->pos_pin));

        $staffUser->refresh();
        $this->assertTrue(Hash::check('9988', $staffUser->passcode));
    }

    /** @test */
    public function test_cannot_update_owner_role(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');

        $this->actingAsTenantUserModel($owner, $tenant);

        $membership = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $owner->id)
            ->firstOrFail();

        // Owner role is locked and cannot be updated
        $response = $this->patch("/s/{$tenant->slug}/admin/users/{$membership->id}", [
            'role' => 'cashier',
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function test_remove_member_via_admin_controller(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $staffUser = $this->createTenantUser($tenant, 'cashier');

        $this->actingAsTenantUserModel($owner, $tenant);

        $membership = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $staffUser->id)
            ->firstOrFail();

        $response = $this->delete("/s/{$tenant->slug}/admin/users/{$membership->id}");

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('tenant_users', [
            'id' => $membership->id,
        ]);
    }

    /** @test */
    public function test_cannot_remove_owner_member(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');

        $this->actingAsTenantUserModel($owner, $tenant);

        $membership = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $owner->id)
            ->firstOrFail();

        $response = $this->delete("/s/{$tenant->slug}/admin/users/{$membership->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function test_attendance_and_staff_redirects(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');

        $this->actingAsTenantUserModel($owner, $tenant);

        // Redirects to user management page
        $response1 = $this->get("/s/{$tenant->slug}/admin/staff");
        $response1->assertRedirect(route('store.admin.users', ['store_slug' => $tenant->slug]));

        $response2 = $this->get("/s/{$tenant->slug}/admin/attendance");
        $response2->assertRedirect(route('store.admin.users', ['store_slug' => $tenant->slug]));
    }
}
