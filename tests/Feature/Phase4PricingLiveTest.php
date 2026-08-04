<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\PlanRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Phase4PricingLiveTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\PlanFeatureMatrixSeeder::class);
    }

    /** @test */
    public function it_loads_single_source_of_truth_pricing_config()
    {
        $pricing = config('pricing');

        $this->assertNotNull($pricing);
        $this->assertArrayHasKey('plans', $pricing);
        $this->assertArrayHasKey('counter', $pricing['plans']);
        $this->assertArrayHasKey('starter', $pricing['plans']);
        $this->assertArrayHasKey('growth', $pricing['plans']);
        $this->assertArrayHasKey('business', $pricing['plans']);

        $this->assertEquals(18.00, $pricing['plans']['counter']['price_monthly']);
        $this->assertEquals(36.00, $pricing['plans']['starter']['price_monthly']);
        $this->assertEquals(63.00, $pricing['plans']['growth']['price_monthly']);
        $this->assertEquals(129.00, $pricing['plans']['business']['price_monthly']);

        $this->assertArrayHasKey('ai_tiers', $pricing);
        $this->assertArrayHasKey('spark', $pricing['ai_tiers']);
        $this->assertArrayHasKey('shop', $pricing['ai_tiers']);
        $this->assertArrayHasKey('pro', $pricing['ai_tiers']);
        $this->assertArrayHasKey('max', $pricing['ai_tiers']);
    }

    /** @test */
    public function it_seeds_v4_plans_with_correct_visibility_flags()
    {
        $counter = \Illuminate\Support\Facades\DB::table('plans')->where('slug', 'counter')->first();
        $this->assertNotNull($counter);
        $this->assertTrue((bool)$counter->is_visible);

        $ltd1 = \Illuminate\Support\Facades\DB::table('plans')->where('slug', 'ltd_1')->first();
        $this->assertNotNull($ltd1);
        $this->assertFalse((bool)$ltd1->is_visible);
    }

    /** @test */
    public function it_shares_pricing_config_in_inertia_props()
    {
        $tenant = Tenant::create([
            'name'             => 'V4 Test Store',
            'slug'             => 'v4-test-store',
            'plan'             => 'starter',
            'status'           => 'active',
            'setup_completed'  => true,
            'industry'         => 'retail',
        ]);

        app()->instance('current.tenant', $tenant);

        $user = User::factory()->create(['is_platform_admin' => true]);
        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);
        $this->actingAs($user);

        $response = $this->get("/s/{$tenant->slug}/dashboard");
        $response->assertStatus(200);

        $page = $response->inertiaPage();
        $this->assertNotNull($page['props']['pricing']);
        $this->assertArrayHasKey('plans', $page['props']['pricing']);
    }

    /** @test */
    public function it_executes_v4_tenant_migration_command()
    {
        $legacyTenant = Tenant::create([
            'name'             => 'Legacy Lite Store',
            'slug'             => 'legacy-lite-store',
            'plan'             => 'lite',
            'status'           => 'active',
            'setup_completed'  => true,
            'industry'         => 'retail',
        ]);

        $this->artisan('app:migrate-tenants-v4')
            ->assertExitCode(0);

        $this->assertEquals('counter', $legacyTenant->fresh()->plan);
    }
}
