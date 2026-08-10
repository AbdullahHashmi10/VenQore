<?php

namespace App\Services\SmartCapture;

use App\Exceptions\SmartCapture\AiModelUnavailableException;
use App\Exceptions\SmartCapture\AiRateLimitException;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AiExtractionService — multi-provider AI extraction engine for SmartCapture (AI Scan).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * REQUEST BUDGET CONTRACT (read this before changing anything in here)
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE SCAN == ONE UPSTREAM API REQUEST.
 *
 * Every image/PDF page, the catalog, the party list and the learned aliases are
 * packed into a single multimodal call. There is no per-file call, no retry
 * loop, and no speculative model chain.
 *
 * The only case where a second request may be sent is when the provider replies
 * "this model does not exist for your key" (404 / 400 model-not-found), because
 * substituting the model is the actual fix. Rate limits (429), server errors
 * (5xx), timeouts and JSON parse failures are surfaced to the user directly.
 * Retrying those was the cause of free-tier quota exhaustion.
 *
 * Concurrency: calls sharing one API key can optionally be paced
 * (config smartcapture.pace_ms) so several staff scanning simultaneously never
 * burst past a free-tier per-minute limit.
 *
 * Tenant isolation: the store's API key is read with an explicit tenant_id
 * query — never via the shared settings cache — so a key can never bleed
 * across tenants.
 *
 * Supports: Gemini, OpenAI, Anthropic (Claude), DeepSeek.
 * Inputs:
 *  - image : one to N (config max_files) base64 images / PDFs, pages of ONE document
 *  - audio : a single base64 audio clip (recorded or uploaded)
 *  - text  : raw pasted / typed text
 */
class AiExtractionService
{
    /** Number of upstream HTTP calls made by the last extract() invocation. */
    public int $lastRequestCount = 0;

    /** Model that actually produced the last successful result. */
    public ?string $lastModelUsed = null;

    /** Token usage reported by the provider for the last call, if any. */
    public array $lastUsage = [];

    // ─────────────────────────────────────────────────────────────────────────
    // Configuration resolution
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Read a SmartCapture setting for the CURRENT tenant only.
     *
     * Deliberately bypasses SettingsHelper: that helper caches per tenant but
     * also falls back to global (tenant_id = null) rows, which would let a
     * platform-level row masquerade as a store's own BYOK key. API keys must be
     * resolved strictly, with no fallback and no shared cache.
     */
    private function tenantSetting(string $key): ?string
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        if (!$tenant) {
            return null;
        }

        $value = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', $key)
            ->value('value');

        $value = is_string($value) ? trim($value) : $value;

        return ($value === '' || $value === null) ? null : $value;
    }

    /**
     * Resolve the effective AI configuration for the current tenant.
     *
     * @return array{provider:string, api_key:?string, model:string, byok:bool}
     */
    public function resolveConfig(?string $feature = null): array
    {
        // 1. Dedicated per-store SmartCapture settings (BYOK) — strictly tenant-scoped
        $tenantKey = $this->tenantSetting('smartcapture_api_key');

        if ($tenantKey !== null) {
            $provider = $this->normalizeProvider($this->tenantSetting('smartcapture_provider') ?: 'gemini');
            $model = $this->tenantSetting('smartcapture_model');
            if (!$model && $feature) {
                $model = config("smartcapture.feature_models.{$feature}");
            }
            return [
                'provider' => $provider,
                'api_key'  => $tenantKey,
                'model'    => $model ?: config("smartcapture.default_models.{$provider}"),
                'byok'     => true,
            ];
        }

        // 2. Legacy tenant chatbot key (historically a Gemini key) — also tenant-scoped
        $legacyKey = $this->tenantSetting('chatbot_api_key') ?? $this->tenantSetting('openai_api_key');
        if ($legacyKey !== null) {
            $model = null;
            if ($feature) {
                $model = config("smartcapture.feature_models.{$feature}");
            }
            return [
                'provider' => 'gemini',
                'api_key'  => $legacyKey,
                'model'    => $model ?: config('smartcapture.default_models.gemini'),
                'byok'     => true,
            ];
        }

        // 3. Platform-level fallback (managed / free tiers)
        $provider = $this->normalizeProvider(config('smartcapture.provider', 'gemini'));
        if ($feature === 'public_tool') {
            $key = config('smartcapture.free_api_key') ?: (config('smartcapture.gemini_key') ?: config('smartcapture.api_key'));
        } else {
            $key = $provider === 'gemini'
                ? (config('smartcapture.gemini_key') ?: config('smartcapture.api_key'))
                : config('smartcapture.api_key');
        }

        $featureModel = $feature ? config("smartcapture.feature_models.{$feature}") : null;

        return [
            'provider' => $provider,
            'api_key'  => $key ?: null,
            'model'    => $featureModel ?: (config('smartcapture.model') ?: config("smartcapture.default_models.{$provider}")),
            'byok'     => false,
        ];
    }

    /** Whether the current tenant has ANY usable key (own key or platform fallback). */
    public function hasKey(): bool
    {
        return !empty($this->resolveConfig()['api_key']);
    }

    /** Whether the current tenant configured their own key. */
    public function hasOwnKey(): bool
    {
        return (bool) $this->resolveConfig()['byok'];
    }

    /** Whether the resolved provider supports the given input type. */
    public function supports(string $inputType): bool
    {
        $provider = $this->resolveConfig()['provider'];
        return (bool) config("smartcapture.capabilities.{$provider}.{$inputType}", false);
    }

    private function normalizeProvider(?string $provider): string
    {
        $p = strtolower(trim((string) $provider));
        return in_array($p, ['gemini', 'openai', 'anthropic', 'deepseek'], true) ? $p : 'gemini';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Extraction
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Extract structured transaction data. Costs exactly one upstream request
     * (see the request budget contract in the class docblock).
     *
     * @param string $inputType 'image' | 'audio' | 'text'
     * @param array  $payload   image => [['base64'=>..,'mime'=>..], ...]
     *                          audio => ['base64'=>..,'mime'=>..]
     *                          text  => ['text'=>..]
     * @param array  $context   ['existing_products'=>[], 'parties'=>[],
     *                           'expense_categories'=>[], 'learned_aliases'=>[]]
     *
     * @throws AiRateLimitException when the key is rate limited / out of quota
     */
    public function extract(
        string $inputType,
        array $payload,
        ?string $targetType = null,
        ?string $customCommand = null,
        array $context = []
    ): array {
        $this->lastRequestCount = 0;
        $this->lastModelUsed = null;
        $this->lastUsage = [];

        $config = $this->resolveConfig($context['feature'] ?? 'scan');

        if (empty($config['api_key'])) {
            throw new \Exception('No AI API key is configured. Add your own key in AI Scan settings.');
        }

        if (!config("smartcapture.capabilities.{$config['provider']}.{$inputType}", false)) {
            $pretty = ucfirst($config['provider']);
            throw new \Exception("{$pretty} does not support {$inputType} input. Switch the AI provider in AI Scan settings (Gemini supports photos, audio and text).");
        }

        $prompt = $this->buildPrompt($inputType, $targetType, $customCommand, $context);

        // Server-side image verification (T0-5): reject images under 400px
        if ($inputType === 'image' && is_array($payload)) {
            foreach ($payload as $file) {
                if (!empty($file['base64'])) {
                    $rawBinary = @base64_decode($file['base64']);
                    if ($rawBinary) {
                        $info = @getimagesizefromstring($rawBinary);
                        if ($info && isset($info[0], $info[1])) {
                            if ($info[0] < 400 || $info[1] < 400) {
                                throw new \Exception("Image resolution ({$info[0]}x{$info[1]}px) is too low. Please upload a clear photo of at least 400x400 pixels.");
                            }
                        }
                    }
                }
            }
        }

        // Attempt 1 — the configured model. This is the ONLY request in the
        // overwhelming majority of scans.
        try {
            return $this->parseJson($this->dispatch($config, $config['model'], $inputType, $payload, $prompt));
        } catch (AiModelUnavailableException $e) {
            // The configured model genuinely does not exist for this key.
            // Substituting is the fix, so one extra request is justified here.
            if (!config('smartcapture.substitute_on_missing_model', true)) {
                throw new \Exception($e->getMessage());
            }

            $substitute = $this->firstSubstituteModel($config);

            if ($substitute === null) {
                throw new \Exception(
                    "The model '{$config['model']}' is not available for your API key, and no substitute is configured. "
                    . 'Pick a different model in AI Scan settings.'
                );
            }

            Log::warning("SmartCapture: model '{$config['model']}' unavailable, substituting '{$substitute}'.");

            try {
                $result = $this->parseJson($this->dispatch($config, $substitute, $inputType, $payload, $prompt));
                $this->rememberWorkingModel($substitute);
                return $result;
            } catch (AiModelUnavailableException $inner) {
                throw new \Exception(
                    "Neither '{$config['model']}' nor the substitute '{$substitute}' is available for your API key. "
                    . 'Open AI Scan settings and choose a model from the discovered list.'
                );
            }
        }
    }

    /**
     * Batch match-fallback call for unmatched line items (T1-5).
     * Sends unmatched names + top 10 candidate shortlists in ONE single Flash-Lite call.
     */
    public function matchFallback(array $unmatchedItems, array $candidateLists): array
    {
        if (empty($unmatchedItems)) {
            return [];
        }

        $config = $this->resolveConfig('match_fallback');
        $prompt = "You are matching unmatched receipt line items to candidate store products.\n"
            . "Unmatched items and candidate options:\n"
            . json_encode(['unmatched' => $unmatchedItems, 'candidates' => $candidateLists]) . "\n"
            . "Return a JSON object mapping each unmatched item name to best matched product_id or null.";

        try {
            $raw = $this->dispatch($config, $config['model'], 'text', ['text' => $prompt], $prompt);
            return $this->parseJson($raw);
        } catch (\Throwable $e) {
            Log::warning("Match fallback call failed: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Validate audio file duration and calculate page credit consumption (T1-7).
     * Max duration 180s on server. Returns credits to deduct (1 credit per 30s started).
     */
    public function validateAudioDuration(int $durationSeconds): int
    {
        if ($durationSeconds > 180) {
            throw new \Exception("Audio memo exceeds maximum duration of 180 seconds. Please upload a shorter recording.");
        }

        return (int) ceil(max(1, $durationSeconds) / 30.0);
    }

    /**
     * Inspect PDF page count and chunk into documents of max 5 pages (T1-8).
     */
    public function validatePdfPages(int $pageCount): array
    {
        if ($pageCount <= 0) {
            $pageCount = 1;
        }

        $chunks = (int) ceil($pageCount / 5.0);

        return [
            'total_pages'  => $pageCount,
            'chunks_count' => $chunks,
            'credits_cost' => $pageCount,
        ];
    }

    /**
     * First substitute model that differs from the one that just failed.
     */
    private function firstSubstituteModel(array $config): ?string
    {
        $chain = (array) config("smartcapture.fallback_models.{$config['provider']}", []);

        foreach ($chain as $candidate) {
            if ($candidate !== $config['model']) {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * Persist a model that proved to work, so the next scan starts with it and
     * does not pay the substitution request again.
     */
    private function rememberWorkingModel(string $model): void
    {
        try {
            $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
            if (!$tenant || $this->tenantSetting('smartcapture_api_key') === null) {
                return; // only rewrite a store's own explicit configuration
            }

            Setting::withoutGlobalScopes()->updateOrCreate(
                ['tenant_id' => $tenant->id, 'key' => 'smartcapture_model'],
                ['value' => $model]
            );
        } catch (\Throwable $e) {
            Log::warning('SmartCapture: could not persist working model — ' . $e->getMessage());
        }
    }

    /**
     * Route to the right provider transport, applying key pacing and counting
     * the request against the budget.
     */
    private function dispatch(array $config, string $model, string $inputType, array $payload, string $prompt): string
    {
        $this->awaitKeyTurn($config['api_key']);

        $this->lastRequestCount++;
        $this->lastModelUsed = $model;

        return match ($config['provider']) {
            'gemini'    => $this->callGemini($config['api_key'], $model, $inputType, $payload, $prompt),
            'openai'    => $this->callOpenAi($config['api_key'], $model, $inputType, $payload, $prompt),
            'anthropic' => $this->callAnthropic($config['api_key'], $model, $inputType, $payload, $prompt),
            'deepseek'  => $this->callDeepSeek($config['api_key'], $model, $inputType, $payload, $prompt),
            default     => throw new \Exception("Unsupported provider: {$config['provider']}"),
        };
    }

    /**
     * Space out calls that share one API key so simultaneous users on a
     * free-tier key never burst past its per-minute allowance.
     *
     * No-op when smartcapture.pace_ms is 0 (the setting for a paid key).
     */
    private function awaitKeyTurn(string $apiKey): void
    {
        $paceMs = (int) config('smartcapture.pace_ms', 0);
        if ($paceMs <= 0) {
            return;
        }

        $maxWaitMs = (int) config('smartcapture.pace_max_wait_ms', 30000);
        $slot      = 'smartcapture:pace:' . substr(hash('sha256', $apiKey), 0, 32);
        $waitedMs  = 0;

        while (true) {
            $lastAt = (float) Cache::get($slot, 0);
            $now    = microtime(true);
            $dueAt  = $lastAt + ($paceMs / 1000);

            if ($now >= $dueAt) {
                // Claim the slot before sleeping ends so a parallel request queues behind us.
                Cache::put($slot, $now, now()->addSeconds(120));
                return;
            }

            $sleepMs = (int) min(500, ceil(($dueAt - $now) * 1000));

            if ($waitedMs + $sleepMs > $maxWaitMs) {
                throw new AiRateLimitException(
                    'Several scans are already queued on this API key. Please try again in a moment.',
                    retryAfterSeconds: (int) ceil($paceMs / 1000)
                );
            }

            usleep($sleepMs * 1000);
            $waitedMs += $sleepMs;
        }
    }

    /**
     * Lightweight connectivity test for the settings screen.
     * Costs exactly one request. Returns ['ok'=>bool,'message'=>string].
     */
    public function testConnection(string $provider, string $apiKey, ?string $model = null): array
    {
        $provider = $this->normalizeProvider($provider);
        $model = $model ?: config("smartcapture.default_models.{$provider}");
        $probe = 'Reply with exactly this JSON and nothing else: {"ok": true}';

        try {
            $raw = match ($provider) {
                'gemini'    => $this->callGemini($apiKey, $model, 'text', ['text' => 'ping'], $probe),
                'openai'    => $this->callOpenAi($apiKey, $model, 'text', ['text' => 'ping'], $probe),
                'anthropic' => $this->callAnthropic($apiKey, $model, 'text', ['text' => 'ping'], $probe),
                'deepseek'  => $this->callDeepSeek($apiKey, $model, 'text', ['text' => 'ping'], $probe),
            };

            return ['ok' => true, 'message' => "Connected to {$provider} ({$model}) successfully."];
        } catch (AiRateLimitException $e) {
            return ['ok' => false, 'message' => 'The key is valid but currently rate limited: ' . $e->getMessage()];
        } catch (AiModelUnavailableException $e) {
            return ['ok' => false, 'message' => "The key works, but the model '{$model}' is not available to it. Choose another model from the list."];
        } catch (\Exception $e) {
            return ['ok' => false, 'message' => 'Connection failed: ' . $e->getMessage()];
        }
    }

    /**
     * Discover the models this key may actually use, so the settings drawer can
     * offer a live list instead of a hardcoded one that goes stale. One request.
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

                $models = collect($response->json('models', []))
                    ->filter(fn ($m) => in_array('generateContent', $m['supportedGenerationMethods'] ?? [], true))
                    ->map(fn ($m) => [
                        'id'    => str_replace('models/', '', $m['name'] ?? ''),
                        'label' => $m['displayName'] ?? str_replace('models/', '', $m['name'] ?? ''),
                    ])
                    ->filter(fn ($m) => $m['id'] !== '')
                    // Vision + audio capable flash/pro families only — embedding and
                    // image-generation models cannot do document extraction.
                    ->filter(fn ($m) => str_contains($m['id'], 'flash') || str_contains($m['id'], 'pro'))
                    ->reject(fn ($m) => str_contains($m['id'], 'embedding') || str_contains($m['id'], 'image-generation'))
                    ->sortByDesc('id')
                    ->values()
                    ->all();

                return $models;
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
    // Provider transports
    // ─────────────────────────────────────────────────────────────────────────

    private function callGemini(string $apiKey, string $model, string $inputType, array $payload, string $prompt): string
    {
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

        $promptTokens = (int) ($json['usageMetadata']['promptTokenCount'] ?? 0);
        $completionTokens = (int) ($json['usageMetadata']['candidatesTokenCount'] ?? 0);
        $cachedTokens = (int) ($json['usageMetadata']['cachedContentTokenCount'] ?? 0);

        $this->lastUsage = [
            'prompt_tokens' => $promptTokens,
            'output_tokens' => $completionTokens,
            'total_tokens'  => $json['usageMetadata']['totalTokenCount'] ?? null,
        ];

        try {
            $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
            app(\App\Services\Ai\AiUsageRecorder::class)->record([
                'tenant_id'       => $tenant?->id,
                'feature'         => 'scan',
                'provider'        => 'gemini',
                'model'           => $model,
                'key_mode'        => 'platform_paid',
                'input_type'      => $inputType,
                'prompt_tokens'   => $promptTokens,
                'output_tokens'   => $completionTokens,
                'cached_tokens'   => $cachedTokens,
                'success'         => true,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to record ai_usage_event: " . $e->getMessage());
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

    /**
     * Business documents are not harmful content; the default thresholds cause
     * false positives on ordinary receipts.
     */
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

    private function callOpenAi(string $apiKey, string $model, string $inputType, array $payload, string $prompt): string
    {
        // Audio: transcribe first, then a text extraction pass. That is two
        // upstream calls by necessity (OpenAI has no single audio->JSON path);
        // Gemini remains the single-request provider for voice memos.
        if ($inputType === 'audio') {
            $transcript = $this->openAiTranscribe($apiKey, $payload);
            $prompt .= "\n\n[TRANSCRIBED VOICE MEMO]\n" . $transcript;
            $content = $prompt;
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
                'messages'              => [['role' => 'user', 'content' => $content]],
            ]);

        if ($response->failed()) {
            $this->throwProviderError('OpenAI', $response->status(), $response->body(), $response->header('Retry-After'));
        }

        $promptTokens = (int) ($response->json('usage.prompt_tokens') ?? 0);
        $completionTokens = (int) ($response->json('usage.completion_tokens') ?? 0);

        $this->lastUsage = [
            'prompt_tokens' => $promptTokens,
            'output_tokens' => $completionTokens,
            'total_tokens'  => $response->json('usage.total_tokens'),
        ];

        try {
            $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
            app(\App\Services\Ai\AiUsageRecorder::class)->record([
                'tenant_id'       => $tenant?->id,
                'feature'         => 'scan',
                'provider'        => 'openai',
                'model'           => $model,
                'key_mode'        => 'platform_paid',
                'input_type'      => $inputType,
                'prompt_tokens'   => $promptTokens,
                'output_tokens'   => $completionTokens,
                'success'         => true,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to record OpenAI ai_usage_event: " . $e->getMessage());
        }

        $text = $response->json('choices.0.message.content');
        if (!$text) {
            throw new \Exception('Empty response from OpenAI.');
        }

        return $text;
    }

    private function openAiTranscribe(string $apiKey, array $payload): string
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

    private function callAnthropic(string $apiKey, string $model, string $inputType, array $payload, string $prompt): string
    {
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

        $promptTokens = (int) ($response->json('usage.input_tokens') ?? 0);
        $completionTokens = (int) ($response->json('usage.output_tokens') ?? 0);

        $this->lastUsage = [
            'prompt_tokens' => $promptTokens,
            'output_tokens' => $completionTokens,
        ];

        try {
            $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
            app(\App\Services\Ai\AiUsageRecorder::class)->record([
                'tenant_id'       => $tenant?->id,
                'feature'         => 'scan',
                'provider'        => 'anthropic',
                'model'           => $model,
                'key_mode'        => 'platform_paid',
                'input_type'      => $inputType,
                'prompt_tokens'   => $promptTokens,
                'output_tokens'   => $completionTokens,
                'success'         => true,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to record Anthropic ai_usage_event: " . $e->getMessage());
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

    private function callDeepSeek(string $apiKey, string $model, string $inputType, array $payload, string $prompt): string
    {
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

        $promptTokens = (int) ($response->json('usage.prompt_tokens') ?? 0);
        $completionTokens = (int) ($response->json('usage.completion_tokens') ?? 0);

        $this->lastUsage = [
            'prompt_tokens' => $promptTokens,
            'output_tokens' => $completionTokens,
        ];

        try {
            $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
            app(\App\Services\Ai\AiUsageRecorder::class)->record([
                'tenant_id'       => $tenant?->id,
                'feature'         => 'scan',
                'provider'        => 'deepseek',
                'model'           => $model,
                'key_mode'        => 'platform_paid',
                'input_type'      => $inputType,
                'prompt_tokens'   => $promptTokens,
                'output_tokens'   => $completionTokens,
                'success'         => true,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to record DeepSeek ai_usage_event: " . $e->getMessage());
        }

        $text = $response->json('choices.0.message.content');
        if (!$text) {
            throw new \Exception('Empty response from DeepSeek.');
        }

        return $text;
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

    // ─────────────────────────────────────────────────────────────────────────
    // Prompt & parsing
    // ─────────────────────────────────────────────────────────────────────────

    private function parseJson(string $text): array
    {
        $clean = trim($text);

        if (str_starts_with($clean, '```')) {
            $clean = preg_replace('/^```(?:json)?/i', '', $clean);
            $clean = preg_replace('/```$/', '', $clean);
            $clean = trim($clean);
        }

        // Salvage: grab the outermost JSON object if the model added prose around it
        if (!str_starts_with($clean, '{')) {
            $start = strpos($clean, '{');
            $end   = strrpos($clean, '}');
            if ($start !== false && $end !== false && $end > $start) {
                $clean = substr($clean, $start, $end - $start + 1);
            }
        }

        $decoded = json_decode($clean, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            throw new \Exception('The AI response could not be read as structured data. Try scanning again with a clearer photo.');
        }

        return $this->normalizeTerseResult($decoded);
    }

    /**
     * Map short terse schema keys (a, pt, d, rf, dc, it, n, q, p, t, sc, c)
     * back to normalized internal shape.
     */
    private function normalizeTerseResult(array $data): array
    {
        $itemsRaw = $data['it'] ?? $data['items'] ?? [];
        $items = [];

        foreach ($itemsRaw as $item) {
            $items[] = [
                'name'          => $item['n'] ?? $item['name'] ?? '',
                'qty'           => isset($item['q']) ? (float) $item['q'] : (isset($item['qty']) ? (float) $item['qty'] : 1.0),
                'unit_price'    => isset($item['p']) ? (float) $item['p'] : (isset($item['unit_price']) ? (float) $item['unit_price'] : null),
                'line_total'    => isset($item['t']) ? (float) $item['t'] : (isset($item['line_total']) ? (float) $item['line_total'] : null),
                'supplier_code' => $item['sc'] ?? $item['supplier_code'] ?? null,
                'confidence'    => (int) ($item['c'] ?? $item['confidence'] ?? 80),
            ];
        }

        return [
            'action'              => $data['a'] ?? $data['action'] ?? 'purchase',
            'party'               => $data['pt'] ?? $data['party'] ?? null,
            'date'                => $data['d'] ?? $data['date'] ?? null,
            'reference'           => $data['rf'] ?? $data['reference'] ?? null,
            'document_confidence' => (int) ($data['dc'] ?? $data['document_confidence'] ?? 80),
            'items'               => $items,
        ];
    }

    private function buildPrompt(string $inputType, ?string $targetType, ?string $customCommand, array $context): string
    {
        $sourceDescription = match ($inputType) {
            'image' => "You will receive one or more photos/scans (up to 5) that together form ONE business document — a printed OR HANDWRITTEN receipt, invoice, bill, delivery note, order list, ledger page or scribbled note. Multiple images are pages/sections of the SAME document: merge them into a single result and do NOT duplicate line items that appear across overlapping photos.",
            'audio' => "You will receive a voice memo. Transcribe it carefully (it may be in any language or mix languages) and extract the transaction it describes.",
            default => "You will receive raw text (typed or pasted) describing a business transaction — it may be an itemised list, a copied invoice, chat message, or free-form note.",
        };

        $prompt = "You are a precise data extraction engine for a retail POS and ERP system.\n"
            . $sourceDescription . "\n"
            . "Return ONLY a valid JSON object. No explanation. No markdown fences.\n"
            . "Output structure using terse short keys:\n"
            . "{\n"
            . "  \"a\": \"purchase\" | \"sale\" | \"expense\" | \"return\" | \"proposal\" | \"pre_invoice\" | \"pre_purchase\" | \"recurring_invoice\" | \"purchase_return\",\n"
            . "  \"pt\": \"supplier or customer name, or null\",\n"
            . "  \"d\": \"YYYY-MM-DD or null\",\n"
            . "  \"rf\": \"invoice/bill/receipt number or null\",\n"
            . "  \"dc\": 0-100 — document confidence,\n"
            . "  \"it\": [\n"
            . "    {\n"
            . "      \"n\": \"item name as written\",\n"
            . "      \"q\": number,\n"
            . "      \"p\": number or null,\n"
            . "      \"t\": number or null,\n"
            . "      \"sc\": supplier item code or null,\n"
            . "      \"c\": 0-100 — confidence\n"
            . "    }\n"
            . "  ]\n"
            . "}\n\n"
            . "ACTION MAPPING RULES:\n"
            . "- 'purchase'          : bill/invoice FROM a supplier (goods received).\n"
            . "- 'sale'              : checkout ticket / customer receipt / invoice TO a customer.\n"
            . "- 'expense'           : operating expense (electricity, rent, internet, fuel, salaries, fees).\n"
            . "- 'return'            : customer return / credit note.\n"
            . "- 'proposal'          : quote/estimate for a customer.\n"
            . "- 'pre_invoice'       : sales order / booking confirmation.\n"
            . "- 'pre_purchase'      : purchase order TO a supplier (goods not yet received).\n"
            . "- 'recurring_invoice' : recurring/subscription invoice template.\n"
            . "- 'purchase_return'   : debit note / return to supplier.\n\n"
            . "HANDWRITING PROTOCOL (apply to every handwritten source):\n"
            . "1. Establish the column layout first — most handwritten bills are [item] [qty] [rate] [amount], but some are [item] [amount] only. Decide which before reading values.\n"
            . "2. Read the whole column top-to-bottom before committing to any digit. A writer's '7' is consistent down the page; use their other digits as a key.\n"
            . "3. Arithmetic is your proof-reader. For each row check qty x unit_price = line_total. If it does not hold, re-read the least legible of the three numbers and correct it so the row balances.\n"
            . "4. Cross-check the column sum against any written subtotal/total. If your extracted lines do not add up to the written total, re-examine the lines rather than inventing an adjustment.\n"
            . "5. Common handwriting confusions to resolve using row arithmetic and the catalog: 1/7, 0/6/8, 3/8, 5/6, 2/7, 4/9, and a trailing '/-' or '=' meaning 'rupees'.\n"
            . "6. Local numeral forms (Urdu/Arabic-Indic ٠١٢٣٤٥٦٧٨٩, Devanagari ०१२३४५६७८९) must be converted to Western digits.\n"
            . "7. Do not merge two short lines into one item, and do not split one item across two lines because it wrapped.\n\n"
            . "EXTRACTION ACCURACY RULES (CRITICAL):\n"
            . "- If a line total and quantity are visible but unit price is not, derive unit_price = line_total / qty.\n"
            . "- If quantity is not visible/spoken, use 1. If unit price is truly unknown, use null.\n"
            . "- Capture EVERY line item. Do not skip small or partially legible lines; extract your best reading.\n"
            . "- Never invent products, parties, prices or quantities that are not in the source.\n"
            . "- Ignore non-item lines like subtotal, tax, total, discount, thank-you notes and shop slogans — but use them to validate your numbers.\n"
            . "- Dates: interpret ambiguous formats using the day-first convention unless the document clearly shows otherwise, and never return a date in the future.\n"
            . "- Set confidence per item honestly. A confident wrong answer costs the user money; an honest low score simply asks them to glance at it.";

        if ($targetType) {
            $prompt .= "\n\n[TARGET DOCUMENT TYPE]\nThe user explicitly requested to create a '{$targetType}'. You MUST set \"action\" to exactly '{$targetType}'.";
        }

        if (!empty($context['document_type'])) {
            $docType = $context['document_type'];
            $prompt .= "\n\n[DOCUMENT FORMAT HINT]\nThe user specified this document is a '{$docType}'. Tailor your extraction specifically for a {$docType}.";
        }

        if (!empty($context['is_handwritten'])) {
            $prompt .= "\n\n[PRIORITY NOTICE: HANDWRITTEN DOCUMENT]\nThis document is explicitly flagged as HANDWRITTEN. Apply extra scrutiny using the HANDWRITING PROTOCOL above.";
        }

        if ($customCommand) {
            $prompt .= "\n\n[USER INSTRUCTIONS]\nRespect these additional user instructions while extracting:\n\"{$customCommand}\"";
        }

        // ── Learned aliases: this store's own corrections, highest authority ──
        $learned = $context['learned_aliases'] ?? [];
        if (!empty($learned)) {
            $prompt .= "\n\n[THIS STORE'S CONFIRMED VOCABULARY]\n"
                . "Staff at this store previously corrected the following readings. These mappings are GROUND TRUTH for this store — they outrank your own guess and the catalog search.\n"
                . json_encode($learned) . "\n"
                . "If a source line matches a \"heard\" value (exactly, phonetically, or as an obvious variant/abbreviation), output that entry's \"name\" verbatim.";
        }

        $existingProducts = $context['existing_products'] ?? [];
        if (!empty($existingProducts)) {
            $prompt .= "\n\n[STORE PRODUCT CATALOG]\n"
                . "This store's catalog:\n"
                . json_encode($existingProducts) . "\n\n"
                . "TRANSLATION & CATALOG MAPPING RULES:\n"
                . "1. The source may be in any language (Urdu, Hindi, Arabic, French, Spanish...) or use local/colloquial words ('pani' = water, 'doodh' = milk, 'aloo' = potato). Translate all item names, party names and descriptions to English.\n"
                . "2. Before finalizing each item name, cross-reference it against the catalog above (exact, phonetic or semantic match).\n"
                . "3. A catalog match must be a genuine match. If guessing, lower item confidence.\n"
                . "4. If no catalog product corresponds, translate the name to English and output it as-is.";
        } else {
            $prompt .= "\n\nTRANSLATION RULES:\nThe source may be in any language. Translate all extracted item names, party names and descriptions to English.";
        }

        $parties = $context['parties'] ?? [];
        if (!empty($parties)) {
            $prompt .= "\n\n[KNOWN CUSTOMERS & SUPPLIERS]\n"
                . json_encode($parties) . "\n"
                . "If the party in the source matches one of these (including phonetic/partial matches), output the EXACT name from this list as \"party\".";
        }

        $categories = $context['expense_categories'] ?? [];
        if (!empty($categories)) {
            $prompt .= "\n\n[EXPENSE CATEGORIES]\n"
                . json_encode($categories) . "\n"
                . "If action is 'expense', set \"expense_category\" to the closest category name from this list (or null if none fits).";
        }

        // ── Party chosen by the user before scanning (SmartCaptureController) ──
        // Telling the model who the document belongs to stops it inventing a
        // party from a letterhead or a slogan, and lets the controller flag a
        // mismatch (e.g. a supplier bill scanned against a chosen customer)
        // instead of silently using the model's own guess.
        $knownParty = $context['known_party'] ?? null;
        if (!empty($knownParty)) {
            $prompt .= "\n\n[PARTY CHOSEN BEFORE SCANNING]\n"
                . "The user has already told us this document belongs to: "
                . json_encode($knownParty) . "\n"
                . "Use this as the party unless the document clearly names a different party — in that case, extract what the document actually says and let the app flag the mismatch.";
        }

        return $prompt;
    }
}
