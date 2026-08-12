<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * V3 CONSOLIDATION — PHASE 3: RECONCILIATION
 * See V3_CONSOLIDATION_PLAN.md §Phase 3.
 *
 * THIS FILE IS YOUR PROOF THAT NO RUPEE MOVED.
 *
 * Run `--baseline` before the backfill to snapshot the truth. Run it again
 * afterwards and the diff must be empty on every line except aged payables,
 * which is EXPECTED to change — that change is the fix, because legacy
 * purchases were previously invisible to that report.
 *
 * Strictly read-only. Never give this command a --fix flag.
 */
class PurchasesReconcileCommand extends Command
{
    protected $signature = 'purchases:reconcile
                            {--baseline : Write this run to the baseline artifact instead of diffing against it.}
                            {--tenant= : Restrict to a single tenant id.}
                            {--json : Emit raw JSON.}';

    protected $description = 'Reconcile the legacy purchase island against the V3 purchases tables (read-only)';

    private const BASELINE_PATH = 'verification/purchases_reconcile_baseline.json';

    public function handle(): int
    {
        $snapshot = $this->capture();

        if ($this->option('json')) {
            $this->line(json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        }

        if ($this->option('baseline')) {
            Storage::disk('local')->put(
                self::BASELINE_PATH,
                json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );
            $this->info('Baseline written to storage/app/' . self::BASELINE_PATH);
            $this->render($snapshot);
            $this->newLine();
            $this->comment('Commit this file. Every later run is diffed against it.');
            return self::SUCCESS;
        }

        $this->render($snapshot);

        if (! Storage::disk('local')->exists(self::BASELINE_PATH)) {
            $this->newLine();
            $this->warn('No baseline found. Run `php artisan purchases:reconcile --baseline` BEFORE the backfill.');
            return self::SUCCESS;
        }

        $baseline = json_decode(Storage::disk('local')->get(self::BASELINE_PATH), true);

        return $this->diff($baseline, $snapshot);
    }

    private function capture(): array
    {
        $tenantFilter = $this->option('tenant');
        $hasInvoices  = DB::getSchemaBuilder()->hasTable('invoices');

        $legacy = $hasInvoices
            ? DB::table('invoices')
                ->when($tenantFilter, fn ($q) => $q->where('tenant_id', $tenantFilter))
                ->whereIn('type', ['purchase', 'purchase_return'])
                ->selectRaw('tenant_id')
                ->selectRaw("SUM(CASE WHEN type='purchase' THEN 1 ELSE 0 END) AS cnt")
                ->selectRaw("SUM(CASE WHEN type='purchase' THEN total_amount ELSE 0 END) AS total")
                ->selectRaw("SUM(CASE WHEN type='purchase_return' THEN 1 ELSE 0 END) AS returns_cnt")
                ->groupBy('tenant_id')
                ->get()
                ->keyBy('tenant_id')
            : collect();

        $v3 = DB::table('purchases')
            ->when($tenantFilter, fn ($q) => $q->where('tenant_id', $tenantFilter))
            ->selectRaw('tenant_id, COUNT(*) AS cnt, SUM(total) AS total')
            ->groupBy('tenant_id')
            ->get()
            ->keyBy('tenant_id');

        // AP balance straight from the ledger — the only source of truth for money.
        $apByParty = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->when($tenantFilter, fn ($q) => $q->where('je.tenant_id', $tenantFilter))
            ->where('je.is_reversed', 0)
            ->where('a.code', '2000')
            ->selectRaw('je.tenant_id, SUM(ji.credit) - SUM(ji.debit) AS balance')
            ->groupBy('je.tenant_id')
            ->pluck('balance', 'tenant_id');

        $agedPayables = DB::table('purchases as p')
            ->when($tenantFilter, fn ($q) => $q->where('p.tenant_id', $tenantFilter))
            ->leftJoin('payment_allocations as pa', function ($j) {
                $j->on('pa.purchase_id', '=', 'p.id')->where('pa.status', '=', 'active');
            })
            ->where('p.workflow_status', '!=', 'cancelled')
            ->selectRaw('p.tenant_id, SUM(p.total) - COALESCE(SUM(pa.allocated_amount), 0) AS outstanding')
            ->groupBy('p.tenant_id')
            ->pluck('outstanding', 'tenant_id');

        return [
            'captured_at' => now()->toIso8601String(),
            'tenants'     => collect($legacy->keys())->merge($v3->keys())->unique()->values()
                ->mapWithKeys(fn ($t) => [$t => [
                    'legacy_purchase_count'  => (int) ($legacy[$t]->cnt ?? 0),
                    'legacy_purchase_total'  => round((float) ($legacy[$t]->total ?? 0), 2),
                    'legacy_return_count'    => (int) ($legacy[$t]->returns_cnt ?? 0),
                    'v3_purchase_count'      => (int) ($v3[$t]->cnt ?? 0),
                    'v3_purchase_total'      => round((float) ($v3[$t]->total ?? 0), 2),
                    'ledger_ap_balance'      => round((float) ($apByParty[$t] ?? 0), 2),
                    'aged_payables_total'    => round((float) ($agedPayables[$t] ?? 0), 2),
                ]])->all(),
            'orphans' => [
                'inventory_batches_unresolved' => $this->orphanBatches($tenantFilter),
                'expenses_unresolved'          => $this->orphanExpenses($tenantFilter),
            ],
        ];
    }

    /** Batches whose purchase_invoice_id resolves to neither table. */
    private function orphanBatches($tenantFilter): int
    {
        $hasInvoices = DB::getSchemaBuilder()->hasTable('invoices');

        return (int) DB::table('inventory_batches as b')
            ->when($tenantFilter, fn ($q) => $q->where('b.tenant_id', $tenantFilter))
            ->whereNotNull('b.purchase_invoice_id')
            ->whereNotExists(fn ($q) => $q->select(DB::raw(1))->from('purchases')
                ->whereColumn('purchases.id', 'b.purchase_invoice_id'))
            ->when($hasInvoices, fn ($q) => $q->whereNotExists(fn ($s) => $s->select(DB::raw(1))->from('invoices')
                ->whereColumn('invoices.id', 'b.purchase_invoice_id')))
            ->count();
    }

    private function orphanExpenses($tenantFilter): int
    {
        $hasInvoices = DB::getSchemaBuilder()->hasTable('invoices');

        return (int) DB::table('expenses as e')
            ->when($tenantFilter, fn ($q) => $q->where('e.tenant_id', $tenantFilter))
            ->whereNotNull('e.purchase_id')
            ->whereNotExists(fn ($q) => $q->select(DB::raw(1))->from('purchases')
                ->whereColumn('purchases.id', 'e.purchase_id'))
            ->when($hasInvoices, fn ($q) => $q->whereNotExists(fn ($s) => $s->select(DB::raw(1))->from('invoices')
                ->whereColumn('invoices.id', 'e.purchase_id')))
            ->count();
    }

    private function render(array $snapshot): void
    {
        $rows = [];
        foreach ($snapshot['tenants'] as $tenantId => $t) {
            $rows[] = [
                $tenantId,
                $t['legacy_purchase_count'],
                $t['v3_purchase_count'],
                number_format($t['legacy_purchase_total'], 2),
                number_format($t['v3_purchase_total'], 2),
                number_format($t['ledger_ap_balance'], 2),
                number_format($t['aged_payables_total'], 2),
            ];
        }

        $this->table(
            ['Tenant', 'Legacy #', 'V3 #', 'Legacy total', 'V3 total', 'Ledger AP', 'Aged payables'],
            $rows
        );

        $this->line('Orphan inventory batches: ' . $snapshot['orphans']['inventory_batches_unresolved']);
        $this->line('Orphan expenses:          ' . $snapshot['orphans']['expenses_unresolved']);
    }

    private function diff(array $baseline, array $now): int
    {
        $problems = [];
        $expected = [];

        foreach ($now['tenants'] as $tenantId => $t) {
            $was = $baseline['tenants'][$tenantId] ?? null;
            if (! $was) {
                $problems[] = "tenant {$tenantId}: not present in the baseline";
                continue;
            }

            // MUST NOT CHANGE — the ledger is the source of truth for money.
            if (abs($t['ledger_ap_balance'] - $was['ledger_ap_balance']) > 0.01) {
                $problems[] = sprintf(
                    'tenant %s: LEDGER AP MOVED %.2f -> %.2f. Stop and diagnose.',
                    $tenantId, $was['ledger_ap_balance'], $t['ledger_ap_balance']
                );
            }

            // Every legacy purchase must now exist in V3.
            $migrated = $t['v3_purchase_count'] - $was['v3_purchase_count'];
            if ($migrated < $was['legacy_purchase_count']) {
                $problems[] = sprintf(
                    'tenant %s: %d legacy purchases but only %d appeared in `purchases`',
                    $tenantId, $was['legacy_purchase_count'], $migrated
                );
            }

            // Totals must carry across exactly.
            $totalDelta = round($t['v3_purchase_total'] - $was['v3_purchase_total'], 2);
            if (abs($totalDelta - $was['legacy_purchase_total']) > 0.01) {
                $problems[] = sprintf(
                    'tenant %s: V3 total rose by %.2f but legacy total was %.2f',
                    $tenantId, $totalDelta, $was['legacy_purchase_total']
                );
            }

            // EXPECTED to change — record it, do not fail on it.
            $agedDelta = round($t['aged_payables_total'] - $was['aged_payables_total'], 2);
            if (abs($agedDelta) > 0.01) {
                $expected[] = sprintf(
                    'tenant %s: aged payables %.2f -> %.2f (delta %.2f) — previously-invisible legacy purchases',
                    $tenantId, $was['aged_payables_total'], $t['aged_payables_total'], $agedDelta
                );
            }
        }

        foreach (['inventory_batches_unresolved', 'expenses_unresolved'] as $k) {
            if ($now['orphans'][$k] > ($baseline['orphans'][$k] ?? 0)) {
                $problems[] = "orphans.{$k} increased: {$baseline['orphans'][$k]} -> {$now['orphans'][$k]}";
            }
        }

        $this->newLine();

        if (! empty($expected)) {
            $this->info('EXPECTED CHANGES (this is the fix, not a fault):');
            foreach ($expected as $e) {
                $this->line('  + ' . $e);
            }
            $this->newLine();
        }

        if (empty($problems)) {
            $this->info('RECONCILIATION CLEAN — no rupee moved.');
            return self::SUCCESS;
        }

        $this->error('RECONCILIATION FAILED (' . count($problems) . '):');
        foreach ($problems as $p) {
            $this->line('  ! ' . $p);
        }

        return self::FAILURE;
    }
}
