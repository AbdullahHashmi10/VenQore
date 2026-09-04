<?php

namespace App\Services\Ai\Providers;

use App\Services\Ai\AiRequest;
use App\Services\Ai\AiResult;
use App\Services\Ai\AiUsageRecorder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiProvider implements ProviderContract
{
    public function call(AiRequest $request, array $keyConfig): AiResult
    {
        $startTime = microtime(true);
        $apiKey = $keyConfig['api_key'] ?? '';
        $model = $keyConfig['model'] ?? 'gemini-2.5-flash-lite';
        $profile = config("ai_models.{$request->feature}") ?? config('ai_models.default', []);
        $timeout = (int) ($profile['timeout'] ?? config('ai_limits.timeout.default', 20));

        if (empty($apiKey)) {
            return AiResult::failure('no_key', 'Gemini API key is missing.');
        }

        // Prepare contents parts
        $parts = [];
        if ($request->prompt) {
            $parts[] = ['text' => $request->prompt];
        }

        if (is_string($request->input)) {
            $parts[] = ['text' => $request->input];
        } elseif (is_array($request->input)) {
            if (isset($request->input['text'])) {
                $parts[] = ['text' => (string) $request->input['text']];
            }
            if (isset($request->input['image'])) {
                $mime = $request->input['mime'] ?? 'image/jpeg';
                $parts[] = ['inline_data' => ['mime_type' => $mime, 'data' => $request->input['image']]];
            } elseif (isset($request->input[0]['base64'])) {
                // Array of files (e.g. SmartCapture images)
                foreach ($request->input as $file) {
                    $parts[] = ['inline_data' => ['mime_type' => $file['mime'], 'data' => $file['base64']]];
                }
            } elseif (isset($request->input['base64'])) {
                $mime = $request->input['mime'] ?? $request->input['mime_type'] ?? 'image/jpeg';
                $parts[] = ['inline_data' => ['mime_type' => $mime, 'data' => $request->input['base64']]];
            }
        }

        if (!empty($request->context)) {
            $parts[] = ['text' => "\n[CONTEXT]\n" . json_encode($request->context)];
        }

        if (empty($parts)) {
            $parts[] = ['text' => 'Hello'];
        }

        $generationConfig = [
            'temperature' => $request->temperature ?? 0.2,
        ];

        if ($request->maxOutputTokens) {
            $generationConfig['maxOutputTokens'] = $request->maxOutputTokens;
        } elseif (!empty($profile['max_output'])) {
            $generationConfig['maxOutputTokens'] = (int) $profile['max_output'];
        }

        if ($request->schema) {
            $generationConfig['responseMimeType'] = 'application/json';
        }

        $thinking = $profile['thinking'] ?? 0;
        if ($thinking > 0) {
            $generationConfig['thinkingConfig'] = ['thinkingBudget' => $thinking];
        }

        $payload = [
            'contents'         => [['parts' => $parts]],
            'generationConfig' => $generationConfig,
            'safetySettings'   => $this->geminiSafetySettings(),
        ];

        if ($request->systemPrompt) {
            $payload['systemInstruction'] = ['parts' => [['text' => $request->systemPrompt]]];
        }

        if (!empty($request->tools)) {
            $payload['tools'] = [['function_declarations' => $request->tools]];
        }

        $modelsToTry = [$model];
        // Deprecation fallback check
        $deprecations = config('ai_models.deprecation_audit', []);
        if (isset($deprecations[$model]['fallback_successor'])) {
            $modelsToTry[] = $deprecations[$model]['fallback_successor'];
        }
        if (!in_array('gemini-2.5-flash-lite', $modelsToTry, true)) {
            $modelsToTry[] = 'gemini-2.5-flash-lite';
        }

        $lastError = null;
        $activeModel = $model;

        foreach ($modelsToTry as $candidateModel) {
            $activeModel = $candidateModel;
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$activeModel}:generateContent?key={$apiKey}";

            try {
                $response = Http::timeout($timeout)->post($url, $payload);
                if ($response->status() === 404 && count($modelsToTry) > 1) {
                    Log::warning("GeminiProvider: Model {$activeModel} returned 404, attempting deprecation successor.");
                    continue;
                }

                if ($response->failed()) {
                    $body = $response->json();
                    $msg = $body['error']['message'] ?? $response->body();
                    return AiResult::failure('provider_error', "Gemini API error ({$response->status()}): {$msg}", 'model');
                }

                $json = $response->json();
                $firstCandidate = $json['candidates'][0] ?? null;
                if (!$firstCandidate) {
                    return AiResult::failure('empty_response', 'Gemini returned no candidates.');
                }

                $promptTokens = (int) ($json['usageMetadata']['promptTokenCount'] ?? 0);
                $outputTokens = (int) ($json['usageMetadata']['candidatesTokenCount'] ?? 0);
                $costUsd = app(AiUsageRecorder::class)->calculateCost($activeModel, $promptTokens, $outputTokens);
                $latencyMs = (int) round((microtime(true) - $startTime) * 1000);

                $part = $firstCandidate['content']['parts'][0] ?? [];

                // Tool calling check
                if (isset($part['functionCall']) && is_callable($request->toolExecutor)) {
                    $fnCall = $part['functionCall'];
                    $fnName = $fnCall['name'];
                    $fnArgs = $fnCall['args'] ?? [];

                    $toolResult = ($request->toolExecutor)($fnName, $fnArgs);

                    // Follow-up round
                    $history = [
                        ['role' => 'user', 'parts' => $parts],
                        ['role' => 'model', 'parts' => [['functionCall' => $fnCall]]],
                        ['role' => 'function', 'parts' => [['functionResponse' => ['name' => $fnName, 'response' => ['content' => $toolResult]]]]],
                    ];

                    $followUpPayload = [
                        'contents'         => $history,
                        'generationConfig' => $generationConfig,
                    ];
                    if (!empty($request->tools)) {
                        $followUpPayload['tools'] = [['function_declarations' => $request->tools]];
                    }

                    $followUpRes = Http::timeout($timeout)->post($url, $followUpPayload);
                    if ($followUpRes->successful()) {
                        $followUpJson = $followUpRes->json();
                        $finalText = $followUpJson['candidates'][0]['content']['parts'][0]['text'] ?? '';
                        $fPrompt = (int) ($followUpJson['usageMetadata']['promptTokenCount'] ?? 0);
                        $fOutput = (int) ($followUpJson['usageMetadata']['candidatesTokenCount'] ?? 0);
                        $promptTokens += $fPrompt;
                        $outputTokens += $fOutput;
                        $costUsd += app(AiUsageRecorder::class)->calculateCost($activeModel, $fPrompt, $fOutput);

                        return AiResult::success(
                            value: $finalText,
                            source: 'model',
                            model: $activeModel,
                            provider: 'gemini',
                            confidence: 1.0,
                            costUsd: $costUsd,
                            latencyMs: (int) round((microtime(true) - $startTime) * 1000),
                            raw: $followUpJson,
                            promptTokens: $promptTokens,
                            outputTokens: $outputTokens,
                            toolCalls: [$fnCall]
                        );
                    }
                }

                $text = collect($firstCandidate['content']['parts'] ?? [])
                    ->pluck('text')
                    ->filter()
                    ->implode('');

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
                    model: $activeModel,
                    provider: 'gemini',
                    confidence: $confidence,
                    costUsd: $costUsd,
                    latencyMs: $latencyMs,
                    raw: $json,
                    promptTokens: $promptTokens,
                    outputTokens: $outputTokens
                );

            } catch (\Throwable $e) {
                $lastError = $e;
                Log::warning("GeminiProvider exception on {$activeModel}: " . $e->getMessage());
            }
        }

        return AiResult::failure('connection_error', $lastError ? $lastError->getMessage() : 'Gemini connection failed.');
    }

    public function testConnection(string $apiKey, string $model): array
    {
        $timeout = (int) config('ai_limits.timeout.query', 20);
        $modelsToTry = array_unique([
            $model,
            'gemini-2.5-flash',
            'gemini-2.5-flash-lite',
            'gemini-1.5-flash',
        ]);

        $firstError = null;

        foreach ($modelsToTry as $m) {
            try {
                $response = Http::timeout($timeout)->post("https://generativelanguage.googleapis.com/v1beta/models/{$m}:generateContent?key={$apiKey}", [
                    'contents' => [['parts' => [['text' => "Say 'Hello'"]]]]
                ])->throw();

                $suggestedModel = ($m !== $model) ? $m : null;
                $message = $suggestedModel
                    ? "Connection Verified! We automatically switched to '{$suggestedModel}'."
                    : "Connection verified successfully!";

                return [
                    'success'         => true,
                    'message'         => $message,
                    'suggested_model' => $suggestedModel,
                ];
            } catch (\Throwable $e) {
                if (!$firstError) {
                    $firstError = $e;
                }
                if (str_contains($e->getMessage(), '401') || str_contains($e->getMessage(), '403')) {
                    return ['success' => false, 'message' => 'Access denied. Your API Key is invalid.'];
                }
            }
        }

        return ['success' => false, 'message' => $firstError ? $firstError->getMessage() : 'Connection test failed.'];
    }

    private function geminiSafetySettings(): array
    {
        return array_map(
            fn ($category) => ['category' => $category, 'threshold' => 'BLOCK_ONLY_HIGH'],
            [
                'HARM_CATEGORY_HARASSMENT',
                'HARM_CATEGORY_HATE_SPEECH',
                'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                'HARM_CATEGORY_DANGEROUS_CONTENT',
            ]
        );
    }
}
