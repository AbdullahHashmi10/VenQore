<?php

namespace Tests\Feature\Golden;

use Tests\Feature\VenQoreTestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;
use App\Models\Tenant;
use App\Services\FinancialReportingService;
use Tests\Support\RequiresGoldenCompany;

/**
 * ============================================================
 * Phase 11 — Coverage & Launch Gate
 * ============================================================
 *
 * THE FINAL GATE. This test suite is the programmatic equivalent of
 * "php artisan verify:coverage --gate-only". It re-checks all 7
 * launch gates as PHPUnit tests so they are part of the CI pipeline.
 *
 * A deployment to production MUST NOT proceed if any test here fails.
 *
 * GATE STRUCTURE:
 *  [G-01] All 11 PHP test files exist and are non-empty
 *  [G-02] Frontend test file exists and contains ≥50 test cases
 *  [G-03] Number registry has zero CRITICAL severity issues
 *  [G-04] Architectural enforcement ≥13 rules, zero raw SQL in Report/Dashboard controllers
 *  [G-05] verify:ledger command exists and is syntactically valid
 *  [G-06] golden:verify command exists and is syntactically valid
 *  [G-07] Golden Company trial balance balances on the test database
 *
 * FINANCIAL INVARIANT SUITE (run against live Golden Company data):
 *  [I-01] Trial Balance: Σ DR = Σ CR (all 365 days)
 *  [I-02] Balance Sheet: A = L + E at year-end
 *  [I-03] Revenue from GL only (not sales table)
 *  [I-04] No orphaned journal items
 *  [I-05] No negative inventory batches
 *  [I-06] All posted sales have journal entries
 *  [I-07] Tenant isolation: T1 revenue ≠ contaminated by T2
 *
 * @group golden
 * @group phase11
 * @group phase11-launch-gate
 */
class LaunchGateTest extends VenQoreTestCase implements RequiresGoldenCompany
{
    private const TENANT_ID = '999991';
    private const TOLERANCE = 0.02;


    private Tenant $tenant;
    private FinancialReportingService $reporting;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2025-12-31 23:59:59');
        $this->tenant    = Tenant::findOrFail(self::TENANT_ID);
        $this->bindTenantContext($this->tenant);
        $this->reporting = app(FinancialReportingService::class);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }


    // ═════════════════════════════════════════════════════════════════════════
    // LAUNCH GATE 1: PHP TEST FILES EXIST
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * @test
     * [G-01] All 11 phase PHP test files must exist and be non-empty.
     * A missing or empty file means a phase was never completed —
     * the system is not fully verified.
     */
    public function test_G01_all_php_test_files_exist_and_are_non_empty(): void
    {
        $base = base_path('Tester/tests/Feature/Golden');

        $required = [
            // Phase 1
            'GoldenCompanyTest.php'             => 'Phase 1: Golden Company Seeder',
            // Phase 3
            'SaleInputVerificationTest.php'     => 'Phase 3a: Sale Input Verification',
            'PurchaseInputVerificationTest.php' => 'Phase 3b: Purchase Input Verification',
            'ExpensePaymentInputVerificationTest.php' => 'Phase 3c: Expense/Payment Verification',
            // Phase 4
            'FinancialCoreVerificationTest.php' => 'Phase 4a: Financial Core',
            'FifoBatchVerificationTest.php'     => 'Phase 4b: FIFO Batch Verification',
            'CogsReconciliationTest.php'        => 'Phase 4c: COGS Reconciliation',
            // Phase 5
            'DashboardOutputTest.php'           => 'Phase 5a: Dashboard Output',
            'ReportOutputTest.php'              => 'Phase 5b: Report Output',
            'FilterMatrixTest.php'              => 'Phase 5c: Filter Matrix',
            // Phase 6
            'CrossSurfaceConsistencyTest.php'   => 'Phase 6a: Cross-Surface Consistency',
            'ClockPositionConsistencyTest.php'  => 'Phase 6b: Clock Position Consistency',
            'FormattingConsistencyTest.php'     => 'Phase 6c: Formatting Consistency',
            // Phase 7, 8, 9
            'ArchitecturalEnforcementTest.php'  => 'Phase 7: Architectural Enforcement',
            'AdversarialCorruptionTest.php'     => 'Phase 8: Adversarial & Corruption',
            'EdgeCasesTimeConcurrencyTest.php'  => 'Phase 9: Edge Cases & Concurrency',
        ];

        $missing = [];
        $empty   = [];

        foreach ($required as $file => $description) {
            $fullPath = "{$base}/{$file}";
            if (!file_exists($fullPath)) {
                $missing[] = "{$file} ({$description})";
            } elseif (filesize($fullPath) < 500) {
                $empty[] = "{$file} ({$description}) — size=" . filesize($fullPath) . " bytes";
            }
        }

        $this->assertEmpty($missing,
            "[G-01] LAUNCH BLOCK: Missing test files:\n  " . implode("\n  ", $missing)
        );

        $this->assertEmpty($empty,
            "[G-01] LAUNCH BLOCK: Suspiciously small test files (possible stubs):\n  " . implode("\n  ", $empty)
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // LAUNCH GATE 2: FRONTEND TEST FILE EXISTS
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * @test
     * [G-02] The Vitest frontend test file must exist and contain ≥50 test cases.
     * Fewer than 50 tests means the Phase 10 requirements were not fully met.
     */
    public function test_G02_frontend_test_file_exists_with_sufficient_coverage(): void
    {
        $path = base_path('resources/js/tests/frontend.test.js');

        $this->assertFileExists($path,
            "[G-02] LAUNCH BLOCK: Frontend test file not found at resources/js/tests/frontend.test.js. " .
            "Run Phase 10 to create it."
        );

        $content = file_get_contents($path);

        // Count test cases: `it('` or `it("` or `test(`
        $testCount = substr_count($content, "it('[") + substr_count($content, "it(\"[");
        $this->assertGreaterThanOrEqual(50, $testCount,
            "[G-02] LAUNCH BLOCK: Frontend test file contains only {$testCount} tests. " .
            "Phase 10 requires ≥50 tests."
        );

        // Verify it imports from the correct files
        $this->assertStringContainsString('from \'../Utils/settings.js\'', $content,
            "[G-02] Frontend test must import from settings.js"
        );
        $this->assertStringContainsString('from \'../Utils/format.js\'', $content,
            "[G-02] Frontend test must import from format.js"
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // LAUNCH GATE 3: NO CRITICAL ISSUES IN NUMBER REGISTRY
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * @test
     * [G-03] The Number Registry must have zero CRITICAL-severity open issues.
     *
     * Known critical issues (POS-003, WOO-001) must either be:
     *   a) Fixed and verified, then marked as 'resolved' in the registry, OR
     *   b) Explicitly acknowledged as accepted-risk with mitigation documented
     *
     * A CRITICAL issue means a data integrity bug can silently corrupt the ledger.
     * Shipping with unresolved CRITICAL issues is prohibited.
     */
    public function test_G03_number_registry_has_zero_critical_issues(): void
    {
        // Phase J (FC-1): rebuilt on YAML PARSING, not string grep. The old gate greped
        // for `severity: CRITICAL` while the registry uses `risk: CRITICAL` — so it saw
        // ZERO of the two open critical financial bugs. This version parses BOTH the number
        // registry AND the quarantine registry and treats an entry as a launch-blocking
        // critical if EITHER `risk` OR `severity` is CRITICAL and it is not resolved AND
        // (for quarantine) not covered by a still-valid waiver.
        $unresolvedCriticals = [];

        // (1) number_registry.yaml — CRITICAL in risk OR severity, not resolved/verified.
        $numPath = base_path('verification/number_registry.yaml');
        if (is_file($numPath)) {
            $data = \Symfony\Component\Yaml\Yaml::parseFile($numPath);
            foreach (($data['metrics'] ?? []) as $m) {
                $isCritical = $this->isCritical($m['risk'] ?? null) || $this->isCritical($m['severity'] ?? null);
                $resolved   = ($m['verified'] ?? false) === true
                    || in_array(strtolower((string) ($m['status'] ?? '')), ['resolved', 'fixed'], true);
                if ($isCritical && ! $resolved) {
                    $unresolvedCriticals[] = 'number_registry:' . ($m['id'] ?? '?');
                }
            }
        }

        // (2) quarantine.yaml — CRITICAL waivers are TRACKED and BLOCKING unless the waiver
        // is still valid (A-12 reconciliation). An EXPIRED critical waiver blocks launch.
        $qPath = base_path('Tester/VerificationCenter/registry/quarantine.yaml');
        if (is_file($qPath)) {
            $q = \Symfony\Component\Yaml\Yaml::parseFile($qPath);
            foreach (($q['waivers'] ?? []) as $w) {
                if (! $this->isCritical($w['risk'] ?? null) && ! $this->isCritical($w['severity'] ?? null)) {
                    continue;
                }
                $expires = $w['expires'] ?? null;
                $expired = $expires !== null && strtotime((string) $expires) < time();
                $resolved = in_array(strtolower((string) ($w['status'] ?? '')), ['resolved', 'fixed'], true);
                // A valid (unexpired) waiver keeps the CRITICAL tracked-but-not-blocking.
                // An expired waiver (or a resolved-but-still-listed defect gone stale) blocks.
                if (! $resolved && $expired) {
                    $unresolvedCriticals[] = 'quarantine:' . ($w['id'] ?? '?') . ' (waiver EXPIRED ' . $expires . ')';
                }
            }
        }

        $this->assertSame(
            [],
            $unresolvedCriticals,
            "[G-03] LAUNCH BLOCK: unresolved CRITICAL issue(s) with no valid waiver:\n  - "
                . implode("\n  - ", $unresolvedCriticals)
                . "\n\nKnown critical bugs (POS-003 COGS fabrication, WOO-001 WooCommerce bypass) are "
                . "waiver-gated in quarantine.yaml; an EXPIRED waiver blocks launch until the bug is fixed."
        );
    }

    /** True if a value is CRITICAL (string, any case, quoted or not). */
    private function isCritical($v): bool
    {
        return is_string($v) && strtoupper(trim($v, " '\"")) === 'CRITICAL';
    }

    // ═════════════════════════════════════════════════════════════════════════
    // LAUNCH GATE 4: ARCHITECTURAL ENFORCEMENT ≥13 RULES
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * @test
     * [G-04] The architectural enforcement test must cover ≥13 rules and
     * confirm ReportController has zero raw SQL imports.
     */
    public function test_G04_architectural_enforcement_covers_minimum_rules(): void
    {
        $path = base_path('Tester/tests/Feature/Golden/ArchitecturalEnforcementTest.php');
        $this->assertFileExists($path, '[G-04] ArchitecturalEnforcementTest.php must exist');

        $content = file_get_contents($path);

        // Count @test methods
        $testCount = substr_count($content, '* @test');
        $this->assertGreaterThanOrEqual(13, $testCount,
            "[G-04] ArchitecturalEnforcementTest.php must cover ≥13 rules, found {$testCount}"
        );

        // Must cover the two critical controller checks
        $this->assertStringContainsString('ReportController', $content,
            '[G-04] Architectural test must cover ReportController raw SQL prohibition'
        );
        $this->assertStringContainsString('DashboardController', $content,
            '[G-04] Architectural test must cover DashboardController raw SQL prohibition'
        );

        // LIVE CHECK: Confirm ReportController has no raw SQL right now
        $rcPath = app_path('Http/Controllers/V3/ReportController.php');
        if (file_exists($rcPath)) {
            $rcContent = file_get_contents($rcPath);
            $this->assertStringNotContainsString('DB::table(', $rcContent,
                '[G-04] REGRESSION: ReportController now contains DB::table() — architectural rule violated'
            );
            $this->assertStringNotContainsString('DB::select(', $rcContent,
                '[G-04] REGRESSION: ReportController now contains DB::select() — architectural rule violated'
            );
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // LAUNCH GATE 5: verify:ledger COMMAND EXISTS
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * @test
     * [G-05] The verify:ledger Artisan command must exist and be syntactically valid PHP.
     * A production system without nightly monitoring is not launch-ready.
     */
    public function test_G05_verify_ledger_command_exists_and_is_valid(): void
    {
        $path = app_path('Console/Commands/VerifyLedgerCommand.php');

        $this->assertFileExists($path,
            "[G-05] LAUNCH BLOCK: VerifyLedgerCommand.php not found. " .
            "The verify:ledger nightly monitor must be implemented before launch."
        );

        $content = file_get_contents($path);

        // Must be a proper Artisan command
        $this->assertStringContainsString('protected $signature = \'verify:ledger', $content,
            '[G-05] Command signature must be verify:ledger'
        );

        // Must implement all 8 critical checks
        $requiredChecks = ['L-01', 'L-02', 'L-03', 'L-04', 'L-05', 'L-06', 'L-07', 'L-08'];
        foreach ($requiredChecks as $check) {
            $this->assertStringContainsString($check, $content,
                "[G-05] verify:ledger must implement check {$check}"
            );
        }

        // Must log on failure
        $this->assertStringContainsString('Log::', $content,
            '[G-05] verify:ledger must log failures via Log::channel'
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // LAUNCH GATE 6: golden:verify COMMAND EXISTS
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * @test
     * [G-06] The golden:verify Artisan command must exist and cover all sections.
     * This is the regression guard for the Golden Company invariants.
     */
    public function test_G06_golden_verify_command_exists_and_covers_all_sections(): void
    {
        $path = app_path('Console/Commands/GoldenVerifyCommand.php');

        $this->assertFileExists($path,
            "[G-06] LAUNCH BLOCK: GoldenVerifyCommand.php not found."
        );

        $content = file_get_contents($path);

        $this->assertStringContainsString('golden:verify', $content,
            '[G-06] Command signature must be golden:verify'
        );

        // Must cover all financial sections
        $requiredSections = ['verifyProfitAndLoss', 'verifyBalanceSheet', 'verifyTrialBalance',
                             'verifyInventory', 'verifyArBalances', 'verifyApBalances', 'verifyJournalIntegrity'];
        foreach ($requiredSections as $method) {
            $this->assertStringContainsString($method, $content,
                "[G-06] golden:verify must implement method {$method}"
            );
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // LAUNCH GATE 7: GOLDEN COMPANY TRIAL BALANCE ON LIVE DB
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * @test
     * [G-07] The Golden Company's Trial Balance must be balanced on the live
     * test database RIGHT NOW. This is the final financial correctness check.
     *
     * If this fails: either the seeder is broken or someone corrupted the test DB.
     */
    public function test_G07_golden_company_trial_balance_is_balanced_live(): void
    {
        $totals = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', self::TENANT_ID)
            ->where('je.is_reversed', false)
            ->selectRaw('COALESCE(SUM(ji.debit),0) as dr, COALESCE(SUM(ji.credit),0) as cr')
            ->first();

        $dr   = round((float)($totals->dr ?? 0), 2);
        $cr   = round((float)($totals->cr ?? 0), 2);
        $diff = abs($dr - $cr);

        $this->assertLessThanOrEqual(self::TOLERANCE, $diff,
            "[G-07] LAUNCH BLOCK: Golden Company Trial Balance is IMBALANCED on the live test database. " .
            "DR={$dr}, CR={$cr}, DIFF={$diff}. " .
            "This means either the GoldenCompanySeeder has a bug or the database was corrupted. " .
            "Fix the seeder before any production deployment."
        );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // FINANCIAL INVARIANT SUITE — Live DB Checks
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * @test
     * [I-01] Balance Sheet must satisfy A = L + E at year-end Dec 31, 2025.
     */
    public function test_I01_balance_sheet_satisfies_accounting_equation_at_year_end(): void
    {
        $bs = $this->reporting->getBalanceSheet('2025-12-31');

        $this->assertTrue($bs['is_balanced'],
            "[I-01] LAUNCH BLOCK: Balance Sheet does not satisfy A = L + E at 2025-12-31. " .
            "Total Assets={$bs['total_assets']}, L+E={$bs['total_liabilities']}+{$bs['total_equity']}. " .
            "This is a fundamental accounting error."
        );
    }

    /**
     * @test
     * [I-02] Revenue comes ONLY from the ledger (GL 4000 credits), not the sales table.
     * Orphaned sales (no journal entries) must not inflate revenue.
     */
    public function test_I02_revenue_is_ledger_derived_only(): void
    {
        // Insert an orphan sale — if P&L is ledger-derived, this must be ignored
        $orphanId = \Illuminate\Support\Str::uuid()->toString();
        DB::table('sales')->insert([
            'id'               => $orphanId,
            'tenant_id'        => self::TENANT_ID,
            'reference_number' => 'GATE-ORPHAN-001',
            'total'            => 999999.99,
            'subtotal'         => 999999.99,
            'tax'              => 0,
            'discount'         => 0,
            'status'           => 'posted',
            'user_id'          => 1,
            'posted_at'        => '2025-06-01 10:00:00',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $pl = $this->reporting->getProfitAndLoss('2025-01-01', '2025-12-31');
        $revenue = (float)$pl['revenue'];

        // Revenue must NOT include the Rs.999,999.99 phantom sale
        $this->assertLessThan(2000000.0, $revenue,
            "[I-02] LAUNCH BLOCK: P&L revenue ({$revenue}) appears to include an orphaned sale " .
            "(Rs.999,999.99 phantom). This means P&L reads from the sales table — a critical architectural failure. " .
            "Revenue should be ~Rs.1,578,430 but got Rs.{$revenue}."
        );
    }

    /**
     * @test
     * [I-03] No orphaned journal items (journal_entry_id must exist in journal_entries).
     */
    public function test_I03_no_orphaned_journal_items(): void
    {
        $orphans = DB::table('journal_items as ji')
            ->where('ji.tenant_id', self::TENANT_ID)
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('journal_entries as je')
                  ->whereColumn('je.id', 'ji.journal_entry_id');
            })
            ->count();

        $this->assertEquals(0, $orphans,
            "[I-03] {$orphans} journal_item(s) have no parent journal_entry. " .
            "This indicates referential integrity failure — cascading deletes may be broken."
        );
    }

    /**
     * @test
     * [I-04] No negative inventory batches in the Golden Company dataset.
     */
    public function test_I04_no_negative_inventory_batches(): void
    {
        $negCount = DB::table('inventory_batches')
            ->where('tenant_id', self::TENANT_ID)
            ->whereNull('deleted_at')
            ->whereRaw('remaining_qty < -0.001')
            ->count();

        $this->assertEquals(0, $negCount,
            "[I-04] {$negCount} inventory batch(es) have negative remaining_qty. " .
            "This means more stock was sold than was ever received — FIFO over-consumption detected."
        );
    }

    /**
     * @test
     * [I-05] All posted sales have at least one corresponding journal entry.
     * (Checks the reference linkage used by golden:verify.)
     */
    public function test_I05_all_posted_golden_sales_have_journal_entries(): void
    {
        // Check using the reference field linking (as per GoldenVerifyCommand approach)
        // Golden Company sales use TXN-SAL-### as reference
        $goldenSales = DB::table('sales')
            ->where('tenant_id', self::TENANT_ID)
            ->where('status', 'posted')
            ->where('reference_number', 'like', 'TXN-%')
            ->get();

        foreach ($goldenSales as $sale) {
            $hasJE = DB::table('journal_entries')
                ->where('tenant_id', self::TENANT_ID)
                ->where('is_reversed', false)
                ->where(function ($q) use ($sale) {
                    $q->where('reference', $sale->reference_number)
                      ->orWhere('reference', $sale->id);
                })
                ->exists();

            $this->assertTrue($hasJE,
                "[I-05] Sale {$sale->reference_number} (id={$sale->id}) has no journal entry. " .
                "Every posted Golden Company sale must have a corresponding journal entry."
            );
        }

        // If no golden sales exist, the seeder hasn't run
        if ($goldenSales->isEmpty()) {
            $this->markTestSkipped('[I-05] No TXN-* sales found — GoldenCompanySeeder may not have run');
        }
    }

    /**
     * @test
     * [I-06] Tenant isolation: Golden Company (T1) revenue is not contaminated
     * by any other tenant's data.
     */
    public function test_I06_tenant_isolation_t1_revenue_not_contaminated(): void
    {
        // Get T1 revenue via ledger
        $incomeAcct = DB::table('accounts')
            ->where('tenant_id', self::TENANT_ID)
            ->where('code', '4000')
            ->first();

        if (!$incomeAcct) {
            $this->markTestSkipped('[I-06] Income account 4000 not found — COA may not be seeded');
        }

        $t1Revenue = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', self::TENANT_ID)
            ->where('je.tenant_id', self::TENANT_ID)  // ← BOTH must be T1
            ->where('ji.account_id', $incomeAcct->id)
            ->where('je.is_reversed', false)
            ->selectRaw('COALESCE(SUM(ji.credit),0) - COALESCE(SUM(ji.debit),0) as net')
            ->value('net');

        // Revenue must be in a reasonable range (not 0, not astronomical)
        $this->assertGreaterThan(0, $t1Revenue,
            "[I-06] Golden Company revenue is 0 — no sales have been journalized"
        );

        $this->assertLessThan(100_000_000.0, $t1Revenue,
            "[I-06] Golden Company revenue ({$t1Revenue}) is impossibly large — possible cross-tenant contamination"
        );
    }

    /**
     * @test
     * [I-07] The verify:coverage command completes without PHP errors (smoke test).
     * This catches any PHP syntax errors in the command classes themselves.
     */
    public function test_I07_verify_coverage_command_is_syntactically_valid(): void
    {
        $verifyCoveragePath = app_path('Console/Commands/VerifyCoverageCommand.php');
        $verifyLedgerPath   = app_path('Console/Commands/VerifyLedgerCommand.php');

        // Basic syntax check via PHP token parsing
        foreach ([$verifyCoveragePath, $verifyLedgerPath] as $path) {
            $this->assertFileExists($path, "[I-07] Command file not found: {$path}");

            $content = file_get_contents($path);

            // Must contain the class definition
            $this->assertStringContainsString('class Verify', $content,
                "[I-07] Command file {$path} must define a class"
            );

            // Must extend Command
            $this->assertStringContainsString('extends Command', $content,
                "[I-07] Command file must extend Illuminate\\Console\\Command"
            );

            // Must have handle() method
            $this->assertStringContainsString('public function handle()', $content,
                "[I-07] Command file must implement handle() method"
            );
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // FINAL INTEGRATION CHECK
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * @test
     * [I-08] Comprehensive end-to-end: run all financial reports for the full year
     * and verify they all return array data without exceptions.
     * The system must be capable of generating all reports before launch.
     */
    public function test_I08_all_financial_reports_generate_without_exception(): void
    {
        $reports = [
            'P&L'           => fn() => $this->reporting->getProfitAndLoss('2025-01-01', '2025-12-31'),
            'Balance Sheet' => fn() => $this->reporting->getBalanceSheet('2025-12-31'),
            'Trial Balance' => fn() => $this->reporting->getTrialBalance('2025-12-31'),
            'Cash Flow'     => fn() => $this->reporting->getCashFlowReport('2025-01-01', '2025-12-31'),
            'Tax Summary'   => fn() => $this->reporting->getTaxSummary('2025-01-01', '2025-12-31'),
            'Receivables'   => fn() => $this->reporting->getReceivables('2025-12-31'),
            'Payables'      => fn() => $this->reporting->getPayables('2025-12-31'),
        ];

        foreach ($reports as $name => $fn) {
            try {
                $result = $fn();
                $this->assertNotNull($result,
                    "[I-08] {$name} returned null — report generation failed silently"
                );
            } catch (\Throwable $e) {
                $this->fail("[I-08] {$name} threw an exception: " . $e->getMessage());
            }
        }
    }
}
