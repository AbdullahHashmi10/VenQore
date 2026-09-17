<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Reckoner\Rollup\ReckonerRollupEngine;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * ReckonerBackfillCommand: Historical backfill of reckoner_daily (§5.1, §6.3).
 *
 * Rules:
 * 1. Resumable, chunked month by month.
 * 2. Dry run supported via --dry-run.
 * 3. Logs rows written per chunk.
 */
class ReckonerBackfillCommand extends Command
{
    protected $signature = 'reckoner:backfill 
                            {--tenant= : Tenant slug or ID (required)}
                            {--from= : Start date (YYYY-MM-DD)}
                            {--to= : End date (YYYY-MM-DD)}
                            {--measure= : Specific measure to backfill (optional)}
                            {--dry-run : Simulate without writing to database}';

    protected $description = 'Backfill historical measure aggregations into reckoner_daily';

    public function handle(ReckonerRollupEngine $engine): int
    {
        $tenantOpt = $this->option('tenant');
        $fromOpt   = $this->option('from');
        $toOpt     = $this->option('to');
        $measureOpt= $this->option('measure');
        $dryRun    = (bool) $this->option('dry-run');

        if (!$tenantOpt) {
            $this->error('The --tenant option is required.');
            return 1;
        }

        $tenant = Tenant::where('id', $tenantOpt)->orWhere('slug', $tenantOpt)->first();
        if (!$tenant) {
            $this->error("Tenant '{$tenantOpt}' not found.");
            return 1;
        }

        $from = $fromOpt ?: Carbon::now()->subYear()->startOfMonth()->toDateString();
        $to   = $toOpt   ?: Carbon::now()->subDay()->toDateString();

        $this->info("Starting backfill for tenant {$tenant->id} ({$tenant->slug}) from {$from} to {$to}" . ($dryRun ? ' [DRY RUN]' : ''));

        $targetMeasures = $measureOpt ? [$measureOpt] : [];

        // Chunk by month for clean progress reporting
        $start = Carbon::parse($from);
        $end   = Carbon::parse($to);

        $totalDays = 0;
        $totalRows = 0;

        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $chunkStart = $cursor->copy();
            $chunkEnd   = $cursor->copy()->endOfMonth();
            if ($chunkEnd->gt($end)) {
                $chunkEnd = $end->copy();
            }

            $res = $engine->backfill(
                $tenant,
                $chunkStart->toDateString(),
                $chunkEnd->toDateString(),
                $targetMeasures,
                $dryRun
            );

            $totalDays += $res['days_count'];
            $totalRows += $res['rows_written'];

            $this->line("  Chunk {$chunkStart->toDateString()} to {$chunkEnd->toDateString()}: {$res['days_count']} days, {$res['rows_written']} rows written.");

            $cursor = $chunkEnd->copy()->addDay();
        }

        $this->info("Backfill complete. Total days: {$totalDays}, Total rows written: {$totalRows}");
        return 0;
    }
}
