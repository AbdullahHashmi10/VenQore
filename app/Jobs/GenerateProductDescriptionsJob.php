<?php

namespace App\Jobs;

use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateProductDescriptionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $tenantId,
        public array $productIds,
        public string $target = 'web'
    ) {
        $this->queue = 'low';
    }

    public function handle(): void
    {
        $tenant = Tenant::find($this->tenantId);
        if (!$tenant) {
            return;
        }

        $products = Product::where('tenant_id', $this->tenantId)
            ->whereIn('id', array_slice($this->productIds, 0, 20))
            ->get();

        if ($products->isEmpty()) {
            return;
        }

        foreach ($products as $product) {
            $aiTitle = ucfirst($this->target) . ' Optimized: ' . $product->name;
            $aiShort = "High quality " . strtolower($product->name) . " suitable for " . $this->target . " catalog.";
            $aiLong  = "Introducing the " . $product->name . ". Engineered for reliability and premium retail performance. Perfect for " . $this->target . " shoppers.";
            $aiTags  = implode(', ', array_filter([$product->name, $this->target, 'retail', 'quality']));

            $product->update([
                'ai_title'             => $aiTitle,
                'ai_description_short' => $aiShort,
                'ai_description_long'  => $aiLong,
                'ai_tags'              => $aiTags,
            ]);
        }

        // Decrement balance by count of processed products
        $processedCount = $products->count();
        $tenant->decrement('ai_descriptions_balance', min($processedCount, max(0, $tenant->ai_descriptions_balance)));

        Log::info("GenerateProductDescriptionsJob: Processed {$processedCount} products for tenant {$this->tenantId}");
    }
}
