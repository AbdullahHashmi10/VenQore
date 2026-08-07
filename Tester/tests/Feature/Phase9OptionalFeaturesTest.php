<?php

namespace Tests\Feature;

use App\Models\KitchenOrder;
use App\Models\Product;
use App\Models\RestaurantTable;
use App\Models\Tenant;
use App\Services\PlanGate;
use App\Services\SmartCapture\FuzzyMatchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Phase9OptionalFeaturesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PlanFeatureMatrixSeeder::class);
    }

    /**
     * T9-8: Test bulk_upload plan gate check and subscription enforcement.
     */
    public function test_bulk_upload_plan_gate_allows_growth_and_blocks_starter(): void
    {
        $starterTenant = Tenant::factory()->create(['plan' => 'starter']);
        app()->instance('current.tenant', $starterTenant);

        $this->assertFalse(PlanGate::check('bulk_upload'), 'Starter plan should not have bulk_upload entitlement.');

        $growthTenant = Tenant::factory()->create(['plan' => 'growth']);
        app()->instance('current.tenant', $growthTenant);

        $this->assertTrue(PlanGate::check('bulk_upload'), 'Growth plan must have bulk_upload entitlement.');
    }

    /**
     * T9-9: Test Restaurant floor management and KDS order status persistence.
     */
    public function test_restaurant_dashboard_and_kitchen_status_updates(): void
    {
        $tenant = Tenant::factory()->create([
            'plan'            => 'growth',
            'slug'            => 'test-bistro',
            'setup_completed' => true,
            'status'          => 'active',
        ]);

        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);

        // Create TenantUser membership so TenantMiddleware grants access
        \App\Models\TenantUser::create([
            'user_id'   => $user->id,
            'tenant_id' => $tenant->id,
            'role'      => 'owner',
            'status'    => 'active',
        ]);

        // 1. Visit Dashboard index (auto-seeds tables)
        $response = $this->get('/s/' . $tenant->slug . '/restaurant/dashboard');
        $response->assertStatus(200);

        $table = RestaurantTable::where('tenant_id', $tenant->id)->first();
        $this->assertNotNull($table);

        // 2. Update Table status
        $updateTableResp = $this->post('/s/' . $tenant->slug . '/restaurant/table/' . $table->id . '/status', [
            'status' => 'cleaning',
        ], ['HTTP_ACCEPT' => 'application/json']);

        $updateTableResp->assertStatus(200);
        $this->assertEquals('cleaning', $table->fresh()->status);

        // 3. Visit Kitchen KDS (auto-seeds orders)
        $kitchenResp = $this->get('/s/' . $tenant->slug . '/restaurant/kitchen');
        $kitchenResp->assertStatus(200);

        $order = KitchenOrder::where('tenant_id', $tenant->id)->first();
        $this->assertNotNull($order);

        // 4. Update Kitchen order status
        $updateOrderResp = $this->post('/s/' . $tenant->slug . '/restaurant/order/' . $order->id . '/status', [
            'status' => 'ready',
        ], ['HTTP_ACCEPT' => 'application/json']);

        $updateOrderResp->assertStatus(200);
        $this->assertEquals('ready', $order->fresh()->status);
    }

    /**
     * T9-7: Test Cosine Embedding vector similarity matching in FuzzyMatchService.
     */
    public function test_cosine_embedding_vector_similarity_matching(): void
    {
        $tenant = Tenant::factory()->create(['plan' => 'growth']);
        app()->instance('current.tenant', $tenant);

        Product::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Organic Fresh Milk 1L',
            'sku' => 'MILK-001',
        ]);

        $fuzzyService = app(FuzzyMatchService::class);

        // Test Cosine Similarity directly
        $sim1 = $fuzzyService->matchByCosineEmbedding('Organic Fresh Milk 1L', 'Organic Fresh Milk 1L');
        $this->assertEquals(1.0, $sim1);

        $sim2 = $fuzzyService->matchByCosineEmbedding('Fresh Milk 1L', 'Organic Fresh Milk 1L');
        $this->assertGreaterThan(0.6, $sim2);

        // Test integrated product matching
        $matches = $fuzzyService->matchProduct('Organic Milk 1L');
        $this->assertNotEmpty($matches);
        $this->assertEquals('Organic Fresh Milk 1L', $matches[0]['product']->name);
    }

    /**
     * T1-1: Test Pre-scan hint parameters acceptance.
     */
    public function test_prescan_hints_validation_and_acceptance(): void
    {
        $tenant = Tenant::factory()->create(['plan' => 'growth', 'slug' => 'hint-store']);
        app()->instance('current.tenant', $tenant);

        $response = $this->postJson('/s/' . $tenant->slug . '/smart-capture/scan', [
            'type'            => 'text',
            'text'            => '1x Espresso Coffee 3.50',
            'target_type'     => 'sale',
            'document_type'   => 'receipt',
            'is_handwritten'  => true,
        ]);

        // If no AI key configured, it will fail gracefully with 500/400 key error rather than 422 Validation error for missing hints
        $this->assertNotEquals(422, $response->status(), 'Pre-scan hints must pass request validation cleanly.');
    }
}
