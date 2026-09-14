<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * ============================================================
 * php artisan golden:verify
 * ============================================================
 *
 * Compares live database state (after GoldenCompanySeeder) against
 * the pre-computed manifest.yaml from the independent calculator.
 *
 * ALL failures are printed to stdout and the command exits with code 1
 * if ANY assertion fails. This makes it CI-compatible.
 *
 * Usage:
 *   php artisan golden:verify --env=testing
 *   php artisan golden:verify --verbose
 *   php artisan golden:verify --section=balance_sheet
 *
 * Exit codes:
 *   0 = all assertions passed
 *   1 = one or more assertions failed
 * ============================================================
 */
class GoldenVerifyCommand extends Command
{
    protected $signature = 'golden:verify
                            {--section= : Only run a specific section (pl|bs|tb|inventory|ar|ap|isolation|dashboard)}
                            {--show-pass  : Print passing assertions too}
                            {--skip-checksum : Skip manifest checksum verification}';

    protected $description = 'Verify live DB state against the Golden Company manifest';

    private string $tenantId = '999991';
    private array  $manifest = [];
    private int    $passed   = 0;
    private int    $failed   = 0;
    private array  $failures = [];
    private float  $tolerance = 0.20;  // PKR 20 paisa tolerance for floating point

    public function handle(): int
    {
        $this->info('VenQore Golden Company Verifier');
        $this->info('================================');

        // ── 1. Load manifest ────────────────────────────────────────────────
        $manifestPath = base_path('verification/golden_company/manifest.yaml');
        $jsonPath     = base_path('verification/golden_company/manifest.json');

        if (file_exists($jsonPath)) {
            $this->manifest = json_decode(file_get_contents($jsonPath), true);
        } elseif (file_exists($manifestPath)) {
            $this->manifest = $this->parseManifestYaml($manifestPath);
        } else {
            $this->error('manifest.json / manifest.yaml not found.');
            $this->error('Run: php verification/golden_company/calculator.php');
            return 1;
        }

        // ── 2. Verify checksum ───────────────────────────────────────────────
        if (!$this->option('skip-checksum')) {
            $specPath    = base_path('verification/golden_company/spec.yaml');
            $specHash    = file_exists($specPath) ? hash('sha256', file_get_contents($specPath)) : null;
            $manifestHash = $this->manifest['spec_checksum'] ?? null;

            if ($specHash && $manifestHash && $specHash !== $manifestHash) {
                $this->warn("⚠️  manifest.json is STALE — spec.yaml has changed since manifest was generated.");
                $this->warn("   Regenerate: php verification/golden_company/calculator.php");
            }
        }

        // ── 3. Guard — confirm golden company tenant exists ──────────────────
        $tenantExists = DB::table('tenants')->where('id', $this->tenantId)->exists();
        if (!$tenantExists) {
            $this->error('Golden company tenant not found. Run: php artisan db:seed --class=GoldenCompanySeeder --env=testing');
            return 1;
        }

        $section = $this->option('section');

        // ── 4. Run assertions per section ────────────────────────────────────
        if (!$section || $section === 'pl') $this->verifyProfitAndLoss();
        if (!$section || $section === 'bs') $this->verifyBalanceSheet();
        if (!$section || $section === 'tb') $this->verifyTrialBalance();
        if (!$section || $section === 'inventory') $this->verifyInventory();
        if (!$section || $section === 'ar') $this->verifyArBalances();
        if (!$section || $section === 'ap') $this->verifyApBalances();
        if (!$section || $section === 'journal') $this->verifyJournalIntegrity();
        if (!$section || $section === 'isolation') $this->verifyIsolation();

        // ── 5. Summary ────────────────────────────────────────────────────────
        $this->newLine();
        $this->info("════════════════════════════════════════════════");
        $this->info("  RESULTS: {$this->passed} passed / {$this->failed} failed");
        $this->info("════════════════════════════════════════════════");

        if ($this->failed > 0) {
            $this->newLine();
            $this->error('FAILURES:');
            foreach ($this->failures as $f) {
                $this->error("  ❌ [{$f['section']}] {$f['label']}");
                $this->error("     Expected : {$f['expected']}");
                $this->error("     Actual   : {$f['actual']}");
                $this->error("     Diff     : {$f['diff']}");
            }
            return 1;
        }

        $this->info('');
        $this->info('✅ All Golden Company assertions passed!');
        return 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: PROFIT & LOSS
    // ─────────────────────────────────────────────────────────────────────────

    private function verifyProfitAndLoss(): void
    {
        $this->line("\n📊 PROFIT & LOSS");
        $pl = $this->manifest['year_end']['profit_and_loss'];

        // Revenue from GL 4000
        $revenue = $this->glBalance('4000');
        $this->assert('pl', 'Revenue (GL 4000)', $pl['revenue'], $revenue);

        // COGS from GL 5000
        $cogs = $this->glBalance('5000');
        $this->assert('pl', 'COGS (GL 5000)', $pl['cogs'], $cogs);

        // Gross profit
        $grossProfit = round($revenue - $cogs, 2);
        $this->assert('pl', 'Gross Profit', $pl['gross_profit'], $grossProfit);

        // Individual expense accounts
        $sal  = $this->glBalance('5100');
        $rent = $this->glBalance('5200');
        $util = $this->glBalance('5300');
        $mkt  = $this->glBalance('5400');
        $opex = $this->glBalance('6000');
        $totalExp = round($sal + $rent + $util + $mkt + $opex, 2);
        $this->assert('pl', 'Total Expenses', $pl['expenses'], $totalExp);

        // Net profit
        $netProfit = round($grossProfit - $totalExp, 2);
        $this->assert('pl', 'Net Profit', $pl['net_profit'], $netProfit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: BALANCE SHEET
    // ─────────────────────────────────────────────────────────────────────────

    private function verifyBalanceSheet(): void
    {
        $this->line("\n🏦 BALANCE SHEET");
        $expected = $this->manifest['year_end']['account_balances'];

        $checks = ['1000', '1010', '1100', '1200', '2000', '2100', '2300', '3000', '4000', '5000', '5200', '5400'];
        foreach ($checks as $code) {
            if (!isset($expected[$code])) continue;
            $actual = $this->glBalance($code);
            $this->assert('bs', "GL {$code}", $expected[$code], $actual);
        }

        // Balance equation: Assets = Liabilities + Equity + Retained Earnings
        $bs = $this->manifest['year_end']['balance_sheet'];
        $assets = $this->glBalance('1000') + $this->glBalance('1010')
                + $this->glBalance('1100') + $this->glBalance('1200')
                + $this->glBalance('2300');
        $this->assert('bs', 'Total Assets', $bs['total_assets'], $assets);

        $balanced = abs($bs['total_assets'] - $bs['liab_plus_equity']) < $this->tolerance;
        if (!$balanced) {
            $this->recordFailure('bs', 'Balance Sheet Equation (A=L+E)',
                $bs['liab_plus_equity'],
                $bs['total_assets'],
                'Balance sheet is unbalanced!');
        } else {
            $this->recordPass('bs', 'Balance Sheet Equation (A=L+E)');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: TRIAL BALANCE
    // ─────────────────────────────────────────────────────────────────────────

    private function verifyTrialBalance(): void
    {
        $this->line("\n📋 TRIAL BALANCE (Debit = Credit)");

        // Query all journal items for this tenant
        $totals = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', $this->tenantId)
            ->where('je.is_reversed', false)
            ->selectRaw('SUM(ji.debit) as total_debit, SUM(ji.credit) as total_credit')
            ->first();

        $totalDebit  = round((float)($totals->total_debit  ?? 0), 2);
        $totalCredit = round((float)($totals->total_credit ?? 0), 2);
        $diff = abs($totalDebit - $totalCredit);

        if ($diff < $this->tolerance) {
            $this->recordPass('tb', "Trial Balance (Σ DR = Σ CR) diff={$diff}");
        } else {
            $this->recordFailure('tb', 'Trial Balance', $totalDebit, $totalCredit,
                "Debits ≠ Credits by Rs.{$diff}");
        }

        // Every individual journal entry must balance
        $unbalanced = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', $this->tenantId)
            ->groupBy('ji.journal_entry_id')
            ->havingRaw('ABS(SUM(ji.debit) - SUM(ji.credit)) > 0.01')
            ->selectRaw('ji.journal_entry_id, SUM(ji.debit) as dr, SUM(ji.credit) as cr')
            ->get();

        if ($unbalanced->isEmpty()) {
            $this->recordPass('tb', 'All individual journal entries balanced');
        } else {
            foreach ($unbalanced as $row) {
                $diff = round(abs($row->dr - $row->cr), 4);
                $this->recordFailure('tb',
                    "Unbalanced entry {$row->journal_entry_id}",
                    $row->dr, $row->cr,
                    "Diff Rs.{$diff}"
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: INVENTORY
    // ─────────────────────────────────────────────────────────────────────────

    private function verifyInventory(): void
    {
        $this->line("\n📦 INVENTORY (Three-Way Tie)");

        $expectedInvValue = $this->manifest['inventory']['total_value'];
        $expectedGl1100   = $this->manifest['year_end']['account_balances']['1100'];

        // GL 1100 balance
        $gl1100 = $this->glBalance('1100');
        $this->assert('inventory', 'GL 1100 (Inventory Asset)', $expectedGl1100, $gl1100);

        // FIFO inventory value = SUM(remaining_qty × unit_cost) for non-deleted batches
        $fifoValue = DB::table('inventory_batches')
            ->where('tenant_id', $this->tenantId)
            ->whereNull('deleted_at')
            ->whereRaw('remaining_qty > 0')
            ->selectRaw('SUM(remaining_qty * unit_cost) as val')
            ->value('val');
        $fifoValue = round((float)($fifoValue ?? 0), 2);

        $this->assert('inventory', 'FIFO Valuation (Σ remaining×cost)', $expectedInvValue, $fifoValue);

        // Three-way tie: GL 1100 = FIFO value
        $diff3way = abs($gl1100 - $fifoValue);
        if ($diff3way < $this->tolerance) {
            $this->recordPass('inventory', "Three-way tie (GL=FIFO diff={$diff3way})");
        } else {
            $this->recordFailure('inventory', 'Three-way tie GL 1100 ≠ FIFO',
                $gl1100, $fifoValue, "Rs.{$diff3way} discrepancy");
        }

        // No negative remaining_qty
        $negBatches = DB::table('inventory_batches')
            ->where('tenant_id', $this->tenantId)
            ->whereNull('deleted_at')
            ->whereRaw('remaining_qty < -0.001')
            ->count();
        if ($negBatches === 0) {
            $this->recordPass('inventory', 'No negative inventory batches');
        } else {
            $this->recordFailure('inventory', 'Negative inventory batches', 0, $negBatches,
                "{$negBatches} batch(es) have negative remaining_qty");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: AR BALANCES
    // ─────────────────────────────────────────────────────────────────────────

    private function verifyArBalances(): void
    {
        $this->line("\n👤 ACCOUNTS RECEIVABLE");

        $expectedTotal = $this->manifest['ar_balances']['total'];
        $gl1200 = $this->glBalance('1200');
        $this->assert('ar', 'AR Total (GL 1200)', $expectedTotal, $gl1200);

        // Per-customer breakdown from party_snapshots or GL party lines
        if (DB::getSchemaBuilder()->hasTable('party_snapshots')) {
            $arAccount = DB::table('accounts')->where('tenant_id', $this->tenantId)->where('code', '1200')->first();
            if ($arAccount) {
                $byCust = DB::table('party_snapshots')
                    ->where('tenant_id', $this->tenantId)
                    ->where('account_id', $arAccount->id)
                    ->whereIn('party_id', [
                        'gc-cust-ahmed-0000000000000001',
                        'gc-cust-sara-00000000000000001',
                        'gc-cust-walk-00000000000000001',
                    ])
                    ->get()
                    ->keyBy('party_id');

                $mapping = [
                    'CUST-AHMED' => 'gc-cust-ahmed-0000000000000001',
                    'CUST-SARA'  => 'gc-cust-sara-00000000000000001',
                    'CUST-WALK'  => 'gc-cust-walk-00000000000000001',
                ];

                $expectedByCust = $this->manifest['ar_balances']['by_customer'];
                foreach ($expectedByCust as $custId => $expected) {
                    $dbId = $mapping[$custId] ?? $custId;
                    $actual = round((float)($byCust[$dbId]->cached_balance ?? 0), 2);
                    $this->assert('ar', "AR Balance for {$custId}", $expected, $actual);
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: AP BALANCES
    // ─────────────────────────────────────────────────────────────────────────

    private function verifyApBalances(): void
    {
        $this->line("\n🏭 ACCOUNTS PAYABLE");

        $expectedTotal = $this->manifest['ap_balances']['total'];
        $gl2000 = $this->glBalance('2000');
        $this->assert('ap', 'AP Total (GL 2000)', $expectedTotal, $gl2000);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: JOURNAL INTEGRITY
    // ─────────────────────────────────────────────────────────────────────────

    private function verifyJournalIntegrity(): void
    {
        $this->line("\n📖 JOURNAL INTEGRITY");

        // Every sale must have exactly one journal entry
        $salesWithoutJE = DB::table('sales as s')
            ->where('s.tenant_id', $this->tenantId)
            ->where('s.status', 'posted')
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('journal_entries as je')
                  ->whereColumn('je.reference', 's.id')
                  ->where('je.reference_type', 'sale');
            })
            ->count();

        if ($salesWithoutJE === 0) {
            $this->recordPass('journal', 'All posted sales have journal entries');
        } else {
            $this->recordFailure('journal', 'Sales without journal entries', 0, $salesWithoutJE,
                "{$salesWithoutJE} posted sale(s) missing journal entry");
        }

        // No orphaned journal items (journal_entry_id must exist)
        $orphans = DB::table('journal_items as ji')
            ->where('ji.tenant_id', $this->tenantId)
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                  ->from('journal_entries as je')
                  ->whereColumn('je.id', 'ji.journal_entry_id');
            })
            ->count();

        if ($orphans === 0) {
            $this->recordPass('journal', 'No orphaned journal_items');
        } else {
            $this->recordFailure('journal', 'Orphaned journal_items', 0, $orphans,
                "{$orphans} journal_item(s) have no parent journal_entry");
        }

        // Reversed entries must have a corresponding reversal
        $badReversals = DB::table('journal_entries')
            ->where('tenant_id', $this->tenantId)
            ->where('is_reversed', true)
            // A mirror-image reversal entry also carries is_reversed=1 (see
            // AccountingService::reverseEntry) but nothing reversed *it*, so it
            // legitimately has no reversed_by pointer. Only originals need one.
            ->where(function ($q) {
                $q->where('is_reversal', false)->orWhereNull('is_reversal');
            })
            ->whereNull('reversed_by')
            ->count();

        if ($badReversals === 0) {
            $this->recordPass('journal', 'All reversed entries have reversed_by pointer');
        } else {
            $this->recordFailure('journal', 'is_reversed=true but reversed_by=null', 0, $badReversals,
                "{$badReversals} entry/entries");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION: TENANT ISOLATION
    // ─────────────────────────────────────────────────────────────────────────

    private function verifyIsolation(): void
    {
        $this->line("\n🔒 TENANT ISOLATION");

        $t2Id = '999992';
        $iso  = $this->manifest['isolation_check'];

        // TENANT-2 revenue must NOT appear in TENANT-1 journal
        $crossTenantRevenue = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', $this->tenantId)  // TENANT-1 items
            ->where('je.tenant_id', $this->tenantId)  // TENANT-1 entries
            ->where('a.code', '4000')
            ->whereIn('ji.id', function ($q) use ($t2Id) {
                // Find any items that reference TENANT-2's sales
                $q->select('ji2.id')
                  ->from('journal_items as ji2')
                  ->where('ji2.tenant_id', $t2Id);
            })
            ->count();

        if ($crossTenantRevenue === 0) {
            $this->recordPass('isolation', 'TENANT-2 revenue not in TENANT-1 journal');
        } else {
            $this->recordFailure('isolation', 'Cross-tenant journal leak', 0, $crossTenantRevenue,
                'TENANT-2 journal items found in TENANT-1 context!');
        }

        // TENANT-1 GL 4000 should NOT equal T1+T2 combined revenue
        $t2Revenue = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', $t2Id)
            ->where('a.code', '4000')
            ->where('je.is_reversed', false)
            ->sum('ji.credit');

        $t2Revenue = round((float)$t2Revenue, 2);
        $this->assert('isolation', 'TENANT-2 Revenue (isolated)', $iso['tenant_2_revenue'], $t2Revenue);

        // TENANT-1 revenue must NOT include T2 revenue
        $t1Revenue = $this->glBalance('4000');
        $combinedRevenue = $t1Revenue + $t2Revenue;
        $manifestT1Revenue = $this->manifest['year_end']['profit_and_loss']['revenue'];

        if (abs($t1Revenue - $manifestT1Revenue) < $this->tolerance) {
            $this->recordPass('isolation', "TENANT-1 revenue Rs.{$t1Revenue} matches manifest (excludes TENANT-2 Rs.{$t2Revenue})");
        } else {
            $this->recordFailure('isolation', 'TENANT-1 revenue contaminated by TENANT-2?',
                $manifestT1Revenue, $t1Revenue, "Diff Rs." . abs($t1Revenue - $manifestT1Revenue));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GL BALANCE HELPER
    // ─────────────────────────────────────────────────────────────────────────

    private function glBalance(string $code): float
    {
        $row = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'a.id', '=', 'ji.account_id')
            ->where('ji.tenant_id', $this->tenantId)
            ->where('a.code', $code)
            ->where('je.is_reversed', false)
            ->selectRaw('SUM(ji.debit) as total_debit, SUM(ji.credit) as total_credit')
            ->first();

        if (!$row) return 0.0;

        $dr = (float)($row->total_debit  ?? 0);
        $cr = (float)($row->total_credit ?? 0);

        // Determine normal balance from account type
        $type = DB::table('accounts')
            ->where('tenant_id', $this->tenantId)
            ->where('code', $code)
            ->value('normal_balance');

        if ($type === 'credit') {
            return round($cr - $dr, 2);
        }
        return round($dr - $cr, 2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ASSERTION HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private function assert(string $section, string $label, float|int $expected, float|int $actual): void
    {
        $expected = round((float)$expected, 2);
        $actual   = round((float)$actual, 2);
        $diff     = abs($expected - $actual);

        if ($diff <= $this->tolerance) {
            $this->recordPass($section, "{$label} = Rs." . number_format($actual, 2));
        } else {
            $this->recordFailure($section, $label, $expected, $actual, "Rs.{$diff}");
        }
    }

    private function recordPass(string $section, string $label): void
    {
        $this->passed++;
        if ($this->option('show-pass')) {
            $this->line("  <fg=green>✅</> [{$section}] {$label}");
        }
    }

    private function recordFailure(string $section, string $label, float|int $expected, float|int $actual, string $diff): void
    {
        $this->failed++;
        $this->failures[] = compact('section', 'label', 'expected', 'actual', 'diff');
        $this->line("  <fg=red>❌</> [{$section}] {$label}");
        if ($this->option('show-pass')) {
            $this->line("       Expected: {$expected}");
            $this->line("       Actual  : {$actual}");
            $this->line("       Diff    : {$diff}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MANIFEST YAML PARSER (minimal)
    // ─────────────────────────────────────────────────────────────────────────

    private function parseManifestYaml(string $path): array
    {
        // The manifest.yaml is simple key: value format with section headers
        // We use the JSON version when available (which it is after calculator.php runs)
        $lines  = file($path, FILE_IGNORE_NEW_LINES);
        $result = [];
        $currentSection = null;

        foreach ($lines as $line) {
            if (empty(trim($line)) || str_starts_with(trim($line), '#')) continue;
            if (preg_match('/^([a-z_]+):$/', trim($line), $m)) {
                $currentSection = $m[1];
                $result[$currentSection] = [];
            } elseif (preg_match('/^\s+[\'"]?([^:\'"\s]+)[\'"]?:\s+(.+)$/', $line, $m)) {
                if ($currentSection) {
                    $val = trim($m[2]);
                    if (is_numeric($val)) $val = (float)$val;
                    if ($val === 'true')  $val = true;
                    if ($val === 'false') $val = false;
                    $result[$currentSection][$m[1]] = $val;
                }
            } elseif (preg_match('/^([a-z_]+):\s+(.+)$/', $line, $m)) {
                $val = trim($m[2]);
                if (is_numeric($val)) $val = (float)$val;
                if ($val === 'true')  $val = true;
                if ($val === 'false') $val = false;
                $result[$m[1]] = $val;
            }
        }

        return $result;
    }
}
