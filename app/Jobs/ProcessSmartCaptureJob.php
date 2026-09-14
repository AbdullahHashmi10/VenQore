<?php

namespace App\Jobs;

use App\Services\SmartCapture\AiExtractionService;

use App\Services\SmartCapture\AiEntitlementService;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProcessSmartCaptureJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 120;

    public function __construct(
        public string $jobId,
        public int $tenantId,
        public array $payload,
        public string $mode,
        public int $pagesToDebit
    ) {}

    public function handle(AiExtractionService $ai, AiEntitlementService $entitlement): void
    {
        $cacheKey = "smart_capture_job:{$this->jobId}";
        Cache::put($cacheKey, ['status' => 'processing', 'progress' => 'Reading document...'], 3600);

        try {
            // Set tenant context for async job execution
            $tenant = \App\Models\Tenant::find($this->tenantId);
            if ($tenant) {
                app()->instance('current.tenant', $tenant);
            }

            // Execute extraction
            $result = $ai->extractFromPayload($this->payload);

            // Meter usage
            if ($this->pagesToDebit > 0) {
                $entitlement->debitPage($this->mode, $this->pagesToDebit);
            }

            Cache::put($cacheKey, [
                'status' => 'done',
                'result' => $result,
            ], 3600);
        } catch (\Throwable $e) {
            Log::error("[ProcessSmartCaptureJob] Failed job {$this->jobId}: " . $e->getMessage());

            // Automatic refund on failure
            if ($this->pagesToDebit > 0) {
                $entitlement->refundPage($this->mode, $this->pagesToDebit);
            }

            Cache::put($cacheKey, [
                'status' => 'failed',
                'error'  => $e->getMessage(),
            ], 3600);
        }
    }
}
