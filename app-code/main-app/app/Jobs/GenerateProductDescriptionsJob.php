<?php

namespace App\Jobs;

use App\Models\Product;
use App\Models\Tenant;
use App\Services\Ai\AiGateway;
use App\Services\Ai\AiRequest;
use App\Services\Ai\AiSchema;
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

        app()->instance('current.tenant', $tenant);

        $products = Product::where('tenant_id', $this->tenantId)
            ->whereIn('id', array_slice($this->productIds, 0, 20))
            ->get();

        if ($products->isEmpty()) {
            return;
        }

        // Fast-fail if tenant has neither entitlement nor BYOK
        $byokKey = \App\Models\Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->whereIn('key', ['smartcapture_api_key', 'chatbot_api_key', 'openai_api_key'])
            ->whereNotNull('value')
            ->where('value', '!=', '')
            ->value('value');

        $isEntitled = !empty($byokKey)
            || in_array($tenant->ai_status ?? 'none', ['managed', 'staff'], true)
            || (($tenant->ai_descriptions_balance ?? 0) > 0);

        if (!$isEntitled) {
            Log::warning("GenerateProductDescriptionsJob: Aborted for tenant {$this->tenantId}. No AI entitlement and no BYOK key.");
            return;
        }

        $successfulGenerations = 0;
        $gateway = app(AiGateway::class);

        foreach ($products as $product) {
            try {
                $prompt = "You are a professional retail catalog copywriter. Generate marketing copy for a product targeted for {$this->target} marketplace.\n"
                    . "Product Name: {$product->name}\n"
                    . "Existing Description: {$product->description}\n"
                    . "Return ONLY valid JSON with keys: ai_title, ai_description_short, ai_description_long, ai_tags (comma separated).";

                $result = $gateway->resolve(
                    AiRequest::for('catalog')
                        ->tenant($tenant)
                        ->prompt($prompt)
                        ->expects(AiSchema::catalogCopy())
                );

                if ($result->ok && is_array($result->value) && !empty($result->value['ai_title'])) {
                    $product->update([
                        'ai_title'             => $result->value['ai_title'],
                        'ai_description_short' => $result->value['ai_description_short'] ?? null,
                        'ai_description_long'  => $result->value['ai_description_long'] ?? null,
                        'ai_tags'              => $result->value['ai_tags'] ?? null,
                    ]);
                    $successfulGenerations++;
                } else {
                    Log::warning("GenerateProductDescriptionsJob: Failed for product {$product->id}: " . ($result->errorMessage ?? $result->failureCode));
                    if (in_array($result->failureCode, ['no_key', 'spend_capped', 'not_allowed', 'rate_limited'], true)) {
                        break;
                    }
                }
            } catch (\Throwable $e) {
                Log::error("GenerateProductDescriptionsJob: Exception for product {$product->id}: " . $e->getMessage());
            }
        }

        // Debit credit balance ONLY for successful AI generations
        if ($successfulGenerations > 0) {
            $tenant->decrement('ai_descriptions_balance', min($successfulGenerations, max(0, $tenant->ai_descriptions_balance)));
            Log::info("GenerateProductDescriptionsJob: Successfully generated copy for {$successfulGenerations} products and debited balance for tenant {$this->tenantId}");
        }
    }
}
