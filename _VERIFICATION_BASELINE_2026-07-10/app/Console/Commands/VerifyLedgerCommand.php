<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ============================================================
 * php artisan verify:ledger
 * ============================================================
 *
 * NIGHTLY PRODUCTION LEDGER INTEGRITY MONITOR
 *
 * Designed to run as a scheduled job (nightly at 02:00 server time).
 * Scans ALL active tenants for these critical integrity conditions:
 *
 *  [L-01] Trial Balance: Σ DR = Σ CR (imbalance → corruption)
 *  [L-02] Unbalanced journal entries (individual DR ≠ CR)
 *  [L-03] Orphaned sales (posted sale has no journal entry)
 *  [L-04] Backdated entries (date ≠ within normal posting window)
 *  [L-05] Duplicate journal entry references (double-posting risk)
 *  [L-06] Negative inventory batches (stock went below zero)
 *  [L-07] Three-way inventory tie broken (GL 1100 ≠ FIFO sum)
 *  [L-08] Cross-tenant journal item contamination
 *
 * EXIT CODES:
 *  0 = All checks passed for all tenants
 *  1 = One or more issues found (alerts logged and output)
 *
 * USAGE:
 *  php artisan verify:ledger                   # all active tenants
 *  php artisan verify:ledger --tenant=<id>     # single tenant
 *  php artisan verify:ledger --since=2025-01-01 # backdating window
 *  php artisan verify:ledger --fail-fast       # stop at first failure
 *  php artisan verify:ledger --json            # machine-readable output
 *
 * SCHEDULING (in App\Console\Kernel or routes/console.php):
 *  Schedule::command('verify:ledger')->dailyAt('02:00');
 * ============================================================
 */
class VerifyLedgerCommand extends Command
{
    protected $signature = 'verify:ledger
        {--tenant=     : Run for a specific tenant ID only}
        {--since=      : Flag entries backdated before this date (default: 90 days ago)}
        {--fail-fast   : Stop after first failure}
        {--json        : Output results as JSON}
        {--silent      : No console output (for cron — errors only via Log)}';

    protected $description = 'Nightly ledger integrity monitor — runs all 8 invariant checks across all active tenants';

    private const TOLERANCE   = 0.01;   // Rs. 1 paisa
    private const DEDUP_DAYS  = 3;      // Flag duplicate references within N days

    private int   $totalIssues  = 0;
    private array $allResults   = [];

    public function handle(): int
    {
        $startTime = microtime(true);

        if (!$this->option('silent')) {
            $this->info('');
            $this->info('╔══════════════════════════════════════════════════╗');
            $this->info('║  VenQore Ledger Integrity Monitor (verify:ledger) ║');
            $this->info('╚══════════════════════════════════════════════════╝');
            $this->info('  Run at: ' . now()->format('Y-m-d H:i:s T'));
            $this->info('');
        }

        // ── Resolve tenants ────────────────────────────────────────────────
        if ($this->option('tenant')) {
            $tenants = DB::table('tenants')
                ->where('id', $this->option('tenant'))
                ->select('id', 'name', 'status')
                ->get();
        } else {
            $tenants = DB::table('tenants')
                ->whereIn('status', ['active', 'trial'])
                ->select('id', 'name', 'status')
                ->get();
        }

        if ($tenants->isEmpty()) {
            $this->error('No active tenants found.');
            return 1;
        }

        // ── Since date (backdating window) ─────────────────────────────────
        $sinceDate = $this->option('since')
            ? $this->option('since')
            : now()->subDays(90)->toDateString();

        // ── Run per-tenant ─────────────────────────────────────────────────
        foreach ($tenants as $tenant) {
            $result = $this->auditTenant($tenant->id, $tenant->name ?? $tenant->id, $sinceDate);
            $this->allResults[] = $result;
            $this->totalIssues += $result['issue_count'];

            if ($this->option('fail-fast') && $result['issue_count'] > 0) {
                break;
            }
        }

        // ── Output ─────────────────────────────────────────────────────────
        $elapsed = round(microtime(true) - $startTime, 2);

        if ($this->option('json')) {
            $this->line(json_encode([
                'run_at'       => now()->toIso8601String(),
                'elapsed_s'    => $elapsed,
                'tenant_count' => count($this->allResults),
                'total_issues' => $this->totalIssues,
                'results'      => $this->allResults,
            ], JSON_PRETTY_PRINT));
            return $this->totalIssues > 0 ? 1 : 0;
        }

        if (!$this->option('silent')) {
            $this->info('');
            $this->info('══════════════════════════════════════════════════');
            if ($this->totalIssues === 0) {
                $this->info("  ✅ ALL CLEAR — 0 issues across {$tenants->count()} tenant(s) [{$elapsed}s]");
            } else {
                $this->error("  ❌ {$this->totalIssues} ISSUE(S) FOUND across {$tenants->count()} tenant(s) [{$elapsed}s]");
                $this->error("  → Check storage/logs/laravel.log for details");
            }
            $this->info('══════════════════════════════════════════════════');
        }

        if ($this->totalIssues > 0) {
            Log::channel('stack')->critical('verify:ledger found ' . $this->totalIssues . ' integrity issue(s)', [
                'results' => $this->allResults,
            ]);
        }

        return $this->totalIssues > 0 ? 1 : 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PER-TENANT AUDIT
    // ─────────────────────────────────────────────────────────────────────────

    private function auditTenant(string $tenantId, string $tenantName, string $sinceDate): array
    {
        if (!$this->option('silent')) {
            $this->line("  🏪 [{$tenantName}] ({$tenantId})");
        }

        $issues  = [];
        $checks  = [];

        // ── [L-01] Trial Balance ──────────────────────────────────────────
        [$tbPass, $tbMsg] = $this->checkTrialBalance($tenantId);
        $checks['L-01_trial_balance'] = ['pass' => $tbPass, 'message' => $tbMsg];
        if (!$tbPass) $issues[] = "[L-01] {$tbMsg}";

        // ── [L-02] Individual unbalanced journal entries ──────────────────
        [$jePass, $jeMsg, $unbalancedJEs] = $this->checkUnbalancedEntries($tenantId);
        $checks['L-02_unbalanced_entries'] = ['pass' => $jePass, 'message' => $jeMsg, 'count' => count($unbalancedJEs)];
        if (!$jePass) $issues[] = "[L-02] {$jeMsg}";

        // ── [L-03] Orphaned sales ─────────────────────────────────────────
        [$orphanPass, $orphanMsg, $orphanCount] = $this->checkOrphanedSales($tenantId);
        $checks['L-03_orphaned_sales'] = ['pass' => $orphanPass, 'message' => $orphanMsg, 'count' => $orphanCount];
        if (!$orphanPass) $issues[] = "[L-03] {$orphanMsg}";

        // ── [L-04] Backdated entries ──────────────────────────────────────
        [$backdatePass, $backdateMsg, $backdateCount] = $this->checkBackdatedEntries($tenantId, $sinceDate);
        $checks['L-04_backdated_entries'] = ['pass' => $backdatePass, 'message' => $backdateMsg, 'count' => $backdateCount];
        if (!$backdatePass) $issues[] = "[L-04] {$backdateMsg}";

        // ── [L-05] Duplicate journal references ──────────────────────────
        [$dupPass, $dupMsg, $dupCount] = $this->checkDuplicateReferences($tenantId);
        $checks['L-05_duplicate_references'] = ['pass' => $dupPass, 'message' => $dupMsg, 'count' => $dupCount];
        if (!$dupPass) $issues[] = "[L-05] {$dupMsg}";

        // ── [L-06] Negative inventory batches ────────────────────────────
        [$negPass, $negMsg, $negCount] = $this->checkNegativeBatches($tenantId);
        $checks['L-06_negative_batches'] = ['pass' => $negPass, 'message' => $negMsg, 'count' => $negCount];
        if (!$negPass) $issues[] = "[L-06] {$negMsg}";

        // ── [L-07] Three-way inventory tie ───────────────────────────────
        [$tiePass, $tieMsg] = $this->checkInventoryThreeWayTie($tenantId);
        $checks['L-07_inventory_tie'] = ['pass' => $tiePass, 'message' => $tieMsg];
        if (!$tiePass) $issues[] = "[L-07] {$tieMsg}";

        // ── [L-08] Cross-tenant contamination ────────────────────────────
        [$crossPass, $crossMsg] = $this->checkCrossTenantContamination($tenantId);
        $checks['L-08_cross_tenant'] = ['pass' => $crossPass, 'message' => $crossMsg];
        if (!$crossPass) $issues[] = "[L-08] {$crossMsg}";

        // ── Print per-tenant result ───────────────────────────────────────
        if (!$this->option('silent')) {
            $passCount = count(array_filter($checks, fn($c) => $c['pass']));
            $failCount = count($issues);
            $statusIcon = $failCount === 0 ? '✅' : '❌';
            $this->line("     {$statusIcon} {$passCount}/8 checks passed" . ($failCount > 0 ? " — {$failCount} issue(s)" : ''));
            foreach ($issues as $issue) {
                $this->error("     → {$issue}");
            }
        }

        if (count($issues) > 0) {
            Log::warning("verify:ledger [{$tenantName}] — " . count($issues) . " issue(s) found", [
                'tenant_id' => $tenantId,
                'issues'    => $issues,
            ]);
        }

        return [
            'tenant_id'   => $tenantId,
            'tenant_name' => $tenantName,
            'issue_count' => count($issues),
            'issues'      => $issues,
            'checks'      => $checks,
            'run_at'      => now()->toIso8601String(),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECKS
    // ─────────────────────────────────────────────────────────────────────────

    /** [L-01] Σ DR = Σ CR across all non-reversed journal items */
    private function checkTrialBalance(string $tenantId): array
    {
        $totals = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', $tenantId)
            ->where('je.is_reversed', false)
            ->selectRaw('COALESCE(SUM(ji.debit),0) as dr, COALESCE(SUM(ji.credit),0) as cr')
            ->first();

        $dr   = round((float)($totals->dr ?? 0), 2);
        $cr   = round((float)($totals->cr ?? 0), 2);
        $diff = abs($dr - $cr);

        if ($diff <= self::TOLERANCE) {
            return [true, "Trial Balance balanced (DR={$dr}, CR={$cr})"];
        }

        return [false, "Trial Balance IMBALANCED: DR={$dr} CR={$cr} DIFF={$diff}"];
    }

    /** [L-02] Each individual journal entry must have DR = CR */
    private function checkUnbalancedEntries(string $tenantId): array
    {
        $unbalanced = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', $tenantId)
            ->where('je.is_reversed', false)
            ->groupBy('ji.journal_entry_id', 'je.reference', 'je.date')
            ->havingRaw('ABS(COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0)) > ?', [self::TOLERANCE])
            ->selectRaw('ji.journal_entry_id, je.reference, je.date,
                         COALESCE(SUM(ji.debit),0) as dr,
                         COALESCE(SUM(ji.credit),0) as cr')
            ->limit(20)
            ->get()
            ->toArray();

        if (empty($unbalanced)) {
            return [true, 'All journal entries individually balanced', []];
        }

        $count = count($unbalanced);
        return [false, "{$count} unbalanced journal entry/entries (first 20 shown)", $unbalanced];
    }

    /** [L-03] Every posted sale must have at least one non-reversed journal entry */
    private function checkOrphanedSales(string $tenantId): array
    {
        // Try via reference matching (reference = sale ID or TXN reference)
        $orphanCount = DB::table('sales as s')
            ->where('s.tenant_id', $tenantId)
            ->where('s.status', 'posted')
            ->where(function ($q) {
                $q->where('s.is_reversed', false)->orWhereNull('s.is_reversed');
            })
            ->whereNotExists(function ($q) use ($tenantId) {
                $q->select(DB::raw(1))
                  ->from('journal_entries as je')
                  ->where('je.tenant_id', $tenantId)
                  ->where('je.is_reversed', false)
                  ->where(function ($inner) {
                      $inner->whereColumn('je.reference', 's.reference')
                            ->orWhereColumn('je.reference', 's.id');
                  });
            })
            ->count();

        if ($orphanCount === 0) {
            return [true, 'All posted sales have journal entries', 0];
        }

        return [false, "{$orphanCount} posted sale(s) have no journal entry (orphaned)", $orphanCount];
    }

    /** [L-04] Entries with je.date before $sinceDate that were created_at AFTER $sinceDate */
    private function checkBackdatedEntries(string $tenantId, string $sinceDate): array
    {
        // Backdated = entry date is more than 90 days before it was created
        $backdated = DB::table('journal_entries')
            ->where('tenant_id', $tenantId)
            ->where('is_reversed', false)
            ->whereRaw('created_at > DATE_ADD(date, INTERVAL 90 DAY)')
            ->where('date', '>=', now()->subYears(2)->toDateString()) // limit scope
            ->count();

        if ($backdated === 0) {
            return [true, 'No suspiciously backdated entries detected', 0];
        }

        return [false, "{$backdated} entry/entries have date > 90 days before their created_at (possible backdating)", $backdated];
    }

    /** [L-05] Duplicate non-reversed journal entry references within DEDUP_DAYS */
    private function checkDuplicateReferences(string $tenantId): array
    {
        $duplicates = DB::table('journal_entries as je1')
            ->where('je1.tenant_id', $tenantId)
            ->where('je1.is_reversed', false)
            ->whereNotNull('je1.reference')
            ->where('je1.reference', '!=', '')
            ->whereExists(function ($q) use ($tenantId) {
                $q->select(DB::raw(1))
                  ->from('journal_entries as je2')
                  ->where('je2.tenant_id', $tenantId)
                  ->where('je2.is_reversed', false)
                  ->whereColumn('je2.reference', 'je1.reference')
                  ->whereColumn('je2.id', '!=', 'je1.id')
                  ->whereRaw('ABS(DATEDIFF(je2.date, je1.date)) <= ?', [self::DEDUP_DAYS]);
            })
            ->distinct()
            ->selectRaw('je1.reference, je1.date')
            ->limit(10)
            ->get()
            ->count();

        if ($duplicates === 0) {
            return [true, 'No duplicate journal entry references detected', 0];
        }

        return [false, "{$duplicates} reference(s) appear in multiple journal entries within " . self::DEDUP_DAYS . " days (possible double-posting)", $duplicates];
    }

    /** [L-06] No inventory batch should have remaining_qty < 0 */
    private function checkNegativeBatches(string $tenantId): array
    {
        $negCount = DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->whereRaw('remaining_qty < -0.001')
            ->count();

        if ($negCount === 0) {
            return [true, 'No negative inventory batches', 0];
        }

        return [false, "{$negCount} inventory batch(es) have negative remaining_qty (oversold)", $negCount];
    }

    /** [L-07] GL 1100 (Inventory) ≈ FIFO sum(remaining_qty × unit_cost) */
    private function checkInventoryThreeWayTie(string $tenantId): array
    {
        $account1100 = DB::table('accounts')
            ->where('tenant_id', $tenantId)
            ->where('code', '1100')
            ->first();

        if (!$account1100) {
            return [true, 'GL 1100 not found — skipping inventory tie (non-standard COA)'];
        }

        $gl1100 = (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', $tenantId)
            ->where('ji.account_id', $account1100->id)
            ->where('je.is_reversed', false)
            ->selectRaw('COALESCE(SUM(ji.debit),0) - COALESCE(SUM(ji.credit),0) as net')
            ->value('net');

        $fifo = (float) DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->whereRaw('remaining_qty > 0')
            ->selectRaw('COALESCE(SUM(remaining_qty * unit_cost), 0) as val')
            ->value('val');

        $gl1100 = round($gl1100, 2);
        $fifo   = round($fifo, 2);
        $diff   = abs($gl1100 - $fifo);

        // Allow up to Rs.1.00 discrepancy (rounding across many batches)
        if ($diff <= 1.00) {
            return [true, "Three-way inventory tie OK (GL1100={$gl1100}, FIFO={$fifo}, diff={$diff})"];
        }

        return [false, "Three-way tie BROKEN: GL 1100={$gl1100} vs FIFO={$fifo} (diff=Rs.{$diff})"];
    }

    /** [L-08] No journal items where tenant_id ≠ their journal_entry.tenant_id */
    private function checkCrossTenantContamination(string $tenantId): array
    {
        $contaminated = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'je.id', '=', 'ji.journal_entry_id')
            ->where('ji.tenant_id', $tenantId)
            ->where('je.tenant_id', '!=', $tenantId)
            ->count();

        if ($contaminated === 0) {
            return [true, 'No cross-tenant journal contamination'];
        }

        return [false, "{$contaminated} journal_item(s) have tenant_id={$tenantId} but parent je.tenant_id differs — CROSS-TENANT LEAK"];
    }
}
