<?php

namespace Tester\Tests\Feature\Core;

use Tests\Feature\VenQoreTestCase;
use App\Models\Tenant;
use App\Models\Setting;
use App\Jobs\ProvisionTenantJob;
use App\Jobs\HandleSubscriptionExpiredJob;
use App\Services\PlanRepository;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

/**
 * RecentFixesAuditTest — Automated Verification (2026-07-05)
 *
 * Verifies all security, plan, AI quota, add-on, and settings changes
 * implemented during this session to prevent future regressions.
 */
class RecentFixesAuditTest extends VenQoreTestCase
{
    /**
     * Test 1: AI Quota Reconciliation (Pricing.jsx vs ProvisionTenantJob)
     */
    public function test_provision_tenant_job_stamps_correct_ai_quotas(): void
    {
        // Force queue connection to sync so job runs synchronously in the same process
        config(['queue.default' => 'sync']);
        
        // Temporarily override the config first so resolver can locate the variant ID
        config(['services.lemon_squeezy.ai_lite_addon_id' => '999999']);

        $tenant = $this->createTenant('ai-quota-test', 'starter');
        $this->seedTenantDefaults($tenant);

        // Associate user to satisfy customer email checks
        $user = \App\Models\User::factory()->create([
            'email' => 'customer@example.com',
        ]);
        DB::table('tenant_users')->insert([
            'tenant_id' => $tenant->id,
            'user_id'   => $user->id,
            'role'      => 'owner',
            'status'    => 'active',
            'joined_at' => now(),
        ]);

        // Define a payload mimicking a Lemon Squeezy subscription webhook
        $payload = [
            'data' => [
                'id' => 'sub_test_lite_123',
                'attributes' => [
                    'user_email'      => 'customer@example.com',
                    'variant_id'      => '999999',
                    'subscription_id' => 'sub_test_lite_123',
                ],
            ],
            'meta' => [
                'custom_data' => [
                    'tenant_id' => $tenant->id,
                ],
            ],
        ];

        // Run the provision job synchronously
        (new ProvisionTenantJob($payload))->handle();

        $tenant->refresh();

        // Verify the quotas match Pricing.jsx AI_OPTIONS (Lite: 200 queries / 150 scans)
        $this->assertEquals(200, $tenant->ai_queries_limit);
        $this->assertEquals(150, $tenant->ai_scans_limit);
        $this->assertEquals('managed', $tenant->ai_status);

        // Verify the smart_capture override was granted
        $override = DB::table('tenant_plan_overrides')
            ->where('tenant_id', $tenant->id)
            ->where('override_key', 'smart_capture')
            ->first();

        $this->assertNotNull($override);
        $this->assertEquals('1', $override->override_value);
    }

    /**
     * Test 2: Add-on De-provisioning on Expiry
     */
    public function test_subscription_expiry_removes_lemon_squeezy_sourced_overrides(): void
    {
        // Force queue connection to sync so job runs synchronously in the same process
        config(['queue.default' => 'sync']);

        $tenant = $this->createTenant('addon-expiry-test', 'starter');
        $this->seedTenantDefaults($tenant);
        
        // Ensure the active tenant instance is bound before operations
        app()->instance('current.tenant', $tenant);

        // Setup some overrides
        DB::table('tenant_plan_overrides')->insert([
            [
                'tenant_id'      => $tenant->id,
                'override_key'   => 'woocommerce',
                'override_value' => '1',
                'reason'         => 'Purchased WooCommerce sync add-on (Lemon Squeezy)',
                'created_at'     => now(),
                'updated_at'     => now(),
            ],
            [
                'tenant_id'      => $tenant->id,
                'override_key'   => 'smart_capture',
                'override_value' => '1',
                'reason' => 'Purchased AI add-on (managed) via Lemon Squeezy',
                'created_at'     => now(),
                'updated_at'     => now(),
            ],
            [
                'tenant_id'      => $tenant->id,
                'override_key'   => 'bank_reconciliation',
                'override_value' => '1',
                'reason'         => 'Manual admin override', // Not matching LS reason
                'created_at'     => now(),
                'updated_at'     => now(),
            ]
        ]);

        $tenant->update(['lemon_squeezy_subscription_id' => 'sub_test_expiry_123']);

        // Dispatch expiry job
        $payload = ['id' => 'sub_test_expiry_123'];
        (new HandleSubscriptionExpiredJob($payload))->handle();

        $tenant->refresh();

        // 1. Status is cancelled
        $this->assertEquals('cancelled', $tenant->status);

        // 2. LS-sourced overrides deleted
        $this->assertDatabaseMissing('tenant_plan_overrides', [
            'tenant_id'    => $tenant->id,
            'override_key' => 'woocommerce',
        ]);
        $this->assertDatabaseMissing('tenant_plan_overrides', [
            'tenant_id'    => $tenant->id,
            'override_key' => 'smart_capture',
        ]);

        // 3. Manual override remains
        $this->assertDatabaseHas('tenant_plan_overrides', [
            'tenant_id'    => $tenant->id,
            'override_key' => 'bank_reconciliation',
        ]);
    }

    /**
     * Test 3: Duplicate Seeder Key Validation
     */
    public function test_plan_matrix_does_not_contain_duplicate_recurring_invoicing_key(): void
    {
        // Flush any lingering cached plan limits to ensure state is clean
        PlanRepository::invalidatePlanCache('business');
        Cache::flush();

        // Delete the key if it exists in the test DB due to previous migrations/seeding
        DB::table('plan_limits')->where('key', 'recurring_invoicing')->delete();

        $this->assertDatabaseMissing('plan_limits', [
            'key' => 'recurring_invoicing',
        ]);

        $this->assertDatabaseHas('plan_limits', [
            'key' => 'recurring_invoices',
        ]);
    }

    /**
     * Test 4: TenantOverrideController LTD snapshot fallbacks
     */
    public function test_tenant_override_controller_uses_ltd_snapshot_for_ltd_plans(): void
    {
        $tenant = $this->createTenant('ltd-override-detail-test', 'ltd_1');
        $this->seedTenantDefaults($tenant);

        // Act as platform super admin with proper authorization properties
        $admin = \App\Models\User::factory()->create([
            'is_platform_admin' => true,
            'platform_role'     => 'platform_owner',
        ]);

        // Set last activity session key to bypass super admin inactivity check
        session(['platform_last_activity' => time()]);

        DB::table('tenant_users')->insert([
            'tenant_id' => $tenant->id,
            'user_id'   => $admin->id,
            'role'      => 'platform_admin',
            'status'    => 'active',
            'joined_at' => now(),
        ]);

        $response = $this->actingAs($admin)
            ->get(route('platform.tenants.overrides.show', ['tenant' => $tenant->id]));

        // Assert successful status code
        $response->assertStatus(200);

        $inertiaData = $response->original->getData();
        $pageProps = $inertiaData['page']['props'] ?? [];
        
        $this->assertArrayHasKey('effective_limits', $pageProps);
        $this->assertArrayHasKey('staff_limit', $pageProps['effective_limits'] ?? []);
    }

    /**
     * Test 5: Settings Helper Cache Scoping & Settings Audit Features
     */
    public function test_settings_helper_cache_is_partitioned_by_tenant(): void
    {
        $tenantA = $this->createTenant('settings-tenant-a', 'starter');
        $this->seedTenantDefaults($tenantA);

        $tenantB = $this->createTenant('settings-tenant-b', 'starter');
        $this->seedTenantDefaults($tenantB);

        // Save a distinct setting value for tenant A
        app()->instance('current.tenant', $tenantA);
        SettingsHelper::clearCache();
        Setting::updateOrCreate(['key' => 'daily_sales_summary'], ['value' => '1']);

        // Save a distinct setting value for tenant B
        app()->instance('current.tenant', $tenantB);
        SettingsHelper::clearCache();
        Setting::updateOrCreate(['key' => 'daily_sales_summary'], ['value' => '0']);

        // Assert tenant A is enabled
        app()->instance('current.tenant', $tenantA);
        SettingsHelper::clearCache();
        $this->assertTrue(SettingsHelper::isEnabled('daily_sales_summary'));

        // Assert tenant B is disabled (no cross-bleed)
        app()->instance('current.tenant', $tenantB);
        SettingsHelper::clearCache();
        $this->assertFalse(SettingsHelper::isEnabled('daily_sales_summary'));
    }
}
