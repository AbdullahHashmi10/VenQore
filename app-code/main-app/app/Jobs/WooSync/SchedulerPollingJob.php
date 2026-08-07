<?php

namespace App\Jobs\WooSync;

use App\Models\WooConnection;
use App\Services\WooSync\SyncEngine;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * SchedulerPollingJob — Safety net polling for a single connection.
 *
 * Runs every 15 minutes via the Laravel scheduler.
 * Compares full WooCommerce product list against linked VenQore products.
 * Catches anything that webhooks missed (plugin updates, manual edits, etc.)
 * Feeds diff into the same queue/diff system.
 */
class SchedulerPollingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 2;
    public int $timeout = 300; // 5 minutes max per connection

    public function __construct(
        protected int $connectionId
    ) {}

    public function handle(): void
    {
        $connection = WooConnection::find($this->connectionId);

        if (!$connection || $connection->status !== 'active') {
            return;
        }

        Log::info('[SchedulerPollingJob] Running poll', ['connection_id' => $this->connectionId]);

        $engine = new SyncEngine($connection);
        $stats  = $engine->runSchedulerPoll();

        Log::info('[SchedulerPollingJob] Poll complete', array_merge(
            $stats,
            ['connection_id' => $this->connectionId]
        ));

        // If new approved entries exist, dispatch the queue processor
        if ($stats['queued'] > 0) {
            ProcessSyncQueueJob::dispatch($this->connectionId)->delay(now()->addSeconds(5));
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error('[SchedulerPollingJob] Failed', [
            'connection_id' => $this->connectionId,
            'error'         => $e->getMessage(),
        ]);

        // Mark connection as error state
        WooConnection::where('id', $this->connectionId)
            ->update(['status' => 'error']);
    }
}
