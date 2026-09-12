<?php

namespace Tests\Feature\Audit;

use App\Engines\ModuleDependencyResolver;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AiBuilder\ApplyConfigurationService;
use App\Services\AiBuilder\CapabilityRegistry;
use App\Services\AiBuilder\ConversationalBuilderService;
use App\Services\AiBuilder\DiscoverySession;
use App\Services\AiBuilder\ModificationParser;
use App\Services\ModuleService;
use App\Services\StoreProvisioner;
use App\Support\ModuleRouteMap;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * AUDIT PROBES — 2026-09-12 prelaunch audit.
 *
 * Every test here PASSES when the DEFECT IS REPRODUCED. They are evidence
 * collectors, not regression tests. When the fix lands, each of these should
 * start failing and be rewritten as the inverse assertion.
 *
 * Runs against the disposable amd_pos_test database only.
 */
class PrelaunchAuditProbesTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        ModuleRouteMap::flush();
        config(['venqore.email_otp_required' => false]);
    }

    private function owner(Tenant $tenant): User
    {
        $u = $this->createTenantUser($tenant, 'owner');
        $this->actingAsTenantUserModel($u, $tenant);
        return $u;
    }

    private function provisioned(array $modules, string $type = 'retail_shop'): Tenant
    {
        $user = User::factory()->create();
        $tenant = app(StoreProvisioner::class)->create($user, [
            'name' => 'Probe ' . fake()->company(),
            'business_type' => $type,
            'modules' => $modules,
            'setup_completed' => true,
        ]);
        $this->actingAsTenantUserModel($user, $tenant);
        ModuleService::invalidate($tenant->id);
        return $tenant;
    }

    // ───────────────────────── B-03 fresh tenant without module rows ─────

    #[Test]
    public function B03_store_created_without_modules_has_zero_rows_and_everything_is_on(): void
    {
        $user = User::factory()->create();
        $tenant = app(StoreProvisioner::class)->create($user, ['name' => 'No Modules Co']);
        $rows = DB::table('tenant_modules')->where('tenant_id', $tenant->id)->count();
        fwrite(STDERR, "\n[B-03] tenant_modules rows for StoreProvisioner::create without 'modules': {$rows}\n");
        $this->assertSame(0, $rows);
        $this->assertCount(46, ModuleService::allEnabled($tenant));
        $this->assertTrue(ModuleService::enabled($tenant, 'cookbook'));
        $this->assertTrue(ModuleService::enabled($tenant, 'quotations'));   // building
    }

    #[Test]
    public function B03b_key_absent_from_a_configured_tenant_is_treated_as_enabled(): void
    {
        $tenant = $this->provisioned(['products', 'pos']);
        DB::table('tenant_modules')->where('tenant_id', $tenant->id)->where('module_key', 'cookbook')->delete();
        ModuleService::invalidate($tenant->id);
        $this->assertTrue(ModuleService::enabled($tenant, 'cookbook'));
    }

    // ───────────────────────── A-1.1 forged modules[] enables non-live ───

    #[Test]
    public function A11_forged_provision_request_enables_building_and_beta_modules(): void
    {
        $email = 'forge-' . fake()->unique()->safeEmail();
        $res = $this->withHeaders(['Accept' => 'application/json'])->post('/workspace/provision', [
            'business_name' => 'Forged Modules Ltd',
            'email' => $email,
            'password' => 'Str0ng!Passw0rd#2026',
            'modules' => ['products', 'purchases', 'inventory', 'cookbook', 'quotations', 'landed_cost', 'composite_items'],
            'preset_key' => 'retail_shop',
        ]);
        fwrite(STDERR, "\n[A-1.1] POST /workspace/provision status={$res->status()} body=" . mb_substr($res->getContent(), 0, 200) . "\n");
        $res->assertStatus(200);
        $slug = $res->json('tenant_slug');
        $tenant = Tenant::withoutGlobalScopes()->where('slug', $slug)->firstOrFail();
        $rows = DB::table('tenant_modules')->where('tenant_id', $tenant->id)
            ->whereIn('module_key', ['quotations', 'landed_cost', 'composite_items'])->pluck('enabled', 'module_key')->all();
        fwrite(STDERR, '[A-1.1] rows: ' . json_encode($rows) . "\n");
        $this->assertSame(1, (int) $rows['quotations']);
        $this->assertSame(1, (int) $rows['landed_cost']);
        $this->assertSame(1, (int) $rows['composite_items']);
        $this->assertTrue(ModuleService::enabled($tenant, 'quotations'));
        $this->assertFalse(ModuleService::visible($tenant, 'quotations'));   // hidden in nav, but the route gate is open
    }

    #[Test]
    public function A11b_dependency_resolver_validate_ignores_status(): void
    {
        $problems = (new ModuleDependencyResolver())->validate(['products', 'purchases', 'inventory', 'cookbook', 'quotations', 'landed_cost', 'composite_items']);
        $this->assertSame([], $problems);
    }

    // ───────────────────────── A-1.2 provisioning refuses unmet requires ─

    #[Test]
    public function A12_provisioning_with_unmet_requires_one_throws_instead_of_resolving(): void
    {
        $user = User::factory()->create();
        $threw = null;
        try {
            app(StoreProvisioner::class)->create($user, [
                'name' => 'Untick Products Co',
                'modules' => ['sales_returns', 'customers', 'expenses', 'reports'], // sales_returns requires_one products|services
            ]);
        } catch (\Throwable $e) {
            $threw = get_class($e) . ': ' . $e->getMessage();
        }
        fwrite(STDERR, "\n[A-1.2] " . ($threw ?? 'no exception') . "\n");
        $this->assertNotNull($threw);
    }

    // ───────────────────────── B-04 gate leaks ───────────────────────────

    #[Test]
    public function B04_tables_and_manufacturing_rules_reachable_with_modules_off(): void
    {
        $tenant = $this->provisioned(['products', 'pos', 'expenses', 'reports']);
        $this->owner($tenant);
        $this->assertFalse(ModuleService::enabled($tenant, 'table_service'));
        $this->assertFalse(ModuleService::enabled($tenant, 'cookbook'));
        $this->assertFalse(ModuleService::enabled($tenant, 'production_runs'));

        $r1 = $this->get("/s/{$tenant->slug}/tables");
        $r2 = $this->get("/s/{$tenant->slug}/tables/state");
        $r3 = $this->get("/s/{$tenant->slug}/api/manufacturing-rules");
        $r4 = $this->get("/s/{$tenant->slug}/restaurant/kitchen/state");
        $r5 = $this->get("/s/{$tenant->slug}/cookbook");   // control: claimed route
        fwrite(STDERR, "\n[B-04] tables={$r1->status()} tables/state={$r2->status()} manufacturing-rules={$r3->status()} kitchen/state={$r4->status()} cookbook(control)={$r5->status()}\n");
        foreach ([$r1, $r2, $r3, $r4] as $r) {
            $this->assertNotSame(403, $r->status());
        }
        $r5->assertStatus(403);
        $this->assertSame('module_disabled', $r5->json('code'));
        $this->assertSame([], ModuleRouteMap::ownersOf('store.tables.index'));
        $this->assertSame([], ModuleRouteMap::ownersOf('store.'));
    }

    #[Test]
    public function B04b_always_on_wildcard_neutralises_module_claimed_api_routes(): void
    {
        $this->assertSame(['marketplace_sync'], ModuleRouteMap::ownersOf('store.api.sync.orders.batch'));
        $this->assertTrue(ModuleRouteMap::isAlwaysOn('store.api.sync.orders.batch'));
        $this->assertSame(['pos'], ModuleRouteMap::ownersOf('store.api.categories'));
        $this->assertTrue(ModuleRouteMap::isAlwaysOn('store.api.categories'));
    }

    // ───────────────────────── B-01 backup download by store admin ───────

    #[Test]
    public function B01_store_owner_can_download_platform_backup_dump(): void
    {
        $tenant = $this->provisioned(['products', 'pos', 'expenses', 'reports']);
        $this->owner($tenant);
        Storage::disk('local')->put('backups/audit-probe-2026.sql', "-- ALL TENANTS DUMP\nINSERT INTO users ...");
        try {
            $r = $this->get("/s/{$tenant->slug}/admin-panel/backups/audit-probe-2026.sql");
            $code = $r->baseResponse->getStatusCode();
            fwrite(STDERR, "\n[B-01] GET backups/{file} status={$code} class=" . get_class($r->baseResponse) . " content-disposition=" . $r->baseResponse->headers->get('content-disposition') . "\n");
            $this->assertSame(200, $code);
        } finally {
            Storage::disk('local')->delete('backups/audit-probe-2026.sql');
        }
    }

    // ───────────────────────── B-06 test-store bypass ────────────────────

    #[Test]
    public function B06_slug_test_store_bypasses_module_gate(): void
    {
        $tenant = $this->createTenant(slug: 'test-store', plan: 'core', status: 'active');
        app(ApplyConfigurationService::class)->apply($tenant, ['modules' => ['products', 'pos', 'expenses', 'reports']], 'audit');
        $this->owner($tenant);
        $this->assertFalse(ModuleService::enabled($tenant, 'cookbook'));
        $r = $this->get('/s/test-store/cookbook');
        fwrite(STDERR, "\n[B-06] /s/test-store/cookbook with cookbook OFF → status={$r->status()}\n");
        $this->assertNotSame(403, $r->status());
    }

    // ───────────────────────── B-07a cross-tenant module probe ───────────

    #[Test]
    public function B07_member_of_tenant_B_can_probe_tenant_A_module_configuration(): void
    {
        // Nothing may pre-bind current.tenant here — a real HTTP request arrives unbound.
        $a = Tenant::factory()->create(['slug' => 'probe-a-' . rand(1000, 9999), 'plan' => 'core', 'status' => 'active', 'setup_completed' => true]);
        app(ApplyConfigurationService::class)->apply($a, ['modules' => ['products', 'pos', 'expenses', 'reports']], 'audit');
        $b = $this->createTenant(plan: 'core', status: 'active');
        $userB = $this->createTenantUser($b, 'owner');
        $this->actingAs($userB);
        $off = $this->withHeaders(['X-Inertia' => 'true'])->get("/s/{$a->slug}/cookbook");
        $on  = $this->withHeaders(['X-Inertia' => 'true'])->get("/s/{$a->slug}/pos");
        fwrite(STDERR, "\n[B-07a] non-member: A/cookbook(off)={$off->status()} code=" . json_encode($off->json('code')) . " | A/pos(on)={$on->status()} location=" . json_encode($on->headers->get('location')) . "\n");
        $this->assertSame(403, $off->status());
        $this->assertSame('module_disabled', $off->json('code'));
        $this->assertSame(302, $on->status());
    }

    // ───────────────────────── B-05 included module still plan-gated ─────

    #[Test]
    public function B05_solo_tenant_with_recurring_invoices_enabled_is_still_refused_by_plan_gate(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        app(ApplyConfigurationService::class)->apply($tenant, ['modules' => ['products', 'customers', 'invoicing', 'recurring_invoices', 'expenses', 'reports']], 'audit');
        $this->owner($tenant);
        $this->assertTrue(ModuleService::enabled($tenant, 'recurring_invoices'));
        $r = $this->withHeaders(['Accept' => 'application/json'])->get("/s/{$tenant->slug}/recurring-invoices");
        fwrite(STDERR, "\n[B-05] solo + recurring_invoices ON → status={$r->status()} body=" . mb_substr($r->getContent(), 0, 160) . "\n");
        $this->assertContains($r->status(), [402, 403, 302]);
        $this->assertNotSame(200, $r->status());
    }

    // ───────────────────────── B-02 lifecycle middleware missing ─────────

    #[Test]
    public function B02_main_write_routes_lack_subscription_lifecycle_middleware(): void
    {
        $missing = [];
        foreach (['store.sales.store', 'store.purchases.store', 'store.expenses.store', 'store.payments.store', 'store.production.store'] as $name) {
            $route = Route::getRoutes()->getByName($name);
            $mw = $route ? app('router')->gatherRouteMiddleware($route) : ['<no route>'];
            $has = collect($mw)->contains(fn ($m) => str_contains((string) $m, 'SubscriptionLifecycle') || str_contains((string) $m, 'EnforceHostedUntil'));
            if (!$has) $missing[] = $name;
        }
        fwrite(STDERR, "\n[B-02] write routes without lifecycle/hosted-until middleware: " . implode(', ', $missing) . "\n");
        $this->assertNotEmpty($missing);
    }

    // ───────────────────────── A-4.1 capability → non-existent modules ───

    #[Test]
    public function A41_confirming_khata_tables_serials_repairs_enables_nothing_relevant(): void
    {
        $reg = app(CapabilityRegistry::class);
        $out = [];
        foreach ([
            'customer_khata_credit' => 'khata_credit',
            'table_and_kot_management' => 'table_service',
            'serial_imei_tracking' => 'serials',
            'repair_job_tracking' => 'services',
            'multi_branch_warehouses' => 'multi_location',
            'appointment_scheduling' => 'services',
        ] as $cap => $expected) {
            $mods = $reg->resolveModules([$cap], 'retail_shop', []);
            $out[$cap] = $mods;
            $this->assertNotContains($expected, $mods, "$cap unexpectedly produced $expected");
        }
        fwrite(STDERR, "\n[A-4.1] " . json_encode($out) . "\n");
        $missing = [];
        foreach ($reg->allCapabilities() as $key => $cap) {
            foreach ($cap['implies_modules'] ?? [] as $m) {
                if (!array_key_exists($m, config('modules'))) $missing[$key][] = $m;
            }
        }
        fwrite(STDERR, '[A-4.1] implies_modules keys absent from config/modules.php: ' . json_encode($missing) . "\n");
        $this->assertNotEmpty($missing);
    }

    // ───────────────────────── A-4.3 confidence floor ─────────────────────

    #[Test]
    public function A43_finalize_proposal_reports_at_least_90pct_confidence_even_when_everything_was_rejected(): void
    {
        $session = DiscoverySession::start('pharmacy', ['trade:pharmacy' => ['value' => true, 'confidence' => 0.9, 'source' => 'test', 'evidence' => '']], 'pharmacy');
        $session->rejected = ['batch_expiry_tracking', 'customer_khata_credit', 'supplier_purchasing', 'multi_branch_warehouses', 'counter_checkout'];
        $session->systemReadinessConfidence = 0.3;
        $session->save();
        $result = app(ConversationalBuilderService::class)->finalizeProposal($session);
        fwrite(STDERR, "\n[A-4.3] readiness=0.3, all rejected → confidence=" . json_encode($result['confidence']) . ' modules=' . json_encode($result['modules']) . ' message=' . json_encode($result['assistant_message']) . "\n");
        $this->assertGreaterThanOrEqual(0.90, (float) $result['confidence']);
    }

    // ───────────────────────── A-6.2 modification parser substrings ──────

    #[Test]
    public function A62_modification_parser_toggles_pos_from_unrelated_words(): void
    {
        $p = app(ModificationParser::class);
        $out = [];
        foreach (['add a deposit box', 'remove the purpose field', 'I want to add compost', 'remove nag'] as $s) {
            $r = $p->parse($s);
            $out[$s] = ['intent' => $r['intent'] ?? null, 'module' => $r['module'] ?? ($r['target'] ?? null)];
        }
        fwrite(STDERR, "\n[A-6.2] " . json_encode($out) . "\n");
        $this->assertSame('pos', $out['add a deposit box']['module']);
        $this->assertSame('pos', $out['remove the purpose field']['module']);
    }

    // ───────────────────────── A-6.1 fact extractor substrings ───────────

    #[Test]
    public function A61_detect_structured_facts_substring_false_positives(): void
    {
        $reg = app(CapabilityRegistry::class);
        $out = [];
        foreach (['we sell spare parts for cars', 'smart phone accessories', 'I sell horseshoes and saddles', 'solomon islands handicrafts', 'we have no POS, just invoices', 'no repairs here, only sales'] as $s) {
            $out[$s] = array_keys($reg->detectStructuredFacts($s)['facts']);
        }
        fwrite(STDERR, "\n[A-6.1] " . json_encode($out) . "\n");
        $this->assertContains('trade:salon', $out['we sell spare parts for cars']);
        $this->assertContains('trade:repairs', $out['no repairs here, only sales']);
        $this->assertSame([], $out['we have no POS, just invoices']);
    }

    // ───────────────────────── A-1.6 builder disable guard ───────────────

    #[Test]
    public function A16_unticking_products_and_pos_together_is_refused(): void
    {
        $tenant = $this->provisioned(['products', 'pos', 'expenses', 'reports']);
        $this->owner($tenant);
        $r = $this->withHeaders(['Accept' => 'application/json'])->post("/s/{$tenant->slug}/builder/apply", [
            'modules' => ['expenses', 'reports'],
        ]);
        fwrite(STDERR, "\n[A-1.6] apply(['expenses','reports']) from products+pos → status={$r->status()} body=" . mb_substr($r->getContent(), 0, 240) . "\n");
        $this->assertSame(422, $r->status());
        $this->assertSame('disable_blocked', $r->json('reason'));
    }

    // ───────────────────────── C-4.1 / C-4.2 service-only tenant ─────────

    #[Test]
    public function C4_service_only_tenant_cannot_reach_its_own_service_catalogue_and_invoice_needs_product_row(): void
    {
        $tenant = $this->provisioned(['services', 'customers', 'invoicing', 'expenses', 'reports'], 'plumber');
        $this->owner($tenant);
        $this->assertFalse(ModuleService::enabled($tenant, 'products'));
        $cat = $this->withHeaders(['Accept' => 'application/json'])->get("/s/{$tenant->slug}/inventory/list?type=service");
        fwrite(STDERR, "\n[C-4.2] services-only → GET /inventory/list?type=service status={$cat->status()} code=" . json_encode($cat->json('code')) . ' module=' . json_encode($cat->json('module')) . "\n");
        $this->assertSame(403, $cat->status());
        $this->assertSame('products', $cat->json('module'));

        $sale = $this->withHeaders(['Accept' => 'application/json'])->post("/s/{$tenant->slug}/sales", [
            'items' => [['description' => 'Fix leaking tap', 'quantity' => 1, 'price' => 1500]],
            'payment_method' => 'cash',
        ]);
        fwrite(STDERR, "[C-4.1] POST /sales with a free-text line → status={$sale->status()} body=" . mb_substr($sale->getContent(), 0, 300) . "\n");
        $this->assertNotSame(200, $sale->status());
    }

    // ───────────────────────── INV-1 invoicing without POS cannot post a sale ──

    #[Test]
    public function INV1_invoicing_tenant_without_pos_cannot_save_an_invoice(): void
    {
        $tenant = $this->provisioned(['products', 'customers', 'invoicing', 'expenses', 'reports'], 'retail_shop');
        $this->owner($tenant);
        $this->assertTrue(ModuleService::enabled($tenant, 'invoicing'));
        $this->assertFalse(ModuleService::enabled($tenant, 'pos'));
        $this->assertSame(['pos'], ModuleRouteMap::ownersOf('store.sales.store'));
        $product = \App\Models\Product::create(['tenant_id' => $tenant->id, 'name' => 'Widget', 'price' => 100, 'cost_price' => 50, 'stock_quantity' => 10, 'type' => 'product']);
        $sale = $this->withHeaders(['Accept' => 'application/json'])->post("/s/{$tenant->slug}/sales", [
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 100]],
            'payment_method' => 'cash',
        ]);
        fwrite(STDERR, "\n[INV-1] invoicing ON, pos OFF → POST /s/{slug}/sales status={$sale->status()} body=" . mb_substr($sale->getContent(), 0, 220) . "\n");
        $this->assertSame(403, $sale->status());
        $this->assertSame('pos', $sale->json('module'));
        $create = $this->get("/s/{$tenant->slug}/sales/invoice/create");
        fwrite(STDERR, "[INV-1] GET /sales/invoice/create status={$create->status()} (the screen opens; saving fails)\n");
    }

    // ───────────────────────── Session lifecycle ─────────────────────────

    #[Test]
    public function S1_discovery_session_is_not_bound_to_the_browser_session_and_expires_silently(): void
    {
        $s = DiscoverySession::start('grocery store', [], 'grocery');
        $this->assertNotNull(DiscoverySession::load($s->sessionId));
        // any caller with the UUID can forget it
        $this->post('/workspace/converse/reset', ['session_id' => $s->sessionId])->assertStatus(200);
        $this->assertNull(DiscoverySession::load($s->sessionId));
        $r = $this->post('/workspace/converse/step', ['session_id' => $s->sessionId, 'response' => 'yes']);
        fwrite(STDERR, "\n[S-1] step after reset → " . mb_substr($r->getContent(), 0, 160) . "\n");
        $this->assertFalse($r->json('ok'));
        $this->assertTrue($r->json('fallback'));
    }

    // ───────────────────────── F-3.2 restaurant probe table ──────────────

    #[Test]
    public function F32_restaurant_capability_probes_a_dropped_table(): void
    {
        $this->assertFalse(\Illuminate\Support\Facades\Schema::hasTable('restaurant_tables'));
        $this->assertTrue(\Illuminate\Support\Facades\Schema::hasTable('occupancies'));
    }

    // ───────────────────────── Data at stake under-counts ────────────────

    #[Test]
    public function F61_owns_data_tables_missing_from_schema(): void
    {
        $missing = [];
        foreach (config('modules') as $key => $m) {
            foreach ($m['owns_data'] ?? [] as $t) {
                if (!\Illuminate\Support\Facades\Schema::hasTable($t)) $missing[$key][] = $t;
            }
        }
        fwrite(STDERR, "\n[F-6.1] owns_data tables absent: " . json_encode($missing) . "\n");
        $this->assertNotEmpty($missing);
    }
}
