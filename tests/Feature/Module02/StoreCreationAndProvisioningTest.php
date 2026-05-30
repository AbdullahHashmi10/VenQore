<?php

use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\StoreLicense;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Setting;
use App\Models\BankAccount;
use App\Models\ExpenseCategory;
use App\Models\Account;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Exceptions\PlanLimitException;

test('owner can create store successfully', function () {
    $user = User::factory()->create([
        'last_store_id' => null,
    ]);

    // Set up available store license
    $license = StoreLicense::create([
        'user_id' => $user->id,
        'type'    => 'subscription',
        'status'  => 'available',
        'plan'    => 'starter',
        'source'  => 'lemon_squeezy',
    ]);

    $this->actingAs($user);

    $response = $this->post('/new-store', [
        'name' => 'My Brand New Store',
    ]);

    // Successful creation redirects to hub
    $response->assertRedirect('/hub');

    // Assert Tenant, TenantUser and License are correctly set up
    $tenant = Tenant::where('name', 'My Brand New Store')->first();
    $this->assertNotNull($tenant);
    $this->assertEquals('trial', $tenant->status);

    $membership = TenantUser::where('tenant_id', $tenant->id)
        ->where('user_id', $user->id)
        ->first();
    
    $this->assertNotNull($membership);
    $this->assertEquals('owner', $membership->role);
    $this->assertEquals('active', $membership->status);

    // Refresh license to verify consumption
    $license->refresh();
    $this->assertEquals('consumed', $license->status);
    $this->assertEquals($tenant->id, $license->tenant_id);

    // Verify last_store_id is updated on user
    $user->refresh();
    $this->assertEquals($tenant->id, $user->last_store_id);
});

test('store creation seeds default data', function () {
    $user = User::factory()->create([
        'last_store_id' => null,
    ]);

    StoreLicense::create([
        'user_id' => $user->id,
        'type'    => 'subscription',
        'status'  => 'available',
        'plan'    => 'starter',
        'source'  => 'lemon_squeezy',
    ]);

    $this->actingAs($user);

    $response = $this->post('/new-store', [
        'name' => 'Unified Seeded Store',
    ]);

    $tenant = Tenant::where('name', 'Unified Seeded Store')->first();
    $this->assertNotNull($tenant);

    // Verify seeder counts matching reality:
    // 24 accounts, 9 settings, 1 warehouse, 6 expense categories, 1 bank account
    $this->assertEquals(24, DB::table('accounts')->where('tenant_id', $tenant->id)->count());
    $this->assertEquals(9, DB::table('settings')->where('tenant_id', $tenant->id)->count());
    $this->assertEquals(1, DB::table('warehouses')->where('tenant_id', $tenant->id)->count());
    $this->assertEquals(6, DB::table('expense_categories')->where('tenant_id', $tenant->id)->count());
    $this->assertEquals(1, DB::table('bank_accounts')->where('tenant_id', $tenant->id)->count());
});

test('ltd tier1 blocked after 1 store', function () {
    $user = User::factory()->create([
        'last_store_id' => null,
    ]);

    // Create an AppSumo ltd_1 license for the user
    $appsumoLicense = StoreLicense::create([
        'user_id'          => $user->id,
        'type'             => 'ltd',
        'status'           => 'consumed',
        'plan'             => 'ltd_1',
        'source'           => 'appsumo',
        'source_reference' => 'CODE-1',
    ]);

    // Create 1 existing store owned by this user
    $tenantA = $this->createTenant('ltd-store-a');
    TenantUser::create([
        'tenant_id' => $tenantA->id,
        'user_id'   => $user->id,
        'role'      => 'owner',
        'status'    => 'active',
        'joined_at' => now(),
    ]);
    
    $user->update(['last_store_id' => $tenantA->id]);

    $this->actingAs($user);

    $response = $this->post('/new-store', [
        'name' => 'Blocked Second Store',
    ]);

    // Should redirect back with validation errors
    $response->assertStatus(302);
    $response->assertSessionHasErrors(['name']);
    
    // Message should warn about the limit
    $errors = session('errors')->get('name');
    $this->assertStringContainsString('allows a maximum of 1 store', $errors[0]);
});

test('ltd tier2 blocked after 2 stores', function () {
    $user = User::factory()->create([
        'last_store_id' => null,
    ]);

    // Create an AppSumo ltd_2 license for the user
    $appsumoLicense = StoreLicense::create([
        'user_id'          => $user->id,
        'type'             => 'ltd',
        'status'           => 'consumed',
        'plan'             => 'ltd_2',
        'source'           => 'appsumo',
        'source_reference' => 'CODE-2',
    ]);

    // Create 2 existing stores owned by this user
    $tenantA = $this->createTenant('ltd-store-a');
    TenantUser::create([
        'tenant_id' => $tenantA->id,
        'user_id'   => $user->id,
        'role'      => 'owner',
        'status'    => 'active',
        'joined_at' => now(),
    ]);

    $tenantB = $this->createTenant('ltd-store-b');
    TenantUser::create([
        'tenant_id' => $tenantB->id,
        'user_id'   => $user->id,
        'role'      => 'owner',
        'status'    => 'active',
        'joined_at' => now(),
    ]);

    $user->update(['last_store_id' => $tenantB->id]);

    $this->actingAs($user);

    $response = $this->post('/new-store', [
        'name' => 'Blocked Third Store',
    ]);

    // Should redirect back with validation errors
    $response->assertStatus(302);
    $response->assertSessionHasErrors(['name']);

    $errors = session('errors')->get('name');
    $this->assertStringContainsString('allows a maximum of 2 store', $errors[0]);
});

test('ltd tier3 blocked after 4 stores', function () {
    $user = User::factory()->create([
        'last_store_id' => null,
    ]);

    // Create an AppSumo ltd_3 license for the user
    $appsumoLicense = StoreLicense::create([
        'user_id'          => $user->id,
        'type'             => 'ltd',
        'status'           => 'consumed',
        'plan'             => 'ltd_3',
        'source'           => 'appsumo',
        'source_reference' => 'CODE-3',
    ]);

    // Create 4 existing stores owned by this user
    for ($i = 1; $i <= 4; $i++) {
        $tenant = $this->createTenant("ltd-store-{$i}");
        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
            'joined_at' => now(),
        ]);
        if ($i === 4) {
            $user->update(['last_store_id' => $tenant->id]);
        }
    }

    $this->actingAs($user);

    $response = $this->post('/new-store', [
        'name' => 'Blocked Fifth Store',
    ]);

    // Should redirect back with validation errors
    $response->assertStatus(302);
    $response->assertSessionHasErrors(['name']);

    $errors = session('errors')->get('name');
    $this->assertStringContainsString('allows a maximum of 4 store', $errors[0]);
});

test('store creation does not fail when woocommerce env not set', function () {
    $user = User::factory()->create([
        'last_store_id' => null,
    ]);

    StoreLicense::create([
        'user_id' => $user->id,
        'type'    => 'subscription',
        'status'  => 'available',
        'plan'    => 'starter',
        'source'  => 'lemon_squeezy',
    ]);

    $this->actingAs($user);

    // Make sure WOOCOMMERCE_KEY and other WooCommerce configs are null/unset in config
    config(['services.woocommerce.key' => null]);
    config(['services.woocommerce.secret' => null]);

    $response = $this->post('/new-store', [
        'name' => 'Woo Isolation Store',
    ]);

    $response->assertRedirect('/hub');
    $this->assertTrue(Tenant::where('name', 'Woo Isolation Store')->exists());
});

test('duplicate store name or slug is rejected', function () {
    $user = User::factory()->create([
        'last_store_id' => null,
    ]);

    StoreLicense::create([
        'user_id' => $user->id,
        'type'    => 'subscription',
        'status'  => 'available',
        'plan'    => 'starter',
        'source'  => 'lemon_squeezy',
    ]);

    $this->actingAs($user);

    // First create a tenant with the slug 'duplicate-brand' owned by user
    $existingTenant = Tenant::factory()->create([
        'name' => 'Duplicate Brand',
        'slug' => 'duplicate-brand',
    ]);
    TenantUser::create([
        'tenant_id' => $existingTenant->id,
        'user_id'   => $user->id,
        'role'      => 'owner',
        'status'    => 'active',
        'joined_at' => now(),
    ]);

    // Attempting to create duplicate-named store should be rejected
    $response = $this->post('/new-store', [
        'name' => 'Duplicate Brand',
    ]);

    $response->assertStatus(302);
    $response->assertSessionHasErrors(['name']);
});

test('reserved subdomain is safely sanitized', function () {
    $user = User::factory()->create([
        'last_store_id' => null,
    ]);

    StoreLicense::create([
        'user_id' => $user->id,
        'type'    => 'subscription',
        'status'  => 'available',
        'plan'    => 'starter',
        'source'  => 'lemon_squeezy',
    ]);

    $this->actingAs($user);

    $response = $this->post('/new-store', [
        'name' => 'Admin', // 'admin' is a reserved subdomain
    ]);

    $response->assertRedirect('/hub');

    $tenant = Tenant::where('name', 'Admin')->first();
    $this->assertNotNull($tenant);
    // The slug should not be 'admin' but something sanitized, e.g., 'admin-xxx'
    $this->assertNotEquals('admin', $tenant->slug);
    $this->assertStringStartsWith('admin-', $tenant->slug);
});

test('does not create partial store', function () {
    $user = User::factory()->create([
        'last_store_id' => null,
    ]);

    $license = StoreLicense::create([
        'user_id' => $user->id,
        'type'    => 'subscription',
        'status'  => 'available',
        'plan'    => 'starter',
        'source'  => 'lemon_squeezy',
    ]);

    $this->actingAs($user);

    // Register a creating event on Tenant to force a rollback scenario
    Tenant::creating(function ($tenant) {
        if ($tenant->name === 'FORCED_FAILURE') {
            throw new \Exception('Forced Transaction Failure');
        }
    });

    try {
        $this->post('/new-store', [
            'name' => 'FORCED_FAILURE',
        ]);
    } catch (\Exception $e) {
        $this->assertEquals('Forced Transaction Failure', $e->getMessage());
    }

    // Verify transaction rolled back all rows for the slug
    $this->assertDatabaseMissing('tenants', ['slug' => 'forced-failure']);
    
    // There should be no chart_of_accounts, settings or warehouses for that tenant
    $tenantIdRaw = DB::table('tenants')->where('slug', 'forced-failure')->value('id');
    if ($tenantIdRaw) {
        $this->assertEquals(0, DB::table('accounts')->where('tenant_id', $tenantIdRaw)->count());
        $this->assertEquals(0, DB::table('settings')->where('tenant_id', $tenantIdRaw)->count());
        $this->assertEquals(0, DB::table('warehouses')->where('tenant_id', $tenantIdRaw)->count());
    }

    // Verify license was rolled back and is still available
    $license->refresh();
    $this->assertEquals('available', $license->status);
});

test('woocommerce webhook isolation regression', function () {
    $tenant = $this->createTenant('woo-tenant', 'starter'); // Starter plan has woocommerce => false
    $user = $this->createTenantUser($tenant, 'owner');
    
    $this->actingAs($user);
    $this->bindTenantContext($tenant, $user);

    // Sending orders to WooCommerce webhook on a plan with woocommerce => false
    // should throw PlanLimitException because woocommerce integration is not allowed.
    $this->expectException(PlanLimitException::class);

    // Act
    $controller = app(\App\Http\Controllers\WooCommerceController::class);
    $request = \Illuminate\Http\Request::create('/woocommerce/webhook', 'POST', [
        'id' => 1234,
        'line_items' => []
    ]);

    $controller->webhook($request);
});
