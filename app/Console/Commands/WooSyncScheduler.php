<?php

namespace App\Console\Commands;

use App\Jobs\WooSync\SchedulerPollingJob;
use App\Models\WooConnection;
use Illuminate\Console\Command;

/**
 * WooSyncScheduler — Dispatches polling jobs for all active WooCommerce connections.
 *
 * Runs every 15 minutes via Laravel scheduler.
 * Each connection gets its own SchedulerPollingJob so they run independently.
 */
class WooSyncScheduler extends Command
{
    protected $signature   = 'woo:sync-all {--connection= : Only sync a specific connection ID}';
    protected $description = 'Dispatch scheduler polling jobs for all active WooCommerce connections.';

    public function handle(): int
    {
        $query = WooConnection::where('status', 'active');

        if ($connectionId = $this->option('connection')) {
            $query->where('id', $connectionId);
        }

        $connections = $query->get();

        if ($connections->isEmpty()) {
            $this->info('No active WooCommerce connections found.');
            return 0;
        }

        $this->info("Dispatching polling jobs for {$connections->count()} connection(s)...");

        foreach ($connections as $connection) {
            SchedulerPollingJob::dispatch($connection->id);
            $this->line("  → Dispatched for: {$connection->name} (ID: {$connection->id})");
        }

        $this->info('Done.');
        return 0;
    }
}
