<?php

namespace App\Services\Ai\Providers;

use App\Services\Ai\AiRequest;
use App\Services\Ai\AiResult;
use App\Services\Ai\AiUsageRecorder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAiProvider implements ProviderContract
{
    public function call(AiRequest $request, array $keyConfig): AiResult
    {
        $startTime = microtime(true);
        $apiKey = $keyConfig['api_key'] ?? '';
        $model = $keyConfig['model'] ?? 'gpt-4o-mini';
        $profile = config("ai_models.{$request->feature}") ?? config('ai_models.default', []);
        $timeout = (int) ($profile['timeout'] ?? config('ai_limits.timeout.default', 20));

        if (empty($apiKey)) {
            return AiResult::failure('no_key', 'OpenAI API key is missing.');
        }

        // Build messages array
        $messages = [];
        if ($request->systemPrompt) {
            $messages[] = ['role' => 'system', 'content' => $request->systemPrompt];
        }

        $userContent = [];
        $hasMultimodal = false;

        if (is_string($request->input)) {
            $userContent = $request->input;
        } elseif (is_array($request->input)) {
            if (isset($request->input['text'])) {
                $userContent = (string) $request->input['text'];
            } elseif (isset($request->input['audio']) || (isset($request->input['mime']) && str_starts_with($request->input['mime'], 'audio/'))) {
                // Audio: transcribe via Whisper first
                $transcription = $this->transcribe($apiKey, $request->input);
                $userContent = "Audio transcription: {$transcription}";
            } elseif (isset($request->input[0]['base64'])) {
                // Array of files (e.g. SmartCapture images)
                $hasMultimodal = true;
                $userContent = [['type' => 'text', 'text' => $request->prompt ?: 'Extract transaction:']];
                foreach ($request->input as $file) {
                    $userContent[] = [
                        'type'      => 'image_url',
                        'image_url' => ['url' => "data:{$file['mime']};base64,{$file['base64']}", 'detail' => 'high'],
                    ];
                }
            } elseif (isset($request->input['image']) || isset($request->input['base64'])) {
                $hasMultimodal = true;
                $mime = $request->input['mime'] ?? 'image/jpeg';
                $b64 = $request->input['image'] ?? $request->input['base64'];
                $userContent = [
                    ['type' => 'text', 'text' => $request->prompt ?: 'Process image: '],
                    ['type' => 'image_url', 'image_url' => ['url' => "data:{$mime};base64,{$b64}", 'detail' => 'high']],
                ];
            }
        }

        if (!empty($request->context)) {
            if (is_string($userContent)) {
                $userContent .= "\n[CONTEXT]\n" . json_encode($request->context);
            } elseif (is_array($userContent)) {
                $userContent[] = ['type' => 'text', 'text' => "\n[CONTEXT]\n" . json_encode($request->context)];
            }
        }

        $messages[] = ['role' => 'user', 'content' => $userContent];

        $payload = [
            'model'    => $model,
            'messages' => $messages,
        ];

        if ($request->temperature !== null) {
            $payload['temperature'] = $request->temperature;
        }

        if ($request->maxOutputTokens) {
            $payload['max_completion_tokens'] = $request->maxOutputTokens;
        }

        if ($request->schema) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        if (!empty($request->tools)) {
            // Normalize tool format: AiController passes Gemini-style function_declarations
            // (top-level 'name' key). OpenAI requires each wrapped in {'type':'function','function':{...}}.
            $normalizedTools = [];
            foreach ($request->tools as $tool) {
                if (isset($tool['name']) && !isset($tool['type'])) {
                    $normalizedTools[] = ['type' => 'function', 'function' => $tool];
                } else {
                    $normalizedTools[] = $tool; // already in OpenAI format
                }
            }
            $payload['tools'] = $normalizedTools;
            $payload['tool_choice'] = 'auto';
        }

        try {
            $response = Http::timeout($timeout)->withToken($apiKey)->post('https://api.openai.com/v1/chat/completions', $payload);

            if ($response->failed()) {
                $msg = $response->json('error.message') ?? $response->body();
                return AiResult::failure('provider_error', "OpenAI error ({$response->status()}): {$msg}");
            }

            $json = $response->json();
            $choice = $json['choices'][0] ?? null;
            if (!$choice) {
                return AiResult::failure('empty_response', 'OpenAI returned no choices.');
            }

            $message = $choice['message'];
            $promptTokens = (int) ($json['usage']['prompt_tokens'] ?? 0);
            $outputTokens = (int) ($json['usage']['completion_tokens'] ?? 0);
            $costUsd = app(AiUsageRecorder::class)->calculateCost($model, $promptTokens, $outputTokens);
            $latencyMs = (int) round((microtime(true) - $startTime) * 1000);

            // Check tool calls
            if (!empty($message['tool_calls']) && is_callable($request->toolExecutor)) {
                $toolCalls = $message['tool_calls'];
                $toolOutputs = [];

                foreach ($toolCalls as $toolCall) {
                    $fnName = $toolCall['function']['name'];
                    $fnArgs = json_decode($toolCall['function']['arguments'] ?? '{}', true) ?: [];
                    $toolRes = ($request->toolExecutor)($fnName, $fnArgs);

                    $toolOutputs[] = [
                        'tool_call_id' => $toolCall['id'],
                        'role'         => 'tool',
                        'name'         => $fnName,
                        'content'      => is_string($toolRes) ? $toolRes : json_encode($toolRes),
                    ];
                }

                $followUpMessages = array_merge($messages, [$message], $toolOutputs);
                $followUpPayload = [
                    'model'    => $model,
                    'messages' => $followUpMessages,
                ];

                $followUpRes = Http::timeout($timeout)->withToken($apiKey)->post('https://api.openai.com/v1/chat/completions', $followUpPayload);
                if ($followUpRes->successful()) {
                    $fJson = $followUpRes->json();
                    $finalText = $fJson['choices'][0]['message']['content'] ?? '';
                    $fPrompt = (int) ($fJson['usage']['prompt_tokens'] ?? 0);
                    $fOutput = (int) ($fJson['usage']['completion_tokens'] ?? 0);
                    $promptTokens += $fPrompt;
                    $outputTokens += $fOutput;
                    $costUsd += app(AiUsageRecorder::class)->calculateCost($model, $fPrompt, $fOutput);

                    return AiResult::success(
                        value: $finalText,
                        source: 'model',
                        model: $model,
                        provider: 'openai',
                        confidence: 1.0,
                        costUsd: $costUsd,
                        latencyMs: (int) round((microtime(true) - $startTime) * 1000),
                        raw: $fJson,
                        promptTokens: $promptTokens,
                        outputTokens: $outputTokens,
                        toolCalls: $toolCalls
                    );
                }
            }

            $content = $message['content'] ?? '';
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
                provider: 'openai',
                confidence: $confidence,
                costUsd: $costUsd,
                latencyMs: $latencyMs,
                raw: $json,
                promptTokens: $promptTokens,
                outputTokens: $outputTokens
            );

        } catch (\Throwable $e) {
            Log::error("OpenAiProvider exception: " . $e->getMessage());
            return AiResult::failure('connection_error', $e->getMessage());
        }
    }

    public function testConnection(string $apiKey, string $model): array
    {
        $timeout = (int) config('ai_limits.timeout.query', 20);
        try {
            $res = Http::timeout($timeout)->withToken($apiKey)->post('https://api.openai.com/v1/chat/completions', [
                'model'      => $model,
                'messages'   => [['role' => 'user', 'content' => "Say 'Hello'"]],
                'max_tokens' => 5,
            ])->throw();

            return ['success' => true, 'message' => 'Connection verified successfully!'];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    private function transcribe(string $apiKey, array $payload): string
    {
        $binary = base64_decode($payload['base64'] ?? '', true);
        if ($binary === false) {
            return '';
        }

        $ext = explode('/', explode(';', $payload['mime'] ?? '')[0])[1] ?? 'webm';

        $response = Http::timeout(60)
            ->withToken($apiKey)
            ->attach('file', $binary, "memo.{$ext}")
            ->post('https://api.openai.com/v1/audio/transcriptions', ['model' => 'whisper-1']);

        return $response->json('text') ?? '';
    }
}
