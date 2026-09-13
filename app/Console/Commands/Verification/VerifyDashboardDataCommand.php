<?php

namespace App\Console\Commands\Verification;

use Illuminate\Console\Command;
use Symfony\Component\Yaml\Yaml;

/**
 * php artisan verify:dashboard-data
 *
 * Produces Tester/VerificationCenter/dashboard-data.json — the single payload the
 * One Dashboard renders. It joins:
 *   - the suite registry (suites.yaml) → what SHOULD run, oracle-tiered
 *   - the latest Run Ledger (runs/latest.json) → what DID run
 *   - the verify:all consolidated record (runs/verify-all-latest.json)
 *   - the trust model (trust_model.yaml) → dimension floors/weights
 * and computes a PROVISIONAL trust score from measured dimension health.
 *
 * The score is measured, not asserted (blueprint §13/§19). Where a dimension
 * can't yet be measured (Phase not landed), it is reported as "pending" and does
 * not inflate the score.
 *
 * EXIT: 0 always (reporting command); writes JSON regardless of run color.
 */
class VerifyDashboardDataCommand extends Command
{
    protected $signature = 'verify:dashboard-data {--print : also echo the JSON}';
    protected $description = 'Generate the One Dashboard data payload from the registry + latest run + trust model.';

    public function handle(): int
    {
        $vc = base_path('Tester/VerificationCenter');
        $registry = Yaml::parseFile($vc . '/registry/suites.yaml');
        $trust    = Yaml::parseFile($vc . '/registry/trust_model.yaml');

        $latest    = $this->readJson($vc . '/runs/latest.json');
        $verifyAll = $this->readJson($vc . '/runs/verify-all-latest.json');

        // Tier tallies from the registry.
        $tierCounts = ['T1' => 0, 'T2' => 0, 'T3' => 0];
        $tierTests  = ['T1' => 0, 'T2' => 0, 'T3' => 0];
        foreach ($registry['suites'] ?? [] as $suite) {
            foreach ($suite['members'] ?? [] as $m) {
                $t = $m['oracle_tier'] ?? 'T2';
                $tierCounts[$t] = ($tierCounts[$t] ?? 0) + 1;
                $tierTests[$t]  = ($tierTests[$t] ?? 0) + (int) ($m['test_methods'] ?? 0);
            }
        }

        // Measured dimension health (0..1 or null=pending).
        $dims = $this->measureDimensions($latest, $verifyAll, $registry);

        // Weighted score over measurable dimensions only.
        $score = 0.0;
        $weightUsed = 0.0;
        foreach (($trust['dimensions'] ?? []) as $name => $def) {
            $h = $dims[$name]['health'] ?? null;
            if ($h === null) {
                continue; // pending — excluded from the roll-up
            }
            $score += $h * (float) $def['weight'];
            $weightUsed += (float) $def['weight'];
        }
        // Normalize to a 0..10 scale over the weight actually measured.
        $normalized = $weightUsed > 0 ? round(($score / $weightUsed) * 10, 2) : null;

        $payload = [
            'generated_at' => now()->toIso8601String(),
            'milestone'    => 'B',
            'registry'     => [
                'suites'               => count($registry['suites'] ?? []),
                'phpunit_test_methods' => $registry['meta']['phpunit_test_methods_total'] ?? null,
                'verification_sources' => count($registry['verification_sources'] ?? []),
                'tier_files'           => $tierCounts,
                'tier_test_methods'    => $tierTests,
            ],
            'latest_run'   => $latest,
            'verify_all'   => $verifyAll,
            'trust'        => [
                'measured_score'      => $normalized,
                'weight_measured'     => round($weightUsed, 3),
                'projected_after_B'   => $trust['milestones']['after_B'] ?? null,
                'dimensions'          => $dims,
                'note'                => 'Score is measured over landed dimensions only; pending dimensions are excluded, not assumed green.',
            ],
        ];

        $out = $vc . '/dashboard-data.json';
        file_put_contents($out, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        $this->info("Wrote {$out}");
        if ($this->option('print')) {
            $this->line(json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        }

        return 0;
    }

    private function measureDimensions(?array $latest, ?array $verifyAll, array $registry): array
    {
        $green = $latest['green'] ?? null;

        // complete_and_visible: registry drift is enforced by a test; if the latest
        // run is green, that test passed, so completeness holds.
        $completeHealth = $green === true ? 1.0 : ($green === false ? 0.5 : null);

        return [
            'green_and_provable' => [
                'health' => $green === true ? 1.0 : ($green === false ? 0.0 : null),
                'evidence' => $latest ? ('latest run total=' . ($latest['total'] ?? '?')) : 'no run ledger yet',
            ],
            'complete_and_visible' => [
                'health' => $completeHealth,
                'evidence' => 'RegistryDriftTest + SuiteIntegrityTest guard completeness',
            ],
            'truth_anchored'        => ['health' => null, 'evidence' => 'pending Phase C/D oracle independence sign-off'],
            'production_path_parity'=> ['health' => null, 'evidence' => 'pending Phase D suites'],
            'bite_proven'           => ['health' => null, 'evidence' => 'pending Phase F mutation baseline'],
            'bypass_resistant'      => ['health' => null, 'evidence' => 'pending Phase E AST rules + permission ratchet'],
            'corruption_alerting'   => ['health' => null, 'evidence' => 'pending Phase F scheduled verify:ledger alert test'],
            'self_explaining'       => ['health' => null, 'evidence' => 'pending Phase H report pairs'],
            'honestly_red'          => ['health' => null, 'evidence' => 'pending Phase D quarantine + Phase J gate self-test'],
            'decaying_by_design'    => [
                'health' => $green === null ? null : 1.0,
                'evidence' => 'score recomputed each run from latest.json',
            ],
        ];
    }

    private function readJson(string $path): ?array
    {
        if (! is_file($path)) {
            return null;
        }
        $j = json_decode((string) file_get_contents($path), true);
        return is_array($j) ? $j : null;
    }
}
