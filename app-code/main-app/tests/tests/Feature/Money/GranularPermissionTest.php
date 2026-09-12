<?php

namespace Tests\Feature\Money;

use App\Models\Tenant;
use Tests\Feature\VenQoreTestCase;

class GranularPermissionTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    /**
     * Test manager role permissions:
     * - hitting force-delete route -> 403
     * - hitting export route -> allowed (not 403)
     */
    public function test_manager_access_restrictions()
    {
        $tenant = $this->createTenant('manager-perm', 'ltd_3');
        $this->seedTenantDefaults($tenant);
        $this->actingAsTenantUser($tenant, 'manager');

        // force-delete -> 403
        $responseDelete = $this->delete($this->storeUrl($tenant, 'admin/recycle-bin/999/force-delete'));
        $responseDelete->assertStatus(403);

        // reports export -> allowed (returns 200 or validation redirect, but NOT 403)
        $responseExport = $this->get($this->storeUrl($tenant, 'v3/reports/export?report=sales&format=json'));
        $this->assertNotEquals(403, $responseExport->status());
    }

    /**
     * Test cashier role (WITHOUT data.export) hitting export -> 403
     */
    public function test_cashier_export_blocked()
    {
        $tenant = $this->createTenant('cashier-perm', 'ltd_3');
        $this->seedTenantDefaults($tenant);
        $this->actingAsTenantUser($tenant, 'cashier');

        // export -> 403
        $responseExport = $this->get($this->storeUrl($tenant, 'v3/reports/export?report=sales&format=json'));
        $responseExport->assertStatus(403);
    }

    /**
     * Test role WITHOUT users.manage hitting staff-management -> 403
     */
    public function test_accountant_staff_blocked()
    {
        $tenant = $this->createTenant('acct-perm', 'ltd_3');
        $this->seedTenantDefaults($tenant);
        $this->actingAsTenantUser($tenant, 'accountant');

        // staff list -> 403
        $responseStaff = $this->get($this->storeUrl($tenant, 'staff'));
        $responseStaff->assertStatus(403);
    }

    /**
     * Test owner role can access all three (no 403)
     */
    public function test_owner_has_all_granular_permissions()
    {
        $tenant = $this->createTenant('owner-perm', 'ltd_3');
        $this->seedTenantDefaults($tenant);
        $this->actingAsOwner($tenant);

        // staff list -> allowed (not 403)
        $responseStaff = $this->get($this->storeUrl($tenant, 'staff'));
        $this->assertNotEquals(403, $responseStaff->status());

        // reports export -> allowed (not 403)
        $responseExport = $this->get($this->storeUrl($tenant, 'v3/reports/export?report=sales&format=json'));
        $this->assertNotEquals(403, $responseExport->status());

        // force-delete -> allowed (hits controller and fails with 404/redirect, but not 403)
        $responseDelete = $this->delete($this->storeUrl($tenant, 'admin/recycle-bin/999/force-delete'));
        $this->assertNotEquals(403, $responseDelete->status());
    }
}
