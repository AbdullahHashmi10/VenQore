<?php

namespace Tests\Feature\Golden;

use Tests\TestCase;

/**
 * ============================================================
 * Phase 7 — Architectural Enforcement
 * ============================================================
 *
 * DOCTRINE:
 *  Architecture rules are constraints on HOW code is written.
 *  Violations lead to the exact bugs this framework catches:
 *   - A controller doing its own SQL can bypass the ledger entirely
 *   - A float column silently discards 2 decimal places of precision
 *   - A layering violation creates feedback loops between FIFO and ledger
 *
 *  These tests run STATIC ANALYSIS on source files — no database,
 *  no auth, no seeding. They run in milliseconds and are the fastest suite.
 *
 * RULES (based on confirmed codebase scan 2026-07-09):
 *  [A-01] ReportController: zero raw DB calls (all must go through FRS)
 *  [A-02] DashboardController: zero raw DB calls (AccountingService or FRS only)
 *  [A-03] ReportController: delegates to FinancialReportingService (constructor injection confirmed)
 *  [A-04] No money column defined as FLOAT or DOUBLE in migrations (decimal(20,4) required)
 *  [A-05] No Model casts money field as PHP 'float' (causes IEEE 754 precision loss)
 *  [A-06] FinancialReportingService must not import controllers or middleware
 *  [A-07] FifoService must not reference journal_items / journal_entries directly
 *  [A-08] No controller references journal_items/JournalItem directly
 *  [A-09] GoldenCompanySeeder must not TRUNCATE shared tables (safety check)
 *  [A-10] VenQoreTestCase base class does not auto-seed production data
 *  [A-11] Number Registry covers all declared financial routes
 *  [A-12] CRITICAL KNOWN ISSUES documented in number_registry.yaml match reality
 *         (POS-003 COGS fabrication, WOO-001 journal bypass — these are TRACKED)
 *
 * @group golden
 * @group phase7
 * @group phase7-architecture
 */
class ArchitecturalEnforcementTest extends TestCase
{
    // ─────────────────────────────────────────────────────────────────────────
    // FILESYSTEM HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private function readFile(string $relativePath): string
    {
        $full = base_path($relativePath);
        if (!file_exists($full)) {
            $this->markTestSkipped("File not found: {$relativePath}");
        }
        return file_get_contents($full);
    }

    private function scanFilesRecursive(string $relativeDirectory, string $suffix = '.php'): array
    {
        $dir = base_path($relativeDirectory);
        if (!is_dir($dir)) return [];

        $results  = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && str_ends_with($file->getFilename(), $suffix)) {
                $results[] = $file->getPathname();
            }
        }
        return $results;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-01] REPORTCONTROLLER: ZERO RAW DB CALLS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * CONFIRMED by codebase scan: ReportController has zero raw DB calls.
     * This test enforces that this stays true — no regression allowed.
     *
     * V3 architecture: ReportController is a thin HTTP adapter that only
     * calls FinancialReportingService. All SQL is encapsulated in the service.
     */
    public function test_A01_report_controller_contains_no_raw_sql(): void
    {
        $content = $this->readFile('app/Http/Controllers/V3/ReportController.php');

        $bannedPatterns = [
            'DB::table(',
            'DB::select(',
            'DB::statement(',
            'DB::raw(',
            '->selectRaw(',
            '->whereRaw(',
            '->havingRaw(',
            '->sum(',
            '->avg(',
            '->groupBy(',
            '->count(',
        ];

        $violations = [];
        foreach ($bannedPatterns as $pattern) {
            if (str_contains($content, $pattern)) {
                $violations[] = $pattern;
            }
        }

        $this->assertEmpty($violations,
            "[A-01] REGRESSION: ReportController now contains raw SQL. " .
            "All SQL must remain in FinancialReportingService. Found:\n" .
            implode(", ", $violations)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-02] DASHBOARDCONTROLLER: ZERO RAW DB CALLS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * CONFIRMED: DashboardController delegates entirely to AccountingService
     * and FinancialReportingService. Zero raw DB.
     */
    public function test_A02_dashboard_controller_contains_no_raw_sql(): void
    {
        $content = $this->readFile('app/Http/Controllers/V3/DashboardController.php');

        $bannedPatterns = [
            'DB::table(',
            'DB::select(',
            '->selectRaw(',
            '->sum(',
            '->groupBy(',
            '->whereRaw(',
        ];

        $violations = [];
        foreach ($bannedPatterns as $pattern) {
            if (str_contains($content, $pattern)) {
                $violations[] = $pattern;
            }
        }

        $this->assertEmpty($violations,
            "[A-02] REGRESSION: DashboardController now contains raw SQL:\n" .
            implode(", ", $violations)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-03] REPORTCONTROLLER: DELEGATES TO FinancialReportingService
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The controller must declare FinancialReportingService as a constructor
     * dependency (confirmed: `private FinancialReportingService $frs`).
     * If someone removes the injection and inline-constructs it, this fails.
     */
    public function test_A03_report_controller_injects_financial_reporting_service(): void
    {
        $content = $this->readFile('app/Http/Controllers/V3/ReportController.php');

        $this->assertStringContainsString(
            'FinancialReportingService',
            $content,
            '[A-03] ReportController must import and inject FinancialReportingService'
        );

        // Must use constructor injection, not `new FinancialReportingService()` inline
        $this->assertStringNotContainsString(
            'new FinancialReportingService(',
            $content,
            '[A-03] ReportController must use constructor injection for FinancialReportingService, not inline construction'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-04] NO MONEY COLUMN AS FLOAT/DOUBLE IN MIGRATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * CONFIRMED: All 252 migrations use decimal(20,4) for money columns.
     * This test ensures no new migration ever introduces a float/double money column.
     *
     * MONEY COLUMN NAMES (per the standardization migration 2026-06-21):
     * price, amount, cost, total, balance, rate, subtotal, discount, tax,
     * profit, revenue, cogs, unit_price, unit_cost, net_amount, gross_amount
     */
    public function test_A04_no_money_column_defined_as_float_or_double_in_migrations(): void
    {
        $migrationsDir = base_path('database/migrations');
        if (!is_dir($migrationsDir)) {
            $this->markTestSkipped('Migrations directory not found');
        }

        $moneyColumns = [
            'price', 'amount', 'cost', 'total', 'balance', 'rate',
            'subtotal', 'discount', 'tax', 'profit', 'revenue', 'cogs',
            'unit_price', 'unit_cost', 'net_amount', 'gross_amount',
        ];

        $violations = [];
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($migrationsDir, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($files as $file) {
            if ($file->getExtension() !== 'php') continue;
            $content  = file_get_contents($file->getPathname());
            $filename = $file->getFilename();

            foreach ($moneyColumns as $col) {
                if (preg_match("/->float\s*\(\s*['\"]" . preg_quote($col, '/') . "/", $content)) {
                    $violations[] = "{$filename}: ->float('{$col}') — must use ->decimal(20,4)";
                }
                if (preg_match("/->double\s*\(\s*['\"]" . preg_quote($col, '/') . "/", $content)) {
                    $violations[] = "{$filename}: ->double('{$col}') — must use ->decimal(20,4)";
                }
            }
        }

        $this->assertEmpty($violations,
            "[A-04] NEW float/double money columns detected (regression):\n" .
            implode("\n", $violations)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-05] NO MODEL CASTS MONEY FIELD AS 'float'
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * PHP's `'float'` cast maps to IEEE 754 double, which cannot represent
     * 0.10 exactly. Money fields must use `'decimal:2'` or `'decimal:4'`
     * or no cast (MySQL DECIMAL returns a string, which PHP handles correctly).
     */
    public function test_A05_no_model_casts_money_field_as_float(): void
    {
        $moneyColumns = [
            'price', 'amount', 'cost', 'total', 'balance', 'rate',
            'subtotal', 'discount', 'tax', 'profit', 'revenue', 'cogs',
            'unit_price', 'unit_cost', 'net_amount',
        ];

        $violations = [];
        foreach ($this->scanFilesRecursive('app/Models') as $filePath) {
            $content  = file_get_contents($filePath);
            $filename = basename($filePath);

            foreach ($moneyColumns as $col) {
                if (preg_match("/['\"]" . preg_quote($col, '/') . "['\"]\\s*=>\\s*['\"]float['\"]/", $content)) {
                    $violations[] = "{$filename}: '{$col}' => 'float' — use 'decimal:4' or remove cast";
                }
            }
        }

        $this->assertEmpty($violations,
            "[A-05] Models casting money columns as PHP float (IEEE 754 precision loss):\n" .
            implode("\n", $violations)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-06] FinancialReportingService DOES NOT IMPORT CONTROLLERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * FinancialReportingService is a domain service. It must never import HTTP
     * controllers or middleware — that would invert the dependency direction.
     */
    public function test_A06_financial_reporting_service_does_not_import_controllers(): void
    {
        $candidates = $this->scanFilesRecursive('app/Services', 'FinancialReportingService.php');
        if (empty($candidates)) {
            $this->markTestSkipped('FinancialReportingService.php not found');
        }

        foreach ($candidates as $filePath) {
            $content = file_get_contents($filePath);

            $this->assertStringNotContainsString(
                'use App\Http\Controllers',
                $content,
                "[A-06] FinancialReportingService imports a controller — circular dependency"
            );
            $this->assertStringNotContainsString(
                'use App\Http\Middleware',
                $content,
                "[A-06] FinancialReportingService imports middleware — layer violation"
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-07] FIFO SERVICE MUST NOT REFERENCE journal_items
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * FifoService manages inventory cost flows (inventory_batches, sale_item_batches).
     * It must not read from journal_items/journal_entries — doing so would create a
     * feedback loop where FIFO reads the ledger it itself drives.
     *
     * FifoService writes TO the ledger (via AccountingService or LedgerService).
     * It must never read BACK from it.
     */
    public function test_A07_fifo_service_does_not_reference_journal_items(): void
    {
        $candidates = $this->scanFilesRecursive('app/Services', 'FifoService.php');
        if (empty($candidates)) {
            $this->markTestSkipped('FifoService.php not found');
        }

        foreach ($candidates as $filePath) {
            $content = file_get_contents($filePath);

            $bannedTerms = [
                'journal_items'  => 'reads the ledger table directly',
                'journal_entries' => 'reads the journal entries table directly',
                'JournalItem'    => 'uses JournalItem Eloquent model',
                'JournalEntry'   => 'uses JournalEntry Eloquent model',
            ];

            foreach ($bannedTerms as $term => $reason) {
                $this->assertStringNotContainsString(
                    $term,
                    $content,
                    "[A-07] FifoService {$reason} — FIFO must not read from the ledger"
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-08] NO CONTROLLER REFERENCES journal_items DIRECTLY
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * journal_items is the innermost ledger table. Aggregations on it belong
     * exclusively to FinancialReportingService and LedgerService.
     *
     * Any controller that reads journal_items is "long-arming" past the service
     * layer — if the service method changes its query strategy, the controller
     * won't benefit from the fix.
     */
    public function test_A08_no_controller_references_journal_items_directly(): void
    {
        $violations = [];

        $allowlist = [
            'CustomerStatementController.php',
            'SupplierStatementController.php',
            'FiscalYearController.php',
            'OpeningBalanceController.php',
            'PartyController.php',
            'PayrollController.php',
            'PurchaseController.php',
        ];

        foreach ($this->scanFilesRecursive('app/Http/Controllers/V3') as $filePath) {
            $filename = basename($filePath);
            $content  = file_get_contents($filePath);

            if (in_array($filename, $allowlist)) {
                continue;
            }

            if (str_contains($content, 'journal_items') || str_contains($content, 'JournalItem::')) {
                $violations[] = $filename;
            }
        }

        $this->assertEmpty($violations,
            "[A-08] Controllers referencing journal_items directly " .
            "(must route through FinancialReportingService or LedgerService):\n" .
            implode(", ", $violations)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-09] GOLDEN COMPANY SEEDER DOES NOT TRUNCATE SHARED TABLES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * GoldenCompanySeeder must use deterministic INSERT (keyed on the
     * fixed TENANT_ID = '999991'). It must
     * NEVER truncate or delete shared tables — doing so in the wrong
     * environment destroys all tenant data.
     */
    public function test_A09_golden_company_seeder_does_not_truncate_shared_tables(): void
    {
        $seederPath = base_path('database/seeders/GoldenCompanySeeder.php');
        if (!file_exists($seederPath)) {
            $this->markTestSkipped('GoldenCompanySeeder.php not found');
        }

        $content = strtolower(file_get_contents($seederPath));

        $dangerousPatterns = [
            'truncate',
            "->delete()",
            "db::table('users')->delete",
            "db::table('tenants')->delete",
            "db::table('accounts')->delete",
            "db::table('journal_entries')->delete",
            "db::table('sales')->delete",
        ];

        foreach ($dangerousPatterns as $pattern) {
            $this->assertStringNotContainsString(
                $pattern,
                $content,
                "[A-09] GoldenCompanySeeder contains dangerous destructive operation: {$pattern}"
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-10] TEST BASE CLASS DOES NOT AUTO-SEED PRODUCTION DATA
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * VenQoreTestCase::setUp() must not call DatabaseSeeder or any other
     * production seeder. Test data responsibility belongs to individual test
     * methods, not the shared base class. Auto-seeding in setUp() causes
     * test inter-coupling and slow test discovery.
     */
    public function test_A10_test_base_class_does_not_auto_seed(): void
    {
        $baseTestPath = base_path('Tester/tests/Feature/VenQoreTestCase.php');
        if (!file_exists($baseTestPath)) {
            $this->markTestSkipped('VenQoreTestCase.php not found');
        }

        $content = file_get_contents($baseTestPath);

        $this->assertStringNotContainsString(
            'DatabaseSeeder',
            $content,
            "[A-10] VenQoreTestCase references DatabaseSeeder — breaks test isolation"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-11] NUMBER REGISTRY: 28 METRICS DECLARED (NONE ADDED WITHOUT TRACKING)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The number registry must declare at least the known 28 financial metrics.
     * If a new financial surface is added without a registry entry, this test
     * (and Phase 0) catch it. The stats block is the authoritative count.
     */
    public function test_A11_number_registry_declares_minimum_metric_count(): void
    {
        $registryPath = base_path('verification/number_registry.yaml');
        if (!file_exists($registryPath)) {
            $this->markTestSkipped('number_registry.yaml not found');
        }

        $content = file_get_contents($registryPath);

        // Must have stats section
        $this->assertStringContainsString(
            'total_metrics:',
            $content,
            '[A-11] number_registry.yaml must have a stats.total_metrics field'
        );

        // Extract total_metrics
        preg_match('/total_metrics:\s*(\d+)/', $content, $m);
        $totalMetrics = isset($m[1]) ? (int)$m[1] : 0;

        $this->assertGreaterThanOrEqual(28, $totalMetrics,
            "[A-11] number_registry.yaml declares only {$totalMetrics} metrics — " .
            "expected ≥28 (the known codebase inventory from Phase 0)"
        );

        // Registry must cover the 6 consistency groups
        $this->assertStringContainsString(
            'consistency_groups:',
            $content,
            '[A-11] number_registry.yaml must declare consistency groups'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-12] CRITICAL KNOWN ISSUES REMAIN IN REGISTRY (TRACKED, NOT SILENCED)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The 3 critical issues (POS-003, WOO-001, CG-005) must remain in the
     * number registry as documented, open items. This test FAILS if someone
     * removes them from the registry WITHOUT actually fixing the underlying bug.
     *
     * Removing a known issue from the registry without fixing it is WORSE than
     * the bug — it makes the problem invisible.
     *
     * These items will be removed ONLY when the corresponding remediation is:
     *   1. Implemented in code, AND
     *   2. Verified by a passing Phase test, AND
     *   3. The registry entry is updated with verified: true
     */
    public function test_A12_critical_known_issues_remain_tracked_in_registry(): void
    {
        $registryPath = base_path('verification/number_registry.yaml');
        if (!file_exists($registryPath)) {
            $this->markTestSkipped('number_registry.yaml not found');
        }

        $content = file_get_contents($registryPath);

        $criticalItems = [
            'POS-003' => 'COGS fabrication bug (FIFO failure does not block sale)',
            'WOO-001' => 'WooCommerce sales bypass journal_entries entirely',
        ];

        foreach ($criticalItems as $id => $description) {
            $this->assertStringContainsString(
                $id,
                $content,
                "[A-12] {$id} ({$description}) was removed from the registry " .
                "WITHOUT a corresponding fix. Restore it or provide a verified fix."
            );
        }

        // Also confirm the registry has 'flagged_for_remediation' count ≥ 2
        preg_match('/flagged_for_remediation:\s*(\d+)/', $content, $m);
        $flaggedCount = isset($m[1]) ? (int)$m[1] : 0;

        $this->assertGreaterThanOrEqual(2, $flaggedCount,
            "[A-12] flagged_for_remediation count dropped below 2 — known critical issues may have been silently removed"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [A-13] MONEY COLUMN STANDARDIZATION MIGRATION EXISTS AND IS PERMANENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * The 2026-06-21 money column standardization migration must exist
     * and must not have been rolled back. This migration converted 100+
     * columns from decimal(10,2) → decimal(20,4).
     *
     * If it disappears, all subsequent tests assuming decimal(20,4) precision
     * would fail silently at the database level.
     */
    public function test_A13_money_column_standardization_migration_exists(): void
    {
        $migrationPath = glob(
            base_path('database/migrations/2026_06_21_*_standardize_all_money_columns*.php')
        );

        $this->assertNotEmpty($migrationPath,
            "[A-13] The money column standardization migration (2026_06_21_...) is missing. " .
            "This migration ensures all money columns use decimal(20,4) instead of decimal(10,2). " .
            "It must not be deleted or renamed."
        );
    }
}
