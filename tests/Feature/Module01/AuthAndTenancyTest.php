<?php

use App\Models\User;
use App\Models\Tenant;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Party;
use Illuminate\Support\Facades\Auth;

test('user can login with correct credentials', function () {
    $user = User::factory()->create([
        'password' => bcrypt($password = 'password123'),
    ]);

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => $password,
    ]);

    $this->assertAuthenticated();
});

test('user cannot login with wrong credentials', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('tenant a cannot see tenant b products', function () {
    $tenantA = $this->createTenant('tenant-a');
    $tenantB = $this->createTenant('tenant-b');

    // Create product in tenant A
    $this->bindTenantContext($tenantA);
    $productA = Product::factory()->create([
        'name' => 'Product A',
        'tenant_id' => $tenantA->id
    ]);

    // Create product in tenant B
    $this->bindTenantContext($tenantB);
    $productB = Product::factory()->create([
        'name' => 'Product B',
        'tenant_id' => $tenantB->id
    ]);

    // Test cross-tenant visibility check (using our base helper assertion)
    $this->assertNoCrossTenantLeak(Product::class, $tenantA, $tenantB);
    $this->assertNoCrossTenantLeak(Product::class, $tenantB, $tenantA);
});

test('tenant a cannot see tenant b sales', function () {
    $tenantA = $this->createTenant('tenant-a');
    $tenantB = $this->createTenant('tenant-b');

    // Create sale in tenant A
    $this->bindTenantContext($tenantA);
    $saleA = Sale::factory()->create([
        'reference_number' => 'INV-A',
        'tenant_id' => $tenantA->id
    ]);

    // Create sale in tenant B
    $this->bindTenantContext($tenantB);
    $saleB = Sale::factory()->create([
        'reference_number' => 'INV-B',
        'tenant_id' => $tenantB->id
    ]);

    $this->assertNoCrossTenantLeak(Sale::class, $tenantA, $tenantB);
    $this->assertNoCrossTenantLeak(Sale::class, $tenantB, $tenantA);
});

test('tenant a cannot see tenant b parties', function () {
    $tenantA = $this->createTenant('tenant-a');
    $tenantB = $this->createTenant('tenant-b');

    // Create party in tenant A
    $this->bindTenantContext($tenantA);
    $partyA = Party::factory()->create([
        'name' => 'Party A',
        'tenant_id' => $tenantA->id
    ]);

    // Create party in tenant B
    $this->bindTenantContext($tenantB);
    $partyB = Party::factory()->create([
        'name' => 'Party B',
        'tenant_id' => $tenantB->id
    ]);

    $this->assertNoCrossTenantLeak(Party::class, $tenantA, $tenantB);
    $this->assertNoCrossTenantLeak(Party::class, $tenantB, $tenantA);
});

test('suspended tenant gets StoreSuspended page', function () {
    $tenant = $this->createTenant('tenant-suspended', 'trial', 'suspended');
    
    // We make an authenticated request as owner to this tenant
    $user = $this->createTenantUser($tenant, 'owner');
    $this->actingAs($user);
    
    $response = $this->get($this->storeUrl($tenant, 'pos'));
    
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page->component('Errors/StoreSuspended'));
});

test('cashier cannot access admin expenses route', function () {
    $tenant = $this->createTenant('tenant-test');
    
    $user = $this->createTenantUser($tenant, 'cashier');
    $this->actingAs($user);
    
    // expenses require finance permission which cashier lacks
    $response = $this->get($this->storeUrl($tenant, 'expenses'));
    
    $response->assertStatus(403);
});

test('superadmin can access venqore routes', function () {
    $this->actingAsSuperAdmin();
    
    $response = $this->get('/VenQore');
    
    // Should be allowed and return either 200 or 302 (redirect inside controller)
    $this->assertTrue(in_array($response->status(), [200, 302]));
});

test('regular user cannot access venqore routes', function () {
    $tenant = $this->createTenant('tenant-test');
    $user = $this->createTenantUser($tenant, 'owner');
    $this->actingAs($user);
    
    $response = $this->get('/VenQore');
    
    $response->assertStatus(404);
});

test('guest cannot access venqore routes', function () {
    $response = $this->get('/VenQore');
    
    $response->assertStatus(404);
});
