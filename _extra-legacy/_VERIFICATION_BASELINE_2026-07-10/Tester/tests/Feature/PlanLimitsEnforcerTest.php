<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Plan;
use App\Models\Platform;
use Illuminate\Support\Facades\Route;
use Tests\Feature\VenQoreTestCase;

class PlanLimitsEnforcerTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Ensure we have a platform and plans defined
        $platform = Platform::firstOrCreate(
            ['slug' => 'venqore'],
            ['name' => 'VenQore Platform', 'is_active' => true]
        );

        Plan::firstOrCreate(
            ['slug' => 'starter'],
            [
                'platform_id' => $platform->id,
                'name' => 'Starter Plan',
                'type' => 'subscription',
                'is_active' => true,
                'is_visible' => true,
            ]
        );
    }

    /** @test */
    public function exceeding_limit_starts_3_day_countdown()
    {
        $tenant = $this->createTenant('starter-limit-store', 'starter', 'active');
        $user = $this->createTenantUser($tenant, 'owner');

        // Bypassing scope/DB restrictions to set plan limits explicitly
        $plan = Plan::where('slug', 'starter')->first();
        $plan->limits()->updateOrCreate(['key' => 'sku_limit'], ['value' => '5']);

        // Clear repo cache so it reads updated limits
        \App\Services\PlanRepository::invalidatePlanCache('starter');

        // Create 6 products (limit is 5)
        for ($i = 0; $i < 6; $i++) {
            \App\Models\Product::factory()->create([
                'tenant_id' => $tenant->id,
                'name' => "Product {$i}",
                'sku' => "SKU-{$i}",
            ]);
        }

        // Initially limit_grace_ends_at should be null
        $this->assertNull($tenant->limit_grace_ends_at);

        // Bind tenant so HasTenant scope can count products correctly
        app()->instance('current.tenant', $tenant);

        // Run limits status check
        $status = $tenant->checkLimitsStatus();
        $this->assertTrue($status['is_over_limit']);
        $this->assertEquals('sku_limit', $status['exceeded_feature']);
        $this->assertEquals(6, $status['current_count']);
        $this->assertEquals(5, $status['limit']);

        // Request dashboard to trigger middleware check
        $this->actingAsTenantUserModel($user, $tenant);
        
        $response = $this->get($this->storeUrl($tenant, 'dashboard'));

        $tenant->refresh();
        $this->assertNotNull($tenant->limit_grace_ends_at);
        $this->assertTrue(now()->addDays(3)->diffInMinutes($tenant->limit_grace_ends_at) < 5); // roughly 3 days
    }

    /** @test */
    public function self_healing_clears_grace_period_and_view_only_mode()
    {
        $tenant = $this->createTenant('starter-limit-store', 'starter', 'active');
        $user = $this->createTenantUser($tenant, 'owner');

        $tenant->update([
            'limit_grace_ends_at' => now()->addDays(2),
            'view_only_since' => now()->subHours(1),
        ]);

        $plan = Plan::where('slug', 'starter')->first();
        $plan->limits()->updateOrCreate(['key' => 'sku_limit'], ['value' => '5']);
        \App\Services\PlanRepository::invalidatePlanCache('starter');

        // Create 3 products (limit is 5) - so we are under limit
        for ($i = 0; $i < 3; $i++) {
            \App\Models\Product::factory()->create([
                'tenant_id' => $tenant->id,
                'name' => "Product {$i}",
                'sku' => "SKU-{$i}",
            ]);
        }

        $this->actingAsTenantUserModel($user, $tenant);
        $response = $this->get($this->storeUrl($tenant, 'dashboard'));

        $tenant->refresh();
        $this->assertNull($tenant->limit_grace_ends_at);
        $this->assertNull($tenant->view_only_since);
    }

    /** @test */
    public function expired_countdown_triggers_view_only_lock()
    {
        $tenant = $this->createTenant('starter-limit-store', 'starter', 'active');
        $user = $this->createTenantUser($tenant, 'owner');

        $tenant->update([
            'limit_grace_ends_at' => now()->subMinutes(1), // already expired
        ]);

        $plan = Plan::where('slug', 'starter')->first();
        $plan->limits()->updateOrCreate(['key' => 'sku_limit'], ['value' => '5']);
        \App\Services\PlanRepository::invalidatePlanCache('starter');

        // Over limit: 6 products
        for ($i = 0; $i < 6; $i++) {
            \App\Models\Product::factory()->create([
                'tenant_id' => $tenant->id,
                'name' => "Product {$i}",
                'sku' => "SKU-{$i}",
            ]);
        }

        $this->actingAsTenantUserModel($user, $tenant);
        $response = $this->get($this->storeUrl($tenant, 'dashboard'));

        $tenant->refresh();
        $this->assertNotNull($tenant->view_only_since);
        $this->assertTrue(now()->diffInMinutes($tenant->view_only_since) < 5);
    }
}
