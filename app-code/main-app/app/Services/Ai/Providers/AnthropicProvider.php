<?php

namespace App\Services\Ai\Providers;

use App\Services\Ai\AiRequest;
use App\Services\Ai\AiResult;
use App\Services\Ai\AiUsageRecorder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AnthropicProvider implements ProviderContract
{
    public function call(AiRequest $request, array $keyConfig): AiResult
    {
        $startTime = microtime(true);
        $apiKey = $keyConfig['api_key'] ?? '';
        $model = $keyConfig['model'] ?? 'claude-3-5-haiku-20241022';
        $profile = config("ai_models.{$request->feature}") ?? config('ai_models.default', []);
        $timeout = (int) ($profile['timeout'] ?? config('ai_limits.timeout.default', 20));

        if (empty($apiKey)) {
            return AiResult::failure('no_key', 'Anthropic API key is missing.');
        }

        $content = [];
        if ($request->prompt) {
            $content[] = ['type' => 'text', 'text' => $request->prompt];
        }

        if (is_string($request->input)) {
            $content[] = ['type' => 'text', 'text' => $request->input];
        } elseif (is_array($request->input)) {
            if (isset($request->input['text'])) {
                $content[] = ['type' => 'text', 'text' => (string) $request->input['text']];
            } elseif (isset($request->input[0]['base64'])) {
                foreach ($request->input as $file) {
                    $type = ($file['mime'] === 'application/pdf') ? 'document' : 'image';
                    $content[] = [
                        'type'   => $type,
                        'source' => ['type' => 'base64', 'media_type' => $file['mime'], 'data' => $file['base64']],
                    ];
                }
            } elseif (isset($request->input['base64'])) {
                $mime = $request->input['mime'] ?? 'image/jpeg';
                $type = ($mime === 'application/pdf') ? 'document' : 'image';
                $content[] = [
                    'type'   => $type,
                    'source' => ['type' => 'base64', 'media_type' => $mime, 'data' => $request->input['base64']],
                ];
            }
        }

        if (!empty($request->context)) {
            $content[] = ['type' => 'text', 'text' => "\n[CONTEXT]\n" . json_encode($request->context)];
        }

        $maxTokens = $request->maxOutputTokens ?: (int) ($profile['max_output'] ?? 1024);

        $payload = [
            'model'      => $model,
            'max_tokens' => $maxTokens,
            'messages'   => [['role' => 'user', 'content' => $content]],
        ];

        if ($request->systemPrompt) {
            $payload['system'] = $request->systemPrompt;
        }

        if ($request->temperature !== null) {
            $payload['temperature'] = $request->temperature;
        }

        try {
            $response = Http::timeout($timeout)
                ->withHeaders([
                    'x-api-key'         => $apiKey,
                    'anthropic-version' => '2023-06-01',
                ])
                ->post('https://api.anthropic.com/v1/messages', $payload);

            if ($response->failed()) {
                $body = $response->json();
                $msg = $body['error']['message'] ?? $response->body();
                return AiResult::failure('provider_error', "Anthropic error ({$response->status()}): {$msg}");
            }

            $json = $response->json();
            $promptTokens = (int) ($json['usage']['input_tokens'] ?? 0);
            $outputTokens = (int) ($json['usage']['output_tokens'] ?? 0);
            $costUsd = app(AiUsageRecorder::class)->calculateCost($model, $promptTokens, $outputTokens);
            $latencyMs = (int) round((microtime(true) - $startTime) * 1000);

            $text = $json['content'][0]['text'] ?? '';
            $parsedValue = $text;
            $confidence = 1.0;

            if ($request->schema) {
                $validation = $request->schema->validate($text);
                $parsedValue = $validation['data'];
                if (!$validation['valid']) {
                    $confidence = 0.7;
                }
            }

            return AiResult::success(
                value: $parsedValue,
                source: 'model',
                model: $model,
                provider: 'anthropic',
                confidence: $confidence,
                costUsd: $costUsd,
                latencyMs: $latencyMs,
                raw: $json,
                promptTokens: $promptTokens,
                outputTokens: $outputTokens
            );
        } catch (\Throwable $e) {
            Log::error("AnthropicProvider exception: " . $e->getMessage());
            return AiResult::failure('connection_error', $e->getMessage());
        }
    }

    public function testConnection(string $apiKey, string $model): array
    {
        $timeout = (int) config('ai_limits.timeout.query', 20);
        try {
            Http::timeout($timeout)
                ->withHeaders([
                    'x-api-key'         => $apiKey,
                    'anthropic-version' => '2023-06-01',
                ])
                ->post('https://api.anthropic.com/v1/messages', [
                    'model'      => $model,
                    'max_tokens' => 5,
                    'messages'   => [['role' => 'user', 'content' => "Say 'Hello'"]],
                ])->throw();

            return ['success' => true, 'message' => 'Connection verified successfully!'];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}
