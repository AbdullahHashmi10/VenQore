<?php

namespace Tests\Feature;

use App\Models\Party;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\PlanDowngradeService;
use App\Services\PlanRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Phase3FeatureGatesTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $counterTenant;
    protected Tenant $starterTenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\PlanFeatureMatrixSeeder::class);

        // Seed Counter tenant using consistent industry attribute
        $this->counterTenant = Tenant::create([
            'name'             => 'Counter Store',
            'slug'             => 'counter-store',
            'plan'             => 'counter',
            'setup_completed'  => true,
            'industry'         => 'grocery',
        ]);

        // Seed Starter tenant using consistent industry attribute
        $this->starterTenant = Tenant::create([
            'name'             => 'Starter Store',
            'slug'             => 'starter-store',
            'plan'             => 'starter',
            'status'           => 'active',
            'setup_completed'  => true,
            'industry'         => 'retail',
        ]);
    }

    /** @test */
    public function it_blocks_access_to_locked_features_via_route_middleware()
    {
        app()->instance('current.tenant', $this->counterTenant);

        $user = User::factory()->create(['is_platform_admin' => false]);
        TenantUser::create([
            'tenant_id' => $this->counterTenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);
        $this->actingAs($user);

        // Counter/Solo plan has multi_branch=0 -> EnsurePlanFeature middleware
        // returns 402 with message=upgrade_required for JSON requests
        $middleware = new \App\Http\Middleware\EnsurePlanFeature();
        $request = \Illuminate\Http\Request::create('/api/stock-transfers', 'GET');
        $request->headers->set('Accept', 'application/json');
        $request->setRouteResolver(function () { return null; });

        $response = $middleware->handle($request, function () {
            return response()->json(['ok' => true]);
        }, 'multi_branch');

        $this->assertEquals(402, $response->getStatusCode());
        $payload = json_decode($response->getContent(), true);
        $this->assertEquals('upgrade_required', $payload['message'] ?? '');
        $this->assertEquals('multi_branch', $payload['feature'] ?? '');
    }

    /** @test */
    public function it_shares_plan_features_and_limits_in_inertia_props()
    {
        app()->instance('current.tenant', $this->counterTenant);

        $user = User::factory()->create(['is_platform_admin' => false]);
        TenantUser::create([
            'tenant_id' => $this->counterTenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);
        $this->actingAs($user);

        $response = $this->get("/s/{$this->counterTenant->slug}/dashboard");
        $response->assertStatus(200);

        $page = $response->inertiaPage();
        $this->assertNotNull($page['props']['plan']);
        $this->assertArrayHasKey('multi_branch', $page['props']['plan']['features']);
        $this->assertFalse($page['props']['plan']['features']['multi_branch']);
        $this->assertEquals(500, $page['props']['plan']['limits']['sku_limit']);
    }

    /** @test */
    public function it_enforces_counter_plan_sku_and_report_limits()
    {
        $this->assertFalse(PlanRepository::canUseFeature($this->counterTenant, 'multi_branch'));
        $this->assertFalse(PlanRepository::canUseFeature($this->counterTenant, 'white_label'));
        // Changed deliberately: reports are plan-gated as of SPEC_PLAN_GATED_REPORTS.
        // counter aliases to solo, and solo no longer includes profit reporting.
        $this->assertFalse(PlanRepository::canUseFeature($this->counterTenant, 'report_profit_loss'));

        $limits = PlanRepository::limitsFor($this->counterTenant);
        $this->assertEquals(500, $limits['sku_limit']);
        $this->assertEquals(1, $limits['location_limit']);
    }

    /** @test */
    public function it_grants_cookbook_recipes_to_counter_food_prep_tenants()
    {
        // In V11, manufacturing & BOM are universal — ON for all plans including counter/solo
        $this->assertTrue(PlanRepository::canUseFeature($this->counterTenant, 'bill_of_materials'));
        $this->assertTrue(PlanRepository::canUseFeature($this->counterTenant, 'manufacturing'));

        // Cafe Counter tenant also has bill_of_materials (all industries)
        $cafeTenant = Tenant::create([
            'name'            => 'City Cafe',
            'slug'            => 'city-cafe',
            'plan'            => 'counter',
            'setup_completed' => true,
            'industry'        => 'cafe',
        ]);

        $this->assertTrue(PlanRepository::canUseFeature($cafeTenant, 'bill_of_materials'));
        $this->assertTrue(PlanRepository::canUseFeature($cafeTenant, 'manufacturing'));
    }

    /** @test */
    public function it_prevents_downgrade_when_tenant_has_open_payables_or_receivables()
    {
        $downgradeService = new PlanDowngradeService();

        // Create customer with active balance on Starter tenant
        Party::create([
            'tenant_id'       => $this->starterTenant->id,
            'name'            => 'Customer A',
            'type'            => 'customer',
            'current_balance' => 1500,
        ]);

        $result = $downgradeService->validateDowngrade($this->starterTenant, 'counter');

        $this->assertFalse($result['allowed']);
        $this->assertNotEmpty($result['reasons']);
        $this->assertStringContainsString('receivables', $result['reasons'][0]);
    }

    /** @test */
    public function it_blocks_downgrade_via_http_endpoint_when_open_balances_exist()
    {
        $this->withoutExceptionHandling();

        app()->instance('current.tenant', $this->starterTenant);

        $user = User::factory()->create(['is_platform_admin' => true]);
        TenantUser::create([
            'tenant_id' => $this->starterTenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);
        $this->actingAs($user);

        // Active receivable on Starter tenant
        Party::create([
            'tenant_id'       => $this->starterTenant->id,
            'name'            => 'Debtor Corp',
            'type'            => 'customer',
            'current_balance' => 50000,
        ]);

        // Attempt HTTP POST downgrade to counter plan
        $response = $this->postJson("/s/{$this->starterTenant->slug}/billing/change-plan", [
            'plan' => 'counter',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'code'    => 'downgrade_blocked',
            ]);

        // Tenant plan must remain unchanged
        $this->assertEquals('starter', $this->starterTenant->fresh()->plan);
    }

    /** @test */
    public function it_blocks_downgrade_via_http_endpoint_for_trial_tenants_with_open_balances()
    {
        $trialTenant = Tenant::create([
            'name'             => 'Trial Store',
            'slug'             => 'trial-store',
            'plan'             => 'starter',
            'status'           => 'trial',
            'setup_completed'  => true,
            'industry'         => 'retail',
        ]);

        app()->instance('current.tenant', $trialTenant);

        $user = User::factory()->create(['is_platform_admin' => true]);
        TenantUser::create([
            'tenant_id' => $trialTenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);
        $this->actingAs($user);

        // Open receivable on Trial tenant
        Party::create([
            'tenant_id'       => $trialTenant->id,
            'name'            => 'Trial Debtor Corp',
            'type'            => 'customer',
            'current_balance' => 25000,
        ]);

        // Attempt HTTP POST downgrade to counter plan while in trial
        $response = $this->postJson("/s/{$trialTenant->slug}/billing/change-plan", [
            'plan' => 'counter',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'code'    => 'downgrade_blocked',
            ]);

        // Tenant plan must remain unchanged
        $this->assertEquals('starter', $trialTenant->fresh()->plan);
    }
}
