<?php

namespace App\Services\Ai\Providers;

use App\Exceptions\SmartCapture\AiModelUnavailableException;
use App\Exceptions\SmartCapture\AiRateLimitException;
use App\Services\Ai\AiUsageRecorder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * SmartCaptureExtractionBridge — provider transport layer for AI Scan.
 *
 * Owns ALL upstream HTTP endpoint URLs for extraction calls so that
 * AiExtractionService contains zero provider URLs (mandate §9).
 * Each method matches the contract of the old private callGemini/callOpenAi/
 * callAnthropic/callDeepSeek/openAiTranscribe methods, moved verbatim here.
 *
 * This bridge is intentionally extraction-specific: it handles the terse
 * JSON schema, Gemini safety relaxation, audio transcription, Anthropic
 * tool-use extraction, and DeepSeek json_object mode that differ from the
 * generic provider path used by AiGateway.
 */
class SmartCaptureExtractionBridge
{
    public function callGemini(
        string $apiKey,
        string $model,
        string $inputType,
        array $payload,
        string $prompt,
        ?AiUsageRecorder $recorder = null
    ): string {
        if ($inputType !== 'image' && $inputType !== 'audio') {
            $prompt .= "\n\n[USER PROVIDED TEXT]\n" . ($payload['text'] ?? '');
        }

        // Place prompt text FIRST to enable Gemini implicit prefix caching
        $parts = [['text' => $prompt]];

        if ($inputType === 'image') {
            foreach ($payload as $file) {
                $parts[] = ['inline_data' => ['mime_type' => $file['mime'], 'data' => $file['base64']]];
            }
        } elseif ($inputType === 'audio') {
            $parts[] = ['inline_data' => ['mime_type' => $payload['mime'], 'data' => $payload['base64']]];
        }

        $pageCount = ($inputType === 'image' && is_array($payload)) ? max(1, count($payload)) : 1;
        $maxTokens = 800 + (400 * $pageCount);

        $generationConfig = [
            'temperature'      => 0.0,
            'topP'             => 0.1,
            'maxOutputTokens'  => $maxTokens,
            'responseMimeType' => 'application/json',
            'responseSchema'   => [
                'type'       => 'OBJECT',
                'properties' => [
                    'a'  => ['type' => 'STRING'],
                    'pt' => ['type' => 'STRING', 'nullable' => true],
                    'd'  => ['type' => 'STRING', 'nullable' => true],
                    'rf' => ['type' => 'STRING', 'nullable' => true],
                    'dc' => ['type' => 'INTEGER'],
                    'it' => [
                        'type'  => 'ARRAY',
                        'items' => [
                            'type'       => 'OBJECT',
                            'properties' => [
                                'n'  => ['type' => 'STRING'],
                                'q'  => ['type' => 'NUMBER'],
                                'p'  => ['type' => 'NUMBER', 'nullable' => true],
                                't'  => ['type' => 'NUMBER', 'nullable' => true],
                                'sc' => ['type' => 'STRING', 'nullable' => true],
                                'c'  => ['type' => 'INTEGER'],
                            ],
                            'required' => ['n', 'q', 'c'],
                        ],
                    ],
                ],
                'required' => ['a', 'dc', 'it'],
            ],
        ];

        $thinkingBudget = $inputType === 'image'
            ? (int) config('smartcapture.thinking_budget_image', 1024)
            : (int) config('smartcapture.thinking_budget_text', 0);

        if ($thinkingBudget >= 0) {
            $generationConfig['thinkingConfig'] = ['thinkingBudget' => $thinkingBudget];
        }

        $response = Http::timeout((int) config('smartcapture.timeout', 120))
            ->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
                [
                    'contents'         => [['parts' => $parts]],
                    'generationConfig' => $generationConfig,
                    // Receipts and invoices routinely trip the default safety
                    // filters on brand names and alcohol/tobacco line items.
                    'safetySettings'   => $this->geminiSafetySettings(),
                ]
            );

        if ($response->failed()) {
            $this->throwProviderError('Gemini', $response->status(), $response->body(), $response->header('Retry-After'));
        }

        $json = $response->json();

        $promptTokens     = (int) ($json['usageMetadata']['promptTokenCount'] ?? 0);
        $completionTokens = (int) ($json['usageMetadata']['candidatesTokenCount'] ?? 0);
        $cachedTokens     = (int) ($json['usageMetadata']['cachedContentTokenCount'] ?? 0);

        if ($recorder) {
            try {
                $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
                $recorder->record([
                    'tenant_id'     => $tenant?->id,
                    'feature'       => 'scan',
                    'provider'      => 'gemini',
                    'model'         => $model,
                    'key_mode'      => 'platform_paid',
                    'input_type'    => $inputType,
                    'prompt_tokens' => $promptTokens,
                    'output_tokens' => $completionTokens,
                    'cached_tokens' => $cachedTokens,
                    'success'       => true,
                ]);
            } catch (\Throwable $e) {
                Log::warning("Failed to record ai_usage_event: " . $e->getMessage());
            }
        }

        // A blocked prompt returns 200 with no candidates.
        if (empty($json['candidates'])) {
            $blockReason = $json['promptFeedback']['blockReason'] ?? null;
            throw new \Exception($blockReason
                ? "Gemini declined to process this document (reason: {$blockReason}). Try re-photographing it, or use the Text tab."
                : 'Gemini returned no result for this document. Try a clearer photo.');
        }

        $candidate    = $json['candidates'][0];
        $finishReason = $candidate['finishReason'] ?? null;

        // Thinking models can emit several parts; concatenate every text part.
        $text = collect($candidate['content']['parts'] ?? [])
            ->pluck('text')
            ->filter()
            ->implode('');

        if ($finishReason === 'MAX_TOKENS' && trim($text) === '') {
            throw new \Exception(
                'The document is too long for one scan — the model ran out of output space. '
                . 'Split it into fewer pages per scan, or raise SMART_CAPTURE_MAX_OUTPUT_TOKENS.'
            );
        }

        if (trim($text) === '') {
            throw new \Exception('Gemini returned an empty response' . ($finishReason ? " (finish reason: {$finishReason})" : '') . '.');
        }

        return $text;
    }

    public function callOpenAi(
        string $apiKey,
        string $model,
        string $inputType,
        array $payload,
        string $prompt,
        ?AiUsageRecorder $recorder = null
    ): string {
        // Audio: transcribe first, then a text extraction pass. That is two
        // upstream calls by necessity (OpenAI has no single audio->JSON path);
        // Gemini remains the single-request provider for voice memos.
        if ($inputType === 'audio') {
            $transcript = $this->openAiTranscribe($apiKey, $payload);
            $prompt    .= "\n\n[TRANSCRIBED VOICE MEMO]\n" . $transcript;
            $content    = $prompt;
        } elseif ($inputType === 'image') {
            $content = [['type' => 'text', 'text' => $prompt]];
            foreach ($payload as $file) {
                if ($file['mime'] === 'application/pdf') {
                    $content[] = [
                        'type' => 'file',
                        'file' => ['filename' => 'document.pdf', 'file_data' => "data:application/pdf;base64,{$file['base64']}"],
                    ];
                } else {
                    $content[] = [
                        'type'      => 'image_url',
                        'image_url' => ['url' => "data:{$file['mime']};base64,{$file['base64']}", 'detail' => 'high'],
                    ];
                }
            }
        } else {
            $content = $prompt . "\n\n[USER PROVIDED TEXT]\n" . ($payload['text'] ?? '');
        }

        $pageCount = ($inputType === 'image' && is_array($payload)) ? max(1, count($payload)) : 1;
        $maxTokens = 800 + (400 * $pageCount);

        $response = Http::timeout((int) config('smartcapture.timeout', 120))
            ->withToken($apiKey)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model'                 => $model,
                'temperature'           => 0.0,
                'max_completion_tokens' => $maxTokens,
                'response_format'       => [
                    'type'        => 'json_schema',
                    'json_schema' => [
                        'name'   => 'terse_extraction_response',
                        'strict' => true,
                        'schema' => [
                            'type'                 => 'object',
                            'properties'           => [
                                'a'  => ['type' => 'string'],
                                'pt' => ['type' => ['string', 'null']],
                                'd'  => ['type' => ['string', 'null']],
                                'rf' => ['type' => ['string', 'null']],
                                'dc' => ['type' => 'integer'],
                                'it' => [
                                    'type'  => 'array',
                                    'items' => [
                                        'type'                 => 'object',
                                        'properties'           => [
                                            'n'  => ['type' => 'string'],
                                            'q'  => ['type' => 'number'],
                                            'p'  => ['type' => ['number', 'null']],
                                            't'  => ['type' => ['number', 'null']],
                                            'sc' => ['type' => ['string', 'null']],
                                            'c'  => ['type' => 'integer'],
                                        ],
                                        'required'             => ['n', 'q', 'p', 't', 'sc', 'c'],
                                        'additionalProperties' => false,
                                    ],
                                ],
                            ],
                            'required'             => ['a', 'pt', 'd', 'rf', 'dc', 'it'],
                            'additionalProperties' => false,
                        ],
                    ],
                ],
                'messages' => [['role' => 'user', 'content' => $content]],
            ]);

        if ($response->failed()) {
            $this->throwProviderError('OpenAI', $response->status(), $response->body(), $response->header('Retry-After'));
        }

        $promptTokens     = (int) ($response->json('usage.prompt_tokens') ?? 0);
        $completionTokens = (int) ($response->json('usage.completion_tokens') ?? 0);

        if ($recorder) {
            try {
                $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
                $recorder->record([
                    'tenant_id'     => $tenant?->id,
                    'feature'       => 'scan',
                    'provider'      => 'openai',
                    'model'         => $model,
                    'key_mode'      => 'platform_paid',
                    'input_type'    => $inputType,
                    'prompt_tokens' => $promptTokens,
                    'output_tokens' => $completionTokens,
                    'success'       => true,
                ]);
            } catch (\Throwable $e) {
                Log::warning("Failed to record OpenAI ai_usage_event: " . $e->getMessage());
            }
        }

        $text = $response->json('choices.0.message.content');
        if (!$text) {
            throw new \Exception('Empty response from OpenAI.');
        }

        return $text;
    }

    public function openAiTranscribe(string $apiKey, array $payload): string
    {
        $binary = base64_decode($payload['base64'], true);
        if ($binary === false) {
            throw new \Exception('Invalid base64 audio payload.');
        }

        $ext = explode('/', explode(';', $payload['mime'])[0])[1] ?? 'webm';

        $response = Http::timeout((int) config('smartcapture.timeout', 120))
            ->withToken($apiKey)
            ->attach('file', $binary, "memo.{$ext}")
            ->post('https://api.openai.com/v1/audio/transcriptions', ['model' => 'whisper-1']);

        if ($response->failed()) {
            $this->throwProviderError('OpenAI transcription', $response->status(), $response->body(), $response->header('Retry-After'));
        }

        $text = $response->json('text');
        if (!$text) {
            throw new \Exception('Empty transcription from OpenAI.');
        }

        return $text;
    }

    public function callAnthropic(
        string $apiKey,
        string $model,
        string $inputType,
        array $payload,
        string $prompt,
        ?AiUsageRecorder $recorder = null
    ): string {
        if ($inputType === 'audio') {
            throw new \Exception('Claude does not support audio input. Use Gemini or OpenAI for voice memos.');
        }

        $content = [];

        if ($inputType === 'image') {
            foreach ($payload as $file) {
                if ($file['mime'] === 'application/pdf') {
                    $content[] = [
                        'type'   => 'document',
                        'source' => ['type' => 'base64', 'media_type' => 'application/pdf', 'data' => $file['base64']],
                    ];
                } else {
                    $content[] = [
                        'type'   => 'image',
                        'source' => ['type' => 'base64', 'media_type' => $file['mime'], 'data' => $file['base64']],
                    ];
                }
            }
            $content[] = ['type' => 'text', 'text' => $prompt];
        } else {
            $content[] = ['type' => 'text', 'text' => $prompt . "\n\n[USER PROVIDED TEXT]\n" . ($payload['text'] ?? '')];
        }

        $pageCount = ($inputType === 'image' && is_array($payload)) ? max(1, count($payload)) : 1;
        $maxTokens = 800 + (400 * $pageCount);

        $toolSchema = [
            'name'         => 'extract_terse_transaction',
            'description'  => 'Extract document details using terse schema.',
            'input_schema' => [
                'type'       => 'object',
                'properties' => [
                    'a'  => ['type' => 'string'],
                    'pt' => ['type' => 'string'],
                    'd'  => ['type' => 'string'],
                    'rf' => ['type' => 'string'],
                    'dc' => ['type' => 'integer'],
                    'it' => [
                        'type'  => 'array',
                        'items' => [
                            'type'       => 'object',
                            'properties' => [
                                'n'  => ['type' => 'string'],
                                'q'  => ['type' => 'number'],
                                'p'  => ['type' => 'number'],
                                't'  => ['type' => 'number'],
                                'sc' => ['type' => 'string'],
                                'c'  => ['type' => 'integer'],
                            ],
                            'required' => ['n', 'q', 'c'],
                        ],
                    ],
                ],
                'required' => ['a', 'dc', 'it'],
            ],
        ];

        $response = Http::timeout((int) config('smartcapture.timeout', 120))
            ->withHeaders([
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
            ])
            ->post('https://api.anthropic.com/v1/messages', [
                'model'       => $model,
                'max_tokens'  => $maxTokens,
                'messages'    => [['role' => 'user', 'content' => $content]],
                'tools'       => [$toolSchema],
                'tool_choice' => ['type' => 'tool', 'name' => 'extract_terse_transaction'],
            ]);

        if ($response->failed()) {
            $this->throwProviderError('Anthropic', $response->status(), $response->body(), $response->header('Retry-After'));
        }

        $promptTokens     = (int) ($response->json('usage.input_tokens') ?? 0);
        $completionTokens = (int) ($response->json('usage.output_tokens') ?? 0);

        if ($recorder) {
            try {
                $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
                $recorder->record([
                    'tenant_id'     => $tenant?->id,
                    'feature'       => 'scan',
                    'provider'      => 'anthropic',
                    'model'         => $model,
                    'key_mode'      => 'platform_paid',
                    'input_type'    => $inputType,
                    'prompt_tokens' => $promptTokens,
                    'output_tokens' => $completionTokens,
                    'success'       => true,
                ]);
            } catch (\Throwable $e) {
                Log::warning("Failed to record Anthropic ai_usage_event: " . $e->getMessage());
            }
        }

        $toolUseInput = $response->json('content.0.input');
        if (is_array($toolUseInput)) {
            return json_encode($toolUseInput);
        }

        $text = $response->json('content.0.text');
        if (!$text) {
            throw new \Exception('Empty response from Anthropic.');
        }

        return $text;
    }

    public function callDeepSeek(
        string $apiKey,
        string $model,
        string $inputType,
        array $payload,
        string $prompt,
        ?AiUsageRecorder $recorder = null
    ): string {
        if ($inputType !== 'text') {
            throw new \Exception('DeepSeek supports text input only. Use Gemini, OpenAI or Claude for photos/audio.');
        }

        $maxTokens = 800 + 400; // text only = 1 page equivalent

        $response = Http::timeout((int) config('smartcapture.timeout', 120))
            ->withToken($apiKey)
            ->post('https://api.deepseek.com/chat/completions', [
                'model'           => $model,
                'temperature'     => 0.0,
                'max_tokens'      => $maxTokens,
                'response_format' => ['type' => 'json_object'],
                'messages'        => [[
                    'role'    => 'user',
                    'content' => $prompt . "\n\n[USER PROVIDED TEXT]\n" . ($payload['text'] ?? ''),
                ]],
            ]);

        if ($response->failed()) {
            $this->throwProviderError('DeepSeek', $response->status(), $response->body(), $response->header('Retry-After'));
        }

        $promptTokens     = (int) ($response->json('usage.prompt_tokens') ?? 0);
        $completionTokens = (int) ($response->json('usage.completion_tokens') ?? 0);

        if ($recorder) {
            try {
                $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
                $recorder->record([
                    'tenant_id'     => $tenant?->id,
                    'feature'       => 'scan',
                    'provider'      => 'deepseek',
                    'model'         => $model,
                    'key_mode'      => 'platform_paid',
                    'input_type'    => $inputType,
                    'prompt_tokens' => $promptTokens,
                    'output_tokens' => $completionTokens,
                    'success'       => true,
                ]);
            } catch (\Throwable $e) {
                Log::warning("Failed to record DeepSeek ai_usage_event: " . $e->getMessage());
            }
        }

        $text = $response->json('choices.0.message.content');
        if (!$text) {
            throw new \Exception('Empty response from DeepSeek.');
        }

        return $text;
    }

    /**
     * Discover models available to this key.
     *
     * @return array<int, array{id:string, label:string}>
     */
    public function listModels(string $provider, string $apiKey): array
    {
        $provider = $this->normalizeProvider($provider);

        try {
            if ($provider === 'gemini') {
                $response = Http::timeout(20)->get(
                    'https://generativelanguage.googleapis.com/v1beta/models',
                    ['key' => $apiKey, 'pageSize' => 200]
                );

                if ($response->failed()) {
                    return [];
                }

                return collect($response->json('models', []))
                    ->filter(fn ($m) => in_array('generateContent', $m['supportedGenerationMethods'] ?? [], true))
                    ->map(fn ($m) => [
                        'id'    => str_replace('models/', '', $m['name'] ?? ''),
                        'label' => $m['displayName'] ?? str_replace('models/', '', $m['name'] ?? ''),
                    ])
                    ->filter(fn ($m) => $m['id'] !== '')
                    ->filter(fn ($m) => str_contains($m['id'], 'flash') || str_contains($m['id'], 'pro'))
                    ->reject(fn ($m) => str_contains($m['id'], 'embedding') || str_contains($m['id'], 'image-generation'))
                    ->sortByDesc('id')
                    ->values()
                    ->all();
            }

            if ($provider === 'openai') {
                $response = Http::timeout(20)->withToken($apiKey)->get('https://api.openai.com/v1/models');
                if ($response->failed()) {
                    return [];
                }

                return collect($response->json('data', []))
                    ->pluck('id')
                    ->filter(fn ($id) => str_starts_with($id, 'gpt-'))
                    ->sort()
                    ->values()
                    ->map(fn ($id) => ['id' => $id, 'label' => $id])
                    ->all();
            }
        } catch (\Throwable $e) {
            Log::info('SmartCapture: model discovery failed — ' . $e->getMessage());
        }

        // Anthropic / DeepSeek have no open list endpoint — fall back to config.
        return collect(config("smartcapture.fallback_models.{$provider}", []))
            ->map(fn ($id) => ['id' => $id, 'label' => $id])
            ->all();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

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

    private function normalizeProvider(?string $provider): string
    {
        $p = strtolower(trim((string) $provider));
        return in_array($p, ['gemini', 'openai', 'anthropic', 'deepseek'], true) ? $p : 'gemini';
    }

    /**
     * Translate a failed HTTP response into the right exception type.
     *
     * This is the gate that decides whether a second request may be sent:
     * only AiModelUnavailableException is retryable, and only once.
     */
    private function throwProviderError(string $label, int $status, string $body, ?string $retryAfterHeader): never
    {
        $snippet = mb_substr($body, 0, 400);
        $lower   = mb_strtolower($snippet);

        // ── Rate limit / quota — never retried ───────────────────────────────
        if ($status === 429) {
            $retryAfter = $this->parseRetryAfter($retryAfterHeader, $body);
            $daily = str_contains($lower, 'perday') || str_contains($lower, 'per day') || str_contains($lower, 'daily');

            throw new AiRateLimitException(
                $daily
                    ? "Your {$label} key has hit its daily free-tier quota. It resets at midnight Pacific time, or you can upgrade the key to a paid tier."
                    : "Your {$label} key is sending requests too quickly (free tier allows only a few per minute). Wait a few seconds and scan again.",
                retryAfterSeconds: $retryAfter,
                dailyQuotaExhausted: $daily
            );
        }

        // ── Model does not exist for this key — the one retryable case ────────
        $modelMissing = $status === 404
            || (in_array($status, [400, 403], true) && (
                str_contains($lower, 'not found')
                || str_contains($lower, 'is not supported')
                || str_contains($lower, 'does not exist')
                || str_contains($lower, 'unsupported model')
            ));

        if ($modelMissing) {
            throw new AiModelUnavailableException("{$label} model unavailable ({$status}): {$snippet}");
        }

        // ── Auth — actionable, never retried ─────────────────────────────────
        if (in_array($status, [401, 403], true)) {
            throw new \Exception("{$label} rejected your API key ({$status}). Check the key in AI Scan settings.");
        }

        // ── Everything else — surfaced, never retried ────────────────────────
        throw new \Exception("{$label} request failed ({$status}): {$snippet}");
    }

    /**
     * Gemini returns a structured retryDelay ("17s") in the error body;
     * other providers use the standard Retry-After header.
     */
    private function parseRetryAfter(?string $header, string $body): int
    {
        if (is_numeric($header)) {
            return max(1, min(300, (int) $header));
        }

        if (preg_match('/"retryDelay"\s*:\s*"(\d+)(?:\.\d+)?s"/i', $body, $m)) {
            return max(1, min(300, (int) $m[1]));
        }

        return 30;
    }
}
