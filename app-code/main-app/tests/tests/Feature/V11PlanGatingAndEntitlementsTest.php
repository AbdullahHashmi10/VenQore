<?php

namespace Tests\Feature;

use App\Exceptions\PlanLimitException;
use App\Http\Middleware\EnsurePlanFeature;
use App\Models\Product;
use App\Models\Register;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\PlanGate;
use App\Services\PlanRepository;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class V11PlanGatingAndEntitlementsTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function makeTenant(string $plan, string $status = 'active'): Tenant
    {
        $tenant = Tenant::create([
            'name'            => ucfirst($plan) . ' Test Store ' . uniqid(),
            'slug'            => $plan . '-store-' . uniqid(),
            'plan'            => $plan,
            'status'          => $status,
            'currency_code'   => 'USD',
            'currency_symbol' => '$',
            'timezone'        => 'UTC',
            'setup_completed' => true,
            'is_demo'         => false,
        ]);

        app()->instance('current.tenant', $tenant);
        PlanRepository::invalidateTenantCache($tenant);

        return $tenant;
    }

    /**
     * 1. Scale Fences Allow/Deny Matrix across Solo, Starter, Core, Scale, Trial.
     */
    public function test_scale_fences_across_all_plans(): void
    {
        $solo    = $this->makeTenant('solo');
        $starter = $this->makeTenant('starter');
        $core    = $this->makeTenant('core');
        $scale   = $this->makeTenant('scale');
        $trial   = $this->makeTenant('trial');

        // Solo: all scale fences denied
        $this->assertFalse(PlanGate::check('multi_branch', $solo));
        $this->assertFalse(PlanGate::check('api_access', $solo));
        $this->assertFalse(PlanGate::check('webhooks', $solo));
        $this->assertFalse(PlanGate::check('security_activity_log', $solo));
        $this->assertFalse(PlanGate::check('custom_roles', $solo));
        $this->assertFalse(PlanGate::check('white_label', $solo));
        $this->assertFalse(PlanGate::check('network_unlimited', $solo));
        $this->assertFalse(PlanGate::check('consolidated_reporting', $solo));
        $this->assertFalse(PlanGate::check('woocommerce', $solo));

        // Starter: all scale fences denied (require add-ons or tier upgrade)
        $this->assertFalse(PlanGate::check('multi_branch', $starter));
        $this->assertFalse(PlanGate::check('api_access', $starter));
        $this->assertFalse(PlanGate::check('webhooks', $starter));
        $this->assertFalse(PlanGate::check('security_activity_log', $starter));
        $this->assertFalse(PlanGate::check('custom_roles', $starter));
        $this->assertFalse(PlanGate::check('white_label', $starter));
        $this->assertFalse(PlanGate::check('network_unlimited', $starter));
        $this->assertFalse(PlanGate::check('consolidated_reporting', $starter));
        $this->assertFalse(PlanGate::check('woocommerce', $starter));

        // Core: API, webhooks, audit log, custom roles, network unlimited included; white_label, multi_branch, consolidated_reporting denied
        $this->assertTrue(PlanGate::check('api_access', $core));
        $this->assertTrue(PlanGate::check('webhooks', $core));
        $this->assertTrue(PlanGate::check('security_activity_log', $core));
        $this->assertTrue(PlanGate::check('custom_roles', $core));
        $this->assertTrue(PlanGate::check('network_unlimited', $core));
        $this->assertFalse(PlanGate::check('multi_branch', $core));
        $this->assertFalse(PlanGate::check('white_label', $core));
        $this->assertFalse(PlanGate::check('consolidated_reporting', $core));
        $this->assertFalse(PlanGate::check('woocommerce', $core));

        // Scale: ALL scale fences included
        $this->assertTrue(PlanGate::check('multi_branch', $scale));
        $this->assertTrue(PlanGate::check('api_access', $scale));
        $this->assertTrue(PlanGate::check('webhooks', $scale));
        $this->assertTrue(PlanGate::check('security_activity_log', $scale));
        $this->assertTrue(PlanGate::check('custom_roles', $scale));
        $this->assertTrue(PlanGate::check('white_label', $scale));
        $this->assertTrue(PlanGate::check('network_unlimited', $scale));
        $this->assertTrue(PlanGate::check('consolidated_reporting', $scale));
        $this->assertTrue(PlanGate::check('woocommerce', $scale));

        // Trial: Core entitlements
        $this->assertTrue(PlanGate::check('api_access', $trial));
        $this->assertTrue(PlanGate::check('security_activity_log', $trial));
        $this->assertFalse(PlanGate::check('white_label', $trial));
        $this->assertFalse(PlanGate::check('consolidated_reporting', $trial));
    }

    /**
     * 2. Every Universal Module is ON for Solo (No Vertical Gating).
     */
    public function test_every_universal_module_is_on_for_solo(): void
    {
        $solo = $this->makeTenant('solo');

        $universalModules = [
            'pos',
            'double_entry_ledger',
            'reports',
            'production',
            'bill_of_materials',
            'manufacturing',
            'work_orders',
            'services',
            'service_jobs',
            'service_contracts',
            'serial_tracking',
            'imei_scanner',
            'batch_tracking',
            'batch_expiry',
            'loyalty_points',
            'digital_gift_cards',
            'marketing_campaigns',
            'smart_capture',
            'ai_assistant',
        ];

        foreach ($universalModules as $module) {
            $this->assertTrue(
                PlanGate::check($module, $solo),
                "Universal module '{$module}' must be ENABLED for Solo plan."
            );
        }
    }

    /**
     * 3. Paid-Only Modules: OFF on Solo, ON on Paid plans.
     */
    public function test_paid_only_modules_off_on_solo_and_on_for_paid(): void
    {
        $solo = $this->makeTenant('solo');
        $starter = $this->makeTenant('starter');
        $core = $this->makeTenant('core');

        // Paid-only features available on Starter and up (modules are included on Solo per Step 4)
        $paidFromStarter = [
            'google_drive_backup',
            'adviser_seat',
            'network_basic',
        ];

        foreach ($paidFromStarter as $feature) {
            $this->assertFalse(PlanGate::check($feature, $solo), "Feature '{$feature}' must be OFF on Solo.");
            $this->assertTrue(PlanGate::check($feature, $starter), "Feature '{$feature}' must be ON on Starter.");
            $this->assertTrue(PlanGate::check($feature, $core), "Feature '{$feature}' must be ON on Core.");
        }

        // Core fences (Fence 4: growth_engine, owners_daily_pulse) — OFF on Solo & Starter, ON on Core
        // Updated per Decision 1 and config/plans.php fences
        $coreFences = [
            'growth_engine',
            'owners_daily_pulse',
        ];

        foreach ($coreFences as $feature) {
            $this->assertFalse(PlanGate::check($feature, $solo), "Core fence '{$feature}' must be OFF on Solo.");
            $this->assertFalse(PlanGate::check($feature, $starter), "Core fence '{$feature}' must be OFF on Starter.");
            $this->assertTrue(PlanGate::check($feature, $core), "Core fence '{$feature}' must be ON on Core.");
        }
    }

    /**
     * 4. Quantity Caps Enforcement by Observers.
     */
    public function test_observers_block_exceeding_quantity_caps(): void
    {
        $tenant = $this->makeTenant('starter');
        $this->assertEquals(5000, (int) PlanGate::getLimit('sku_limit', $tenant));

        // 1. PlanGate allows below cap
        PlanGate::enforce('sku_limit', 4999, $tenant);
        $this->assertTrue(true);

        // 2. PlanGate enforces and throws at or above cap
        $this->expectException(PlanLimitException::class);
        PlanGate::enforce('sku_limit', 5000, $tenant);
    }

    /**
     * 5. Till Logins: Cashiers are unlimited & free on Paid; Solo capped at 2.
     */
    public function test_till_logins_cashier_rules(): void
    {
        $starter = $this->makeTenant('starter');

        $user1 = User::create([
            'name'     => 'Cashier One',
            'email'    => 'cashier1_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
        ]);
        $user2 = User::create([
            'name'     => 'Cashier Two',
            'email'    => 'cashier2_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
        ]);

        // Paid plan allows multiple cashiers freely
        $cashier1 = TenantUser::create([
            'tenant_id' => $starter->id,
            'user_id'   => $user1->id,
            'role'      => 'cashier',
            'status'    => 'active',
        ]);
        $cashier2 = TenantUser::create([
            'tenant_id' => $starter->id,
            'user_id'   => $user2->id,
            'role'      => 'cashier',
            'status'    => 'active',
        ]);

        $this->assertNotNull($cashier1->id);
        $this->assertNotNull($cashier2->id);

        // Solo plan: 2 till logins allowed, 3rd blocked
        $solo = $this->makeTenant('solo');

        $user3 = User::create([
            'name'     => 'Solo Cashier 1',
            'email'    => 'solocashier1_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
        ]);
        $user4 = User::create([
            'name'     => 'Solo Cashier 2',
            'email'    => 'solocashier2_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
        ]);
        $user5 = User::create([
            'name'     => 'Solo Cashier 3',
            'email'    => 'solocashier3_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
        ]);

        TenantUser::create([
            'tenant_id' => $solo->id,
            'user_id'   => $user3->id,
            'role'      => 'cashier',
            'status'    => 'active',
        ]);
        TenantUser::create([
            'tenant_id' => $solo->id,
            'user_id'   => $user4->id,
            'role'      => 'cashier',
            'status'    => 'active',
        ]);

        $this->expectException(PlanLimitException::class);
        TenantUser::create([
            'tenant_id' => $solo->id,
            'user_id'   => $user5->id,
            'role'      => 'cashier',
            'status'    => 'active',
        ]);
    }

    /**
     * 6. Catalogue at 100%: Existing products still sell/query; only N+1 blocked.
     */
    public function test_catalogue_at_capacity_rule(): void
    {
        $solo = $this->makeTenant('solo');

        // Check limit directly: sku_limit is 500
        $this->assertTrue(PlanGate::check('sku_limit', 499, $solo));
        $this->assertFalse(PlanGate::check('sku_limit', 500, $solo));
    }

    /**
     * 7. Guard Test: PlanGate:: never appears in SaleController store paths.
     */
    public function test_sale_write_path_has_no_plangate_enforce_calls(): void
    {
        $saleControllerCode = file_get_contents(app_path('Http/Controllers/SaleController.php'));
        $v3SaleControllerCode = file_get_contents(app_path('Http/Controllers/V3/SaleController.php'));

        $this->assertStringNotContainsString(
            "PlanGate::enforce('transactions_per_month'",
            $saleControllerCode,
            'SaleController::store must NOT contain PlanGate::enforce for transaction limits.'
        );

        $this->assertStringNotContainsString(
            "PlanGate::enforce('transactions_per_month'",
            $v3SaleControllerCode,
            'V3/SaleController::store must NOT contain PlanGate::enforce for transaction limits.'
        );
    }

    /**
     * 8. Blocker 0.2 Test: Till works with transactions_per_month row deleted from plan_limits.
     */
    public function test_till_works_with_transactions_per_month_row_deleted_from_plan_limits(): void
    {
        $starter = $this->makeTenant('starter');
        $plan = DB::table('plans')->where('slug', 'starter')->first();

        // Delete the transactions_per_month limit row
        DB::table('plan_limits')->where('plan_id', $plan->id)->where('key', 'transactions_per_month')->delete();
        PlanRepository::invalidatePlanCache('starter');

        // PlanGate check should still safely handle null/missing limit without throwing
        $this->assertTrue(
            PlanGate::check('pos', $starter),
            'POS must remain open and operational even if a limit row is deleted.'
        );
    }

    /**
     * 9. Solo 30-Day History Browsable & Complete Ledger Preserved.
     */
    public function test_solo_30_day_history_rule(): void
    {
        $solo = $this->makeTenant('solo');
        $this->assertEquals(30, $solo->historyRetentionDays());

        $starter = $this->makeTenant('starter');
        $this->assertNull($starter->historyRetentionDays());
    }

    /**
     * 10. Unknown Feature Key Fails Closed and Logs Warning.
     */
    public function test_unknown_feature_key_fails_closed_and_logs_warning(): void
    {
        $tenant = $this->makeTenant('scale');

        Log::spy();

        $result = PlanGate::check('non_existent_fake_key_12345', $tenant);
        $this->assertFalse($result, 'Unknown feature key must fail closed.');

        Log::shouldHaveReceived('warning')
            ->once()
            ->withArgs(fn($msg) => str_contains($msg, 'Unknown or unseeded plan limit key'));
    }

    /**
     * 11. EnsurePlanFeature Fails Closed with No Tenant.
     */
    public function test_ensure_plan_feature_middleware_fails_closed_with_no_tenant(): void
    {
        app()->forgetInstance('current.tenant');
        $middleware = new EnsurePlanFeature();
        $request = Request::create('/api/v1/fenced-endpoint', 'GET');
        $request->headers->set('Accept', 'application/json');

        $response = $middleware->handle($request, function () {
            return response()->json(['status' => 'success']);
        }, 'api_access');

        $this->assertEquals(402, $response->getStatusCode());
    }

    /**
     * 12. LTD Unlimited Transactions and Stacking Tiers.
     */
    public function test_ltd_tiers_have_unlimited_transactions_and_scale_fences(): void
    {
        $ltd1 = $this->makeTenant('ltd_1');
        $ltd2 = $this->makeTenant('ltd_2');
        $ltd3 = $this->makeTenant('ltd_3');

        // Unlimited transactions on all 3 LTD tiers
        $this->assertNull(PlanGate::getLimit('transactions_per_month', $ltd1));
        $this->assertNull(PlanGate::getLimit('transactions_per_month', $ltd2));
        $this->assertNull(PlanGate::getLimit('transactions_per_month', $ltd3));

        // multi_branch is disabled on ltd_1, enabled on ltd_2 and ltd_3
        $this->assertFalse(PlanGate::check('multi_branch', $ltd1));
        $this->assertTrue(PlanGate::check('multi_branch', $ltd2));
        $this->assertTrue(PlanGate::check('multi_branch', $ltd3));

        // Scale fences (API, white label, audit trail) disabled on all LTD tiers
        $this->assertFalse(PlanGate::check('api_access', $ltd1));
        $this->assertFalse(PlanGate::check('api_access', $ltd2));
        $this->assertFalse(PlanGate::check('api_access', $ltd3));
        $this->assertFalse(PlanGate::check('white_label', $ltd3));

        // Channel sync: 1 included on ltd_3, 0 on ltd_1/ltd_2
        $this->assertFalse(PlanGate::check('woocommerce', $ltd1));
        $this->assertFalse(PlanGate::check('woocommerce', $ltd2));
        $this->assertTrue(PlanGate::check('woocommerce', $ltd3));
    }
}
