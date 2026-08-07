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
use App\Jobs\WooSync\ProcessWebhookJob;
use Tests\Feature\VenQoreTestCase;

uses(VenQoreTestCase::class);

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
        'terms_consent' => true,
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
        'terms_consent' => true,
    ]);

    $tenant = Tenant::where('name', 'Unified Seeded Store')->first();
    $this->assertNotNull($tenant);

    // Counts are derived from TenantDefaultSeeder's own source rather than
    // hardcoded, so this test can't silently go stale again the way it did
    // when 1205 (Marketplace Clearing) and 5410 (Marketplace Fee Variance)
    // were added to the chart of accounts (27 -> 29) without this assertion
    // being updated — see LAUNCH_VERIFICATION_AUDIT_2026-08-02.md item D2.
    // Expense categories and settings are still asserted as fixed counts:
    // those lists are short, hand-maintained, and change far less often, so
    // a hardcoded number pulling double duty as documentation is more useful
    // there than a reflection-derived count would be.
    // Count actual account DEFINITION rows only (['code' => '1234', 'name' => ...])
    // — a naive substr_count("'code' =>") also matches the updateOrInsert() WHERE
    // clause further down the same method (['tenant_id' => ..., 'code' =>
    // $account['code']]), which would silently inflate this by one. Matching on
    // the literal numeric-code array shape avoids that.
    $seederSource = file_get_contents(
        (new \ReflectionClass(\Database\Seeders\TenantDefaultSeeder::class))->getFileName()
    );
    $expectedAccountCount = preg_match_all(
        "/\['code'\s*=>\s*'\d+'/",
        $seederSource
    );

    $this->assertEquals($expectedAccountCount, DB::table('accounts')->where('tenant_id', $tenant->id)->count());
    $this->assertEquals(9, DB::table('settings')->where('tenant_id', $tenant->id)->count());
    $this->assertEquals(1, DB::table('warehouses')->where('tenant_id', $tenant->id)->count());
    $this->assertEquals(6, DB::table('expense_categories')->where('tenant_id', $tenant->id)->count());
    $this->assertEquals(1, DB::table('bank_accounts')->where('tenant_id', $tenant->id)->count());

    // ai_settings is new as of this session (see TenantDefaultSeeder::seedAiSettings) —
    // assert it's actually being seeded for new tenants now, closing the gap
    // that caused AiEngineTest::isolates_ai_settings_per_tenant to fail.
    $this->assertEquals(7, DB::table('ai_settings')->where('tenant_id', $tenant->id)->count());
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
        'terms_consent' => true,
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
        'terms_consent' => true,
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
        'terms_consent' => true,
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
        'terms_consent' => true,
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
        'terms_consent' => true,
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
        'terms_consent' => true,
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
            'terms_consent' => true,
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

    // Create WooConnection with a secret
    $connection = \App\Models\WooConnection::create([
        'tenant_id' => $tenant->id,
        'name' => 'Test Isolation Connection',
        'site_url' => 'https://test-iso.com',
        'uuid' => 'test-iso-uuid',
        'status' => 'active',
        'webhook_secret' => 'iso-secret-key'
    ]);

    // Sending orders to WooCommerce webhook on a plan with woocommerce => false
    // should throw PlanLimitException because woocommerce integration is not allowed.
    $this->expectException(PlanLimitException::class);

    // Act
    $controller = app(\App\Http\Controllers\WooCommerceController::class);
    $payload = [
        'id' => 1234,
        'line_items' => []
    ];
    $body = json_encode($payload);
    $signature = base64_encode(hash_hmac('sha256', $body, 'iso-secret-key', true));

    $request = \Illuminate\Http\Request::create(
        '/woocommerce/webhook', 
        'POST', 
        [], 
        [], 
        [], 
        ['CONTENT_TYPE' => 'application/json'], 
        $body
    );
    $request->headers->set('x-wc-webhook-signature', $signature);

    $controller->webhook($request, $connection->uuid);
});

test('woocommerce webhook requires a valid signature', function () {
    $tenant = $this->createTenant('woo-webhook-sec', 'growth');

    // WooCommerce is included in NO plan (2026-07-04 decision) — entitle this
    // tenant explicitly via a per-tenant override, the same way a real sold
    // add-on would be granted. This test is about signature verification, not
    // plan gating (that's covered by 'woocommerce webhook isolation regression').
    \Illuminate\Support\Facades\DB::table('tenant_plan_overrides')->insert([
        'tenant_id' => $tenant->id,
        'override_key' => 'woocommerce',
        'override_value' => '1',
        'applied_by' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Create a WooConnection with the webhook secret
    $connection = \App\Models\WooConnection::create([
        'tenant_id' => $tenant->id,
        'name' => 'Test Connection',
        'site_url' => 'https://test.com',
        'uuid' => 'test-uuid-1',
        'status' => 'active',
        'webhook_secret' => 'my-super-secret-key'
    ]);

    $payload = [
        'id' => 9999,
        'line_items' => [
            ['sku' => 'PROD-123', 'quantity' => 1]
        ]
    ];

    $body = json_encode($payload);

    // Request with missing signature -> 401 Unauthorized
    $response = $this->postJson("/woocommerce/webhook/{$connection->uuid}", $payload);
    $response->assertStatus(401);

    // Request with invalid signature -> 401 Unauthorized
    $response = $this->postJson("/woocommerce/webhook/{$connection->uuid}", $payload, [
        'x-wc-webhook-signature' => 'invalid-hmac-signature-here'
    ]);
    $response->assertStatus(401);

    // Request with valid signature (HMAC-SHA256 of payload signed with secret)
    $validSignature = base64_encode(hash_hmac('sha256', $body, 'my-super-secret-key', true));
    $response = $this->postJson("/woocommerce/webhook/{$connection->uuid}", $payload, [
        'x-wc-webhook-signature' => $validSignature
    ]);

    // Should now pass signature check and proceed
    $response->assertStatus(200);
});

test('store creation has double submit prevention via cache lock', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    // Set up available store license
    $license = StoreLicense::create([
        'user_id' => $user->id,
        'type'    => 'subscription',
        'status'  => 'available',
        'plan'    => 'starter',
        'source'  => 'lemon_squeezy',
    ]);

    // Acquire lock manually to simulate an active concurrent request
    $lockKey = 'store_create_lock_' . $user->id;
    $lock = \Illuminate\Support\Facades\Cache::lock($lockKey, 10);
    $lock->acquire();

    // Send a store creation request while locked
    $response = $this->post('/new-store', [
        'name' => 'Concurrent Store Attempt',
        'terms_consent' => true,
    ]);

    // Should redirect back with validation/concurrency errors
    $response->assertStatus(302);
    $response->assertSessionHasErrors(['name']);

    $errors = session('errors')->get('name');
    $this->assertStringContainsString('creation is already in progress', $errors[0]);

    // Release lock and try again
    $lock->release();
    $response = $this->post('/new-store', [
        'name' => 'Successful Store Attempt',
        'terms_consent' => true,
    ]);
    $response->assertRedirect('/hub');
});

test('onboarding setup completion has double submit lock', function () {
    $tenant = $this->createTenant('setup-lock-store');
    $user = $this->createTenantUser($tenant, 'owner');
    
    $this->actingAs($user);
    $this->bindTenantContext($tenant, $user);

    // Acquire lock manually to simulate an active concurrent request
    $lockKey = 'setup_complete_lock_' . $tenant->id;
    $lock = \Illuminate\Support\Facades\Cache::lock($lockKey, 10);
    $lock->acquire();

    // Send setup completion request
    $response = $this->post($this->storeUrl($tenant, 'setup'), [
        'business_name' => 'Concurrent Biz',
        'email' => 'biz@test.com',
        'phone' => '1234567',
        'address' => 'Test Address',
        'currency_symbol' => 'Rs.',
        'currency_code' => 'PKR',
        'industry_key' => 'retail',
    ]);

    // Should redirect back with errors due to active lock
    $response->assertStatus(302);
    $response->assertSessionHasErrors(['error']);

    $errors = session('errors')->get('error');
    $this->assertStringContainsString('Setup is already in progress', $errors[0]);

    // Release lock
    $lock->release();
});

test('process webhook job binds tenant context in queue', function () {
    $tenant = $this->createTenant('woo-job-store');
    
    // Create a connection for this tenant
    $connection = \App\Models\WooConnection::create([
        'tenant_id' => $tenant->id,
        'name' => 'Test Woo Connection',
        'site_url' => 'https://test-woo-site.com',
        'uuid' => 'test-connection-uuid-123',
        'status' => 'active'
    ]);

    // Ensure app('current.tenant') is unbound initially (simulating background worker)
    if (app()->bound('current.tenant')) {
        app()->forgetInstance('current.tenant');
    }

    // Dispatch job
    $job = new ProcessWebhookJob($connection->id, 'product.created', [
        'id' => 101,
        'sku' => 'PROD-SKU-1',
        'name' => 'Background Product'
    ]);
    
    $job->handle();

    // Assert that the job successfully bound the tenant to the DI container during execution
    $this->assertTrue(app()->bound('current.tenant'));
    $this->assertEquals($tenant->id, app('current.tenant')->id);
});
