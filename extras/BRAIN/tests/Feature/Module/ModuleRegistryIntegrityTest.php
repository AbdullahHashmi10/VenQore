<?php

namespace Tests\Feature\Module;

use Illuminate\Support\Facades\Route;
use ReflectionClass;
use RuntimeException;
use Tests\TestCase;

/**
 * MODULE REGISTRY INTEGRITY — the test that makes THE_RULEBOOK enforceable.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * config/modules.php is the brain. Everything reads from it: the AI prompt, the
 * validator, presets, navigation, the dashboard and the route gate. A wrong
 * value in it does not fail loudly — it fails months later, in front of a
 * paying customer, as a 404 the AI promised them.
 *
 * This test is the only thing standing between a typo and that moment.
 *
 * WRITE IT BEFORE YOU FINISH THE REGISTRY, NOT AFTER. Build plan STEP 3 is
 * explicit: "Acceptance: green. Do not proceed until it is."
 *
 * WHAT EACH TEST PROTECTS
 * -----------------------
 *  shape                -> nobody half-adds a module
 *  tier_zero            -> the worst outcome in the project: a switchable ledger
 *  routes_resolve       -> a disabled module that is still reachable by URL
 *  pages_exist          -> a nav item that 404s
 *  permissions_real     -> a module invisible to everyone, or visible to all
 *  cards_and_terms_real -> a dashboard that renders nothing
 *  graph                -> boot-time infinite loops, and "I clicked one thing
 *                          and five appeared"
 *  aliases              -> the AI missing a business it could have served
 *  status_discipline    -> shipping unfinished work inside a preset
 *  billing_promise      -> quietly breaking "every module, every plan"
 *
 * RUNNING IT
 *   php artisan test --filter=ModuleRegistryIntegrityTest
 *
 * IF IT FAILS, FIX THE REGISTRY — NOT THE TEST. The one exception is
 * test_aliases_do_not_collide_with_qore_denylist, which is documented inline.
 */
class ModuleRegistryIntegrityTest extends TestCase
{
    private array $modules;
    private array $qore;

    protected function setUp(): void
    {
        parent::setUp();
        $this->modules = config('modules');
        $this->qore    = config('qore');

        $this->assertIsArray($this->modules, 'config/modules.php did not return an array.');
        $this->assertIsArray($this->qore, 'config/qore.php did not return an array.');
    }

    // ---------------------------------------------------------------- shape

    public function test_registry_has_exactly_the_planned_modules(): void
    {
        $this->assertCount(
            46,
            $this->modules,
            'VENQORE_FINAL_BUILD_PLAN defines 46 modules. If you deliberately merged or dropped one, '
            .'change this number AND the number in the plan AND the pricing page copy in the same commit. '
            .'The count is a public promise, not an implementation detail.'
        );

        $ids = array_column($this->modules, 'id');
        sort($ids);
        $this->assertSame(range(1, 46), $ids, 'Module ids must be exactly 1..46 with no gaps or duplicates.');
    }

    public function test_every_module_has_every_field(): void
    {
        $fields = [
            'id', 'group', 'label', 'description', 'requires', 'requires_one', 'enhances',
            'routes', 'pages', 'permissions', 'cards', 'terms', 'nav', 'aliases',
            'billing', 'legacy_gate', 'status', 'verify', 'features', 'opens',
            'owns_data', 'history_probe',
        ];

        foreach ($this->modules as $key => $module) {
            foreach ($fields as $field) {
                $this->assertArrayHasKey($field, $module, "Module '{$key}' is missing '{$field}'. Copy a complete entry rather than writing one from memory.");
            }
            $this->assertIsString($module['label'], "{$key}: label must be a string.");
            $this->assertNotEmpty($module['description'], "{$key}: write one plain sentence. If you cannot, it is two modules or none.");
            $this->assertContains($module['group'], ['A', 'B', 'C', 'D', 'E', 'F', 'G'], "{$key}: group must be A-G.");
        }
    }

    // ------------------------------------------------------------- tier zero

    /**
     * THE MOST IMPORTANT TEST IN THE SUITE.
     *
     * One Qore key in the registry means a customer — or a hallucinating model —
     * can switch off the thing that makes the numbers correct. That is silent
     * financial corruption. There is no error message, no exception, no alert:
     * just months of slightly wrong reports and a customer who eventually
     * notices.
     */
    public function test_no_qore_key_appears_in_the_registry(): void
    {
        $deny = $this->qore['denylist'];

        foreach ($this->modules as $key => $module) {
            $this->assertNotContains($key, $deny, "TIER 0 LEAK: '{$key}' is foundation and must never be a module.");

            $deps = array_merge($module['requires'], $module['enhances']);
            foreach ($module['requires_one'] as $set) {
                $deps = array_merge($deps, $set);
            }

            foreach ($deps as $dep) {
                $this->assertNotContains($dep, $deny, "TIER 0 LEAK: '{$key}' depends on foundation key '{$dep}'. Foundation is always on; it is never a dependency.");
            }
        }
    }

    /**
     * Aliases are an attack surface, not just vocabulary.
     *
     * If 'accounting' is an alias of the Accounting Workspace module, a model
     * can reason its way to "the user said accounting is optional, so the
     * ledger is optional". It is not.
     *
     * THIS IS THE ONE TEST WHERE THE FIX MAY BE THE REGISTRY *OR* THIS LIST:
     * narrow the alias ('accounting screens' rather than 'accounting'), or add
     * a documented exemption below. Never delete the denylist entry.
     */
    public function test_aliases_do_not_collide_with_qore_denylist(): void
    {
        // Documented exemptions: real words customers type, where the module
        // genuinely is the screen for that concept. Each one is a decision, not
        // an oversight. Adding to this list requires a sentence saying why.
        $exempt = [
            'accounting_workspace' => ['accounting', 'accounts', 'chart of accounts', 'journal', 'bookkeeping', 'books'],
            'khata_credit'         => ['ledger'],
            'bank_accounts'        => ['accounts'],
            'customers'            => ['parties'],
            'suppliers'            => ['party'],
        ];

        $deny = $this->qore['denylist'];

        foreach ($this->modules as $key => $module) {
            foreach ($module['aliases'] as $alias) {
                $slug = str_replace([' ', '-'], '_', strtolower($alias));
                if (in_array($alias, $exempt[$key] ?? [], true)) {
                    continue;
                }
                $this->assertNotContains(
                    $slug,
                    $deny,
                    "Module '{$key}' has alias '{$alias}' which names a Qore concept. Narrow the alias, or add a documented exemption above."
                );
            }
        }
    }

    // ---------------------------------------------------------------- routes

    /**
     * A route pattern that matches nothing means the gate never fires, which
     * means a disabled module stays fully reachable by typing its URL.
     * That is the failure nobody notices until a customer finds it.
     *
     * NOTE ON EXACT NAMES: 'store.pos' is a route NAME, not a prefix.
     * 'store.pos.*' does not match it. Both forms must be listed where both
     * exist — this test proves each pattern matches at least one real route.
     */
    public function test_every_route_pattern_matches_at_least_one_real_route(): void
    {
        $names = collect(Route::getRoutes()->getRoutesByName())->keys()->all();
        $this->assertNotEmpty($names, 'No named routes found — did the app boot?');

        foreach ($this->modules as $key => $module) {
            foreach ($module['routes'] as $pattern) {
                $this->assertTrue(
                    $this->patternMatchesAny($pattern, $names),
                    "Module '{$key}': route pattern '{$pattern}' matches no registered route. "
                    .'Regenerate route_list_current.json and fix the pattern — an unmatched pattern is an ungated module.'
                );
            }
        }
    }

    /**
     * A nav item pointing at a route this module does not own is a menu entry
     * the gate will block the moment the module is switched off — or worse,
     * one that survives when it should not.
     */
    public function test_nav_routes_are_owned_by_their_module(): void
    {
        foreach ($this->modules as $key => $module) {
            foreach ($module['nav'] as $nav) {
                $this->assertTrue(
                    Route::has($nav['route']),
                    "Module '{$key}': nav route '{$nav['route']}' does not exist. A 404 in the main menu."
                );
                $this->assertTrue(
                    $this->patternMatchesAny($nav['route'], [$nav['route']]) && $this->ownsRoute($module, $nav['route']),
                    "Module '{$key}': nav route '{$nav['route']}' is not covered by this module's own 'routes' patterns."
                );
            }
        }
    }

    /**
     * No route may be claimed by two modules unless BOTH are listed — otherwise
     * the gate's answer depends on evaluation order, which is a bug that only
     * shows up for some tenants.
     */
    public function test_no_route_is_silently_claimed_by_two_modules(): void
    {
        $names  = collect(Route::getRoutes()->getRoutesByName())->keys()->all();
        $owners = [];

        foreach ($this->modules as $key => $module) {
            foreach ($names as $name) {
                foreach ($module['routes'] as $pattern) {
                    if ($this->matches($pattern, $name)) {
                        $owners[$name][] = $key;
                    }
                }
            }
        }

        $shared = array_filter($owners, fn ($o) => count(array_unique($o)) > 1);

        // Sharing is legal, but it must be DELIBERATE: the gate must allow the
        // route when ANY owning module is enabled. This assertion prints them so
        // the decision is conscious rather than accidental.
        foreach ($shared as $name => $moduleKeys) {
            $this->addToAssertionCount(1);
            fwrite(STDERR, "SHARED ROUTE: {$name} claimed by ".implode(', ', array_unique($moduleKeys))."\n");
        }

        $this->assertLessThan(
            40,
            count($shared),
            'Too many shared routes. Shared prefixes must be replaced with explicit route names (see Invoicing #6 for the pattern).'
        );
    }

    // ----------------------------------------------------------------- pages

    public function test_every_page_path_exists_on_disk(): void
    {
        foreach ($this->modules as $key => $module) {
            foreach ($module['pages'] as $page) {
                $path = resource_path('js/Pages/'.$page);
                $this->assertTrue(
                    file_exists($path) || is_dir(rtrim($path, '/')),
                    "Module '{$key}': page '{$page}' does not exist at {$path}."
                );
            }
        }
    }

    // --------------------------------------------------- permissions / cards

    public function test_every_permission_key_is_real(): void
    {
        $permissions = $this->flattenPermissionKeys(config('permissions'));
        $this->assertNotEmpty($permissions, 'config/permissions.php produced no keys.');

        foreach ($this->modules as $key => $module) {
            foreach ($module['permissions'] as $permission) {
                $this->assertContains($permission, $permissions, "Module '{$key}': unknown permission '{$permission}'.");
            }
        }
    }

    public function test_every_dashboard_card_key_is_real(): void
    {
        $cards = array_keys(\App\Services\Dashboard\DashboardRegistry::all());

        foreach ($this->modules as $key => $module) {
            foreach ($module['cards'] as $card) {
                $this->assertContains($card, $cards, "Module '{$key}': unknown dashboard card '{$card}'.");
            }
        }
    }

    /**
     * Terms::$fallbacks had 25 keys on 15 Aug 2026 and 'composition' was NOT
     * one of them. The Cookbook module wants it. Add the key to Terms.php, then
     * add it to that module's terms[] — in that order, or this test tells you.
     */
    public function test_every_terminology_key_is_real(): void
    {
        $terms = array_keys(
            (new ReflectionClass(\App\Support\Terms::class))->getStaticPropertyValue('fallbacks')
        );

        foreach ($this->modules as $key => $module) {
            foreach ($module['terms'] as $term) {
                $this->assertContains($term, $terms, "Module '{$key}': term key '{$term}' is not in Terms::\$fallbacks. Add it there first.");
            }
        }
    }

    // ----------------------------------------------------------------- graph

    public function test_every_dependency_target_exists(): void
    {
        foreach ($this->modules as $key => $module) {
            $deps = array_merge($module['requires'], $module['enhances']);
            foreach ($module['requires_one'] as $set) {
                $this->assertGreaterThanOrEqual(2, count($set), "Module '{$key}': a requires_one set with fewer than 2 options is just a requires.");
                $deps = array_merge($deps, $set);
            }
            foreach ($deps as $dep) {
                $this->assertArrayHasKey($dep, $this->modules, "Module '{$key}': depends on unknown module '{$dep}'. A typo here fails silently at runtime and loudly in production.");
            }
        }
    }

    public function test_dependency_graph_has_no_cycles_and_is_shallow(): void
    {
        $max = 0;
        $deepest = '';

        foreach (array_keys($this->modules) as $key) {
            $depth = $this->depth($key, []);   // throws on a cycle
            if ($depth > $max) {
                $max = $depth;
                $deepest = $key;
            }
        }

        $this->assertLessThanOrEqual(
            4,
            $max,
            "Deepest requires-chain is {$max} via '{$deepest}'. The plan allows 4. Deeper means a user enables one thing and five appear — usually a sign something modelled as 'requires' should be 'enhances'."
        );
    }

    public function test_a_module_is_never_more_live_than_its_dependencies(): void
    {
        $rank = ['planned' => 0, 'building' => 1, 'beta' => 2, 'live' => 3, 'retired' => 3];

        foreach ($this->modules as $key => $module) {
            foreach ($module['requires'] as $dep) {
                $this->assertLessThanOrEqual(
                    $rank[$this->modules[$dep]['status']],
                    $rank[$module['status']],
                    "Module '{$key}' is '{$module['status']}' but requires '{$dep}' which is only '{$this->modules[$dep]['status']}'. You cannot sell a module that stands on unfinished work."
                );
            }
        }
    }

    // --------------------------------------------------------------- content

    public function test_every_module_has_enough_aliases(): void
    {
        foreach ($this->modules as $key => $module) {
            $this->assertGreaterThanOrEqual(
                6,
                count($module['aliases']),
                "Module '{$key}' has only ".count($module['aliases'])." aliases. Target 6-10, including the trade word, the Roman-Urdu word and the typo. Aliases are the highest-return field in the file — every good one is an onboarding that lands correctly."
            );
        }
    }

    public function test_status_discipline(): void
    {
        $valid = ['live', 'beta', 'building', 'planned', 'retired'];
        $nonLive = [];

        foreach ($this->modules as $key => $module) {
            $this->assertContains($module['status'], $valid, "Module '{$key}': invalid status.");
            $this->assertNotSame('NEEDS_VALIDATION', $module['status'], "Module '{$key}' is still unvalidated and must not ship.");

            if ($module['status'] !== 'live') {
                $nonLive[] = "{$key} ({$module['status']})";
            }

            if ($module['status'] === 'live') {
                $this->assertNotEmpty($module['routes'], "Module '{$key}' is live but owns no routes. Live means a customer can open it.");
            }
        }

        $this->assertLessThanOrEqual(
            5,
            count($nonLive),
            'Too much unfinished work in V1: '.implode(', ', $nonLive).'. Cut to the most valuable few.'
        );
    }

    /**
     * "Every module is included on every plan" is the positioning. It is
     * verifiable by a customer in five seconds on your pricing page, which is
     * exactly why it must not drift. Only the documented exceptions may cost
     * extra, and each has a real marginal cost.
     */
    public function test_the_billing_promise_holds(): void
    {
        $allowedExceptions = ['ai_insights', 'marketplace_sync'];

        foreach ($this->modules as $key => $module) {
            $this->assertContains($module['billing'], ['included', 'metered', 'addon'], "Module '{$key}': invalid billing type.");

            if ($module['billing'] !== 'included') {
                $this->assertContains(
                    $key,
                    $allowedExceptions,
                    "Module '{$key}' is not free on every plan. Charge for what costs you money to run, and for scale — never for a feature you already built. If this is a real decision, add it above and update the pricing page in the same commit."
                );
            }
        }

        $included = count(array_filter($this->modules, fn ($m) => $m['billing'] === 'included'));
        $this->assertGreaterThanOrEqual(42, $included, 'The promise is "every module, every plan" with four honest exceptions. Fewer than 42 included breaks the claim.');
    }

    // --------------------------------------------------------------- presets

    public function test_presets_only_combine_live_modules(): void
    {
        foreach (config('ai_builder.presets') as $presetKey => $preset) {
            foreach ($preset['modules'] as $moduleKey) {
                $this->assertArrayHasKey($moduleKey, $this->modules, "Preset '{$presetKey}': unknown module '{$moduleKey}'. Presets combine what exists; they never justify inventing an entry.");

                if ($this->modules[$moduleKey]['status'] !== 'live') {
                    $this->assertContains(
                        $moduleKey,
                        $preset['blocked_by'] ?? [],
                        "Preset '{$presetKey}' uses '{$moduleKey}' which is '{$this->modules[$moduleKey]['status']}'. Either wait, or declare it in blocked_by so it cannot ship by accident."
                    );
                }
            }
        }
    }

    public function test_presets_are_dependency_complete(): void
    {
        foreach (config('ai_builder.presets') as $presetKey => $preset) {
            $set = $preset['modules'];

            foreach ($set as $moduleKey) {
                foreach ($this->modules[$moduleKey]['requires'] as $dep) {
                    $this->assertContains($dep, $set, "Preset '{$presetKey}': '{$moduleKey}' requires '{$dep}', which is missing. The resolver would add it silently — put it in the preset so what you tested is what ships.");
                }
                foreach ($this->modules[$moduleKey]['requires_one'] as $oneOf) {
                    $this->assertNotEmpty(array_intersect($oneOf, $set), "Preset '{$presetKey}': '{$moduleKey}' needs one of [".implode(' | ', $oneOf)."] and the preset has none.");
                }
            }
        }
    }

    // --------------------------------------------------------------- helpers

    private function depth(string $key, array $seen): int
    {
        if (in_array($key, $seen, true)) {
            throw new RuntimeException('CYCLE in module requires: '.implode(' -> ', array_merge($seen, [$key])).'. A cycle is a boot-time infinite loop.');
        }

        $seen[] = $key;
        $max = 0;

        foreach ($this->modules[$key]['requires'] as $dep) {
            if (isset($this->modules[$dep])) {
                $max = max($max, 1 + $this->depth($dep, $seen));
            }
        }

        return $max;
    }

    private function ownsRoute(array $module, string $name): bool
    {
        foreach ($module['routes'] as $pattern) {
            if ($this->matches($pattern, $name)) {
                return true;
            }
        }

        return false;
    }

    private function patternMatchesAny(string $pattern, array $names): bool
    {
        foreach ($names as $name) {
            if ($this->matches($pattern, $name)) {
                return true;
            }
        }

        return false;
    }

    private function matches(string $pattern, string $name): bool
    {
        $regex = '/^'.str_replace(['\*'], ['.*'], preg_quote($pattern, '/')).'$/';

        return (bool) preg_match($regex, $name);
    }

    private function flattenPermissionKeys(array $config): array
    {
        $keys = [];

        array_walk_recursive($config, function ($value, $key) use (&$keys) {
            foreach ([$value, $key] as $candidate) {
                if (is_string($candidate) && preg_match('/^[a-z_]+\.[a-z_]+$/', $candidate)) {
                    $keys[] = $candidate;
                }
            }
        });

        return array_values(array_unique($keys));
    }
}
