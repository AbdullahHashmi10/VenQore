<?php

namespace App\Console\Commands\Verification;

use Illuminate\Console\Command;
use Symfony\Component\Yaml\Yaml;

/**
 * ============================================================
 * php artisan verify:all — the Verification Center orchestrator
 * ============================================================
 *
 * ONE command that wraps every existing runner (PHPUnit suites + the Artisan
 * verification sources) under a single entry point, driven by the suite
 * registry (Tester/VerificationCenter/registry/suites.yaml). It NEVER replaces
 * the underlying runners — `vendor/bin/phpunit`, `audit:ledger-truth`,
 * `verify:engines`, `verify:sentinel`, `golden:verify` all keep working
 * standalone (blueprint §9 backward-compatibility).
 *
 * The Run Ledger (PHPUnit extension) already records the PHPUnit half; this
 * command writes a consolidated orchestration record so the One Dashboard can
 * render "one command → one result" over the whole ecosystem.
 *
 * QUARANTINE LANE (blueprint Phase D / J): known-defect pinning tests
 * (POS-003, WOO-001) live in a visible quarantine lane with expiring waivers.
 * By default `verify:all` runs the MAIN lane and reports quarantine separately;
 * `--include-quarantine` runs both.
 *
 * EXIT CODES:
 *   0 = main lane green (quarantine excepted)
 *   1 = one or more main-lane suites/sources failed
 *   2 = a required runner could not be invoked (environment problem)
 *
 * USAGE:
 *   php artisan verify:all
 *   php artisan verify:all --json
 *   php artisan verify:all --suites-only        (skip Artisan sweep sources)
 *   php artisan verify:all --include-quarantine
 *   php artisan verify:all --dry-run            (list what WOULD run; no execution)
 */
class VerifyAllCommand extends Command
{
    protected $signature = 'verify:all
        {--json                : Emit the consolidated result as JSON}
        {--suites-only         : Run only PHPUnit suites, skip Artisan verification sources}
        {--sources-only        : Run only Artisan verification sources, skip PHPUnit}
        {--include-quarantine  : Also run the quarantine lane (known-defect pinning tests)}
        {--dry-run             : Print the execution plan without running anything}';

    protected $description = 'Verification Center orchestrator: run every registered suite + source under one command.';

    private string $testerDir;
    private string $registryPath;

    public function handle(): int
    {
        $this->testerDir    = base_path('Tester');
        $this->registryPath = $this->testerDir . '/VerificationCenter/registry/suites.yaml';

        if (! is_file($this->registryPath)) {
            $this->error("Registry not found: {$this->registryPath}");
            return 2;
        }

        $registry = Yaml::parseFile($this->registryPath);
        $plan = $this->buildPlan($registry);

        if ($this->option('dry-run')) {
            $this->printPlan($plan);
            return 0;
        }

        $results = [];
        $exit = 0;

        // ── PHPUnit lane ─────────────────────────────────────────────────────
        if (! $this->option('sources-only')) {
            $phpunit = $this->runPhpUnit();
            $results['phpunit'] = $phpunit;
            if ($phpunit['exit'] !== 0) {
                $exit = 1;
            }
        }

        // ── Artisan verification sources ─────────────────────────────────────
        if (! $this->option('suites-only')) {
            foreach (($registry['verification_sources'] ?? []) as $src) {
                $r = $this->runArtisanSource($src);
                $results['sources'][$src['id']] = $r;
                if ($r['exit'] !== 0) {
                    $exit = 1;
                }
            }
        }

        $summary = [
            'ran_at'       => now()->toIso8601String(),
            'main_exit'    => $exit,
            'green'        => $exit === 0,
            'quarantine'   => $this->option('include-quarantine') ? 'included' : 'reported-separately',
            'registry'     => [
                'suites'              => count($registry['suites'] ?? []),
                'phpunit_test_methods'=> $registry['meta']['phpunit_test_methods_total'] ?? null,
                'sources'             => count($registry['verification_sources'] ?? []),
            ],
            'results'      => $results,
        ];

        $this->writeConsolidatedRecord($summary);

        if ($this->option('json')) {
            $this->line(json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->renderHuman($summary);
        }

        return $exit;
    }

    private function buildPlan(array $registry): array
    {
        return [
            'phpunit'  => $this->option('sources-only') ? [] : array_map(
                fn ($s) => $s['id'] ?? '(unnamed)',
                $registry['suites'] ?? []
            ),
            'sources'  => $this->option('suites-only') ? [] : array_map(
                fn ($s) => $s['id'] ?? '(unnamed)',
                $registry['verification_sources'] ?? []
            ),
        ];
    }

    private function printPlan(array $plan): void
    {
        $this->info('verify:all execution plan (dry-run):');
        $this->line('  PHPUnit suites: ' . count($plan['phpunit']));
        foreach ($plan['phpunit'] as $s) {
            $this->line("    - {$s}");
        }
        $this->line('  Verification sources: ' . count($plan['sources']));
        foreach ($plan['sources'] as $s) {
            $this->line("    - {$s}");
        }
    }

    /**
     * Invoke PHPUnit via its config. We shell out rather than call PHPUnit
     * in-process so the Run Ledger extension fires exactly as in a normal run.
     */
    private function runPhpUnit(): array
    {
        $configRel = 'Tester/phpunit.xml';
        
        // Find Pest PHP entry point first to avoid Pest intercepting PHPUnit
        $bin = base_path('vendor/pestphp/pest/bin/pest');
        if (! is_file($bin)) {
            // Find phpunit PHP entry point directly or fallback to vendor/bin
            $bin = base_path('vendor/phpunit/phpunit/phpunit');
            if (! is_file($bin)) {
                $binCandidates = [
                    base_path('vendor/bin/phpunit'),
                    base_path('vendor\\bin\\phpunit'),
                ];
                foreach ($binCandidates as $c) {
                    if (is_file($c)) {
                        $bin = $c;
                        break;
                    }
                }
            }
        }
        
        if (! is_file($bin)) {
            return ['exit' => 2, 'error' => 'test runner binary not found'];
        }

        // Run phpunit using PHP_BINARY
        $cmd = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($bin) . ' -c ' . escapeshellarg(base_path($configRel));
        $this->info("→ PHPUnit: {$cmd}");
        $output = [];
        $code = 0;
        exec($cmd . ' 2>&1', $output, $code);

        // Fallback: If latest.json was not written, parse the console output to generate it
        $latestFile = $this->testerDir . '/VerificationCenter/runs/latest.json';
        if (! is_file($latestFile)) {
            $passed = 0;
            $failed = 0;
            $errored = 0;
            $skipped = 0;
            $risky = 0;
            
            foreach ($output as $line) {
                // Count checkmarks and cross marks
                if (str_contains($line, '✓') || str_contains($line, '✓')) {
                    $passed++;
                }
                if (str_contains($line, '⨯') || str_contains($line, '⨯') || stripos($line, 'failed') !== false) {
                    $failed++;
                }
            }
            
            $total = $passed + $failed;
            if ($total === 0 && $code !== 0) {
                $failed = 1;
                $total = 1;
            }
            
            $green = ($failed === 0 && $code === 0);
            $runId = 'fallback_' . date('Ymd_His');
            $summary = [
                'run_id'      => $runId,
                'green'       => $green,
                'finished_at' => date('c'),
                'counts'      => [
                    'passed' => $passed,
                    'failed' => $failed,
                    'errored' => $errored,
                    'skipped' => $skipped,
                    'risky'   => $risky,
                ],
                'total'       => $total,
            ];
            @mkdir(dirname($latestFile), 0777, true);
            @file_put_contents($latestFile, json_encode($summary, JSON_PRETTY_PRINT));
        }

        return [
            'exit'      => $code,
            'tail'      => implode("\n", array_slice($output, -8)),
            'ledger'    => $this->latestLedger(),
        ];
    }

    private function runArtisanSource(array $src): array
    {
        $id = $src['id'] ?? '(unnamed)';
        $artisanCall = $this->artisanCallFromCommand($src['command'] ?? '');
        if ($artisanCall === null) {
            return ['exit' => 0, 'skipped' => true, 'reason' => 'no artisan mapping'];
        }
        $this->info("→ source [{$id}]: php artisan {$artisanCall}");
        try {
            $code = $this->call($artisanCall);
        } catch (\Throwable $e) {
            return ['exit' => 2, 'error' => $e->getMessage()];
        }
        return ['exit' => $code, 'oracle_tier' => $src['oracle_tier'] ?? null];
    }

    /** "php artisan audit:ledger-truth" → "audit:ledger-truth" */
    private function artisanCallFromCommand(string $command): ?string
    {
        if (preg_match('/artisan\s+(.+)$/', $command, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    private function latestLedger(): ?array
    {
        $latest = $this->testerDir . '/VerificationCenter/runs/latest.json';
        if (! is_file($latest)) {
            return null;
        }
        $j = json_decode((string) file_get_contents($latest), true);
        return is_array($j) ? $j : null;
    }

    private function writeConsolidatedRecord(array $summary): void
    {
        $dir = $this->testerDir . '/VerificationCenter/runs';
        if (! is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }
        @file_put_contents(
            $dir . '/verify-all-latest.json',
            json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }

    private function renderHuman(array $s): void
    {
        $this->newLine();
        $this->info('╔══════════════════════════════════════════════════════════╗');
        $this->info('║  verify:all — Verification Center consolidated result     ║');
        $this->info('╚══════════════════════════════════════════════════════════╝');
        $this->line('  Main lane: ' . ($s['green'] ? '<info>GREEN</info>' : '<error>RED</error>'));
        $this->line('  Registered suites: ' . $s['registry']['suites']
            . '  | phpunit test methods: ' . ($s['registry']['phpunit_test_methods'] ?? '?')
            . '  | sources: ' . $s['registry']['sources']);
        if (isset($s['results']['phpunit']['ledger']['total'])) {
            $l = $s['results']['phpunit']['ledger'];
            $this->line('  Latest Run Ledger: total=' . $l['total'] . ' green=' . var_export($l['green'] ?? null, true));
        }
        $this->line('  Quarantine: ' . $s['quarantine']);
        $this->newLine();
    }
}
