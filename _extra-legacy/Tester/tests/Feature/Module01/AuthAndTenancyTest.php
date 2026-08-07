<?php

uses(\Tests\Feature\VenQoreTestCase::class);

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

    // /VenQore (GET /) maps directly to SuperAdminController::dashboard, an
    // Inertia render with no redirect step for an authorized superadmin — a
    // 302 here would mean something is wrong (e.g. falling through to a login
    // redirect), not an acceptable alternate success path. FIXED 2026-08-02:
    // previously accepted [200, 302], which could not distinguish "reached the
    // dashboard" from "got redirected away from it".
    $response->assertOk();
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

test('user can log in via POS PIN with valid credentials', function () {
    $tenant = $this->createTenant('pos-pin-store');
    $user = $this->createTenantUser($tenant, 'cashier');

    // Create a hashed PIN for the membership
    $membership = \App\Models\TenantUser::where('tenant_id', $tenant->id)
        ->where('user_id', $user->id)
        ->first();
    $membership->update([
        'pos_pin' => bcrypt('1234'),
    ]);

    // Send a POST request to our newly mapped login/pin endpoint
    $response = $this->post('/login/pin', [
        'store_id' => $tenant->id,
        'pin' => '1234',
    ]);

    // Assert redirection to the store dashboard
    $response->assertRedirect(route('store.dashboard', ['store_slug' => $tenant->slug]));
    $this->assertAuthenticatedAs($user);
});

test('user cannot log in via POS PIN with invalid credentials', function () {
    $tenant = $this->createTenant('pos-pin-store');
    $user = $this->createTenantUser($tenant, 'cashier');

    $membership = \App\Models\TenantUser::where('tenant_id', $tenant->id)
        ->where('user_id', $user->id)
        ->first();
    $membership->update([
        'pos_pin' => bcrypt('1234'),
    ]);

    // Send an invalid PIN request
    $response = $this->post('/login/pin', [
        'store_id' => $tenant->id,
        'pin' => '9999',
    ]);

    $response->assertSessionHasErrors('pin');
    $this->assertGuest();
});

test('session switching regenerates session id and clears store specific session keys', function () {
    $tenantA = $this->createTenant('store-a');
    $tenantB = $this->createTenant('store-b');

    // User is a member of both stores
    $user = $this->createTenantUser($tenantA, 'owner');
    \App\Models\TenantUser::create([
        'tenant_id' => $tenantB->id,
        'user_id' => $user->id,
        'role' => 'owner',
        'status' => 'active',
        'display_name' => $user->name,
        'joined_at' => now(),
    ]);

    $this->actingAs($user);

    // Seed session data for Store A
    session()->put([
        'store_active_cart' => ['item1', 'item2'],
        'register_open_balance' => 500,
        'owner_pulse_authorized_' . $tenantA->id => true,
        'other_global_key' => 'global-value',
    ]);

    $initialSessionId = session()->getId();

    // Trigger store switch middleware by visiting Store B dashboard
    $response = $this->get($this->storeUrl($tenantB, 'dashboard'));

    // Assert that the session ID has changed (regenerated)
    $this->assertNotEquals($initialSessionId, session()->getId());

    // Assert store-specific keys are forgotten/cleared
    $this->assertFalse(session()->has('store_active_cart'));
    $this->assertFalse(session()->has('register_open_balance'));
    $this->assertFalse(session()->has('owner_pulse_authorized_' . $tenantA->id));

    // Assert non-store-specific global session keys are preserved
    $this->assertEquals('global-value', session()->get('other_global_key'));
});
