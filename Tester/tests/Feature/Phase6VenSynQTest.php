<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureVenSynQAccess;
use App\Jobs\ProvisionTenantJob;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\PlanGate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class Phase6VenSynQTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\PlanFeatureMatrixSeeder::class);

        $this->tenant = Tenant::create([
            'name'            => 'VenSynQ Store',
            'slug'            => 'vensynq-store',
            'plan'            => 'starter',
            'status'          => 'active',
            'setup_completed' => true,
        ]);

        $this->user = User::factory()->create([
            'last_store_id'     => $this->tenant->id,
            'is_platform_admin' => true,
        ]);

        TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);
    }

    /** @test */
    public function it_provisions_amazon_addon_and_creates_plan_overrides()
    {
        Config::set('services.lemon_squeezy.amazon_addon_id', '998877');

        $payload = [
            'meta' => [
                'custom_data' => [
                    'tenant_id' => (string) $this->tenant->id,
                    'variant_id' => '998877',
                ],
            ],
            'data' => [
                'attributes' => [
                    'user_email'      => $this->user->email,
                    'variant_id'      => '998877',
                    'subscription_id' => 'sub_amazon_123',
                ],
            ],
        ];

        $job = new ProvisionTenantJob($payload);
        $job->handle();

        $fresh = $this->tenant->fresh();
        $this->assertContains('amazon', $fresh->sync_channels ?? []);

        // Assert tenant_plan_overrides created for both 'amazon' and 'vensync_command'
        $amazonOverride = DB::table('tenant_plan_overrides')
            ->where('tenant_id', $this->tenant->id)
            ->where('override_key', 'amazon')
            ->first();

        $vensyncOverride = DB::table('tenant_plan_overrides')
            ->where('tenant_id', $this->tenant->id)
            ->where('override_key', 'vensync_command')
            ->first();

        $this->assertNotNull($amazonOverride, 'Amazon plan override row was not created');
        $this->assertEquals('1', $amazonOverride->override_value);

        $this->assertNotNull($vensyncOverride, 'VenSynQ Command plan override row was not created');
        $this->assertEquals('1', $vensyncOverride->override_value);
    }

    /** @test */
    public function it_validates_and_generates_checkout_url_for_amazon_and_woocommerce_addons()
    {
        // Production-path HTTP test with NO middleware bypassed
        Http::fake([
            'https://api.lemonsqueezy.com/v1/checkouts' => Http::response([
                'data' => [
                    'attributes' => [
                        'url' => 'https://checkout.lemonsqueezy.com/buy/mock-checkout-url',
                    ],
                ],
            ], 201),
        ]);

        Config::set('services.lemon_squeezy.api_key', 'test_key_123');
        Config::set('services.lemon_squeezy.store_id', 'test_store_123');
        Config::set('services.lemon_squeezy.amazon_addon_id', 'var_amazon_123');
        Config::set('services.lemon_squeezy.woocommerce_addon_id', 'var_woo_123');

        app()->instance('current.tenant', $this->tenant);

        // Test Amazon Add-on Checkout via real HTTP stack (no withoutMiddleware)
        $responseAmazon = $this->actingAs($this->user)
            ->postJson("/s/{$this->tenant->slug}/billing/checkout-addon", [
                'addon_type' => 'sync_amazon',
            ]);

        $responseAmazon->assertStatus(200)
            ->assertJson(['url' => 'https://checkout.lemonsqueezy.com/buy/mock-checkout-url']);

        // Test WooCommerce Add-on Checkout via real HTTP stack (no withoutMiddleware)
        $responseWoo = $this->actingAs($this->user)
            ->postJson("/s/{$this->tenant->slug}/billing/checkout-addon", [
                'addon_type' => 'sync_woocommerce',
            ]);

        $responseWoo->assertStatus(200)
            ->assertJson(['url' => 'https://checkout.lemonsqueezy.com/buy/mock-checkout-url']);
    }

    /** @test */
    public function it_blocks_unentitled_tenant_from_accessing_vensynq_dashboard_end_to_end()
    {
        // True E2E test through the full real middleware stack (no withoutMiddleware)
        Config::set('vensynq.enabled', true);
        app()->instance('current.tenant', $this->tenant);

        // Starter plan by default has vensync_command = 0 -> expect 403
        $response = $this->actingAs($this->user)
            ->get("/s/{$this->tenant->slug}/vensynq");

        $response->assertStatus(403);
    }

    /** @test */
    public function it_allows_entitled_tenant_to_access_vensynq_dashboard_end_to_end()
    {
        // True E2E test through the full real middleware stack (no withoutMiddleware)
        Config::set('vensynq.enabled', true);
        app()->instance('current.tenant', $this->tenant);

        // Grant vensync_command override
        DB::table('tenant_plan_overrides')->insert([
            'tenant_id'      => $this->tenant->id,
            'override_key'   => 'vensync_command',
            'override_value' => '1',
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        \App\Services\PlanRepository::invalidateTenantCache($this->tenant->id);

        $response = $this->actingAs($this->user)
            ->get("/s/{$this->tenant->slug}/vensynq");

        $response->assertStatus(200);
    }

    /** @test */
    public function it_ensures_vensynq_simulation_mode_defaults_to_false()
    {
        $simulationMode = config('vensynq.simulation_mode');
        $this->assertFalse((bool) $simulationMode, 'vensynq.simulation_mode must default to false for production safety');
    }
}
