<?php

namespace App\Jobs;

use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
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

        $apiKey = config('smartcapture.gemini_key') ?? config('services.gemini.key') ?? env('GEMINI_API_KEY');

        if (empty($apiKey)) {
            Log::error("GenerateProductDescriptionsJob: Aborted for tenant {$this->tenantId}. GEMINI_API_KEY is not configured.");
            return;
        }

        $successfulGenerations = 0;

        foreach ($products as $product) {
            try {
                $prompt = "You are a professional retail catalog copywriter. Generate marketing copy for a product targeted for {$this->target} marketplace.\n"
                    . "Product Name: {$product->name}\n"
                    . "Existing Description: {$product->description}\n"
                    . "Return ONLY valid JSON with keys: ai_title, ai_description_short, ai_description_long, ai_tags (comma separated).";

                $res = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={$apiKey}", [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                        'generationConfig' => [
                            'temperature'      => 0.4,
                            'responseMimeType' => 'application/json',
                        ],
                    ]);

                if ($res->successful()) {
                    $rawJson = $res->json('candidates.0.content.parts.0.text');
                    $parsed  = json_decode($rawJson, true);
                    if (is_array($parsed) && !empty($parsed['ai_title'])) {
                        $product->update([
                            'ai_title'             => $parsed['ai_title'],
                            'ai_description_short' => $parsed['ai_description_short'] ?? null,
                            'ai_description_long'  => $parsed['ai_description_long'] ?? null,
                            'ai_tags'              => $parsed['ai_tags'] ?? null,
                        ]);
                        $successfulGenerations++;
                    } else {
                        Log::error("GenerateProductDescriptionsJob: Invalid JSON structure returned for product {$product->id}");
                    }
                } else {
                    Log::error("GenerateProductDescriptionsJob: Gemini API HTTP error {$res->status()} for product {$product->id}");
                }
            } catch (\Throwable $e) {
                Log::error("GenerateProductDescriptionsJob: API exception for product {$product->id}: " . $e->getMessage());
            }
        }

        // Debit credit balance ONLY for successful AI generations
        if ($successfulGenerations > 0) {
            $tenant->decrement('ai_descriptions_balance', min($successfulGenerations, max(0, $tenant->ai_descriptions_balance)));
            Log::info("GenerateProductDescriptionsJob: Successfully generated copy for {$successfulGenerations} products and debited balance for tenant {$this->tenantId}");
        }
    }
}
