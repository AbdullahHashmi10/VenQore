<?php

namespace Tests\Feature\Golden;

use Symfony\Component\Yaml\Yaml;
use Illuminate\Foundation\Testing\DatabaseTransactions;

/**
 * @group golden
 * @group sentinel
 */
class SentinelAuditTest extends SentinelTestCase
{
    use DatabaseTransactions;

    /**
     * @test
     * Core Sentinel Test Sweep:
     *   1. ARRANGE: Seed a bypassed transaction of Rs 9,999 directly to DB tables (sales, purchases, expenses)
     *               but bypass/omit writing double-entry ledger items.
     *   2. ACT: Iterate through all LEDGER-DERIVED routes in number_registry.yaml and retrieve Inertia payloads.
     *   3. ASSERT: No page or API response contains the bypassed amount 9,999.00 or "9,999".
     *              If a page does, it means it is reading raw transaction tables, not the ledger!
     */
    public function test_sentinel_ledger_isolation_sweep(): void
    {
        $this->seedBypassedTransactions();

        $registryPath = base_path('verification/number_registry.yaml');
        if (!file_exists($registryPath)) {
            $this->markTestSkipped("Number registry not found, skipping Sentinel sweep.");
        }

        $registry = Yaml::parseFile($registryPath);
        $metrics = $registry['metrics'] ?? [];

        // Group by route to minimize HTTP calls
        $routes = [];
        foreach ($metrics as $metric) {
            if (($metric['classification'] ?? '') === 'LEDGER-DERIVED' && !empty($metric['route'])) {
                $routes[$metric['route']][] = $metric['name'];
            }
        }

        $this->actingAsTenantUser($this->tenant, 'owner');

        $violations = [];
        foreach ($routes as $routeName => $metricNames) {
            $url = $this->resolveRouteUrl($routeName);
            if (!$url) {
                continue;
            }

            // Hit with Inertia headers to get raw JSON props
            $response = $this->get($url, [
                'X-Inertia' => 'true',
                'X-Inertia-Version' => '1',
            ]);

            if ($response->status() !== 200) {
                continue;
            }

            $props = [];
            if ($response->headers->get('content-type') === 'application/json') {
                $props = $response->json();
            } else {
                $page = $response->viewData('page');
                if ($page && isset($page['props'])) {
                    $props = $page['props'];
                }
            }

            if ($this->scanPayload($props, self::BYPASSED_AMOUNT)) {
                $violations[$routeName] = [
                    'url' => $url,
                    'metrics' => $metricNames,
                ];
            }
        }

        if (!empty($violations)) {
            $errorMessage = "\n===============================================================\n"
                . "✖ SENTINEL LEDGER ISOLATION VIOLATIONS DETECTED!\n"
                . "===============================================================\n"
                . "The following routes are displaying raw transaction data instead of ledger totals:\n\n";

            foreach ($violations as $route => $details) {
                $errorMessage .= "Route: {$route} ({$details['url']})\n"
                    . "Associated Metrics:\n"
                    . implode("\n", array_map(fn($m) => "  - " . $m, $details['metrics'])) . "\n\n";
            }

            $errorMessage .= "Root Cause: These endpoints are bypasses. They query raw tables instead of the Ledger.\n"
                . "===============================================================\n";

            $this->fail($errorMessage);
        }

        $this->assertTrue(true);
    }
}
