<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Reckoner\Rollup\ReckonerRollupEngine;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * ReckonerRollupCommand: Scheduled rollup of dirty days into reckoner_daily (§5.1, §6.3).
 */
class ReckonerRollupCommand extends Command
{
    protected $signature = 'reckoner:rollup 
                            {--tenant= : Tenant slug or ID}
                            {--limit=60 : Maximum dirty days to process per tenant}';

    protected $description = 'Rollup pending dirty days into reckoner_daily pre-aggregated history';

    public function handle(ReckonerRollupEngine $engine): int
    {
        $tenantOpt = $this->option('tenant');
        $limit     = (int) $this->option('limit');

        $lock = Cache::lock('reckoner_rollup_lock', 120);

        if (!$lock->get()) {
            $this->warn('Another reckoner:rollup process is currently running.');
            return 0;
        }

        try {
            $tenantQuery = DB::table('tenants');
            if ($tenantOpt) {
                $tenantQuery->where(function ($q) use ($tenantOpt) {
                    $q->where('id', $tenantOpt)->orWhere('slug', $tenantOpt);
                });
            } else {
                // Only tenants that actually have pending dirty days
                $tenantIds = DB::table('reckoner_dirty_days')
                    ->distinct()
                    ->pluck('tenant_id')
                    ->all();

                if (empty($tenantIds)) {
                    $this->info('No pending dirty days found across all tenants.');
                    return 0;
                }

                $tenantQuery->whereIn('id', $tenantIds);
            }

            $tenants = $tenantQuery->get();
            $totalWritten = 0;

            foreach ($tenants as $t) {
                $written = $engine->rollupPending($t->id, $limit);
                $this->info("Tenant {$t->id} ({$t->slug}): rolled up {$written} rows.");
                $totalWritten += $written;
            }

            $this->info("Rollup complete. Total rows updated: {$totalWritten}");
            return 0;
        } finally {
            $lock->release();
        }
    }
}
