<?php

namespace Tests\Feature\Auth;

use App\Models\TenantUser;
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
}
