<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Platform;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PlanGate;
use App\Exceptions\PlanLimitException;
use Tests\Feature\VenQoreTestCase;

class PlanManagementTest extends VenQoreTestCase
{
    /** @test */
    public function pricing_page_is_accessible(): void
    {
        $response = $this->get('/pricing');
        $response->assertOk();
    }

    /** @test */
    public function super_admin_can_access_plans_index(): void
    {
        $response = $this->actingAsSuperAdmin()
            ->get('/VenQore/plans');
        
        $response->assertOk();
    }

    /** @test */
    public function super_admin_can_update_plan_limits(): void
    {
        $platform = Platform::firstOrCreate(
            ['slug' => 'venqore'],
            ['name' => 'VenQore Platform', 'is_active' => true]
        );

        $plan = Plan::firstOrCreate(
            ['slug' => 'standard'],
            [
                'platform_id' => $platform->id,
                'name' => 'Standard Plan',
                'type' => 'subscription',
                'price_monthly' => 19.00,
                'is_active' => true,
                'is_visible' => true,
            ]
        );

        $response = $this->actingAsSuperAdmin()
            ->put("/VenQore/plans/{$plan->id}", [
                'name' => 'Updated Plan Name',
                'limits' => [
                    ['key' => 'smart_capture', 'value' => '1', 'reset_period' => 'never'],
                    ['key' => 'bill_of_materials', 'value' => '0', 'reset_period' => 'never'],
                ]
            ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('plan_limits', [
            'plan_id' => $plan->id,
            'key' => 'smart_capture',
            'value' => '1',
        ]);

        $this->assertDatabaseHas('plan_limits', [
            'plan_id' => $plan->id,
            'key' => 'bill_of_materials',
            'value' => '0',
        ]);
    }

    /** @test */
    public function super_admin_can_bulk_update_plan_limits(): void
    {
        $platform = Platform::firstOrCreate(
            ['slug' => 'venqore'],
            ['name' => 'VenQore Platform', 'is_active' => true]
        );

        $plan1 = Plan::firstOrCreate(
            ['slug' => 'starter_test'],
            [
                'platform_id' => $platform->id,
                'name' => 'Starter Test Plan',
                'type' => 'subscription',
                'is_active' => true,
                'is_visible' => true,
            ]
        );

        $plan2 = Plan::firstOrCreate(
            ['slug' => 'growth_test'],
            [
                'platform_id' => $platform->id,
                'name' => 'Growth Test Plan',
                'type' => 'subscription',
                'is_active' => true,
                'is_visible' => true,
            ]
        );

        $response = $this->actingAsSuperAdmin()
            ->put(route('platform.plans.bulk-update'), [
                'changes' => [
                    $plan1->id => [
                        'woocommerce' => '1',
                        'staff_limit' => '5'
                    ],
                    $plan2->id => [
                        'woocommerce' => '0',
                        'staff_limit' => '15'
                    ]
                ]
            ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('plan_limits', [
            'plan_id' => $plan1->id,
            'key' => 'woocommerce',
            'value' => '1'
        ]);
        $this->assertDatabaseHas('plan_limits', [
            'plan_id' => $plan1->id,
            'key' => 'staff_limit',
            'value' => '5'
        ]);
        $this->assertDatabaseHas('plan_limits', [
            'plan_id' => $plan2->id,
            'key' => 'woocommerce',
            'value' => '0'
        ]);
        $this->assertDatabaseHas('plan_limits', [
            'plan_id' => $plan2->id,
            'key' => 'staff_limit',
            'value' => '15'
        ]);
    }

    /** @test */
    public function plangate_allows_and_blocks_features_correctly(): void
    {
        $tenant = $this->createTenant('gated-store', 'trial');
        $user = $this->createTenantUser($tenant, 'owner');

        $this->bindTenantContext($tenant, $user);

        $platform = Platform::firstOrCreate(
            ['slug' => 'venqore'],
            ['name' => 'VenQore Platform', 'is_active' => true]
        );

        $plan = Plan::firstOrCreate(
            ['slug' => 'trial'],
            [
                'platform_id' => $platform->id,
                'name' => 'Trial Plan',
                'type' => 'trial',
                'is_active' => true,
                'is_visible' => true,
            ]
        );

        // Disable bill_of_materials, Enable smart_capture
        $plan->limits()->updateOrCreate(['key' => 'bill_of_materials'], ['value' => '0']);
        $plan->limits()->updateOrCreate(['key' => 'smart_capture'], ['value' => '1']);

        // Force invalidation of the plan cache
        \App\Services\PlanRepository::invalidatePlanCache('trial');

        // Test check
        $this->assertTrue(PlanGate::check('smart_capture'));
        $this->assertFalse(PlanGate::check('bill_of_materials'));

        // Test enforce throws Exception
        $this->expectException(PlanLimitException::class);
        PlanGate::enforce('bill_of_materials');
    }
}
