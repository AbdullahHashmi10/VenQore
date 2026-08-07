<?php

namespace App\Jobs;

use App\Services\Growth\GrowthEngine;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * RunGrowthEngineForTenant — one tenant, one job.
 *
 * V1 processed every tenant inside a single synchronous foreach. A slow or
 * broken tenant stalled everybody behind it, and the UI "Refresh" button ran
 * that whole loop inside an HTTP request.
 *
 * `ShouldBeUnique` is the important detail here: a tenant can never have two
 * overlapping engine runs, no matter how many times someone taps Refresh or
 * how the scheduler and a manual trigger happen to collide. Combined with the
 * idempotent signal upsert, that makes the engine safe to invoke as often as
 * we like.
 */
class RunGrowthEngineForTenant implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Analysis is heavy but not urgent — keep it off the default queue. */
    public $queue = 'growth';

    public $tries = 2;

    /** A very large tenant should still finish comfortably. */
    public $timeout = 600;

    /** Uniqueness lock expiry — must exceed $timeout so it always releases. */
    public $uniqueFor = 900;

    public function __construct(
        public readonly int|string $tenantId,
        public readonly string $mode = 'deep',
        public readonly bool $force = false,
    ) {
    }

    public function uniqueId(): string
    {
        return 'growth-engine-' . $this->tenantId;
    }

    public function handle(GrowthEngine $engine): void
    {
        $run = $engine->runForTenant($this->tenantId, $this->mode, $this->force);

        if ($run->status === 'failed') {
            Log::error("[GrowthEngine] Tenant {$this->tenantId} run failed: {$run->error}");
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error("[GrowthEngine] Job permanently failed for tenant {$this->tenantId}: " . $e->getMessage());
    }
}
