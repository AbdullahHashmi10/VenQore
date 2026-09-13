<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * V3 CONSOLIDATION — PHASE 4: DUAL-READ VERIFICATION WINDOW
 * See V3_CONSOLIDATION_PLAN.md §Phase 4.
 *
 * After the backfill, both tables hold the same purchases and legacy is STILL
 * serving writes (with a shadow write into `purchases` using the same UUID).
 * This command runs nightly and compares the two on count and total per tenant.
 *
 * ANY DRIFT MEANS STOP AND DIAGNOSE. Do not proceed to Phase 5 cutover until
 * this has reported zero drift for 7+ consecutive days — that streak is what
 * buys you the one-line, zero-risk rollback at cutover.
 *
 * Exit code 1 on drift, so it can gate CI or a deploy step.
 */
class PurchasesDriftCheckCommand extends Command
{
    protected $signature = 'purchases:drift-check
                            {--tenant= : Restrict to a single tenant id.}
                            {--json : Emit raw JSON.}';

    protected $description = 'Compare the legacy invoices purchase island against V3 purchases (Phase 4 dual-read window)';

    private const LEDGER_PATH = 'verification/purchases_drift.jsonl';

    /** Money tolerance. Anything above this is real drift, not rounding. */
    private const TOLERANCE = 0.01;

    public function handle(): int
    {
        if (! DB::getSchemaBuilder()->hasTable('invoices')) {
            $this->info('`invoices` table is gone — Phase 6 complete, drift is structurally impossible.');
            return self::SUCCESS;
        }

        $tenantFilter = $this->option('tenant');

        $legacy = DB::table('invoices')
            ->when($tenantFilter, fn ($q) => $q->where('tenant_id', $tenantFilter))
            ->where('type', 'purchase')
            ->selectRaw('tenant_id, COUNT(*) AS cnt, COALESCE(SUM(total_amount),0) AS total')
            ->groupBy('tenant_id')
            ->get()
            ->keyBy('tenant_id');

        // Compare only against purchases that legacy could have produced.
        // A purchase created natively in V3 has no legacy twin and is not drift.
        $legacyIds = DB::table('invoices')
            ->when($tenantFilter, fn ($q) => $q->where('tenant_id', $tenantFilter))
            ->where('type', 'purchase')
            ->pluck('id');

        $v3 = DB::table('purchases')
            ->when($tenantFilter, fn ($q) => $q->where('tenant_id', $tenantFilter))
            ->whereIn('id', $legacyIds)
            ->selectRaw('tenant_id, COUNT(*) AS cnt, COALESCE(SUM(total),0) AS total')
            ->groupBy('tenant_id')
            ->get()
            ->keyBy('tenant_id');

        $tenantIds = $legacy->keys()->merge($v3->keys())->unique()->values();
        $rows      = [];
        $drift     = [];

        foreach ($tenantIds as $tenantId) {
            $lCnt   = (int) ($legacy[$tenantId]->cnt ?? 0);
            $lTotal = round((float) ($legacy[$tenantId]->total ?? 0), 2);
            $vCnt   = (int) ($v3[$tenantId]->cnt ?? 0);
            $vTotal = round((float) ($v3[$tenantId]->total ?? 0), 2);

            $cntDelta   = $vCnt - $lCnt;
            $totalDelta = round($vTotal - $lTotal, 2);
            $isDrift    = $cntDelta !== 0 || abs($totalDelta) > self::TOLERANCE;

            $rows[] = [$tenantId, $lCnt, $vCnt, $cntDelta, number_format($lTotal, 2), number_format($vTotal, 2), number_format($totalDelta, 2), $isDrift ? 'DRIFT' : 'ok'];

            if ($isDrift) {
                $drift[] = [
                    'tenant_id'   => $tenantId,
                    'legacy_count' => $lCnt,
                    'v3_count'     => $vCnt,
                    'count_delta'  => $cntDelta,
                    'legacy_total' => $lTotal,
                    'v3_total'     => $vTotal,
                    'total_delta'  => $totalDelta,
                    'missing_ids'  => $this->missingIds($tenantId),
                ];
            }
        }

        $snapshot = [
            'captured_at'  => now()->toIso8601String(),
            'tenants'      => $tenantIds->count(),
            'drift_tenants' => count($drift),
            'clean'        => empty($drift),
            'drift'        => $drift,
        ];

        Storage::disk('local')->append(
            self::LEDGER_PATH,
            json_encode($snapshot, JSON_UNESCAPED_SLASHES)
        );

        if ($this->option('json')) {
            $this->line(json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            return empty($drift) ? self::SUCCESS : self::FAILURE;
        }

        $this->table(
            ['Tenant', 'Legacy #', 'V3 #', 'Δ#', 'Legacy total', 'V3 total', 'Δ total', 'Status'],
            $rows
        );

        if (empty($drift)) {
            $this->info('ZERO DRIFT. Streak continues — see storage/app/' . self::LEDGER_PATH);
            return self::SUCCESS;
        }

        Log::error('[V3-consolidation] purchase drift detected', $snapshot);

        $this->error('DRIFT DETECTED on ' . count($drift) . ' tenant(s). DO NOT CUT OVER.');
        foreach ($drift as $d) {
            $this->line("  tenant {$d['tenant_id']}: count Δ{$d['count_delta']}, total Δ{$d['total_delta']}");
            foreach (array_slice($d['missing_ids'], 0, 10) as $id) {
                $this->line("    missing from `purchases`: {$id}");
            }
        }
        $this->newLine();
        $this->comment('A legacy purchase with no twin means the shadow write failed. Fix it, then restart the 7-day streak.');

        return self::FAILURE;
    }

    /** Legacy purchase ids with no row in `purchases` — the shadow write missed them. */
    private function missingIds($tenantId): array
    {
        return DB::table('invoices as i')
            ->where('i.tenant_id', $tenantId)
            ->where('i.type', 'purchase')
            ->whereNotExists(fn ($q) => $q->select(DB::raw(1))->from('purchases')
                ->whereColumn('purchases.id', 'i.id'))
            ->limit(50)
            ->pluck('i.id')
            ->all();
    }
}
