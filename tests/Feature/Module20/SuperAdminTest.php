<?php

namespace Tests\Feature\Module20;

use Tests\Feature\VenQoreTestCase;
use App\Models\Tenant;
use App\Models\User;

beforeEach(function () {
    $this->tenant = $this->createTenant('store-super');
    $this->seedTenantDefaults($this->tenant);
});

test('super_admin_can_list_all_tenants', function () {
    $this->actingAsSuperAdmin();

    $response = $this->get('/superadmin/tenants');
    $response->assertStatus(200);

    // Assert that the tenant we created is listed in the Inertia page
    $page = $response->viewData('page');
    $tenantsData = collect(data_get($page, 'props.tenants.data'));
    $this->assertTrue($tenantsData->contains('subdomain', $this->tenant->slug));
});

test('super_admin_can_suspend_tenant', function () {
    $this->actingAsSuperAdmin();

    $response = $this->post("/superadmin/tenants/{$this->tenant->id}/suspend");
    $response->assertStatus(302); // Redirects back

    $this->tenant->refresh();
    $this->assertEquals('suspended', $this->tenant->status);
});

test('super_admin_can_upgrade_tenant_plan', function () {
    $this->actingAsSuperAdmin();

    $response = $this->post("/superadmin/tenants/{$this->tenant->id}/upgrade", [
        'plan' => 'business'
    ]);
    $response->assertStatus(302); // Redirects back

    $this->tenant->refresh();
    $this->assertEquals('business', $this->tenant->plan);
});

test('non_admin_cannot_access_platform_dashboard', function () {
    // Authenticate as a normal tenant user (non-admin)
    $normalUser = $this->createTenantUser($this->tenant, 'cashier');
    $this->actingAs($normalUser);

    $response = $this->get('/superadmin/dashboard');
    // Aborted with 404 in SuperAdminMiddleware
    $response->assertStatus(404);
});
