<?php

namespace App\Jobs\WooSync;

use App\Models\WooConnection;
use App\Models\WooSyncQueue;
use App\Services\WooSync\SyncEngine;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * ProcessSyncQueueJob — Processes approved queue entries for a given connection.
 *
 * Runs after a user approves staged items, or after automatic resolution
 * based on priority_source. Rate-aware: processes entries in small batches
 * to respect WooCommerce API limits.
 */
class ProcessSyncQueueJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    protected int $batchSize = 10; // Process max 10 entries per job run

    public function __construct(
        protected int $connectionId
    ) {}

    public function handle(): void
    {
        $connection = WooConnection::find($this->connectionId);

        if (!$connection || $connection->status !== 'active') {
            return;
        }

        $engine = new SyncEngine($connection);

        // Grab approved entries ready to process (respects process_after for backoff)
        $entries = WooSyncQueue::where('connection_id', $this->connectionId)
            ->readyToProcess()
            ->orderBy('created_at')
            ->limit($this->batchSize)
            ->get();

        if ($entries->isEmpty()) {
            return;
        }

        Log::info('[ProcessSyncQueueJob] Processing batch', [
            'connection_id' => $this->connectionId,
            'count'         => $entries->count(),
        ]);

        foreach ($entries as $entry) {
            // Mark as processing
            $entry->update(['status' => 'processing']);

            try {
                $success = false;

                if ($entry->direction === 'to_woo') {
                    // Push to WooCommerce
                    if ($entry->productLink) {
                        $success = $engine->pushToWoo($entry->productLink);
                    } else {
                        // New product — create on WooCommerce
                        // SyncEngine handles this through pullFromWoo or direct create
                        Log::warning('[ProcessSyncQueueJob] No product_link for to_woo entry', ['entry' => $entry->id]);
                        $success = false;
                    }
                } elseif ($entry->direction === 'from_woo') {
                    // Pull from WooCommerce
                    $success = $engine->pullFromWoo($entry);
                }

                $entry->update(['status' => $success ? 'done' : 'failed']);

                if (!$success) {
                    $entry->fail('Sync operation returned false — check API response logs.');
                }
            } catch (\Exception $e) {
                Log::error('[ProcessSyncQueueJob] Entry failed', [
                    'entry_id' => $entry->id,
                    'error'    => $e->getMessage(),
                ]);
                $entry->fail($e->getMessage());
            }
        }

        // If there are more entries, dispatch another job
        $remaining = WooSyncQueue::where('connection_id', $this->connectionId)
            ->readyToProcess()
            ->count();

        if ($remaining > 0) {
            static::dispatch($this->connectionId)->delay(now()->addSeconds(10));
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error('[ProcessSyncQueueJob] Job itself failed', [
            'connection_id' => $this->connectionId,
            'error'         => $e->getMessage(),
        ]);
    }
}
