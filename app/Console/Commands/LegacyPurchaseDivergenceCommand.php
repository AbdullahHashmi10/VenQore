<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Phase 0 instrument for the legacy → V3 purchase consolidation.
 * See V3_CONSOLIDATION_PLAN.md §Phase 0 step 2.
 *
 * Counts rows still living in the legacy purchase island — `invoices` with
 * `type IN ('purchase','purchase_return')` — per tenant, once a day, and appends
 * the result to an append-only JSONL ledger.
 *
 * What you are watching for:
 *
 *   - During Phases 1–4 the counts keep growing. That is expected; legacy is
 *     still serving writes.
 *   - After Phase 5 (route cutover) the counts must go FLAT. A count that is
 *     still climbing after cutover means a writer was missed — as of 2026-08-11
 *     the only two are PurchaseController::store() and SmartFulfillmentService
 *     (JIT drafts), both banner-frozen.
 *   - After Phase 6 (archive + delete) the counts must go to zero.
 *
 * Strictly READ-ONLY. This command must never write to `invoices`, and must
 * never be given a --fix flag. It is evidence, not a repair tool.
 */
class LegacyPurchaseDivergenceCommand extends Command
{
    protected $signature = 'purchases:divergence-count
                            {--json : Emit the snapshot as JSON on stdout instead of a table}
                            {--no-record : Do not append to the JSONL ledger (dry inspection)}';

    protected $description = 'Count rows remaining in the legacy purchase island (invoices type=purchase/purchase_return) per tenant';

    /** Relative to the local disk root (storage/app). */
    private const LEDGER_PATH = 'verification/legacy_purchase_divergence.jsonl';

    public function handle(): int
    {
        // Guard: if the legacy table is gone, Phase 6 is complete and this
        // command has done its job. Exit clean rather than fataling the scheduler.
        if (! DB::getSchemaBuilder()->hasTable('invoices')) {
            $this->info('`invoices` table no longer exists — legacy purchase island fully decommissioned.');
            return self::SUCCESS;
        }

        $rows = DB::table('invoices')
            ->selectRaw('tenant_id')
            ->selectRaw("SUM(CASE WHEN type = 'purchase' THEN 1 ELSE 0 END) AS purchases")
            ->selectRaw("SUM(CASE WHEN type = 'purchase_return' THEN 1 ELSE 0 END) AS purchase_returns")
            ->selectRaw('COUNT(*) AS total')
            ->selectRaw('MAX(created_at) AS newest')
            ->whereIn('type', ['purchase', 'purchase_return'])
            ->groupBy('tenant_id')
            ->orderByDesc('total')
            ->get();

        $snapshot = [
            'captured_at'      => now()->toIso8601String(),
            'tenants'          => $rows->count(),
            'purchases'        => (int) $rows->sum('purchases'),
            'purchase_returns' => (int) $rows->sum('purchase_returns'),
            'total'            => (int) $rows->sum('total'),
            'newest_legacy_row' => optional($rows->max('newest')) ?: null,
            'per_tenant'       => $rows->map(fn ($r) => [
                'tenant_id'        => $r->tenant_id,
                'purchases'        => (int) $r->purchases,
                'purchase_returns' => (int) $r->purchase_returns,
                'total'            => (int) $r->total,
                'newest'           => $r->newest,
            ])->values()->all(),
        ];

        if (! $this->option('no-record')) {
            $this->append($snapshot);
        }

        Log::info('[V3-consolidation] legacy purchase island count', [
            'total'            => $snapshot['total'],
            'purchases'        => $snapshot['purchases'],
            'purchase_returns' => $snapshot['purchase_returns'],
            'tenants'          => $snapshot['tenants'],
        ]);

        if ($this->option('json')) {
            $this->line(json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            return self::SUCCESS;
        }

        if ($rows->isEmpty()) {
            $this->info('No legacy purchase rows remain. If Phase 6 has run, this is the expected end state.');
            return self::SUCCESS;
        }

        $this->table(
            ['Tenant', 'Purchases', 'Purchase returns', 'Total', 'Newest'],
            $rows->map(fn ($r) => [
                $r->tenant_id,
                $r->purchases,
                $r->purchase_returns,
                $r->total,
                $r->newest,
            ])->all()
        );

        $this->newLine();
        $this->line(sprintf(
            'TOTAL: %d legacy rows across %d tenant(s)  (%d purchases, %d returns)',
            $snapshot['total'],
            $snapshot['tenants'],
            $snapshot['purchases'],
            $snapshot['purchase_returns']
        ));
        $this->comment('Ledger: storage/app/' . self::LEDGER_PATH . '  — see V3_CONSOLIDATION_PLAN.md');

        return self::SUCCESS;
    }

    /**
     * Append one line to the JSONL ledger. Append-only on purpose: the value of
     * this artifact is the trend, so nothing may rewrite history.
     */
    private function append(array $snapshot): void
    {
        $disk = Storage::disk('local');
        $line = json_encode($snapshot, JSON_UNESCAPED_SLASHES) . PHP_EOL;

        if ($disk->exists(self::LEDGER_PATH)) {
            $disk->append(self::LEDGER_PATH, rtrim($line, PHP_EOL));
        } else {
            $disk->put(self::LEDGER_PATH, $line);
        }
    }
}
