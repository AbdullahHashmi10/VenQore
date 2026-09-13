<?php

namespace App\Services\Growth;

use App\Models\GrowthRun;
use App\Models\Tenant;
use App\Services\Growth\Brains\CashflowBrain;
use App\Services\Growth\Brains\CustomerBrain;
use App\Services\Growth\Brains\InventoryBrain;
use App\Services\Growth\Brains\ProfitBrain;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * GrowthEngine — the orchestrator.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ## The server-load problem this solves
 *
 * V1 ran once a night at 09:00 for every tenant, sequentially, inside one
 * Artisan process. Worse, the "Refresh" button in the UI called
 * `Artisan::call('growth:analyze', ['--force' => true])` synchronously inside
 * an HTTP request — with NO tenant filter. One shop owner clicking Refresh
 * deleted and regenerated recommendations for EVERY tenant on the platform,
 * while their browser waited. On a busy server that request would simply time
 * out, and the tenant would conclude the feature was broken.
 *
 * Because it was so expensive, it was run rarely; because it ran rarely, its
 * output was stale; because its output was stale, nobody trusted it. That is
 * the loop this class breaks.
 *
 * ## How V2 stays cheap while running far more often
 *
 *  1. WATERMARK SKIP. If nothing has been sold or purchased since the last
 *     run, the tenant is skipped after ONE cheap query.
 *  2. TWO GEARS. The hourly `light` pass runs only the brains that respond to
 *     fresh transactions and skips the expensive full-catalogue analytics.
 *     The nightly `deep` pass does everything.
 *  3. SET-BASED SQL. See GrowthDataSource — roughly a dozen queries per
 *     tenant instead of thousands.
 *  4. QUEUED PER TENANT. Each tenant is its own job, so one large tenant
 *     cannot block the rest and the work spreads across workers.
 *  5. IDEMPOTENT WRITES. Re-running on unchanged data changes nothing, so
 *     frequent runs are safe by construction.
 *
 * Net effect: the engine now runs up to 24× more often than V1 at a small
 * fraction of the total database cost.
 */
class GrowthEngine
{
    public function __construct(
        private readonly GrowthDataSource $data,
        private readonly SignalRepository $signals,
        private readonly ThresholdTuner $tuner,
        private readonly OutcomeEvaluator $evaluator,
        private readonly MetricSnapshotter $snapshotter,
        private readonly CustomerBrain $customerBrain,
        private readonly InventoryBrain $inventoryBrain,
        private readonly ProfitBrain $profitBrain,
        private readonly CashflowBrain $cashflowBrain,
    ) {
    }

    /**
     * Run the engine for a single tenant.
     *
     * @param  string  $mode   'deep' | 'light' | 'manual'
     * @param  bool    $force  Ignore the watermark and run regardless.
     */
    public function runForTenant(int|string $tenantId, string $mode = 'deep', bool $force = false): GrowthRun
    {
        $started = microtime(true);

        $run = GrowthRun::withoutTenantScope()->create([
            'id'         => (string) Str::uuid(),
            'tenant_id'  => $tenantId,
            'mode'       => $mode,
            'status'     => 'running',
            'started_at' => now(),
        ]);

        try {
            $watermark = $this->data->watermark($tenantId);

            // ── Cheap exit: nothing has changed ──────────────────────────
            if (!$force && $this->shouldSkip($tenantId, $watermark, $mode)) {
                $run->update([
                    'status'         => 'skipped',
                    'finished_at'    => now(),
                    'duration_ms'    => (int) ((microtime(true) - $started) * 1000),
                    'data_watermark' => $watermark,
                ]);
                return $run;
            }

            // Bind the tenant so anything relying on the HasTenant global
            // scope (models, the reporting service) behaves correctly inside
            // this CLI/queue context.
            $tenant = Tenant::find($tenantId);
            if ($tenant) {
                app()->instance('current.tenant', $tenant);
            }

            $ctx = new GrowthContext(
                tenantId: $tenantId,
                data:     $this->data,
                tuner:    $this->tuner,
                mode:     $mode,
                currency: $this->currencyFor($tenantId),
                settings: $this->settingsFor($tenantId),
            );

            $created = $updated = $resolved = 0;
            $timings = [];

            // ── Housekeeping first, so grading informs this run's ranking ─
            if ($mode !== 'light') {
                $this->evaluator->evaluate($tenantId);
                $this->tuner->tune($tenantId);
                $this->signals->expireStale($tenantId);
            }

            // ── The four brains ─────────────────────────────────────────
            foreach ($this->brainsFor($mode) as $brainKey => $brain) {
                $t0 = microtime(true);

                try {
                    $out = $brain->run($ctx);
                    $res = $this->signals->flush($tenantId, $brainKey, $out);

                    $created  += $res['created'];
                    $updated  += $res['updated'];
                    $resolved += $res['resolved'];
                } catch (\Throwable $e) {
                    // One brain failing must never take the others down with
                    // it. V1 ran everything in one method, so a single bad row
                    // aborted the entire tenant.
                    Log::error("[GrowthEngine] Brain '{$brainKey}' failed for tenant {$tenantId}: "
                        . $e->getMessage(), ['exception' => $e]);
                    $timings[$brainKey . '_error'] = $e->getMessage();
                }

                $timings[$brainKey] = (int) ((microtime(true) - $t0) * 1000);
            }

            // ── Daily KPI snapshot (deep pass only) ─────────────────────
            if ($mode !== 'light') {
                try {
                    $this->snapshotter->backfill($tenantId);
                    $this->snapshotter->snapshot($tenantId);
                } catch (\Throwable $e) {
                    Log::warning("[GrowthEngine] Snapshot failed for tenant {$tenantId}: " . $e->getMessage());
                }
            }

            $run->update([
                'status'             => 'success',
                'finished_at'        => now(),
                'duration_ms'        => (int) ((microtime(true) - $started) * 1000),
                'signals_created'    => $created,
                'signals_updated'    => $updated,
                'signals_resolved'   => $resolved,
                'customers_analysed' => $ctx->customersAnalysed,
                'products_analysed'  => $ctx->productsAnalysed,
                'data_watermark'     => $watermark,
                'brain_timings'      => $timings,
            ]);

        } catch (\Throwable $e) {
            Log::error("[GrowthEngine] Run failed for tenant {$tenantId}: " . $e->getMessage(), ['exception' => $e]);

            $run->update([
                'status'      => 'failed',
                'finished_at' => now(),
                'duration_ms' => (int) ((microtime(true) - $started) * 1000),
                'error'       => Str::limit($e->getMessage() . "\n" . $e->getTraceAsString(), 4000),
            ]);
        } finally {
            $this->tuner->forget($tenantId);

            // Release the tenant binding. Queue workers are long-lived and
            // share one container across jobs — leaving 'current.tenant' bound
            // would let the NEXT tenant's job briefly resolve the previous
            // tenant if anything read it before rebinding. Cheap insurance
            // against the worst class of bug this codebase can have.
            app()->forgetInstance('current.tenant');
        }

        return $run;
    }

    /**
     * Which brains run in this mode.
     *
     * The light pass covers what actually changes hour to hour — customer
     * rhythm and stock levels — and skips the margin/mix analysis, which needs
     * 30- and 90-day windows and cannot meaningfully move between two hourly
     * runs. Running it anyway would be pure waste.
     */
    private function brainsFor(string $mode): array
    {
        if ($mode === 'light') {
            return [
                InsightCatalog::BRAIN_INVENTORY => $this->inventoryBrain,
                InsightCatalog::BRAIN_CASH      => $this->cashflowBrain,
            ];
        }

        return [
            InsightCatalog::BRAIN_CUSTOMER  => $this->customerBrain,
            InsightCatalog::BRAIN_INVENTORY => $this->inventoryBrain,
            InsightCatalog::BRAIN_PROFIT    => $this->profitBrain,
            InsightCatalog::BRAIN_CASH      => $this->cashflowBrain,
        ];
    }

    /**
     * Skip a tenant whose data has not moved.
     *
     * The deep pass always runs at least once a day even without new sales,
     * because time itself changes the answer: a customer becomes overdue and
     * a receivable ages without anything new being recorded.
     */
    private function shouldSkip(int|string $tenantId, ?\Carbon\Carbon $watermark, string $mode): bool
    {
        $last = GrowthRun::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->where('status', 'success')
            ->latest('finished_at')
            ->first();

        if (!$last) {
            return false; // First ever run.
        }

        if ($mode !== 'light') {
            return $last->finished_at && $last->finished_at->isAfter(now()->subHours(20));
        }

        // Light pass: skip unless something genuinely new arrived.
        if (!$watermark || !$last->data_watermark) {
            return false;
        }

        return !$watermark->greaterThan($last->data_watermark);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  TENANT SETTINGS
    // ═══════════════════════════════════════════════════════════════════════

    private function settingsFor(int|string $tenantId): array
    {
        try {
            return DB::table('ai_settings')
                ->where('tenant_id', $tenantId)
                ->pluck('value', 'key')
                ->toArray();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * V1 hardcoded "Rs." into every generated message, which is wrong for any
     * tenant outside Pakistan. Read the tenant's configured currency instead.
     */
    private function currencyFor(int|string $tenantId): string
    {
        try {
            $symbol = DB::table('settings')
                ->where('tenant_id', $tenantId)
                ->whereIn('key', ['currency_symbol', 'currency'])
                ->orderByRaw("FIELD(`key`, 'currency_symbol', 'currency')")
                ->value('value');

            return $symbol ? trim($symbol) : 'Rs';
        } catch (\Throwable) {
            return 'Rs';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  READ SIDE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Has this tenant's engine ever produced anything?
     * Used by the UI to distinguish "nothing to report" from "not run yet" —
     * a distinction V1's dashboard papered over with fake demo data.
     */
    public function status(int|string $tenantId): array
    {
        $last = GrowthRun::withoutTenantScope()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['success', 'skipped'])
            ->latest('created_at')
            ->first();

        return [
            'has_run'      => (bool) $last,
            'last_run_at'  => $last?->finished_at?->toIso8601String(),
            'last_mode'    => $last?->mode,
            'duration_ms'  => $last?->duration_ms,
            'customers'    => $last?->customers_analysed ?? 0,
            'products'     => $last?->products_analysed ?? 0,
        ];
    }
}
