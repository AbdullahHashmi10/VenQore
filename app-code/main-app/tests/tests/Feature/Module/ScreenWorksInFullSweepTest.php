<?php

namespace Tests\Feature\Module;

use App\Services\Builder\PlanEntitlement;
use App\Services\ModuleService;
use App\Support\ModuleRouteMap;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * "Whatever we give you works on its own."
 *
 * For EVERY module: switch on only that module (plus what it requires), switch
 * every other optional module off, then fire every call its screens make — the
 * lookups as background requests, the saves/deletes as if sent from the module's
 * own screen. None of them may come back "module_disabled".
 *
 * Calls are found by reading the module's own pages (config/modules.php 'pages')
 * for route('…') names, so a new button wired to another module's route is
 * covered the day it is written. Controllers may still answer 404/422/500 for the
 * dummy ids used here; this test only cares that the module gate let it through.
 */
class ScreenWorksInFullSweepTest extends VenQoreTestCase
{
    #[Test]
    public function no_call_from_a_modules_own_screens_is_refused_for_a_missing_module(): void
    {
        $tenant = $this->createTenant(plan: 'business', status: 'active');
        $this->actingAsTenantUser($tenant, 'owner');
        $modules = (array) config('modules');
        $routes = app('router')->getRoutes();
        $refused = [];
        $checked = 0;

        foreach ($modules as $key => $def) {
            if (! is_array($def) || ($def['status'] ?? 'live') !== 'live' || empty($def['pages'])) {
                continue;
            }
            $screen = $this->screenRouteOf($def, $key);
            if (! $screen) {
                continue;
            }
            $this->onlyEnable($tenant, $key, $modules);

            foreach ($this->callsMadeBy($def) as $name) {
                $route = $routes->getByName($name);
                if (! $route || ModuleRouteMap::isAlwaysOn($name) || ModuleRouteMap::ownersOf($name) === []) {
                    continue;
                }
                $url = $this->urlFor($name, $route, $tenant);
                if ($url === null) {
                    continue;
                }
                $method = collect($route->methods())->first(fn ($m) => $m !== 'HEAD');
                $referer = route($screen, ['store_slug' => $tenant->slug]);
                $response = $method === 'GET'
                    ? $this->withHeaders(['Sec-Fetch-Dest' => 'empty'])->getJson($url)
                    : $this->withHeaders(['Referer' => $referer])->json($method, $url, []);
                $this->flushHeaders();
                $checked++;

                $base = $response->baseResponse;   // downloads come back streamed: reached the controller, so allowed
                if ($base->getStatusCode() === 403 && ! $base instanceof \Symfony\Component\HttpFoundation\StreamedResponse
                    && str_contains((string) $base->getContent(), 'module_disabled')) {
                    $refused[] = "{$key} screen → {$method} {$name}";
                }
            }
        }

        $this->assertGreaterThan(20, $checked, 'The sweep found too few calls to mean anything — did the page scan break?');
        $this->assertSame([], $refused, "These calls are made from a screen the store has, and were refused:\n" . implode("\n", $refused));
    }

    #[Test]
    public function the_builder_never_gives_a_plan_a_module_that_plan_locks(): void
    {
        // Regression for the cases found in the 2026-10-19 sweep.
        $this->assertFalse(PlanEntitlement::allows('multi_location', 'core'), 'A second warehouse is refused below Scale (multi_branch).');
        $this->assertFalse(PlanEntitlement::allows('ai_insights', 'starter'), 'AI Insights pages are locked below Core (growth_engine).');
        $this->assertFalse(PlanEntitlement::allows('marketplace_sync', 'core'), 'WooCommerce pages are locked below Scale.');
        $this->assertTrue(PlanEntitlement::allows('inventory', 'solo'), 'Retired legacy_gate flags must not lock core modules.');
        $this->assertTrue(PlanEntitlement::allows('multi_location', null), 'No plan chosen yet: hold nothing back.');

        // Generic: whatever a module's own front page needs, an allowed plan has.
        foreach (['solo', 'starter', 'core', 'scale'] as $plan) {
            foreach ((array) config('modules') as $key => $def) {
                if (! is_array($def) || ! PlanEntitlement::allows($key, $plan)) {
                    continue;
                }
                foreach (PlanEntitlement::featuresFor($key) as $feature) {
                    $limits = \App\Services\PlanRepository::getLimits($plan);
                    $v = $limits[$feature] ?? config("plans.{$plan}.{$feature}");
                    $this->assertTrue($v === null || $v === true || $v === 'true' || (is_numeric($v) && $v > 0),
                        "{$plan} is allowed {$key} but lacks {$feature}");
                }
            }
        }
    }

    private function onlyEnable($tenant, string $key, array $modules): void
    {
        $keep = [$key => true];
        $queue = [$key];
        while ($queue) {
            foreach ((array) ($modules[array_pop($queue)]['requires'] ?? []) as $dep) {
                if (! isset($keep[$dep])) {
                    $keep[$dep] = true;
                    $queue[] = $dep;
                }
            }
        }
        foreach (array_keys($modules) as $m) {
            isset($keep[$m]) ? ModuleService::enable($tenant, $m) : ModuleService::disable($tenant, $m);
        }
        ModuleService::invalidate($tenant->id);
    }

    /** The page the owner is on: the module's menu page, else its first GET route without extra parameters. */
    private function screenRouteOf(array $def, string $key): ?string
    {
        foreach ((array) ($def['nav'] ?? []) as $nav) {
            if (! empty($nav['route']) && app('router')->getRoutes()->getByName($nav['route'])) {
                return $nav['route'];
            }
        }
        foreach (app('router')->getRoutes() as $r) {
            if ($r->getName() && in_array('GET', $r->methods(), true) && in_array($key, ModuleRouteMap::ownersOf($r->getName()), true)
                && array_diff($r->parameterNames(), ['store_slug']) === []) {
                return $r->getName();
            }
        }

        return null;
    }

    /** @return array<int,string> route names the module's own pages call */
    private function callsMadeBy(array $def): array
    {
        $names = [];
        foreach ((array) $def['pages'] as $page) {
            $base = resource_path('js/Pages/' . $page);
            $files = is_dir($base) ? glob(rtrim($base, '/') . '/*.jsx') : (is_file($base) ? [$base] : []);
            foreach ($files as $file) {
                preg_match_all("/route\(\s*['\"]([a-z0-9_.\-]+)['\"]/i", (string) file_get_contents($file), $m);
                array_push($names, ...$m[1]);
            }
        }

        return array_values(array_unique($names));
    }

    private function urlFor(string $name, $route, $tenant): ?string
    {
        $params = ['store_slug' => $tenant->slug];
        foreach ($route->parameterNames() as $p) {
            $params[$p] ??= 999999;
        }
        try {
            return route($name, $params);
        } catch (\Throwable) {
            return null;
        }
    }
}
