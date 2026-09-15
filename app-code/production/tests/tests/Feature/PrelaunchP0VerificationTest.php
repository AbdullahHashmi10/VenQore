<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRequest;
use App\Services\AiBuilder\CapabilityRegistry;
use App\Services\AiBuilder\ConversationalBuilderService;
use App\Services\AiBuilder\DiscoverySession;
use App\Services\ModuleService;
use App\Services\StoreProvisioner;
use App\Support\ModuleRouteMap;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use ReflectionClass;
use Tests\Feature\VenQoreTestCase;

/**
 * PrelaunchP0VerificationTest — Empirical behavioral proof for the P0 findings (R01, R03, R04, R05, R06, R07, R25).
 */
class PrelaunchP0VerificationTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        ModuleRouteMap::flush();
        config(['venqore.email_otp_required' => false]);
    }

    #[Test]
    public function r01_disabled_operational_endpoints_return_403_for_solo_tenant(): void
    {
        // Solo tenant with services only (inventory, bank_accounts, sales_returns disabled)
        $owner = User::factory()->create();
        $tenant = app(StoreProvisioner::class)->create($owner, [
            'name' => 'Solo Service Business',
            'business_type' => 'services_solo',
            'modules' => ['services', 'invoicing'],
            'setup_completed' => true,
        ]);
        $this->actingAsTenantUserModel($owner, $tenant);
        ModuleService::invalidate($tenant->id);

        $this->assertFalse(ModuleService::enabled($tenant, 'inventory'));
        $this->assertFalse(ModuleService::enabled($tenant, 'bank_accounts'));
        $this->assertFalse(ModuleService::enabled($tenant, 'sales_returns'));

        // 1. Warehouse endpoint must 403
        $warehousesRes = $this->get("/s/{$tenant->slug}/api/warehouses");
        $warehousesRes->assertStatus(403);
        $warehousesRes->assertJsonPath('code', 'module_disabled');
        $warehousesRes->assertJsonPath('module', 'inventory');

        // 2. Bank accounts endpoint must 403
        $bankRes = $this->get("/s/{$tenant->slug}/api/bank-accounts");
        $bankRes->assertStatus(403);
        $bankRes->assertJsonPath('code', 'module_disabled');
        $bankRes->assertJsonPath('module', 'bank_accounts');

        // 3. Returnable sales lookup must 403
        $returnableRes = $this->get("/s/{$tenant->slug}/api/sales/returnable");
        $returnableRes->assertStatus(403);
        $returnableRes->assertJsonPath('code', 'module_disabled');
        $returnableRes->assertJsonPath('module', 'sales_returns');
    }

    #[Test]
    public function r03_analyze_endpoint_runs_business_understanding_on_non_empty_prompt(): void
    {
        // When prompt is non-empty, analyze must run BusinessUnderstanding and preserve detected trade/modules
        $response = $this->postJson('/workspace/analyze', [
            'prompt' => 'I am a solo mobile plumber doing emergency leak repairs and pipe fitting.',
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertIsArray($data['modules']);
        $this->assertNotEmpty($data['modules']);
        // A plumber should have services
        $this->assertContains('services', $data['modules']);
        // Stated solo facts should rule out staff_attendance
        $this->assertNotContains('staff_attendance', $data['modules']);
    }

    #[Test]
    public function r04_ai_failure_fallback_resolves_against_facts_without_unwanted_modules(): void
    {
        $session = new DiscoverySession(
            sessionId: 'test-session-r04',
            structuredFacts: [
                'has_employees' => false,
                'sells_goods'   => false,
            ]
        );
        $session->preset = 'field_service';
        $session->confirmed = ['repair_job_tracking'];

        $service = app(ConversationalBuilderService::class);
        $ref = new ReflectionClass($service);
        $method = $ref->getMethod('fallbackToPreset');
        $method->setAccessible(true);

        $result = $method->invoke($service, $session, 'rate_limit');

        $this->assertIsArray($result);
        $this->assertArrayHasKey('modules', $result);
        $modules = $result['modules'];

        // Because has_employees is false, staff_attendance must NOT be enabled in the fallback set
        $this->assertNotContains('staff_attendance', $modules, 'Fallback must not add staff_attendance for a solo business.');
    }

    #[Test]
    public function r05_store_provisioner_with_empty_modules_array_creates_lean_workspace(): void
    {
        $user = User::factory()->create();
        $tenant = app(StoreProvisioner::class)->create($user, [
            'name'    => 'Strictly Empty Store',
            'modules' => [], // explicitly empty modules array
        ]);

        $enabledRows = DB::table('tenant_modules')
            ->where('tenant_id', $tenant->id)
            ->where('enabled', 1)
            ->pluck('module_key')
            ->all();

        // Must NOT default to the five-module preset
        $defaultPreset = ['products', 'pos', 'inventory', 'expenses', 'reports'];
        $hasAllDefaultFive = count(array_intersect($defaultPreset, $enabledRows)) === 5;
        $this->assertFalse(
            $hasAllDefaultFive,
            "StoreProvisioner defaulted to all 5 modules from the retail preset instead of respecting the explicitly empty modules array."
        );
        $this->assertEmpty($enabledRows, 'Explicit empty modules array should produce 0 enabled modules.');
    }

    #[Test]
    public function r06_disabled_module_reckoner_readings_are_unavailable(): void
    {
        $owner = User::factory()->create();
        $tenant = app(StoreProvisioner::class)->create($owner, [
            'name' => 'Solo Minimalist Store',
            'modules' => ['services'],
            'setup_completed' => true,
        ]);
        $this->actingAsTenantUserModel($owner, $tenant);
        ModuleService::invalidate($tenant->id);

        $reckoner = app(Reckoner::class);
        $keys = [
            'reminders.count',
            'recurring_invoices.revenue',
            'returns.qty',
            'returns.value',
        ];

        // 1. Catalogue availability check: all must be false when modules are off
        $availability = $reckoner->checkAvailability($keys, $owner, $tenant);
        foreach ($keys as $key) {
            $this->assertFalse($availability[$key], "Reckoner reading '{$key}' should be unavailable when its owning module is disabled.");
        }

        // 2. readMany execution: must fail with not_applicable due to module off
        $requests = array_map(fn ($k) => new ReckonerRequest($k, 'today'), $keys);
        $results = $reckoner->readMany($requests, $owner, $tenant);

        foreach ($requests as $req) {
            $id = $req->getCompositeId();
            $res = $results[$id] ?? null;
            $this->assertNotNull($res, "Result missing for '{$req->key}'");
            $this->assertFalse($res->ok, "Reading '{$req->key}' should fail when module is off");
            $this->assertSame('not_applicable', $res->errorCode);
            $this->assertStringContainsString('module switched off', $res->errorMessage);
        }
    }

    #[Test]
    public function r07_quick_action_routes_from_command_palette_do_not_return_501(): void
    {
        $owner = User::factory()->create();
        $tenant = app(StoreProvisioner::class)->create($owner, [
            'name' => 'Command Palette Store',
            'modules' => ['products', 'customers', 'payments', 'invoicing'],
            'setup_completed' => true,
        ]);
        $this->actingAsTenantUserModel($owner, $tenant);

        // Test payment creation redirect routes (formerly 501 aborts)
        $resIn = $this->get("/s/{$tenant->slug}/payments/in/create");
        $this->assertNotSame(501, $resIn->status(), '/payments/in/create must not return 501');
        $resIn->assertRedirect(route('store.payments.in', ['store_slug' => $tenant->slug]));

        $resOut = $this->get("/s/{$tenant->slug}/payments/out/create");
        $this->assertNotSame(501, $resOut->status(), '/payments/out/create must not return 501');
        $resOut->assertRedirect(route('store.payments.out', ['store_slug' => $tenant->slug]));

        // Direct payments screen access
        $this->get("/s/{$tenant->slug}/payments/in")->assertStatus(200);
        $this->get("/s/{$tenant->slug}/payments/out")->assertStatus(200);
    }

    #[Test]
    public function r25_blueprint_marketing_copy_uses_bounded_language(): void
    {
        $blueprintPath = resource_path('js/Pages/Marketing/Blueprint.jsx');
        $this->assertFileExists($blueprintPath);

        $content = (string) file_get_contents($blueprintPath);

        // Absolute unmeasured claim must be absent
        $this->assertStringNotContainsString(
            'Not greyed out with an upsell badge. Absent.',
            $content,
            'Blueprint copy should not make the absolute unmeasured "Absent" promise.'
        );

        // Bounded, honest copy must be present
        $this->assertStringContainsString(
            'Tools you did not pick stay completely out of your way until you choose to add them',
            $content,
            'Blueprint copy should use bounded language explaining disabled tools stay out of the way.'
        );
    }
}
