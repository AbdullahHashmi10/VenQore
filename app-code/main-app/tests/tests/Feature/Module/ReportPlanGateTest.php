<?php

namespace Tests\Feature\Module;

use App\Models\Sale;
use App\Models\JournalEntry;
use App\Services\ModuleService;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

class ReportPlanGateTest extends VenQoreTestCase
{
    #[Test]
    public function analytical_reports_require_plan_upgrade_on_solo_even_with_reports_module_enabled(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $this->actingAsTenantUser($tenant, 'owner');

        // Explicitly enable reports & accounting workspace module
        ModuleService::enable($tenant, 'reports');
        ModuleService::enable($tenant, 'accounting_workspace');

        $response = $this->getJson("/s/{$tenant->slug}/reports/profit-loss");

        $response->assertStatus(403);
        $response->assertJsonPath('code', 'plan_upgrade_required');
        $response->assertJsonPath('action', 'upgrade');
        $response->assertJsonPath('upgrade', true);

        // REGRESSION GUARD: Must NEVER be 'add_module' (which sends user to builder dead end)
        $this->assertNotSame('add_module', $response->json('action'));
    }

    #[Test]
    public function operational_reports_remain_free_and_accessible_on_solo(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $this->actingAsTenantUser($tenant, 'owner');

        ModuleService::enable($tenant, 'reports');
        ModuleService::enable($tenant, 'inventory');
        ModuleService::enable($tenant, 'khata_credit');

        // Operational reports return 200
        $this->get("/s/{$tenant->slug}/reports/day-book")->assertStatus(200);
        $this->get("/s/{$tenant->slug}/reports/low-stock")->assertStatus(200);
        $this->get("/s/{$tenant->slug}/reports/party-statement")->assertStatus(200);
        $this->get("/s/{$tenant->slug}/v3/reports/aged-receivables")->assertStatus(200);
    }

    #[Test]
    public function core_plan_tenant_can_access_analytical_reports(): void
    {
        $tenant = $this->createTenant(plan: 'core', status: 'active');
        $this->actingAsTenantUser($tenant, 'owner');

        ModuleService::enable($tenant, 'reports');
        ModuleService::enable($tenant, 'accounting_workspace');

        $response = $this->get("/s/{$tenant->slug}/reports/profit-loss");
        $response->assertStatus(200);
    }

    #[Test]
    public function double_entry_ledger_records_on_solo_even_when_profit_loss_report_is_blocked(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $user = $this->actingAsTenantUser($tenant, 'owner');

        ModuleService::enable($tenant, 'pos');
        ModuleService::enable($tenant, 'reports');

        // Confirm profit-loss is plan-blocked
        $this->getJson("/s/{$tenant->slug}/reports/profit-loss")->assertStatus(403);

        \App\Models\Warehouse::firstOrCreate(
            ['id' => 1],
            ['tenant_id' => $tenant->id, 'name' => 'Main Warehouse', 'is_default' => true, 'is_active' => true]
        );

        $customer = \App\Models\Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'customer']);
        $product = \App\Models\Product::factory()->create(['tenant_id' => $tenant->id, 'type' => 'service', 'price' => 150.00]);

        $initialJournalEntries = JournalEntry::where('tenant_id', $tenant->id)->count();

        // Perform a sale
        $payload = [
            'customer_id'    => $customer->id,
            'payment_method' => 'cash',
            'amount_paid'    => 150.00,
            'items'          => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 1,
                    'price'      => 150.00,
                ],
            ],
        ];

        $saleResponse = $this->post("/s/{$tenant->slug}/sales", $payload);
        $saleResponse->assertSuccessful();

        // Verify ledger recorded in the background
        $newJournalEntries = JournalEntry::where('tenant_id', $tenant->id)->count();
        $this->assertGreaterThan($initialJournalEntries, $newJournalEntries);
    }

    #[Test]
    public function whole_report_plan_map_is_enforced_for_solo_and_allowed_for_scale(): void
    {
        $soloTenant = $this->createTenant(plan: 'solo', status: 'active');
        $this->actingAsTenantUser($soloTenant, 'owner');

        // Enable all modules so module gating does not block
        $allLiveModules = array_keys(config('modules', []));
        foreach ($allLiveModules as $mod) {
            ModuleService::enable($soloTenant, $mod);
        }

        foreach (array_keys(\App\Support\ReportPlanMap::MAP) as $suffix) {
            $routeName = \Illuminate\Support\Facades\Route::has("store.reports.{$suffix}")
                ? "store.reports.{$suffix}"
                : "store.v3.reports.{$suffix}";

            $url = route($routeName, ['store_slug' => $soloTenant->slug]);
            if ($suffix === 'export') {
                $url .= '?report=profit_loss&format=json';
            }

            $response = $this->getJson($url);
            $this->assertSame(
                403,
                $response->getStatusCode(),
                "Expected 403 on Solo for analytical report '{$suffix}', got {$response->getStatusCode()}."
            );
            $this->assertSame(
                'plan_upgrade_required',
                $response->json('code'),
                "Expected code 'plan_upgrade_required' on Solo for '{$suffix}', got " . json_encode($response->json())
            );
        }

        // Scale tenant test
        $scaleTenant = $this->createTenant(plan: 'scale', status: 'active');
        $this->actingAsTenantUser($scaleTenant, 'owner');
        foreach ($allLiveModules as $mod) {
            ModuleService::enable($scaleTenant, $mod);
        }

        foreach (array_keys(\App\Support\ReportPlanMap::MAP) as $suffix) {
            $routeName = \Illuminate\Support\Facades\Route::has("store.reports.{$suffix}")
                ? "store.reports.{$suffix}"
                : "store.v3.reports.{$suffix}";

            $url = route($routeName, ['store_slug' => $scaleTenant->slug]);
            if ($suffix === 'export') {
                $url .= '?report=profit_loss&format=json';
            }

            $response = $this->getJson($url);
            $this->assertNotSame(
                403,
                $response->getStatusCode(),
                "Expected non-403 on Scale for analytical report '{$suffix}', got {$response->getStatusCode()}."
            );
        }
    }

    #[Test]
    public function operational_reports_free_list_stays_free_on_solo(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $this->actingAsTenantUser($tenant, 'owner');

        $allLiveModules = array_keys(config('modules', []));
        foreach ($allLiveModules as $mod) {
            ModuleService::enable($tenant, $mod);
        }

        $party = \App\Models\Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'customer']);

        $freeReportSuffixes = [
            'index',
            'dashboard',
            'day-book',
            'daily-sales',
            'sales',
            'low-stock',
            'expiry',
            'all-parties',
            'party-statement',
            'party-ledger',
            'aged-receivables',
            'aged-payables',
            'expenses',
            'expense-by-category',
            'purchases',
            'purchase-returns',
            'sale-orders',
            'sale-order-items',
            'inventory-movement',
            'movement-history',
            'item-detail',
            'stock-summary-by-category',
            'bank-statement',
            'loan-statement',
            'tax',
        ];

        foreach ($freeReportSuffixes as $suffix) {
            $routeName = \Illuminate\Support\Facades\Route::has("store.reports.{$suffix}")
                ? "store.reports.{$suffix}"
                : (\Illuminate\Support\Facades\Route::has("store.v3.reports.{$suffix}")
                    ? "store.v3.reports.{$suffix}"
                    : null);

            if (!$routeName) {
                continue;
            }

            $params = ['store_slug' => $tenant->slug];
            if ($suffix === 'party-ledger') {
                $params['partyId'] = $party->id;
            }

            $url = route($routeName, $params);
            $response = $this->get($url);

            $this->assertNotSame(
                403,
                $response->getStatusCode(),
                "Operational report '{$suffix}' should be accessible on Solo, but returned 403."
            );
        }
    }

    #[Test]
    public function inertia_shares_all_14_plan_features_with_proper_boolean_states_for_solo_and_scale(): void
    {
        $expectedKeys = array_values(array_unique(\App\Support\ReportPlanMap::REQUIRED_PLAN_FEATURES));
        $this->assertCount(14, $expectedKeys);

        // 1. Solo tenant
        $soloTenant = $this->createTenant(plan: 'solo', status: 'active');
        $this->actingAsTenantUser($soloTenant, 'owner');
        ModuleService::enable($soloTenant, 'reports');

        $soloResponse = $this->get("/s/{$soloTenant->slug}/reports");
        $soloResponse->assertSuccessful();

        $soloProps = $soloResponse->viewData('page')['props'] ?? [];
        $this->assertArrayHasKey('planFeatures', $soloProps);
        $this->assertIsArray($soloProps['planFeatures']);
        $this->assertCount(14, $soloProps['planFeatures']);

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $soloProps['planFeatures']);
            $this->assertFalse($soloProps['planFeatures'][$key], "Expected {$key} to be false on Solo plan.");
        }

        // 2. Scale tenant
        $scaleTenant = $this->createTenant(plan: 'scale', status: 'active');
        $this->actingAsTenantUser($scaleTenant, 'owner');
        ModuleService::enable($scaleTenant, 'reports');

        $scaleResponse = $this->get("/s/{$scaleTenant->slug}/reports");
        $scaleResponse->assertSuccessful();

        $scaleProps = $scaleResponse->viewData('page')['props'] ?? [];
        $this->assertArrayHasKey('planFeatures', $scaleProps);
        $this->assertIsArray($scaleProps['planFeatures']);
        $this->assertCount(14, $scaleProps['planFeatures']);

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $scaleProps['planFeatures']);
            $this->assertTrue($scaleProps['planFeatures'][$key], "Expected {$key} to be true on Scale plan.");
        }
    }
}
