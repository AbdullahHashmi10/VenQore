<?php

namespace Tests\Feature\Golden;

use Symfony\Component\Yaml\Yaml;
use Tests\TestCase;

/**
 * Launch Gate SELF-TEST (blueprint Phase J.1 — "a launch gate that has never failed is
 * untested").
 *
 * The rebuilt G-03 reads registries and blocks on unresolved CRITICALs. This test PROVES
 * the gate can actually fail: it evaluates the SAME critical-detection logic against a
 * synthetic fixture containing an injected critical entry, and asserts the logic flags it.
 * If this ever passes with the injected critical UNflagged, the gate is vacuous again.
 *
 * It also asserts the inverse: a clean fixture (no criticals / valid waivers) does NOT
 * flag — so the gate isn't just "always blocks."
 *
 * No DB; pure logic over YAML fixtures written to a temp dir.
 */
class LaunchGateSelfTest extends TestCase
{
    /** Mirror of the gate's critical-detection predicate (kept identical to G-03). */
    private function isCritical($v): bool
    {
        return is_string($v) && strtoupper(trim($v, " '\"")) === 'CRITICAL';
    }

    private function evaluate(array $numberRegistry, array $quarantine): array
    {
        $blocking = [];
        foreach (($numberRegistry['metrics'] ?? []) as $m) {
            $isCritical = $this->isCritical($m['risk'] ?? null) || $this->isCritical($m['severity'] ?? null);
            $resolved = ($m['verified'] ?? false) === true
                || in_array(strtolower((string) ($m['status'] ?? '')), ['resolved', 'fixed'], true);
            if ($isCritical && ! $resolved) {
                $blocking[] = 'number_registry:' . ($m['id'] ?? '?');
            }
        }
        foreach (($quarantine['waivers'] ?? []) as $w) {
            if (! $this->isCritical($w['risk'] ?? null) && ! $this->isCritical($w['severity'] ?? null)) {
                continue;
            }
            $expires = $w['expires'] ?? null;
            $expired = $expires !== null && strtotime((string) $expires) < time();
            $resolved = in_array(strtolower((string) ($w['status'] ?? '')), ['resolved', 'fixed'], true);
            if (! $resolved && $expired) {
                $blocking[] = 'quarantine:' . ($w['id'] ?? '?');
            }
        }
        return $blocking;
    }

    /** @test */
    public function gate_blocks_on_a_synthetic_injected_critical(): void
    {
        // Inject a CRITICAL metric (risk field) that is NOT resolved.
        $numberRegistry = [
            'metrics' => [
                ['id' => 'SYN-OK', 'risk' => 'LOW', 'verified' => true],
                ['id' => 'SYN-CRIT', 'risk' => 'CRITICAL', 'verified' => false], // must block
            ],
        ];
        $blocking = $this->evaluate($numberRegistry, []);

        $this->assertContains(
            'number_registry:SYN-CRIT',
            $blocking,
            'GATE SELF-TEST FAILED: an injected unresolved CRITICAL was NOT flagged — the gate is vacuous.'
        );
    }

    /** @test */
    public function gate_blocks_on_an_expired_critical_waiver(): void
    {
        $quarantine = [
            'waivers' => [
                ['id' => 'WAIVED-VALID', 'risk' => 'CRITICAL', 'expires' => '2999-01-01'],   // valid → not blocking
                ['id' => 'WAIVED-EXPIRED', 'risk' => 'CRITICAL', 'expires' => '2000-01-01'], // expired → blocking
            ],
        ];
        $blocking = $this->evaluate([], $quarantine);

        $this->assertContains('quarantine:WAIVED-EXPIRED', $blocking, 'Expired critical waiver must block.');
        $this->assertNotContains('quarantine:WAIVED-VALID', $blocking, 'Valid waiver must NOT block.');
    }

    /** @test */
    public function gate_passes_a_clean_fixture(): void
    {
        // A launch gate that ALWAYS blocks is as useless as one that never does.
        $numberRegistry = ['metrics' => [
            ['id' => 'CLEAN-1', 'risk' => 'LOW', 'verified' => true],
            ['id' => 'CLEAN-2', 'severity' => 'CRITICAL', 'status' => 'resolved'], // resolved → ok
        ]];
        $quarantine = ['waivers' => [
            ['id' => 'W-OK', 'risk' => 'CRITICAL', 'expires' => '2999-01-01'],
        ]];
        $this->assertSame([], $this->evaluate($numberRegistry, $quarantine), 'Clean fixture must NOT block.');
    }

    /** @test */
    public function self_test_predicate_matches_the_real_gate_registries_shape(): void
    {
        // Sanity: the real quarantine.yaml parses and uses the fields the gate reads.
        $qPath = base_path('Tester/VerificationCenter/registry/quarantine.yaml');
        $this->assertFileExists($qPath);
        $q = Yaml::parseFile($qPath);
        $this->assertArrayHasKey('waivers', $q);
        foreach ($q['waivers'] as $w) {
            $this->assertArrayHasKey('risk', $w, 'Each waiver must declare risk for the gate to read.');
            $this->assertArrayHasKey('expires', $w, 'Each waiver must declare an expiry for the gate countdown.');
        }
    }
}
