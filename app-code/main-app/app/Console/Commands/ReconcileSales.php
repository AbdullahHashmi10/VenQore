<?php

namespace App\Console\Commands;

use App\Services\Reconciliation\SaleReconciliation;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * sales:reconcile — the read-only reconciliation report (sale reliability
 * plan §5). Checks every store's books, sales, payment rows, returns, online
 * orders, FBR outbox and till queues in exact paisa, and reports every
 * difference. It never changes anything.
 *
 *   php artisan sales:reconcile                       yesterday and today, all stores
 *   php artisan sales:reconcile --tenant=12 --from=2026-10-01 --to=2026-10-08
 *   php artisan sales:reconcile --json                machine-readable
 *   php artisan sales:reconcile --fail-on=blocker     exit 1 when a blocker is found (CI / release gate)
 */
class ReconcileSales extends Command
{
    protected $signature = 'sales:reconcile
        {--tenant= : Only this tenant ID}
        {--from= : First date (default: yesterday)}
        {--to= : Last date (default: today)}
        {--json : Print JSON}
        {--fail-on=blocker : Exit 1 on findings of this severity or worse (blocker|warning|none)}
        {--examples=10 : Examples to print per check}';

    protected $description = 'Read-only reconciliation of sales, payments, journals, returns, online orders, FBR and till queues (exact paisa).';

    public function handle(SaleReconciliation $recon): int
    {
        $from = Carbon::parse($this->option('from') ?: 'yesterday')->toDateString();
        $to   = Carbon::parse($this->option('to') ?: 'today')->toDateString();

        $tenants = DB::table('tenants')->when($this->option('tenant'), fn ($q, $t) => $q->where('id', $t))->orderBy('id')->pluck('name', 'id');

        $report = [];
        $blockers = $warnings = 0;
        foreach ($tenants as $id => $name) {
            $findings = $recon->run($id, $from, $to);
            if (! $findings) {
                continue;
            }
            foreach ($findings as $f) {
                $f['severity'] === 'blocker' ? $blockers += $f['count'] : $warnings += $f['count'];
            }
            $report[] = ['tenant_id' => $id, 'name' => $name, 'findings' => $findings];
        }

        $summary = ['from' => $from, 'to' => $to, 'stores_checked' => $tenants->count(), 'stores_with_findings' => count($report),
                    'blockers' => $blockers, 'warnings' => $warnings];

        if ($this->option('json')) {
            $this->line(json_encode(['summary' => $summary, 'stores' => $report], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->info("Reconciliation {$from} → {$to}: {$summary['stores_checked']} store(s) checked, {$blockers} blocker(s), {$warnings} warning(s).");
            $n = max(0, (int) $this->option('examples'));
            foreach ($report as $store) {
                $this->line('');
                $this->line("Store {$store['tenant_id']} — {$store['name']}");
                foreach ($store['findings'] as $f) {
                    $line = sprintf('  [%s] %s: %d', strtoupper($f['severity']), $f['label'], $f['count']);
                    $f['severity'] === 'blocker' ? $this->error($line) : $this->warn($line);
                    foreach (array_slice($f['items'], 0, $n) as $item) {
                        $this->line('      ' . json_encode($item, JSON_UNESCAPED_SLASHES));
                    }
                }
            }
            if (! $report) {
                $this->info('No differences.');
            }
        }

        if ($blockers || $warnings) {
            Log::warning('sales.reconcile_findings', $summary);
        }

        $failOn = $this->option('fail-on');
        if (($failOn === 'blocker' && $blockers > 0) || ($failOn === 'warning' && ($blockers + $warnings) > 0)) {
            return self::FAILURE;
        }
        return self::SUCCESS;
    }
}
