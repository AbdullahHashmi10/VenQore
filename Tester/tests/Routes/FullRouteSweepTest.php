<?php

namespace Tests\Routes;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * FullRouteSweepTest — whole-application route and page integrity.
 *
 * WHY THIS EXISTS
 * ---------------
 * The project already has two route checkers, and between them they leave a
 * real hole:
 *
 *   1. Tests\Feature\ZiggyRouteIntegrityTest — scans the React source for
 *      route('...') calls and asserts each one is registered. It is
 *      frontend-driven, so a route that exists in Laravel but was never
 *      regenerated into resources/js/ziggy.js is invisible to it.
 *
 *   2. php artisan audit:ledger-truth (LedgerTruthAuditCommand) — a real HTTP
 *      sweep, but discoverGetRoutes() filters to names starting with 'store.'
 *      only. At the time of writing that skips platform.*, tools.*,
 *      marketing.*, superadmin.* and vensynq.* entirely.
 *
 * This test closes the hole. It is registry-and-filesystem based, so it needs
 * no database and no HTTP: it runs in seconds and is safe to put in front of
 * every deploy. The heavyweight HTTP sweep stays where it is and is invoked by
 * RUN_ROUTE_SWEEP.bat immediately after this one.
 *
 * WHAT IT CATCHES
 * ---------------
 *  - "Ziggy error: route not found" in the browser, caused by adding a route
 *    to routes/web.php and forgetting `php artisan ziggy:generate`. This is
 *    called out in CLAUDE.md as a known recurring build-guard failure; here it
 *    fails in CI instead of in a customer's face.
 *  - A stale ziggy.js entry pointing at a route that has since been deleted or
 *    renamed, which produces a URL that 404s.
 *  - Inertia::render('Some/Page') where resources/js/Pages/Some/Page.jsx does
 *    not exist — a guaranteed white screen.
 *  - A route wired to a controller class or method that does not exist — a
 *    guaranteed 500.
 *  - A brand-new top-level route namespace appearing without anyone deciding
 *    how it should be swept.
 *
 * MAINTENANCE
 * -----------
 * When you legitimately add a new top-level namespace, add it to
 * KNOWN_NAMESPACES below together with a one-line note on how it gets covered.
 * That is the entire maintenance burden of this file, and it is deliberate:
 * the census test is what stops coverage silently rotting.
 */
class FullRouteSweepTest extends TestCase
{
    /**
     * Top-level route-name namespaces we have consciously accounted for.
     *
     * The value is the sweep story for that namespace — how we know those
     * pages actually work. Keeping the note here means the coverage argument
     * lives next to the assertion that enforces it.
     */
    private const KNOWN_NAMESPACES = [
        'store'            => 'HTTP-swept by audit:ledger-truth (GET) + Feature/Smoke/InertiaPageRenderTest',
        'platform'         => 'Static sweep only (this file). No HTTP sweep yet — see Documentation/ROUTE_SWEEP.md',
        'superadmin'       => 'Static sweep only (this file). Behaviour covered by Feature/Module20/SuperAdminTest',
        'tools'            => 'Feature/Tools/* covers every public tool endpoint directly',
        'marketing'        => 'Feature/MarketingSsrTest, FeaturePagesTest, SolutionsPagesTest, ComparePagesTest',
        'vensynq'          => 'Feature/Module19/* (VenSynQ + marketplace clearing)',
        'woo'              => 'Feature/Module10/WooCommerceTest + Production/WooWebhookJournalPinningTest',
        'legacy'           => 'Legacy redirect shims. Covered by RouteParameterRegressionTest',
        'admin'            => 'Feature/LayoutAndAdminUsersRegressionTest',
        'api'              => 'JSON endpoints. Covered by TerminalAppIntegrationTest',
        'chatbot'          => 'Feature/Chat/*',
        'notifications'    => 'Feature/Module19/RealTimeNotificationTest',
        'horizon'          => 'Vendor package (Laravel Horizon). Not our code, not swept.',
        'sanctum'          => 'Vendor package (Laravel Sanctum). Not our code, not swept.',
        'ignition'         => 'Vendor package (dev error page). Not our code, not swept.',
        'login'            => 'Feature/Auth/AuthenticationTest',
        'logout'           => 'Feature/Auth/AuthenticationTest',
        'register'         => 'Feature/Auth/RegistrationTest',
        'password'         => 'Feature/Auth/PasswordResetTest + PasswordUpdateTest',
        'verification'     => 'Feature/Auth/EmailVerificationTest',
        'account'          => 'Feature/ProfileTest',
        'profile'          => 'Feature/ProfileTest',
        'staff'            => 'Feature/Module16/StaffAttendanceTest',
        'staff-login'      => 'Feature/Module16/StaffAttendanceTest',
        'invite'           => 'Feature/Module01/AuthAndTenancyTest',
        'demo'             => 'Feature/DemoStore/*',
        'blog'             => 'Feature/BlogPostEngineTest',
        'sitemap'          => 'Feature/SitemapTest + SitemapIndexAndLastModifiedTest',
        'partner-support'  => 'Feature/PartnersPageTest',
        'partners'         => 'Feature/PartnersPageTest',
        'error'            => 'Static error page. No behaviour to sweep.',
        'storage'          => 'Framework local-disk signed URL route.',
        'pricing'          => 'Feature/PricingConversionOptimizationTest',
        'roadmap'          => 'Feature/RoadmapTest',
        'docs'             => 'Feature/DocumentationHubTest',
        'documentation'    => 'Feature/DocumentationHubTest',
        'appsumo'          => 'Feature/AppSumo/*',
        'billing'          => 'Feature/Billing/*',
        'health'           => 'Infrastructure heartbeat endpoints.',
        'auth'             => 'Feature/Auth/*',
        'barcode'          => 'Feature/Tools/*',
        'csrf'             => 'Framework CSRF cookie endpoint',
        'dashboard'        => 'Feature/Smoke/ProductionSmokeTest',
        'gift'             => 'Feature/GiftCards/*',
        'google'           => 'Feature/GoogleDriveAuthTest',
        'hub'              => 'Feature/Module01/AuthAndTenancyTest',
        'installer'        => 'Installer suite',
        'my-stores'        => 'Feature/Module01/AuthAndTenancyTest',
        'privacy'          => 'Feature/LegalPagesTest',
        'redeem'           => 'Feature/AppSumo/*',
        'refund-policy'    => 'Feature/LegalPagesTest',
        'terms'            => 'Feature/LegalPagesTest',
        'help'             => 'Feature/HelpCenterTest',
        'known-issues'     => 'Feature/KnownIssuesTest',
        'updater'          => 'Updater endpoints',
        'webhooks'         => 'Webhook handlers',
        'welcome'          => 'Feature/MarketingSsrTest',
        'welcome-splash'   => 'Feature/MarketingSsrTest',
        'what-is-included' => 'Feature/MarketingSsrTest',
    ];

    // -----------------------------------------------------------------
    // 1. Ziggy <-> Laravel registry drift, in BOTH directions.
    // -----------------------------------------------------------------

    public function test_every_ziggy_route_still_exists_in_the_laravel_registry(): void
    {
        $ziggy      = $this->ziggyRoutes();
        $registered = $this->registeredRouteNames();

        $stale = array_values(array_diff(array_keys($ziggy), $registered));

        $this->assertSame(
            [],
            $stale,
            "resources/js/ziggy.js contains route names that no longer exist in Laravel.\n"
            . "Any route(...) call to one of these produces a broken URL at runtime.\n"
            . "Fix: php artisan ziggy:generate\n\n"
            . "Stale entries:\n  - " . implode("\n  - ", $stale) . "\n"
        );
    }

    public function test_every_laravel_route_is_present_in_the_generated_ziggy_file(): void
    {
        $ziggy = $this->ziggyRoutes();

        $missing = [];

        foreach (Route::getRoutes()->getRoutes() as $route) {
            $name = $route->getName();

            if ($name === null || $name === '') {
                continue;
            }

            // Vendor packages ship their own routes and are not called from our
            // React source, so their absence from ziggy.js is not a defect.
            if ($this->isVendorNamespace($name)) {
                continue;
            }

            if (! array_key_exists($name, $ziggy)) {
                $missing[] = $name . '  [' . implode('|', $route->methods()) . ' ' . $route->uri() . ']';
            }
        }

        sort($missing);

        $this->assertSame(
            [],
            $missing,
            "Routes exist in Laravel but are missing from resources/js/ziggy.js.\n"
            . "Calling route('<name>') for any of these throws the Ziggy\n"
            . "\"route is not in the route list\" error in the browser.\n"
            . "Fix: php artisan ziggy:generate  (then rebuild the frontend)\n\n"
            . "Missing entries:\n  - " . implode("\n  - ", $missing) . "\n"
        );
    }

    // -----------------------------------------------------------------
    // 2. Every Inertia page a controller can render must exist on disk.
    // -----------------------------------------------------------------

    public function test_every_rendered_inertia_page_component_exists(): void
    {
        $pagesDir = base_path('resources/js/Pages');

        $this->assertDirectoryExists($pagesDir, 'resources/js/Pages is missing entirely.');

        $missing = [];

        foreach ($this->renderedPageComponents() as $component => $sources) {
            $candidates = [
                $pagesDir . '/' . $component . '.jsx',
                $pagesDir . '/' . $component . '.tsx',
                $pagesDir . '/' . $component . '/index.jsx',
                $pagesDir . '/' . $component . '/index.tsx',
            ];

            $found = false;

            foreach ($candidates as $candidate) {
                if (is_file($candidate)) {
                    $found = true;
                    break;
                }
            }

            if (! $found) {
                $missing[] = $component . '   (rendered from: ' . implode(', ', array_unique($sources)) . ')';
            }
        }

        sort($missing);

        $this->assertSame(
            [],
            $missing,
            "Controllers render Inertia pages that do not exist under resources/js/Pages.\n"
            . "Hitting the corresponding route gives the user a blank screen.\n\n"
            . "Missing components:\n  - " . implode("\n  - ", $missing) . "\n"
        );
    }

    // -----------------------------------------------------------------
    // 3. Every route action must resolve to real code.
    // -----------------------------------------------------------------

    public function test_every_route_action_resolves_to_an_existing_controller_method(): void
    {
        $broken = [];

        foreach (Route::getRoutes()->getRoutes() as $route) {
            $action = $route->getActionName();

            // Closures and view/redirect shorthand routes have no class to check.
            if ($action === 'Closure' || ! str_contains($action, '@')) {
                continue;
            }

            [$class, $method] = explode('@', $action, 2);

            if ($this->isVendorClass($class)) {
                continue;
            }

            if (! class_exists($class)) {
                $broken[] = "{$route->uri()}  ->  MISSING CLASS  {$class}";
                continue;
            }

            if (! method_exists($class, $method)) {
                $broken[] = "{$route->uri()}  ->  MISSING METHOD {$class}::{$method}()";
            }
        }

        sort($broken);

        $this->assertSame(
            [],
            $broken,
            "Routes point at controller code that does not exist. Every one of\n"
            . "these is a guaranteed 500 the moment a user reaches the URL.\n\n"
            . "Broken wiring:\n  - " . implode("\n  - ", $broken) . "\n"
        );
    }

    // -----------------------------------------------------------------
    // 4. Namespace census — the anti-rot assertion.
    // -----------------------------------------------------------------

    public function test_no_route_namespace_exists_without_a_declared_sweep_story(): void
    {
        $seen = [];

        foreach (Route::getRoutes()->getRoutes() as $route) {
            $name = $route->getName();

            if ($name === null || $name === '') {
                continue;
            }

            $seen[explode('.', $name)[0]] = true;
        }

        $unreviewed = array_values(array_diff(
            array_keys($seen),
            array_keys(self::KNOWN_NAMESPACES)
        ));

        sort($unreviewed);

        $this->assertSame(
            [],
            $unreviewed,
            "New top-level route namespaces appeared with no declared sweep story.\n"
            . "This test is the tripwire that stops route coverage rotting: someone\n"
            . "shipped a whole area of the app and nobody decided how it gets tested.\n\n"
            . "Add each one to FullRouteSweepTest::KNOWN_NAMESPACES with a note on\n"
            . "how it is covered, and make that note true.\n\n"
            . "Unreviewed namespaces:\n  - " . implode("\n  - ", $unreviewed) . "\n"
        );
    }

    /**
     * Coverage census. Writes a machine-readable report the dashboard reads,
     * and asserts a floor so the sweep cannot silently shrink.
     */
    public function test_route_coverage_census_is_recorded_and_has_not_shrunk(): void
    {
        $byNamespace = [];
        $totalNamed  = 0;
        $totalGet    = 0;

        foreach (Route::getRoutes()->getRoutes() as $route) {
            $name = $route->getName();

            if ($name === null || $name === '') {
                continue;
            }

            $ns = explode('.', $name)[0];
            $isGet = in_array('GET', $route->methods(), true);

            $byNamespace[$ns]['total'] = ($byNamespace[$ns]['total'] ?? 0) + 1;
            $byNamespace[$ns]['get']   = ($byNamespace[$ns]['get'] ?? 0) + ($isGet ? 1 : 0);

            $totalNamed++;
            $totalGet += $isGet ? 1 : 0;
        }

        ksort($byNamespace);

        $report = [
            'generated_at'      => date('c'),
            'total_named'       => $totalNamed,
            'total_get'         => $totalGet,
            'inertia_pages'     => count($this->renderedPageComponents()),
            'ziggy_entries'     => count($this->ziggyRoutes()),
            'by_namespace'      => $byNamespace,
            'http_swept_by_artisan' => ['store'],
            'static_swept_only'     => array_values(array_diff(
                array_keys($byNamespace),
                ['store'],
                $this->vendorNamespaces()
            )),
        ];

        $dir = dirname(__DIR__, 2) . '/reports';

        if (! is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        @file_put_contents(
            $dir . '/route-coverage.json',
            json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        // Floor assertions. These are not arbitrary: they are the counts at the
        // time this file was written. If the app genuinely shrinks, lower them
        // deliberately in the same commit that removes the routes — never to
        // make a red build go green.
        $this->assertGreaterThanOrEqual(
            850,
            $totalNamed,
            "Named route count collapsed to {$totalNamed}. Either a route file "
            . "failed to load, or a large area of the app was deleted."
        );

        $this->assertGreaterThanOrEqual(
            400,
            $totalGet,
            "GET route count collapsed to {$totalGet}."
        );
    }

    // =================================================================
    // Helpers
    // =================================================================

    /**
     * Parse resources/js/ziggy.js into name => definition.
     *
     * The file is `const Ziggy = {...};` followed by a browser-merge shim, so
     * we slice between the first brace and the closing `};` rather than trying
     * to regex the whole thing.
     *
     * @return array<string, array<string, mixed>>
     */
    private function ziggyRoutes(): array
    {
        $path = base_path('resources/js/ziggy.js');

        $this->assertFileExists(
            $path,
            'resources/js/ziggy.js is missing. Run: php artisan ziggy:generate'
        );

        $source = file_get_contents($path);

        // The file is:
        //
        //     const Ziggy = { ... };
        //     if (typeof window !== 'undefined' ...) { ... }
        //     export { Ziggy };
        //
        // An earlier version of this method used strrpos($source, '};') to find
        // the end of the object. That matches the LAST '};' in the file, which
        // belongs to `export { Ziggy };` — so it sliced in ~150 characters of
        // trailing JavaScript and json_decode() returned null on a perfectly
        // valid ziggy.js. That was a bug in this test, not in the application.
        //
        // Brace-match from the opening brace instead, skipping braces that
        // appear inside string literals (route URIs contain {store_slug}).
        $start = strpos($source, '{');

        $this->assertNotFalse($start, 'Could not locate the Ziggy object in ziggy.js.');

        $depth    = 0;
        $end      = null;
        $inString = false;
        $length   = strlen($source);

        for ($i = $start; $i < $length; $i++) {
            $char = $source[$i];

            if ($inString) {
                if ($char === '\\') {
                    $i++;               // skip the escaped character
                } elseif ($char === '"') {
                    $inString = false;
                }

                continue;
            }

            if ($char === '"') {
                $inString = true;
            } elseif ($char === '{') {
                $depth++;
            } elseif ($char === '}') {
                $depth--;

                if ($depth === 0) {
                    $end = $i;
                    break;
                }
            }
        }

        $this->assertNotNull(
            $end,
            'Could not find the closing brace of the Ziggy object — ziggy.js may be truncated.'
        );

        $decoded = json_decode(substr($source, $start, $end - $start + 1), true);

        $this->assertIsArray($decoded, 'ziggy.js did not contain valid JSON. Regenerate it.');
        $this->assertArrayHasKey('routes', $decoded, 'ziggy.js has no "routes" key.');

        return $decoded['routes'];
    }

    /** @return list<string> */
    private function registeredRouteNames(): array
    {
        $names = [];

        foreach (Route::getRoutes()->getRoutes() as $route) {
            $name = $route->getName();

            if ($name !== null && $name !== '') {
                $names[$name] = true;
            }
        }

        return array_keys($names);
    }

    /**
     * Every Inertia page component name a controller can render, mapped to the
     * files that render it.
     *
     * @return array<string, list<string>>
     */
    private function renderedPageComponents(): array
    {
        static $cache = null;

        if ($cache !== null) {
            return $cache;
        }

        $components = [];

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(
                base_path('app'),
                \FilesystemIterator::SKIP_DOTS
            )
        );

        foreach ($iterator as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }

            $source = file_get_contents($file->getPathname());

            if (! str_contains($source, 'nertia')) {
                continue;
            }

            // Inertia::render('Foo/Bar'  |  inertia('Foo/Bar'
            preg_match_all(
                "/(?:Inertia::render|\\binertia)\s*\(\s*'([A-Za-z0-9_\/\-]+)'/",
                $source,
                $matches
            );

            foreach ($matches[1] as $component) {
                $components[$component][] = str_replace(base_path() . DIRECTORY_SEPARATOR, '', $file->getPathname());
            }
        }

        ksort($components);

        return $cache = $components;
    }

    /** @return list<string> */
    private function vendorNamespaces(): array
    {
        return ['horizon', 'sanctum', 'ignition', 'telescope', 'pulse', 'livewire', 'debugbar'];
    }

    private function isVendorNamespace(string $routeName): bool
    {
        return in_array(explode('.', $routeName)[0], $this->vendorNamespaces(), true);
    }

    private function isVendorClass(string $class): bool
    {
        return ! str_starts_with($class, 'App\\');
    }
}
