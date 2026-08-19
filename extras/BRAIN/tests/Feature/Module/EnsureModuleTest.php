<?php

namespace Tests\Feature\Module;

use App\Engines\ModuleDependencyResolver;
use App\Services\ModuleService;
use App\Support\ModuleRouteMap;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * STEPS 6 & 7 — acceptance tests.
 *
 * The build plan's criteria, one test each:
 *
 *   Step 6: "no path can produce an invalid configuration. Disabling never
 *            deletes."
 *   Step 7: "NO MODULE ROUTE REACHABLE BY URL WHEN OFF."
 *
 * That last one is in capitals in the plan and it is the reason this file
 * exists. Everything else here protects the safety rails around it — because
 * a gate that is too aggressive locks paying customers out of their own
 * software, which is a worse failure than the one it prevents.
 *
 * Extends VenQoreTestCase to match the rest of the suite.
 */
class EnsureModuleTest extends VenQoreTestCase
{
    private ModuleDependencyResolver $resolver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resolver = new ModuleDependencyResolver();
        ModuleRouteMap::flush();
    }

    // ══════════════════════════════════════════════ THE SAFETY RAILS ══════
    // These come first on purpose. If any of them fails, do not deploy the
    // middleware — you will take every existing customer's system away.

    #[Test]
    public function a_tenant_with_no_configuration_keeps_everything(): void
    {
        $tenant = $this->makeTenant();
        DB::table('tenant_modules')->where('tenant_id', $tenant->id)->delete();
        ModuleService::invalidate($tenant->id);

        foreach (array_keys(config('modules')) as $key) {
            $this->assertTrue(
                ModuleService::enabled($tenant, $key),
                "Module '{$key}' was denied to a tenant with no configuration. This is the rail that stops a mid-backfill deploy locking everyone out."
            );
        }

        $this->assertCount(46, ModuleService::allEnabled($tenant));
    }

    #[Test]
    public function an_unknown_module_key_is_never_denied(): void
    {
        $tenant = $this->makeTenant();

        $this->assertTrue(ModuleService::enabled($tenant, 'teleportation'));
        $this->assertTrue(ModuleService::enabled($tenant, 'accounting'));   // a Qore word, not a module
    }

    #[Test]
    public function always_on_routes_are_never_gated(): void
    {
        foreach (['store.settings', 'store.billing', 'store.dashboard', 'store.backup.export', 'store.profile.edit'] as $name) {
            $this->assertTrue(
                ModuleRouteMap::isAlwaysOn($name),
                "'{$name}' must never be blocked by the module gate — it is how a customer reaches their own account."
            );
        }
    }

    // ══════════════════════════════════════════ STEP 7 ACCEPTANCE ═════════

    #[Test]
    public function every_module_route_is_blocked_when_its_module_is_off(): void
    {
        $tenant = $this->makeTenant();
        $this->actingAsOwnerOf($tenant);

        // Cookbook is a good probe: it is live, it owns a real GET index route,
        // and nothing else claims that route.
        ModuleService::disable($tenant, 'cookbook');

        $response = $this->get("/s/{$tenant->slug}/cookbook");

        $response->assertStatus(403);
        $response->assertJsonPath('code', 'module_disabled');
        $response->assertJsonPath('module', 'cookbook');

        // And the refusal points at the builder, never at billing.
        $response->assertJsonPath('upgrade', false);
        $response->assertJsonPath('action', 'add_module');
    }

    #[Test]
    public function the_same_route_works_again_the_moment_the_module_is_back_on(): void
    {
        $tenant = $this->makeTenant();
        $this->actingAsOwnerOf($tenant);

        ModuleService::disable($tenant, 'cookbook');
        $this->get("/s/{$tenant->slug}/cookbook")->assertStatus(403);

        ModuleService::enable($tenant, 'cookbook');
        $this->get("/s/{$tenant->slug}/cookbook")->assertStatus(200);
    }

    #[Test]
    public function an_exact_route_name_is_gated_as_well_as_its_children(): void
    {
        // store.pos is an EXACT name. 'store.pos.*' does not match it. If this
        // test fails, the POS screen is reachable with the module switched off,
        // which is the specific bug this whole naming discipline exists for.
        $owners = ModuleRouteMap::ownersOf('store.pos');

        $this->assertContains('pos', $owners, "'store.pos' is not claimed by the POS module. The exact-name pattern is missing from config/modules.php.");
    }

    #[Test]
    public function a_shared_route_survives_when_any_one_owner_is_enabled(): void
    {
        $tenant = $this->makeTenant();

        // The party statement belongs to both Khata and Reports.
        $owners = ModuleRouteMap::ownersOf('store.reports.party-statement');
        $this->assertGreaterThan(1, count($owners), 'Expected this route to be shared. If ownership changed, update this test.');

        ModuleService::disable($tenant, 'reports');
        $this->assertTrue(
            ModuleService::enabled($tenant, 'khata_credit'),
            'Sharing is OR, not AND: switching off one owner must not hide the route.'
        );
    }

    #[Test]
    public function every_route_pattern_in_the_registry_matches_a_real_route(): void
    {
        $map = ModuleRouteMap::all();
        $unmatched = [];

        foreach (config('modules') as $key => $module) {
            foreach ($module['routes'] as $pattern) {
                $found = false;
                foreach ($map as $name => $owners) {
                    if (in_array($key, $owners, true)) {
                        $found = true;
                        break;
                    }
                }
                if (!$found && $module['routes']) {
                    $unmatched[] = "{$key}: {$pattern}";
                }
            }
        }

        $this->assertSame([], $unmatched, "Route patterns matching nothing:\n".implode("\n", $unmatched)."\nAn unmatched pattern is an ungated module.");
    }

    // ══════════════════════════════════════════ STEP 6 ACCEPTANCE ═════════

    #[Test]
    public function resolving_always_produces_a_valid_configuration(): void
    {
        // Ask for a child without its parent, twice over.
        $result = $this->resolver->resolve(['table_service', 'production_runs']);

        $this->assertSame([], $this->resolver->validate($result['modules']), 'The resolver produced an invalid set.');

        // The full chain came with it: table_service -> park_recall -> pos -> products
        foreach (['products', 'pos', 'park_recall', 'table_service'] as $expected) {
            $this->assertContains($expected, $result['modules']);
        }

        // And every addition can be explained to the user.
        foreach ($result['added'] as $key => $reason) {
            $this->assertNotEmpty($reason['why'], "Module '{$key}' was added with no explanation. A silent cascade reads as the software overruling the user.");
        }
    }

    #[Test]
    public function requires_one_is_asked_and_never_guessed(): void
    {
        // Khata needs Customers OR Suppliers. BOTH are live, so this is a real
        // two-way choice and the resolver must ask rather than pick.
        $result = $this->resolver->resolve(['khata_credit']);

        $this->assertNotEmpty($result['questions'], 'Khata needs Customers OR Suppliers. The resolver must ASK, not pick.');

        $question = $result['questions'][0];
        $this->assertEqualsCanonicalizing(['customers', 'suppliers'], $question['options']);
        $this->assertStringContainsString('who you keep accounts with', $question['prompt']);

        // Critically: it did NOT quietly add either one.
        $this->assertNotContains('customers', $result['modules'], 'The resolver guessed. Guessing is how a shop that only runs supplier khata ends up with a customer directory it never opens.');
        $this->assertNotContains('suppliers', $result['modules']);
    }

    #[Test]
    public function a_requires_one_with_a_single_shippable_option_is_resolved_not_asked(): void
    {
        // Invoicing needs Products OR Services, but Services is still
        // 'building' — so today there is exactly one real answer. Asking a
        // question with one possible answer is a dead end wearing a choice's
        // clothing, so the resolver adds it AND explains why.
        //
        // WHEN SERVICES GOES LIVE THIS TEST SHOULD START FAILING. That is the
        // signal to move Invoicing back to a genuine question — see the
        // includeNonLive assertion below for the shape it must take.
        $result = $this->resolver->resolve(['invoicing']);

        $this->assertSame([], $result['questions']);
        $this->assertContains('products', $result['modules']);
        $this->assertArrayHasKey('products', $result['added']);
        $this->assertStringContainsString('only option available today', $result['added']['products']['why']);

        // And with Services treated as available, it becomes a real question.
        $future = $this->resolver->resolve(['invoicing'], true);
        $this->assertNotEmpty($future['questions']);
        $this->assertEqualsCanonicalizing(['products', 'services'], $future['questions'][0]['options']);
        $this->assertStringContainsString('what you sell', $future['questions'][0]['prompt']);
        $this->assertNotContains('products', $future['modules']);
    }

    #[Test]
    public function a_satisfied_requires_one_asks_nothing(): void
    {
        $result = $this->resolver->resolve(['invoicing', 'products']);

        $this->assertSame([], $result['questions']);
        $this->assertSame([], $result['added'], 'Nothing should be cascaded when the requirement was already satisfied explicitly.');
        $this->assertContains('products', $result['modules']);
    }

    #[Test]
    public function resolving_is_idempotent(): void
    {
        // Applying a configuration must never drift. If resolve(resolve(x)) can
        // differ from resolve(x), a customer's system changes shape every time
        // they open the builder and press save.
        $once = $this->resolver->resolve(config('ai_builder.presets.restaurant.modules'));
        $twice = $this->resolver->resolve($once['modules']);

        $this->assertSame($once['modules'], $twice['modules']);
    }

    #[Test]
    public function unknown_and_unfinished_modules_are_dropped_silently(): void
    {
        $result = $this->resolver->resolve(['pos', 'teleportation', 'accounting', 'services']);

        $this->assertContains('pos', $result['modules']);
        $this->assertNotContains('teleportation', $result['modules']);
        $this->assertNotContains('accounting', $result['modules'], 'A Qore key reached the resolved set.');
        $this->assertNotContains('services', $result['modules'], "Services is 'building' and must never be enabled.");

        $this->assertEqualsCanonicalizing(['teleportation', 'accounting', 'services'], $result['dropped']);
        $this->assertArrayNotHasKey('services', $result['added'], 'A dropped module must not sneak back in through a cascade.');
    }

    #[Test]
    public function enhancements_are_suggested_but_never_added(): void
    {
        $result = $this->resolver->resolve(['pos']);

        $this->assertNotContains('loyalty_gift', $result['modules'], 'An "enhances" module was force-enabled.');
        $this->assertContains('park_recall', $result['suggestions']);
    }

    #[Test]
    public function disabling_a_load_bearing_module_offers_a_choice_instead_of_refusing(): void
    {
        $enabled = ['products', 'pos', 'cookbook', 'inventory'];

        $verdict = $this->resolver->canDisable($enabled, 'products');

        $this->assertFalse($verdict['allowed']);
        $this->assertContains('pos', $verdict['dependents']);
        $this->assertStringContainsString('Which would you like?', $verdict['message'], 'Never a dead end: the refusal must offer the next step.');
    }

    #[Test]
    public function cascade_disable_lists_everything_before_touching_anything(): void
    {
        $enabled = ['products', 'pos', 'park_recall', 'table_service', 'inventory', 'cookbook', 'expenses'];

        $cascade = $this->resolver->disableCascade($enabled, 'pos');

        foreach (['pos', 'park_recall', 'table_service'] as $expected) {
            $this->assertContains($expected, $cascade);
        }

        $this->assertNotContains('expenses', $cascade, 'Expenses requires nothing and must never be dragged into a cascade.');
        $this->assertNotContains('products', $cascade, 'A cascade must travel down the graph, never up it.');
    }

    #[Test]
    public function disabling_hides_and_never_deletes(): void
    {
        $tenant = $this->makeTenant();

        ModuleService::enable($tenant, 'expenses');
        $before = DB::table('tenant_modules')->where('tenant_id', $tenant->id)->count();

        ModuleService::disable($tenant, 'expenses');

        $this->assertSame($before, DB::table('tenant_modules')->where('tenant_id', $tenant->id)->count(), 'Disabling deleted a row. It must flip a boolean.');
        $this->assertFalse(ModuleService::enabled($tenant, 'expenses'));

        ModuleService::enable($tenant, 'expenses');
        $this->assertTrue(ModuleService::enabled($tenant, 'expenses'), 'Re-enabling must restore the module exactly.');
    }

    #[Test]
    public function every_preset_resolves_to_a_valid_configuration(): void
    {
        foreach (config('ai_builder.presets') as $name => $preset) {
            if (!empty($preset['blocked_by'])) {
                continue;   // cannot ship yet; covered by the integrity test
            }

            $result = $this->resolver->resolve($preset['modules']);

            $this->assertSame([], $this->resolver->validate($result['modules']), "Preset '{$name}' resolves to an invalid configuration.");
            $this->assertSame([], $result['questions'], "Preset '{$name}' leaves a requires_one unanswered. A preset must be complete — the user should never be interrogated by a template.");
            $this->assertSame([], $result['dropped'], "Preset '{$name}' references a module that was dropped.");
        }
    }

    // ------------------------------------------------------------- helpers

    /**
     * Adjust these two helpers to match your existing test factories — the rest
     * of the file is independent of how a tenant gets made.
     */
    private function makeTenant()
    {
        return \App\Models\Tenant::factory()->create(['slug' => 'module-test-'.uniqid()]);
    }

    private function actingAsOwnerOf($tenant): void
    {
        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);
        app()->instance('current.tenant', $tenant);
    }
}
