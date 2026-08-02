<?php

namespace App\Console\Commands;

use App\Jobs\RunGrowthEngineForTenant;
use App\Models\Tenant;
use App\Services\Growth\GrowthEngine;
use Illuminate\Console\Command;

/**
 * growth:analyze — the Growth Engine entry point.
 *
 * Replaces the V1 command, which:
 *   - ran every tenant inline in one process,
 *   - read the empty `invoices` table so produced nothing,
 *   - and offered `--force`, which DELETED all of a tenant's recommendations
 *     and analytics before regenerating. That destroyed the read/dismiss state
 *     the owner had built up, and — after V2 — would also destroy the outcome
 *     history the engine learns from. `--force` now means "ignore the
 *     watermark and re-run", which is what people actually wanted from it.
 *
 * Modes:
 *   deep    full analysis, all four brains, grading + tuning + snapshot (nightly)
 *   light   fast pass over stock and cash only, skipped entirely if nothing
 *           new has been recorded (hourly)
 */
class RunGrowthEngine extends Command
{
    protected $signature = 'growth:analyze
        {--tenant= : Run for a single tenant ID}
        {--mode=deep : deep|light}
        {--force : Ignore the change watermark and run anyway}
        {--sync : Run inline instead of dispatching to the queue}';

    protected $description = 'Run the Growth Engine — four brains producing tracked, self-tuning business insights';

    public function handle(GrowthEngine $engine): int
    {
        $mode = in_array($this->option('mode'), ['deep', 'light'], true)
            ? $this->option('mode')
            : 'deep';

        $query = Tenant::query()->whereIn('status', ['active', 'trial']);

        if ($this->option('tenant')) {
            $query->where('id', $this->option('tenant'));
        }

        $tenants = $query->get(['id', 'name']);

        if ($tenants->isEmpty()) {
            $this->warn('No active tenants found.');
            return self::SUCCESS;
        }

        $this->info("Growth Engine — {$mode} pass across {$tenants->count()} tenant(s)");

        // Inline mode is for local debugging and single-tenant manual runs.
        // Anything platform-wide goes through the queue so it cannot monopolise
        // a web worker or block on one slow tenant.
        $sync = $this->option('sync') || ($this->option('tenant') && $tenants->count() === 1 && $this->option('sync'));

        $created = $skipped = $failed = 0;

        foreach ($tenants as $tenant) {
            if ($sync) {
                $run = $engine->runForTenant($tenant->id, $mode, (bool) $this->option('force'));

                match ($run->status) {
                    'skipped' => $skipped++,
                    'failed'  => $failed++,
                    default   => $created += $run->signals_created,
                };

                $this->line(sprintf(
                    '  [%d] %-28s %-8s %5dms  +%d new  ~%d updated  ✓%d resolved',
                    $tenant->id,
                    \Illuminate\Support\Str::limit($tenant->name, 26),
                    $run->status,
                    $run->duration_ms,
                    $run->signals_created,
                    $run->signals_updated,
                    $run->signals_resolved
                ));

                if ($run->status === 'failed') {
                    $this->error('      ' . \Illuminate\Support\Str::limit((string) $run->error, 160));
                }
            } else {
                RunGrowthEngineForTenant::dispatch(
                    $tenant->id,
                    $mode,
                    (bool) $this->option('force')
                );
                $created++;
            }
        }

        if ($sync) {
            $this->newLine();
            $this->info("Done. {$created} new signals, {$skipped} tenant(s) skipped (no new data), {$failed} failed.");
        } else {
            $this->info("Queued {$created} tenant job(s) on the 'growth' queue.");
            $this->comment('Ensure a worker is processing it:  php artisan queue:work --queue=growth');
        }

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
