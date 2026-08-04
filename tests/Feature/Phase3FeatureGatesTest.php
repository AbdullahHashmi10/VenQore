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

        $user = User::factory()->create(['is_platform_admin' => true]);
        TenantUser::create([
            'tenant_id' => $this->counterTenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);
        $this->actingAs($user);

        // Counter plan has aged_receivables disabled -> expect 402 for JSON
        $response = $this->getJson("/s/{$this->counterTenant->slug}/reports/sale-aging");
        $response->assertStatus(402)
            ->assertJson([
                'success' => false,
                'code'    => 'feature_locked',
                'feature' => 'aged_receivables',
            ]);
    }

    /** @test */
    public function it_shares_plan_features_and_limits_in_inertia_props()
    {
        app()->instance('current.tenant', $this->counterTenant);

        $user = User::factory()->create(['is_platform_admin' => true]);
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
        $this->assertEquals('counter', $page['props']['plan']['slug']);
        $this->assertArrayHasKey('aged_receivables', $page['props']['plan']['features']);
        $this->assertFalse($page['props']['plan']['features']['aged_receivables']);
        $this->assertEquals(500, $page['props']['plan']['limits']['sku_limit']);
    }

    /** @test */
    public function it_enforces_counter_plan_sku_and_report_limits()
    {
        $this->assertFalse(PlanRepository::canUseFeature($this->counterTenant, 'aged_receivables'));
        $this->assertFalse(PlanRepository::canUseFeature($this->counterTenant, 'report_profit_loss'));
        $this->assertFalse(PlanRepository::canUseFeature($this->counterTenant, 'report_trial_balance'));
        
        $limits = PlanRepository::limitsFor($this->counterTenant);
        $this->assertEquals(500, $limits['sku_limit']);
        $this->assertEquals(2, $limits['staff_limit']);
        $this->assertEquals(1, $limits['location_limit']);
    }

    /** @test */
    public function it_grants_cookbook_recipes_to_counter_food_prep_tenants()
    {
        // Grocery Counter tenant cannot use recipes
        $this->assertFalse(PlanRepository::canUseFeature($this->counterTenant, 'recipes'));

        // Cafe Counter tenant can use recipes (Cookbook on Counter)
        $cafeTenant = Tenant::create([
            'name'            => 'City Cafe',
            'slug'            => 'city-cafe',
            'plan'            => 'counter',
            'setup_completed' => true,
            'industry'        => 'cafe',
        ]);

        $this->assertTrue(PlanRepository::canUseFeature($cafeTenant, 'recipes'));
        $this->assertTrue(PlanRepository::canUseFeature($cafeTenant, 'bill_of_materials'));
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
}
