<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AiUsageRecorder
{
    /**
     * Record an AI execution event into ai_usage_events with accurate pricing.
     */
    public function record(array $params): void
    {
        try {
            $model = $params['model'] ?? 'gemini-2.5-flash-lite';
            $promptTokens = (int) ($params['prompt_tokens'] ?? 0);
            $outputTokens = (int) ($params['output_tokens'] ?? 0);
            $thinkingTokens = (int) ($params['thinking_tokens'] ?? 0);
            $cachedTokens = (int) ($params['cached_tokens'] ?? 0);

            // Calculate cost using config/ai_pricing.php lookup
            $costUsd = $this->calculateCost($model, $promptTokens, $outputTokens, $cachedTokens);

            DB::table('ai_usage_events')->insert([
                'tenant_id'       => $params['tenant_id'] ?? null,
                'user_id'         => $params['user_id'] ?? null,
                'feature'         => $params['feature'] ?? 'scan',
                'provider'        => $params['provider'] ?? 'gemini',
                'model'           => $model,
                'key_mode'        => $params['key_mode'] ?? 'platform_paid',
                'input_type'      => $params['input_type'] ?? 'image',
                'pages'           => (int) ($params['pages'] ?? 1),
                'prompt_tokens'   => $promptTokens,
                'output_tokens'   => $outputTokens,
                'thinking_tokens' => $thinkingTokens,
                'cached_tokens'   => $cachedTokens,
                'cost_usd'        => $costUsd,
                'latency_ms'      => (int) ($params['latency_ms'] ?? 0),
                'success'         => $params['success'] ?? true,
                'error_code'      => $params['error_code'] ?? null,
                'created_at'      => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error('AiUsageRecorder failed to log event: ' . $e->getMessage(), [
                'params' => $params,
            ]);
        }
    }

    /**
     * Calculate cost in USD based on model pricing rate card.
     */
    public function calculateCost(string $model, int $promptTokens, int $outputTokens, int $cachedTokens = 0): float
    {
        $rates = config("ai_pricing.models.{$model}") ?? config('ai_pricing.default');

        $inputRate = $rates['input_per_m'] / 1000000;
        $outputRate = $rates['output_per_m'] / 1000000;

        $billablePromptTokens = max(0, $promptTokens - $cachedTokens);
        // Discount cached tokens by 75% if present
        $cachedCost = ($cachedTokens * $inputRate * 0.25);

        return round(($billablePromptTokens * $inputRate) + ($outputTokens * $outputRate) + $cachedCost, 8);
    }
}
