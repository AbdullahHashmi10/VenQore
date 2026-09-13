<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

/**
 * Trivial job whose only purpose is proving a queue worker is alive and
 * actually processing jobs — dispatched every minute by the scheduler
 * (see routes/console.php) and by a synchronous check whenever the demo
 * deploy/reset endpoints need to decide whether it's safe to rely on the
 * queue, or whether they should fall back to running inline.
 *
 * If this job's cache write is more than ~2 minutes stale, no worker is
 * currently consuming the queue — see DemoStoreController::queueWorkerLooksAlive().
 */
class QueueHeartbeatJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 30;
    public int $tries = 1;

    public function handle(): void
    {
        Cache::put('queue_worker_last_heartbeat_ok', true, now()->addMinutes(3));
        Cache::put('queue_worker_last_heartbeat_at', now()->toISOString(), now()->addMinutes(3));
    }
}
