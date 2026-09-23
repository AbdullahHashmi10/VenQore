<?php

namespace Tests\Feature\Auth;

use App\Models\TenantUser;
use App\Models\User;
use Tests\Feature\VenQoreTestCase;

class PermissionOverrideModeTest extends VenQoreTestCase
{
    public function test_user_inherits_role_permissions_by_default(): void
    {
        $tenant = $this->createTenant();
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->bindTenantContext($tenant, $cashier);

        // Cashier has pos.checkout by role
        $this->assertTrue($cashier->hasPermission('pos.checkout'));
        // Cashier lacks finance.balances by role
        $this->assertFalse($cashier->hasPermission('finance.balances'));
    }

    public function test_user_uses_custom_permissions_when_override_mode_is_custom(): void
    {
        $tenant = $this->createTenant();
        $cashier = $this->createTenantUser($tenant, 'cashier');

        $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $cashier->id)->first();
        $membership->update([
            'permission_override_mode' => 'custom',
            'permissions' => ['finance.balances', 'reports.financial'],
        ]);

        $this->bindTenantContext($tenant, $cashier);

        // Custom permissions granted
        $this->assertTrue($cashier->hasPermission('finance.balances'));
        $this->assertTrue($cashier->hasPermission('reports.financial'));
        // Role permissions NOT in custom list are now revoked
        $this->assertFalse($cashier->hasPermission('pos.checkout'));
    }

    public function test_user_reverts_to_inherited_permissions_when_override_mode_is_inherit(): void
    {
        $tenant = $this->createTenant();
        $cashier = $this->createTenantUser($tenant, 'cashier');

        $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $cashier->id)->first();
        $membership->update([
            'permission_override_mode' => 'inherit',
            'permissions' => ['finance.balances'], // Ignored because mode is inherit
        ]);

        $this->bindTenantContext($tenant, $cashier);

        // Inherited role permissions active
        $this->assertTrue($cashier->hasPermission('pos.checkout'));
        $this->assertFalse($cashier->hasPermission('finance.balances'));
    }

    public function test_custom_mode_with_empty_permissions_revokes_all(): void
    {
        $tenant = $this->createTenant();
        $cashier = $this->createTenantUser($tenant, 'cashier');

        $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $cashier->id)->first();
        $membership->update([
            'permission_override_mode' => 'custom',
            'permissions' => [],
        ]);

        $this->bindTenantContext($tenant, $cashier);

        // All permissions revoked when custom mode has empty array
        $this->assertFalse($cashier->hasPermission('pos.checkout'));
        $this->assertFalse($cashier->hasPermission('inventory.view'));
        $this->assertEmpty($cashier->permissions);
    }

    public function test_legacy_null_override_mode_fallback_behavior(): void
    {
        $tenant = $this->createTenant();
        $cashier = $this->createTenantUser($tenant, 'cashier');

        $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $cashier->id)->first();

        // 1. Null mode with non-empty permissions uses custom array
        $membership->update([
            'permission_override_mode' => null,
            'permissions' => ['reports.summary'],
        ]);
        $this->bindTenantContext($tenant, $cashier);
        $this->assertTrue($cashier->hasPermission('reports.summary'));
        $this->assertFalse($cashier->hasPermission('pos.checkout'));

        // 2. Null mode with empty/null permissions falls back to role default
        $membership->update([
            'permission_override_mode' => null,
            'permissions' => null,
        ]);
        $this->bindTenantContext($tenant, $cashier);
        $this->assertTrue($cashier->hasPermission('pos.checkout'));
        $this->assertFalse($cashier->hasPermission('reports.financial'));
    }

    public function test_owner_retains_full_permissions_regardless_of_mode(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');

        $membership = TenantUser::where('tenant_id', $tenant->id)->where('user_id', $owner->id)->first();
        $membership->update([
            'permission_override_mode' => 'custom',
            'permissions' => [], // Empty custom should still not revoke owner power
        ]);

        $this->bindTenantContext($tenant, $owner);
        $this->assertTrue($owner->hasPermission('finance.balances'));
        $this->assertTrue($owner->hasPermission('pos.checkout'));
    }

    public function test_platform_admin_has_wildcard_permissions(): void
    {
        $admin = User::forceCreate([
            'name' => 'Platform Admin',
            'email' => 'admin.' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'is_platform_admin' => true,
        ]);

        $this->assertTrue($admin->hasPermission('any.arbitrary.permission'));
        $this->assertEquals(['*'], $admin->permissions);
    }

    public function test_tenant_isolation_with_different_override_modes(): void
    {
        $tenant1 = $this->createTenant();
        $tenant2 = $this->createTenant();

        $user = User::create([
            'name' => 'Multi Tenant User',
            'email' => 'multi.' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
        ]);

        // In Tenant 1: Cashier with custom override granting finance.balances
        TenantUser::create([
            'tenant_id' => $tenant1->id,
            'user_id' => $user->id,
            'role' => 'cashier',
            'status' => 'active',
            'permission_override_mode' => 'custom',
            'permissions' => ['finance.balances'],
        ]);

        // In Tenant 2: Cashier with inherit mode and stale permissions
        TenantUser::create([
            'tenant_id' => $tenant2->id,
            'user_id' => $user->id,
            'role' => 'cashier',
            'status' => 'active',
            'permission_override_mode' => 'inherit',
            'permissions' => ['finance.balances'],
        ]);

        // Tenant 1 Context
        $this->bindTenantContext($tenant1, $user);
        $this->assertTrue($user->hasPermission('finance.balances'));
        $this->assertFalse($user->hasPermission('pos.checkout'));

        // Tenant 2 Context
        $this->bindTenantContext($tenant2, $user);
        $this->assertTrue($user->hasPermission('pos.checkout'));
        $this->assertFalse($user->hasPermission('finance.balances'));
    }
}
