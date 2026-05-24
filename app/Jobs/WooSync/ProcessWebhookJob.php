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
 * ProcessWebhookJob — Dispatched immediately when a WooCommerce product webhook arrives.
 *
 * The webhook receiver validates the signature synchronously, then hands off
 * processing to this job so the HTTP response returns < 3s (WooCommerce timeout).
 */
class ProcessWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30; // seconds between retries

    public function __construct(
        protected int    $connectionId,
        protected string $topic,
        protected array  $payload
    ) {}

    public function handle(): void
    {
        $connection = WooConnection::find($this->connectionId);

        if (!$connection || $connection->status !== 'active') {
            Log::info('[ProcessWebhookJob] Skipping — connection not active', [
                'connection_id' => $this->connectionId,
            ]);
            return;
        }

        Log::info('[ProcessWebhookJob] Processing', [
            'connection_id' => $this->connectionId,
            'topic'         => $this->topic,
            'woo_id'        => $this->payload['id'] ?? 'unknown',
        ]);

        $engine = new SyncEngine($connection);
        $engine->processWebhook($this->topic, $this->payload);
    }

    public function failed(\Throwable $e): void
    {
        Log::error('[ProcessWebhookJob] Failed after all retries', [
            'connection_id' => $this->connectionId,
            'topic'         => $this->topic,
            'error'         => $e->getMessage(),
        ]);
    }
}
