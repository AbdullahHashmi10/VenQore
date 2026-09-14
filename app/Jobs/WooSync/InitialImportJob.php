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
 * InitialImportJob — Runs the one-time full product import for a new connection.
 * Dispatched after a WooCommerce connection is successfully set up.
 */
class InitialImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;
    public int $timeout = 600; // 10 minutes for large catalogs

    public function __construct(
        protected int $connectionId
    ) {}

    public function handle(): void
    {
        $connection = WooConnection::find($this->connectionId);

        if (!$connection) {
            return;
        }

        Log::info('[InitialImportJob] Starting', ['connection_id' => $this->connectionId]);

        $engine = new SyncEngine($connection);
        $stats  = $engine->runInitialImport();

        Log::info('[InitialImportJob] Complete', array_merge(
            $stats,
            ['connection_id' => $this->connectionId]
        ));
    }

    public function failed(\Throwable $e): void
    {
        Log::error('[InitialImportJob] Failed', [
            'connection_id' => $this->connectionId,
            'error'         => $e->getMessage(),
        ]);

        WooConnection::where('id', $this->connectionId)->update(['status' => 'error']);
    }
}
