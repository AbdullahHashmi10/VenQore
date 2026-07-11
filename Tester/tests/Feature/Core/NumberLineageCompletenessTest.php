<?php

namespace Tests\Feature\Core;

use Symfony\Component\Yaml\Yaml;
use Tests\TestCase;

/**
 * Number-Lineage Completeness (blueprint Phase I — SourceOfTruthEngine as a test).
 *
 * The lineage graph in verification/number_registry.yaml answers "where did this number
 * come from" (page → controller → service → GL accounts → journal rows). This test keeps
 * that graph COMPLETE so a new number can't ship unregistered (the "new number ships
 * unregistered" hole):
 *
 *   1. Every LEDGER-DERIVED metric must trace to a service method AND ≥1 ledger account.
 *   2. Every metric must name a controller and a route (the page it appears on).
 *   3. The registry must be non-trivial (guards against an emptied registry passing).
 *
 * No DB. This is the SourceOfTruthEngine's contract expressed as an enforced test.
 */
class NumberLineageCompletenessTest extends TestCase
{
    private function metrics(): array
    {
        $path = base_path('verification/number_registry.yaml');
        $this->assertFileExists($path, 'number_registry.yaml must exist.');
        $data = Yaml::parseFile($path);
        return array_values(array_filter($data['metrics'] ?? [], 'is_array'));
    }

    /** @test */
    public function ledger_derived_metrics_trace_to_a_service_and_accounts(): void
    {
        $broken = [];
        foreach ($this->metrics() as $m) {
            if (($m['classification'] ?? '') !== 'LEDGER-DERIVED') {
                continue;
            }
            $hasService = ! empty($m['service']);
            $hasAccounts = ! empty($m['ledger_accounts']);
            if (! $hasService || ! $hasAccounts) {
                $broken[] = ($m['id'] ?? '?') . ' (' . ($m['name'] ?? '') . ')'
                    . (! $hasService ? ' [no service]' : '')
                    . (! $hasAccounts ? ' [no ledger_accounts]' : '');
            }
        }

        $this->assertSame(
            [],
            $broken,
            "LEDGER-DERIVED metrics missing lineage (a number that can't be traced to the ledger):\n"
                . implode("\n", $broken)
        );
    }

    /** @test */
    public function every_metric_names_a_controller_and_route(): void
    {
        $broken = [];
        foreach ($this->metrics() as $m) {
            if (empty($m['controller']) || (empty($m['route']) && empty($m['route_uri']))) {
                $broken[] = ($m['id'] ?? '?') . ' (' . ($m['name'] ?? '') . ')';
            }
        }
        $this->assertSame([], $broken, "Metrics with no controller/route (unlocatable surface):\n" . implode("\n", $broken));
    }

    /** @test */
    public function registry_is_non_trivial(): void
    {
        $metrics = $this->metrics();
        $this->assertGreaterThanOrEqual(
            20,
            count($metrics),
            'number_registry.yaml has suspiciously few metrics — an emptied registry must not pass as "complete".'
        );
        $ledgerDerived = array_filter($metrics, fn ($m) => ($m['classification'] ?? '') === 'LEDGER-DERIVED');
        $this->assertGreaterThanOrEqual(
            10,
            count($ledgerDerived),
            'Too few LEDGER-DERIVED metrics — the truth-anchored denominator is missing.'
        );
    }
}
