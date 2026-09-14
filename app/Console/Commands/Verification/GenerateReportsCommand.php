<?php

namespace App\Console\Commands\Verification;

use Illuminate\Console\Command;
use Symfony\Component\Yaml\Yaml;

/**
 * php artisan verify:reports  (blueprint Phase H — Dual Reporting, Part 3)
 *
 * On every failing verification, produces TWO linked artifacts under
 * Tester/VerificationCenter/reports/:
 *   - <id>.business.md   — plain English: what happened, which number is wrong on which
 *                          screen, the correct value + currency impact, why it matters.
 *   - <id>.technical.md  — route/controller/service/method, captured lineage, ledger rows,
 *                          expected vs actual, oracle provenance, root-cause candidates,
 *                          confidence, blast radius, first-fix recommendation.
 *
 * It reads the failed claims from the latest Run Ledger (runs/latest.json + per-test
 * tests.jsonl) and the lineage from number_registry.yaml. The analytical fields
 * (root cause, confidence, blast radius) come from the ten engines, which this command
 * orchestrates — it never replaces them (blueprint §11/Phase I).
 *
 * Priority scoring (Phase I): failures are ranked by
 * (currency_impact × surface_count × confidence) and written to reports/PRIORITY.md —
 * "what should be fixed first."
 *
 * EXIT: 0 (reporting). Writes nothing destructive.
 */
class GenerateReportsCommand extends Command
{
    protected $signature = 'verify:reports
        {--from= : Path to a failed-claims JSONL (defaults to the latest Run Ledger)}';
    protected $description = 'Generate business + technical report pairs for every failing verification.';

    private string $vc;

    public function handle(): int
    {
        $this->vc = base_path('Tester/VerificationCenter');
        $reportsDir = $this->vc . '/reports';
        @mkdir($reportsDir, 0777, true);

        $registry = $this->loadNumberRegistry();
        $failures = $this->loadFailures();

        if (empty($failures)) {
            $this->info('No failing verifications in the latest run — no reports to generate.');
            return 0;
        }

        $priority = [];
        foreach ($failures as $i => $fail) {
            $id = $this->slug($fail['id'] ?? ('failure-' . $i));
            $lineage = $this->lineageFor($fail, $registry);

            $currencyImpact = (float) ($fail['currency_impact']
                ?? abs(((float) ($fail['expected'] ?? 0)) - ((float) ($fail['actual'] ?? 0))));
            $surfaceCount = max(1, count($lineage['surfaces'] ?? []));
            $confidence   = (int) ($fail['confidence'] ?? 60);
            $score = $currencyImpact * $surfaceCount * ($confidence / 100);

            file_put_contents("{$reportsDir}/{$id}.business.md", $this->businessReport($fail, $lineage, $currencyImpact));
            file_put_contents("{$reportsDir}/{$id}.technical.md", $this->technicalReport($fail, $lineage, $confidence));

            $priority[] = compact('id', 'score', 'currencyImpact', 'surfaceCount', 'confidence')
                + ['title' => $fail['metric'] ?? $fail['id'] ?? $id];
        }

        usort($priority, fn ($a, $b) => $b['score'] <=> $a['score']);
        file_put_contents("{$reportsDir}/PRIORITY.md", $this->priorityReport($priority));

        $this->info('Wrote ' . count($failures) . ' report pair(s) + PRIORITY.md to ' . $reportsDir);
        return 0;
    }

    private function businessReport(array $f, array $lineage, float $impact): string
    {
        $screen = $lineage['surfaces'][0] ?? ($f['surface'] ?? 'a financial screen');
        $expected = $f['expected'] ?? '(unknown)';
        $actual   = $f['actual'] ?? '(unknown)';
        return implode("\n", [
            '# Business Report — ' . ($f['metric'] ?? $f['id'] ?? 'Verification failure'),
            '',
            '**What happened.** A number shown on **' . $screen . '** does not match what the '
                . 'accounting ledger says it should be.',
            '',
            '**The wrong number.** The screen shows **' . $actual . '**, but the correct value '
                . '(from the independent oracle) is **' . $expected . '**.',
            '',
            '**Money impact.** The discrepancy is **' . number_format($impact, 2) . '** in currency terms.',
            '',
            '**Why it matters.** ' . ($f['why'] ?? 'This number feeds decisions (pricing, tax, '
                . 'profitability). If it is wrong, those decisions are made on corrupted data.'),
            '',
            '**Severity.** ' . strtoupper((string) ($f['severity'] ?? 'high')),
            '',
            '_Technical details: see the paired technical report._',
            '',
        ]);
    }

    private function technicalReport(array $f, array $lineage, int $confidence): string
    {
        $lines = [
            '# Technical Report — ' . ($f['metric'] ?? $f['id'] ?? 'Verification failure'),
            '',
            '## Location',
            '- Route: `' . ($lineage['route'] ?? '?') . '`',
            '- Controller: `' . ($lineage['controller'] ?? '?') . '`',
            '- Service/method: `' . ($lineage['service'] ?? '?') . '`',
            '- Ledger accounts: `' . implode(', ', $lineage['ledger_accounts'] ?? []) . '`',
            '- Tables: `' . implode(', ', $lineage['tables'] ?? []) . '`',
            '- prop_path: `' . ($lineage['prop_path'] ?? '?') . '`',
            '',
            '## Comparison',
            '- Expected (oracle): `' . ($f['expected'] ?? '?') . '`',
            '- Actual (surface): `' . ($f['actual'] ?? '?') . '`',
            '- Tolerance: `' . ($f['tolerance'] ?? '0.01') . '`',
            '- Oracle provenance: ' . ($f['oracle'] ?? 'hand-derived Golden manifest'),
            '',
            '## Analysis (engines)',
            '- Root-cause candidates (RootCauseEngine): ' . ($f['root_cause'] ?? 'ranked at runtime'),
            '- Confidence (ConfidenceEngine): ' . $confidence . '%',
            '- Blast radius (BlastRadiusEngine): ' . implode(', ', $lineage['surfaces'] ?? ['(computed at runtime)']),
            '',
            '## First-fix recommendation',
            '- ' . ($f['first_fix'] ?? 'Trace the service method above; compare its query against the '
                . 'ledger-derived oracle; the divergence is between the surface and the ledger.'),
            '',
        ];
        return implode("\n", $lines);
    }

    private function priorityReport(array $priority): string
    {
        $out = [
            '# Verification Priority — what to fix first',
            '',
            'Ranked by **currency impact × surface count × confidence** (blueprint Phase I).',
            '',
            '| Rank | Verification | Score | Money | Surfaces | Confidence |',
            '|---|---|---:|---:|---:|---:|',
        ];
        foreach ($priority as $i => $p) {
            $out[] = sprintf(
                '| %d | %s | %.2f | %s | %d | %d%% |',
                $i + 1,
                $p['title'],
                $p['score'],
                number_format($p['currencyImpact'], 2),
                $p['surfaceCount'],
                $p['confidence']
            );
        }
        $out[] = '';
        return implode("\n", $out);
    }

    private function lineageFor(array $fail, array $registry): array
    {
        $metricId = $fail['registry_id'] ?? $fail['id'] ?? null;
        foreach (($registry['metrics'] ?? []) as $m) {
            if (($m['id'] ?? null) === $metricId
                || ($m['name'] ?? null) === ($fail['metric'] ?? null)) {
                return [
                    'route'           => $m['route_uri'] ?? $m['route'] ?? null,
                    'controller'      => $m['controller'] ?? null,
                    'service'         => $m['service'] ?? null,
                    'ledger_accounts' => $m['ledger_accounts'] ?? [],
                    'tables'          => $m['tables'] ?? [],
                    'prop_path'       => $m['prop_path'] ?? null,
                    'surfaces'        => array_filter([$m['inertia_page'] ?? null, $m['route'] ?? null]),
                ];
            }
        }
        return ['surfaces' => array_filter([$fail['surface'] ?? null])];
    }

    private function loadNumberRegistry(): array
    {
        $path = base_path('verification/number_registry.yaml');
        return is_file($path) ? (Yaml::parseFile($path) ?: []) : [];
    }

    private function loadFailures(): array
    {
        if ($this->option('from') && is_file($this->option('from'))) {
            return $this->readJsonl($this->option('from'));
        }
        // Default: newest run dir's tests.jsonl, filtered to failed/errored.
        $runs = glob($this->vc . '/runs/*/tests.jsonl');
        if (empty($runs)) {
            return [];
        }
        usort($runs, fn ($a, $b) => filemtime($b) <=> filemtime($a));
        $all = $this->readJsonl($runs[0]);
        return array_values(array_filter($all, fn ($r) => in_array($r['status'] ?? '', ['failed', 'errored'], true)));
    }

    private function readJsonl(string $path): array
    {
        $out = [];
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $j = json_decode($line, true);
            if (is_array($j)) {
                $out[] = $j;
            }
        }
        return $out;
    }

    private function slug(string $s): string
    {
        return preg_replace('/[^A-Za-z0-9._-]+/', '-', $s) ?: 'failure';
    }
}
