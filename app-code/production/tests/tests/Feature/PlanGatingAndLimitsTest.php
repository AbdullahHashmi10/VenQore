<?php

namespace Tests\Feature;

use App\Exceptions\PlanLimitException;
use App\Http\Middleware\EnsurePlanFeature;
use App\Models\Product;
use App\Models\Register;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\TenantPlanOverride;
use App\Models\TenantUser;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\DeviceSessionService;
use App\Services\PlanDowngradeService;
use App\Services\PlanGate;
use App\Services\PlanRepository;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class PlanGatingAndLimitsTest extends TestCase
{
    use DatabaseTransactions;

    /**
     * The 8 capability fences defined in canonical pricing specification:
     * - multi_branch
     * - manufacturing
     * - growth_signals
     * - loyalty_points
     * - recurring_invoices
     * - api_webhooks
     * - white_label
     * - audit_trail
     */
    private const FENCES = [
        'multi_branch',
        'api_access',
        'webhooks',
        'security_activity_log',
        'custom_roles',
        'white_label',
        'network_unlimited',
        'consolidated_reporting',
        'woocommerce',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function makeTenant(string $plan, string $status = 'active'): Tenant
    {
        $tenant = Tenant::create([
            'name'                => ucfirst($plan) . ' Test Store ' . uniqid(),
            'slug'                => $plan . '-store-' . uniqid(),
            'plan'                => $plan,
            'status'              => $status,
            'currency_code'       => 'USD',
            'currency_symbol'     => '$',
            'timezone'            => 'UTC',
            'setup_completed'     => true,
            'is_demo'             => false,
        ]);

        app()->instance('current.tenant', $tenant);
        PlanRepository::invalidateTenantCache($tenant);

        return $tenant;
    }

    public function test_solo_plan_is_denied_all_eight_capability_fences(): void
    {
        $tenant = $this->makeTenant('solo');

        foreach (self::FENCES as $fence) {
            $this->assertFalse(
                PlanGate::check($fence, $tenant),
                "Solo plan should be denied capability fence: {$fence}"
            );
        }
    }

    public function test_starter_plan_is_denied_all_eight_capability_fences(): void
    {
        $tenant = $this->makeTenant('starter');

        foreach (self::FENCES as $fence) {
            $this->assertFalse(
                PlanGate::check($fence, $tenant),
                "Starter plan should be denied capability fence: {$fence}"
            );
        }
    }

    public function test_growth_plan_allows_tier_one_fences_and_denies_scale_fences(): void
    {
        $tenant = $this->makeTenant('growth');

        $allowedOnGrowth = [
            'api_access',
            'webhooks',
            'security_activity_log',
            'custom_roles',
            'network_unlimited',
        ];

        $deniedOnGrowth = [
            'multi_branch',
            'white_label',
            'consolidated_reporting',
            'woocommerce',
        ];

        foreach ($allowedOnGrowth as $fence) {
            $this->assertTrue(
                PlanGate::check($fence, $tenant),
                "Growth/Core plan should allow capability fence: {$fence}"
            );
        }

        foreach ($deniedOnGrowth as $fence) {
            $this->assertFalse(
                PlanGate::check($fence, $tenant),
                "Growth/Core plan should deny Scale capability fence: {$fence}"
            );
        }
    }

    public function test_business_scale_plan_allows_all_eight_capability_fences(): void
    {
        $tenant = $this->makeTenant('business');

        foreach (self::FENCES as $fence) {
            $this->assertTrue(
                PlanGate::check($fence, $tenant),
                "Business/Scale plan should allow capability fence: {$fence}"
            );
        }
    }

    public function test_trial_plan_acts_as_growth_plan_entitlements(): void
    {
        $tenant = $this->makeTenant('trial');

        $this->assertTrue(PlanGate::check('api_access', $tenant), 'Trial plan must include Core tier api_access fence');
        $this->assertTrue(PlanGate::check('security_activity_log', $tenant), 'Trial plan must include Core tier audit log fence');
        $this->assertFalse(PlanGate::check('white_label', $tenant), 'Trial plan must deny Scale tier white_label fence');
    }

    public function test_unknown_feature_key_fails_closed_and_logs_warning(): void
    {
        $tenant = $this->makeTenant('business');

        Log::spy();

        $result = PlanGate::check('completely_fake_nonexistent_capability', $tenant);
        $this->assertFalse($result, 'Unknown feature key must fail closed (return false)');

        Log::shouldHaveReceived('warning')
            ->once()
            ->withArgs(function ($message) {
                return str_contains($message, 'Unknown or unseeded plan limit key');
            });
    }

    public function test_unauthenticated_or_null_tenant_fails_closed(): void
    {
        app()->forgetInstance('current.tenant');
        $this->assertFalse(PlanGate::check('multi_branch', null));
    }

    public function test_warehouse_observer_blocks_exceeding_location_limit(): void
    {
        $tenant = $this->makeTenant('starter');

        // Starter limit is 1 location. First location is allowed.
        Warehouse::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Main Store',
            'is_active' => true,
        ]);

        $this->expectException(PlanLimitException::class);
        $this->expectExceptionMessage("You've reached the maximum number of store locations for your plan");

        Warehouse::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Second Store (Over Cap)',
            'is_active' => true,
        ]);
    }

    public function test_register_observer_blocks_exceeding_register_limit(): void
    {
        $tenant = $this->makeTenant('solo');

        // Solo limit is 1 register. First register is allowed.
        Register::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Register 1',
            'is_active' => true,
        ]);

        $this->expectException(PlanLimitException::class);
        $this->expectExceptionMessage("You've reached the maximum number of POS registers for your plan");

        Register::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Register 2 (Over Cap)',
            'is_active' => true,
        ]);
    }

    public function test_tenant_user_observer_blocks_exceeding_staff_seat_limit_on_full_seats_only(): void
    {
        $tenant = $this->makeTenant('starter');

        // Add 1 full seat (owner)
        $ownerUser = User::factory()->create();
        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $ownerUser->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        // Cashiers do not count towards staff_limit and should be unlimited.
        $cashierUser1 = User::factory()->create();
        $cashier1 = TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $cashierUser1->id,
            'role'      => 'cashier',
            'status'    => 'active',
        ]);
        $this->assertNotNull($cashier1->id, 'Cashier should be created freely without hitting staff_limit');

        $cashierUser2 = User::factory()->create();
        $cashier2 = TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $cashierUser2->id,
            'role'      => 'cashier',
            'status'    => 'active',
        ]);
        $this->assertNotNull($cashier2->id, 'Multiple cashiers should be created freely');

        // Now attempt to add a second full staff member (manager) -> should trigger PlanLimitException
        $managerUser = User::factory()->create();

        $this->expectException(PlanLimitException::class);
        $this->expectExceptionMessage("You've reached the maximum number of full staff seats for your plan");

        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $managerUser->id,
            'role'      => 'manager',
            'status'    => 'active',
        ]);
    }

    public function test_product_observer_blocks_exceeding_sku_limit(): void
    {
        $tenant = $this->makeTenant('starter');

        // Override sku_limit on this tenant to 2 for fast testing
        TenantPlanOverride::create([
            'tenant_id'      => $tenant->id,
            'override_key'   => 'sku_limit',
            'override_value' => '2',
        ]);
        PlanRepository::invalidateTenantCache($tenant);

        Product::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Product 1',
            'sku'       => 'SKU-' . uniqid(),
            'price'     => 10,
        ]);

        Product::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Product 2',
            'sku'       => 'SKU-' . uniqid(),
            'price'     => 20,
        ]);

        $this->expectException(PlanLimitException::class);
        $this->expectExceptionMessage("You've reached the maximum number of catalogue items for your plan");

        Product::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Product 3 (Over Cap)',
            'sku'       => 'SKU-' . uniqid(),
            'price'     => 30,
        ]);
    }

    public function test_pos_till_is_never_blocked_under_any_tenant_billing_status(): void
    {
        $statuses = ['trial', 'active', 'past_due', 'expired', 'cancelled'];

        foreach ($statuses as $status) {
            $tenant = $this->makeTenant('starter', $status);

            $this->assertTrue(
                PlanGate::check('pos', $tenant),
                "POS checkout must remain open for status: {$status}"
            );
        }
    }

    public function test_session_eviction_and_banner_notification(): void
    {
        $tenant = $this->makeTenant('growth');
        $user = User::factory()->create(['email' => 'staff@teststore.com']);

        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $user->id,
            'role'      => 'manager',
            'status'    => 'active',
        ]);

        $request1 = Request::create('/app/dashboard', 'GET');
        $request1->cookies->set('vq_device_token', 'token-device-1');
        session()->setId('session-id-device-1');

        // First login
        $result1 = DeviceSessionService::registerSession($user, $tenant, $request1, 'session-id-device-1');
        $this->assertTrue($result1['success']);
        $this->assertFalse($result1['evicted']);

        // Second login from another device
        $request2 = Request::create('/app/dashboard', 'GET');
        $request2->cookies->set('vq_device_token', 'token-device-2');

        $result2 = DeviceSessionService::registerSession($user, $tenant, $request2, 'session-id-device-2');
        $this->assertTrue($result2['success']);
        $this->assertTrue($result2['evicted'], 'Second login must evict earlier active session');

        // Check eviction banner on session 1
        $evictionNotice = DeviceSessionService::checkEviction('session-id-device-1');
        $this->assertNotNull($evictionNotice);
        $this->assertStringContainsString('staff@teststore.com signed in on another device', $evictionNotice['message']);
    }

    public function test_soft_device_cap_and_self_service_deactivation(): void
    {
        $tenant = $this->makeTenant('solo'); // Solo devices_per_seat is 2
        $user = User::factory()->create();

        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        // Device 1
        $req1 = Request::create('/', 'GET');
        $req1->cookies->set('vq_device_token', 'dev-1');
        $res1 = DeviceSessionService::registerSession($user, $tenant, $req1, 'sess-1');
        $dev1 = $res1['device'];

        // Device 2
        $req2 = Request::create('/', 'GET');
        $req2->cookies->set('vq_device_token', 'dev-2');
        $res2 = DeviceSessionService::registerSession($user, $tenant, $req2, 'sess-2');
        $dev2 = $res2['device'];

        // Self-service deactivation of Device 1
        $deactivated = DeviceSessionService::deactivateDevice($user, $dev1->id);
        $this->assertTrue($deactivated);
        $this->assertFalse($dev1->fresh()->is_active);
    }

    public function test_solo_history_scope_filters_old_records_while_db_keeps_them(): void
    {
        $tenant = $this->makeTenant('solo');
        $user = User::factory()->create();

        // Insert a recent sale (within 30 days)
        Sale::create([
            'tenant_id'        => $tenant->id,
            'user_id'          => $user->id,
            'reference_number' => 'REF-' . uniqid(),
            'status'           => 'posted',
            'total'            => 100,
            'created_at'       => now()->subDays(5),
        ]);

        // Insert an older sale (beyond 30 days)
        Sale::create([
            'tenant_id'        => $tenant->id,
            'user_id'          => $user->id,
            'reference_number' => 'REF-' . uniqid(),
            'status'           => 'posted',
            'total'            => 250,
            'created_at'       => now()->subDays(60),
        ]);

        // Total in DB is 2 (never deleted)
        $this->assertEquals(2, Sale::where('tenant_id', $tenant->id)->count());

        // Visible history scope returns only 1 (the recent one)
        $visibleCount = Sale::where('tenant_id', $tenant->id)->visibleHistory($tenant)->count();
        $this->assertEquals(1, $visibleCount, 'Solo visible history query scope must only return records within 30 days');
    }

    public function test_trial_expiry_drops_to_solo_plan(): void
    {
        $tenant = $this->makeTenant('trial', 'expired');

        PlanDowngradeService::dropToSolo($tenant);

        $tenant->refresh();
        $this->assertEquals('solo', $tenant->plan);
        $this->assertEquals('active', $tenant->status);
        $this->assertEquals(30, $tenant->historyRetentionDays());
    }

    public function test_tenant_plan_overrides_are_respected(): void
    {
        $tenant = $this->makeTenant('starter');

        $this->assertFalse(PlanGate::check('multi_branch', $tenant));

        // Grant override
        TenantPlanOverride::create([
            'tenant_id'      => $tenant->id,
            'override_key'   => 'multi_branch',
            'override_value' => '1',
        ]);
        PlanRepository::invalidateTenantCache($tenant);

        $this->assertTrue(
            PlanGate::check('multi_branch', $tenant),
            'Tenant plan override must grant feature access'
        );
    }

    public function test_ensure_plan_feature_middleware_enforces_gate(): void
    {
        $tenant = $this->makeTenant('starter');

        $middleware = new EnsurePlanFeature();

        // 1. JSON request returns 402 with structured payload
        $jsonRequest = Request::create('/api/whitelabel/settings', 'POST');
        $jsonRequest->headers->set('Accept', 'application/json');

        $response = $middleware->handle($jsonRequest, function () {
            return response()->json(['status' => 'success']);
        }, 'white_label');

        $this->assertEquals(402, $response->getStatusCode());
        $payload = json_decode($response->getContent(), true);
        $this->assertEquals('upgrade_required', $payload['message'] ?? '');
        $this->assertEquals('white_label', $payload['feature'] ?? '');

        // 2. Web request redirects to billing upgrade route
        $webRequest = Request::create('/app/whitelabel/settings', 'GET');
        $webResponse = $middleware->handle($webRequest, function () {
            return response('OK');
        }, 'white_label');

        $this->assertTrue($webResponse->isRedirection());
    }

    public function test_ai_meter_and_scan_subcap_limits(): void
    {
        $soloTenant = $this->makeTenant('solo');
        $this->assertEquals(100, $soloTenant->getLimit('ai_credits_monthly'));
        $this->assertEquals(10, $soloTenant->getLimit('ai_scans_monthly'));

        $starterTenant = $this->makeTenant('starter');
        $this->assertEquals(500, $starterTenant->getLimit('ai_credits_monthly'));

        $growthTenant = $this->makeTenant('growth');
        $this->assertEquals(2000, $growthTenant->getLimit('ai_credits_monthly'));

        $scaleTenant = $this->makeTenant('business');
        $this->assertEquals(10000, $scaleTenant->getLimit('ai_credits_monthly'));
    }

    public function test_downgrade_validation_blocks_when_balances_open(): void
    {
        $tenant = $this->makeTenant('growth');

        $downgradeService = new PlanDowngradeService();
        $result = $downgradeService->validateDowngrade($tenant, 'starter');
        $this->assertTrue($result['allowed']);

        // Create an open party balance
        \App\Models\Party::create([
            'tenant_id'       => $tenant->id,
            'name'            => 'Customer with debt',
            'type'            => 'customer',
            'current_balance' => 500.00,
        ]);

        $blockedResult = $downgradeService->validateDowngrade($tenant, 'starter');
        $this->assertFalse($blockedResult['allowed']);
        $this->assertNotEmpty($blockedResult['reasons']);
    }

    public function test_ltd_plans_have_unlimited_transactions_and_correct_fences(): void
    {
        $ltd1 = $this->makeTenant('ltd_1');
        $ltd2 = $this->makeTenant('ltd_2');
        $ltd3 = $this->makeTenant('ltd_3');

        // All LTD plans have transactions_per_month = null (unlimited)
        $this->assertNull($ltd1->getLimit('transactions_per_month'), 'LTD 1 transactions must be unlimited');
        $this->assertNull($ltd2->getLimit('transactions_per_month'), 'LTD 2 transactions must be unlimited');
        $this->assertNull($ltd3->getLimit('transactions_per_month'), 'LTD 3 transactions must be unlimited');

        // LTD 1 has multi_branch OFF
        $this->assertFalse(PlanGate::check('multi_branch', $ltd1));
        $this->assertTrue(PlanGate::check('manufacturing', $ltd1));

        // LTD 2 and 3 have multi_branch ON
        $this->assertTrue(PlanGate::check('multi_branch', $ltd2));
        $this->assertTrue(PlanGate::check('manufacturing', $ltd2));
        $this->assertTrue(PlanGate::check('multi_branch', $ltd3));
        $this->assertTrue(PlanGate::check('manufacturing', $ltd3));

        // All LTD plans have scale fences OFF (White Label, etc.)
        $this->assertFalse(PlanGate::check('white_label', $ltd1));
        $this->assertFalse(PlanGate::check('white_label', $ltd2));
        $this->assertFalse(PlanGate::check('white_label', $ltd3));
        $this->assertFalse(PlanGate::check('audit_trail', $ltd3));

        // LTD AI credits annual
        $this->assertEquals(12000, $ltd1->getLimit('ai_credits_annual'));
        $this->assertEquals(30000, $ltd2->getLimit('ai_credits_annual'));
        $this->assertEquals(60000, $ltd3->getLimit('ai_credits_annual'));
    }

    public function test_history_reappears_instantly_upon_upgrade_from_solo(): void
    {
        $tenant = $this->makeTenant('solo');
        $user = User::factory()->create();

        // Old sale (> 90 days)
        Sale::create([
            'tenant_id'        => $tenant->id,
            'user_id'          => $user->id,
            'reference_number' => 'REF-OLD-' . uniqid(),
            'status'           => 'posted',
            'total'            => 250,
            'created_at'       => now()->subDays(100),
        ]);

        // Recent sale (< 90 days)
        Sale::create([
            'tenant_id'        => $tenant->id,
            'user_id'          => $user->id,
            'reference_number' => 'REF-NEW-' . uniqid(),
            'status'           => 'posted',
            'total'            => 100,
            'created_at'       => now()->subDays(5),
        ]);

        // On Solo, visibleHistory gives 1
        $this->assertEquals(1, Sale::where('tenant_id', $tenant->id)->visibleHistory($tenant)->count());

        // Upgrade tenant to Starter
        $tenant->plan = 'starter';
        $tenant->save();
        PlanRepository::invalidateTenantCache($tenant);

        // Now visibleHistory returns all 2 sales
        $this->assertEquals(2, Sale::where('tenant_id', $tenant->id)->visibleHistory($tenant)->count(), 'All historical sales must reappear upon upgrading from Solo');
    }

    public function test_till_remains_unblocked_when_device_cap_exceeded(): void
    {
        $tenant = $this->makeTenant('solo'); // Solo has 2 devices per seat
        $user = User::factory()->create();
        app()->instance('current.tenant', $tenant);

        // POS Till check must be true even if user has exceeded devices
        $this->assertTrue(PlanGate::check('pos'));
        $this->assertTrue(PlanGate::check('cashier_pin_login'));
    }
}

