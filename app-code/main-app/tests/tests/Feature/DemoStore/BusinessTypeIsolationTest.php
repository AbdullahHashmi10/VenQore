<?php

use App\Models\User;
use App\Models\Tenant;
use App\Services\ModuleService;
use App\Support\BusinessTypes;
use Tests\Feature\VenQoreTestCase;
use Illuminate\Support\Facades\DB;

uses(VenQoreTestCase::class);

beforeEach(function () {
    $this->tenant = Tenant::where('slug', 'demo')->first();
    if (!$this->tenant) {
        $this->tenant = Tenant::create([
            'name'             => 'VenQore Demo Store',
            'slug'             => 'demo',
            'plan'             => 'business',
            'status'           => 'active',
            'currency_symbol'  => '$',
            'currency_code'    => 'USD',
            'setup_completed'  => true,
            'is_demo'          => true,
        ]);
    }

    $this->user = User::where('email', 'demo-owner@venqore-demo.internal')->first();
    if (!$this->user) {
        $this->user = User::create([
            'name'              => 'Demo Owner',
            'email'             => 'demo-owner@venqore-demo.internal',
            'password'          => bcrypt('password'),
            'last_store_id'     => $this->tenant->id,
            'email_verified_at' => now(),
        ]);
    }
});

test('public demo landing page loads and provides business types catalogue', function () {
    $response = $this->get('/demo');
    $response->assertStatus(200);

    $catalogue = BusinessTypes::all();
    expect(count($catalogue))->toBeGreaterThanOrEqual(85);
});

test('all demo store users have verified emails so email verification prompt is bypassed', function () {
    $demoUsers = User::where('email', 'like', '%@venqore-demo.internal')->get();
    expect($demoUsers->count())->toBeGreaterThanOrEqual(1);

    foreach ($demoUsers as $u) {
        expect($u->hasVerifiedEmail())->toBeTrue();
    }

    // Visiting dashboard directly as demo user must not redirect to verification notice
    $response = $this->actingAs($this->user)->get('/s/demo/dashboard');
    $response->assertStatus(200);
});

test('factory selection activates production and cleanly disables table service / kitchen clash', function () {
    $response = $this->post('/demo/login', [
        'role'          => 'owner',
        'business_type' => 'furniture_maker',
    ]);

    $response->assertRedirect('/s/demo/dashboard');

    $modules = session('demo_modules');
    expect($modules)->toBeArray();
    expect($modules['production_runs'] ?? false)->toBeTrue();
    expect($modules['table_service'] ?? false)->toBeFalse();

    // Verify ModuleService reflects session isolation
    expect(ModuleService::enabled($this->tenant, 'production_runs'))->toBeTrue();
    expect(ModuleService::enabled($this->tenant, 'table_service'))->toBeFalse();
});

test('restaurant selection activates table service and cleanly disables manufacturing BOM', function () {
    $response = $this->post('/demo/login', [
        'role'          => 'owner',
        'business_type' => 'restaurant',
    ]);

    $response->assertRedirect('/s/demo/dashboard');

    $modules = session('demo_modules');
    expect($modules)->toBeArray();
    expect($modules['table_service'] ?? false)->toBeTrue();
    expect($modules['production_runs'] ?? false)->toBeFalse();

    expect(ModuleService::enabled($this->tenant, 'table_service'))->toBeTrue();
    expect(ModuleService::enabled($this->tenant, 'production_runs'))->toBeFalse();
});

test('repair service selection activates services and disables table service', function () {
    $response = $this->post('/demo/login', [
        'role'          => 'cashier',
        'business_type' => 'phone_repair',
    ]);

    $response->assertRedirect('/s/demo/dashboard');

    $modules = session('demo_modules');
    expect($modules)->toBeArray();
    expect($modules['services'] ?? false)->toBeTrue();
    expect($modules['table_service'] ?? false)->toBeFalse();
});

test('in-app business switcher updates visitor modules dynamically', function () {
    $this->actingAs($this->user);

    $response = $this->post('/demo/switch-business', [
        'business_type' => 'restaurant',
    ]);

    $response->assertRedirect();
    expect(session('demo_business_type'))->toBe('restaurant');
    expect(session('demo_modules')['table_service'])->toBeTrue();
    expect(session('demo_modules')['production_runs'])->toBeFalse();
});

test('specialized role login creates verified user and grants role permissions', function () {
    $response = $this->post('/demo/login', [
        'role'          => 'kitchen_manager',
        'business_type' => 'restaurant',
    ]);

    $response->assertRedirect('/s/demo/dashboard');

    $user = User::where('email', 'demo-kitchen_manager@venqore-demo.internal')->first();
    expect($user)->not->toBeNull();
    expect($user->hasVerifiedEmail())->toBeTrue();

    $membership = DB::table('tenant_users')
        ->where('tenant_id', $this->tenant->id)
        ->where('user_id', $user->id)
        ->first();

    expect($membership)->not->toBeNull();
    expect($membership->role)->toBe('kitchen_manager');
});

test('custom permissions profile applies exact custom capabilities to tenant user', function () {
    $customPerms = ['pos.checkout', 'sales.view', 'inventory.view'];

    $response = $this->post('/demo/login', [
        'role'                  => 'cashier',
        'business_type'         => 'grocery',
        'permissions'           => $customPerms,
        'is_custom_permissions' => true,
    ]);

    $response->assertRedirect('/s/demo/dashboard');

    $user = User::where('email', 'demo-cashier@venqore-demo.internal')->first();
    expect($user)->not->toBeNull();

    $membership = DB::table('tenant_users')
        ->where('tenant_id', $this->tenant->id)
        ->where('user_id', $user->id)
        ->first();

    expect($membership->permission_override_mode)->toBe('custom');
    $decodedPerms = json_decode($membership->permissions, true);
    expect($decodedPerms)->toEqualCanonicalizing($customPerms);
});

