<?php

namespace App\Services\Ai\Providers;

use App\Services\Ai\AiRequest;
use App\Services\Ai\AiResult;
use App\Services\Ai\AiUsageRecorder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeepSeekProvider implements ProviderContract
{
    public function call(AiRequest $request, array $keyConfig): AiResult
    {
        $startTime = microtime(true);
        $apiKey = $keyConfig['api_key'] ?? '';
        $model = $keyConfig['model'] ?? 'deepseek-chat';
        $profile = config("ai_models.{$request->feature}") ?? config('ai_models.default', []);
        $timeout = (int) ($profile['timeout'] ?? config('ai_limits.timeout.default', 20));

        if (empty($apiKey)) {
            return AiResult::failure('no_key', 'DeepSeek API key is missing.');
        }

        $promptText = $request->prompt ?: '';
        if (is_string($request->input)) {
            $promptText .= "\n" . $request->input;
        } elseif (is_array($request->input) && isset($request->input['text'])) {
            $promptText .= "\n" . $request->input['text'];
        }

        if (!empty($request->context)) {
            $promptText .= "\n[CONTEXT]\n" . json_encode($request->context);
        }

        $messages = [];
        if ($request->systemPrompt) {
            $messages[] = ['role' => 'system', 'content' => $request->systemPrompt];
        }
        $messages[] = ['role' => 'user', 'content' => $promptText];

        $payload = [
            'model'    => $model,
            'messages' => $messages,
        ];

        if ($request->temperature !== null) {
            $payload['temperature'] = $request->temperature;
        }

        if ($request->maxOutputTokens) {
            $payload['max_tokens'] = $request->maxOutputTokens;
        }

        if ($request->schema) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        try {
            $response = Http::timeout($timeout)->withToken($apiKey)->post('https://api.deepseek.com/chat/completions', $payload);

            if ($response->failed()) {
                $msg = $response->json('error.message') ?? $response->body();
                return AiResult::failure('provider_error', "DeepSeek error ({$response->status()}): {$msg}");
            }

            $json = $response->json();
            $choice = $json['choices'][0] ?? null;
            if (!$choice) {
                return AiResult::failure('empty_response', 'DeepSeek returned no choices.');
            }

            $content = $choice['message']['content'] ?? '';
            $promptTokens = (int) ($json['usage']['prompt_tokens'] ?? 0);
            $outputTokens = (int) ($json['usage']['completion_tokens'] ?? 0);
            $costUsd = app(AiUsageRecorder::class)->calculateCost($model, $promptTokens, $outputTokens);
            $latencyMs = (int) round((microtime(true) - $startTime) * 1000);

            $parsedValue = $content;
            $confidence = 1.0;

            if ($request->schema) {
                $validation = $request->schema->validate($content);
                $parsedValue = $validation['data'];
                if (!$validation['valid']) {
                    $confidence = 0.7;
                }
            }

            return AiResult::success(
                value: $parsedValue,
                source: 'model',
                model: $model,
                provider: 'deepseek',
                confidence: $confidence,
                costUsd: $costUsd,
                latencyMs: $latencyMs,
                raw: $json,
                promptTokens: $promptTokens,
                outputTokens: $outputTokens
            );
        } catch (\Throwable $e) {
            Log::error("DeepSeekProvider exception: " . $e->getMessage());
            return AiResult::failure('connection_error', $e->getMessage());
        }
    }

    public function testConnection(string $apiKey, string $model): array
    {
        $timeout = (int) config('ai_limits.timeout.query', 20);
        try {
            Http::timeout($timeout)->withToken($apiKey)->post('https://api.deepseek.com/chat/completions', [
                'model'      => $model,
                'messages'   => [['role' => 'user', 'content' => "Say 'Hello'"]],
                'max_tokens' => 5,
            ])->throw();

            return ['success' => true, 'message' => 'Connection verified successfully!'];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}
