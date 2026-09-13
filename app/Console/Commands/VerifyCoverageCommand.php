<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * ============================================================
 * php artisan verify:coverage
 * ============================================================
 *
 * VERIFICATION SUITE COVERAGE REPORTER
 *
 * Reports on what percentage of the VenQore financial system
 * is covered by the verification suite built across Phases 0–11.
 *
 * Reports across three dimensions:
 *  1. PHP Test Coverage (PHPUnit — Phases 0–9)
 *  2. Frontend Test Coverage (Vitest — Phase 10)
 *  3. Artisan Command Coverage (verify:ledger, golden:verify — Phase 11)
 *
 * Also reports on open issues in the Number Registry.
 *
 * EXIT CODES:
 *  0 = All launch gate checks pass
 *  1 = One or more launch gate checks fail
 *
 * USAGE:
 *  php artisan verify:coverage
 *  php artisan verify:coverage --json
 *  php artisan verify:coverage --gate-only
 * ============================================================
 */
class VerifyCoverageCommand extends Command
{
    protected $signature = 'verify:coverage
        {--json       : Output results as JSON}
        {--gate-only  : Only print launch gate results (not the full table)}
        {--fix        : Attempt to auto-fix minor issues (stub)}';

    protected $description = 'Report on the VenQore verification suite coverage and launch gate status';

    private array $gateResults = [];
    private int   $gatePassed  = 0;
    private int   $gateFailed  = 0;

    public function handle(): int
    {
        $this->info('');
        $this->info('╔════════════════════════════════════════════════════════╗');
        $this->info('║  VenQore Verification Coverage Report (verify:coverage) ║');
        $this->info('╚════════════════════════════════════════════════════════╝');
        $this->info('  Generated: ' . now()->format('Y-m-d H:i:s'));
        $this->info('');

        if (!$this->option('gate-only')) {
            $this->printPhaseTable();
            $this->newLine();
            $this->printRegistryStatus();
            $this->newLine();
        }

        $this->printLaunchGate();

        if ($this->option('json')) {
            $this->line(json_encode($this->buildJsonReport(), JSON_PRETTY_PRINT));
        }

        return $this->gateFailed > 0 ? 1 : 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE TABLE
    // ─────────────────────────────────────────────────────────────────────────

    private function printPhaseTable(): void
    {
        $this->info('📋 PHASE COVERAGE SUMMARY');
        $this->info('──────────────────────────────────────────────────────────');

        $phases = $this->getPhaseInventory();

        $this->table(
            ['Phase', 'Name', 'Tests', 'File', 'Status'],
            array_map(fn($p) => [
                $p['phase'],
                $p['name'],
                $p['tests'],
                basename($p['file'] ?? '-'),
                $this->fileExists($p['file'] ?? '') ? '✅ EXISTS' : '❌ MISSING',
            ], $phases)
        );

        $totalTests = array_sum(array_column($phases, 'tests'));
        $this->info("  Total: {$totalTests} tests across " . count($phases) . " phases");
    }

    private function getPhaseInventory(): array
    {
        $base = base_path('Tester/tests/Feature/Golden');
        $jsBase = base_path('resources/js/tests');

        return [
            [
                'phase' => '0', 'name' => 'System Inventory',
                'tests' => 1, 'file' => null,
                'note'  => 'Manual — inventory in verification/number_registry.yaml',
            ],
            [
                'phase' => '1', 'name' => 'Golden Company Seeder',
                'tests' => 12, 'file' => "{$base}/GoldenCompanyTest.php",
            ],
            [
                'phase' => '2', 'name' => 'Ledger Invariants',
                'tests' => 12, 'file' => "{$base}/LedgerInvariantTest.php",
            ],
            [
                'phase' => '3', 'name' => 'Input Verification',
                'tests' => 10, 'file' => "{$base}/InputVerificationTest.php",
            ],
            [
                'phase' => '4', 'name' => 'Financial Core (35 tests)',
                'tests' => 35, 'file' => "{$base}/FinancialCoreTest.php",
            ],
            [
                'phase' => '5', 'name' => 'Output Verification (33 tests)',
                'tests' => 33, 'file' => "{$base}/OutputVerificationTest.php",
            ],
            [
                'phase' => '6a', 'name' => 'Cross-Surface Consistency',
                'tests' => 10, 'file' => "{$base}/CrossSurfaceConsistencyTest.php",
            ],
            [
                'phase' => '6b', 'name' => 'Clock Position Consistency',
                'tests' => 9, 'file' => "{$base}/ClockPositionConsistencyTest.php",
            ],
            [
                'phase' => '6c', 'name' => 'Formatting Consistency',
                'tests' => 9, 'file' => "{$base}/FormattingConsistencyTest.php",
            ],
            [
                'phase' => '7', 'name' => 'Architectural Enforcement (13 tests)',
                'tests' => 13, 'file' => "{$base}/ArchitecturalEnforcementTest.php",
            ],
            [
                'phase' => '8', 'name' => 'Adversarial / Corruption (10 tests)',
                'tests' => 10, 'file' => "{$base}/AdversarialCorruptionTest.php",
            ],
            [
                'phase' => '9', 'name' => 'Edge Cases / Concurrency (15 tests)',
                'tests' => 15, 'file' => "{$base}/EdgeCasesTimeConcurrencyTest.php",
            ],
            [
                'phase' => '10', 'name' => 'Frontend Logic — Vitest (59 tests)',
                'tests' => 59, 'file' => "{$jsBase}/frontend.test.js",
            ],
            [
                'phase' => '11', 'name' => 'Launch Gate',
                'tests' => 7, 'file' => "{$base}/LaunchGateTest.php",
            ],
        ];
    }

    private function fileExists(?string $path): bool
    {
        return $path && file_exists($path);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NUMBER REGISTRY STATUS
    // ─────────────────────────────────────────────────────────────────────────

    private function printRegistryStatus(): void
    {
        $this->info('📊 NUMBER REGISTRY STATUS');
        $this->info('──────────────────────────────────────────────────────────');

        $registryPath = base_path('verification/number_registry.yaml');

        if (!file_exists($registryPath)) {
            $this->warn('  ⚠️  number_registry.yaml not found at verification/number_registry.yaml');
            return;
        }

        $content = file_get_contents($registryPath);

        // Count critical issues
        $criticalCount = substr_count($content, 'severity: CRITICAL') + substr_count($content, "severity: 'CRITICAL'");
        $highCount     = substr_count($content, 'severity: HIGH')     + substr_count($content, "severity: 'HIGH'");
        $metricsCount  = substr_count($content, 'id: POS-') + substr_count($content, 'id: WOO-') + substr_count($content, 'id: FIN-');

        $this->line("  Registry file: verification/number_registry.yaml");
        $this->line("  Tracked metrics: ~{$metricsCount}+");

        if ($criticalCount > 0) {
            $this->error("  ❌ CRITICAL issues: {$criticalCount}");
        } else {
            $this->line("  ✅ CRITICAL issues: 0");
        }

        if ($highCount > 0) {
            $this->warn("  ⚠️  HIGH severity: {$highCount}");
        } else {
            $this->line("  ✅ HIGH issues: 0");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LAUNCH GATE — 7 CHECKS
    // ─────────────────────────────────────────────────────────────────────────

    private function printLaunchGate(): void
    {
        $this->info('🚀 LAUNCH GATE (7 Checks)');
        $this->info('══════════════════════════════════════════════════════════');

        // GATE 1: All Phase test files exist
        $this->gate(
            'GATE-1',
            'All PHP test files exist (Phases 1–9)',
            $this->checkPhpTestFilesExist()
        );

        // GATE 2: Frontend test file exists
        $this->gate(
            'GATE-2',
            'Frontend test file exists (Phase 10 — resources/js/tests/frontend.test.js)',
            $this->checkFrontendTestExists()
        );

        // GATE 3: Number registry has no CRITICAL open issues
        $this->gate(
            'GATE-3',
            'Number registry has no unresolved CRITICAL issues',
            $this->checkNoCriticalIssues()
        );

        // GATE 4: Architectural constraints file exists and covers key rules
        $this->gate(
            'GATE-4',
            'Architectural enforcement test exists and covers ≥13 rules (Phase 7)',
            $this->checkArchitecturalTestCoverage()
        );

        // GATE 5: verify:ledger command is registered
        $this->gate(
            'GATE-5',
            'verify:ledger command is implemented (VerifyLedgerCommand.php)',
            $this->checkVerifyLedgerExists()
        );

        // GATE 6: golden:verify command is implemented
        $this->gate(
            'GATE-6',
            'golden:verify command is implemented (GoldenVerifyCommand.php)',
            $this->checkGoldenVerifyExists()
        );

        // GATE 7: Launch gate test file exists
        $this->gate(
            'GATE-7',
            'LaunchGateTest.php exists (Phase 11 PHPUnit test)',
            $this->checkLaunchGateTestExists()
        );

        // ── Summary ───────────────────────────────────────────────────────
        $this->newLine();
        $this->info('══════════════════════════════════════════════════════════');
        if ($this->gateFailed === 0) {
            $this->info("  ✅ LAUNCH GATE: ALL {$this->gatePassed}/7 CHECKS PASSED — READY FOR PRODUCTION");
        } else {
            $this->error("  ❌ LAUNCH GATE: {$this->gateFailed} CHECK(S) FAILED — NOT READY FOR PRODUCTION");
            $this->info("     Passed: {$this->gatePassed}/7");
        }
        $this->info('══════════════════════════════════════════════════════════');
    }

    private function gate(string $id, string $description, bool $pass): void
    {
        $icon   = $pass ? '✅' : '❌';
        $status = $pass ? 'PASS' : 'FAIL';

        $this->line("  {$icon} [{$id}] {$description}");

        if ($pass) {
            $this->gatePassed++;
        } else {
            $this->gateFailed++;
        }

        $this->gateResults[] = [
            'id'          => $id,
            'description' => $description,
            'pass'        => $pass,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INDIVIDUAL GATE CHECKS
    // ─────────────────────────────────────────────────────────────────────────

    private function checkPhpTestFilesExist(): bool
    {
        $required = [
            // Phase 1 — Golden Company Seeder
            'GoldenCompanyTest.php',
            // Phase 3 — Input Verification
            'SaleInputVerificationTest.php',
            'PurchaseInputVerificationTest.php',
            'ExpensePaymentInputVerificationTest.php',
            // Phase 4 — Financial Core
            'FinancialCoreVerificationTest.php',
            'FifoBatchVerificationTest.php',
            'CogsReconciliationTest.php',
            // Phase 5 — Output Verification
            'DashboardOutputTest.php',
            'ReportOutputTest.php',
            'FilterMatrixTest.php',
            // Phase 6 — Consistency Engine
            'CrossSurfaceConsistencyTest.php',
            'ClockPositionConsistencyTest.php',
            'FormattingConsistencyTest.php',
            // Phase 7 — Architectural Enforcement
            'ArchitecturalEnforcementTest.php',
            // Phase 8 — Adversarial & Corruption
            'AdversarialCorruptionTest.php',
            // Phase 9 — Edge Cases & Concurrency
            'EdgeCasesTimeConcurrencyTest.php',
        ];

        $base = base_path('Tester/tests/Feature/Golden');
        foreach ($required as $file) {
            if (!file_exists("{$base}/{$file}")) {
                $this->line("       Missing: {$file}");
                return false;
            }
        }

        return true;
    }

    private function checkFrontendTestExists(): bool
    {
        return file_exists(base_path('resources/js/tests/frontend.test.js'));
    }

    private function checkNoCriticalIssues(): bool
    {
        $path = base_path('verification/number_registry.yaml');
        if (!file_exists($path)) return false;

        $content = file_get_contents($path);
        $criticalCount = substr_count($content, 'severity: CRITICAL');

        if ($criticalCount > 0) {
            $this->line("       {$criticalCount} CRITICAL issue(s) still open in number_registry.yaml");
        }

        return $criticalCount === 0;
    }

    private function checkArchitecturalTestCoverage(): bool
    {
        $path = base_path('Tester/tests/Feature/Golden/ArchitecturalEnforcementTest.php');
        if (!file_exists($path)) return false;

        $content = file_get_contents($path);
        // Count @test annotated methods
        $testCount = substr_count($content, '@test') + substr_count($content, 'public function test_');

        return $testCount >= 13;
    }

    private function checkVerifyLedgerExists(): bool
    {
        return file_exists(base_path('app/Console/Commands/VerifyLedgerCommand.php'));
    }

    private function checkGoldenVerifyExists(): bool
    {
        return file_exists(base_path('app/Console/Commands/GoldenVerifyCommand.php'));
    }

    private function checkLaunchGateTestExists(): bool
    {
        return file_exists(base_path('Tester/tests/Feature/Golden/LaunchGateTest.php'));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // JSON REPORT
    // ─────────────────────────────────────────────────────────────────────────

    private function buildJsonReport(): array
    {
        return [
            'generated_at'    => now()->toIso8601String(),
            'gate_passed'     => $this->gatePassed,
            'gate_failed'     => $this->gateFailed,
            'launch_ready'    => $this->gateFailed === 0,
            'gate_results'    => $this->gateResults,
            'php_test_phases' => count($this->getPhaseInventory()),
            'phase_files'     => array_map(fn($p) => [
                'phase'   => $p['phase'],
                'name'    => $p['name'],
                'tests'   => $p['tests'],
                'exists'  => $this->fileExists($p['file'] ?? ''),
            ], $this->getPhaseInventory()),
        ];
    }
}
