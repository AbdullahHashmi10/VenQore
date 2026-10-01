<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\Growth\MetricSnapshotter;
use Illuminate\Console\Command;

/**
 * growth:snapshot — capture the daily KPI row for every tenant.
 *
 * Runs just after midnight so it records a complete day. The resulting
 * time-series is what lets the brains compare a tenant against their own
 * history rather than against a hardcoded constant — the single change that
 * turns generic alerts into insights the owner recognises as true.
 */
class SnapshotGrowthMetrics extends Command
{
    protected $signature = 'growth:snapshot
        {--tenant= : Snapshot a single tenant}
        {--date= : Specific date (Y-m-d), defaults to yesterday}
        {--backfill= : Backfill this many days of history}';

    protected $description = 'Record the daily business KPI snapshot the Growth Engine uses as its baseline';

    public function handle(MetricSnapshotter $snapshotter): int
    {
        $query = Tenant::query()->whereIn('status', ['active', 'trial']);

        if ($this->option('tenant')) {
            $query->where('id', $this->option('tenant'));
        }

        $tenants = $query->get(['id', 'name']);
        $date    = $this->option('date') ? \Carbon\Carbon::parse($this->option('date')) : null;
        $backfill= (int) $this->option('backfill');

        $done = 0;

        foreach ($tenants as $tenant) {
            try {
                if ($backfill > 0) {
                    $n = $snapshotter->backfill($tenant->id, $backfill);
                    $this->line("  [{$tenant->id}] {$tenant->name} — backfilled {$n} day(s)");
                    $done += $n;
                } else {
                    $snap = $snapshotter->snapshot($tenant->id, $date);
                    $this->line(sprintf(
                        '  [%d] %-26s %s  revenue %s  margin %s%%  orders %d',
                        $tenant->id,
                        \Illuminate\Support\Str::limit($tenant->name, 24),
                        $snap->snapshot_date->toDateString(),
                        number_format((float) $snap->revenue),
                        round((float) $snap->margin_pct, 1),
                        $snap->order_count
                    ));
                    $done++;
                }
            } catch (\Throwable $e) {
                $this->error("  [{$tenant->id}] failed: " . $e->getMessage());
            }
        }

        $this->info("Snapshotted {$done} record(s).");

        return self::SUCCESS;
    }
}
