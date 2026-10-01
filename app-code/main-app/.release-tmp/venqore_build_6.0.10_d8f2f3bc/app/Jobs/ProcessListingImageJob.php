<?php

namespace App\Jobs;

use App\Services\ListingImageService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessListingImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $tenantId,
        public string $imagePath
    ) {}

    public function handle(ListingImageService $service): void
    {
        $processedPath = $service->processForAmazon($this->imagePath);
        Log::info("ProcessListingImageJob: Processed image for tenant {$this->tenantId} -> {$processedPath}");
    }
}
