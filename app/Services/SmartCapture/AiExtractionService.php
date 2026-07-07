<?php

namespace App\Services\SmartCapture;

use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AiExtractionService — multi-provider AI extraction engine for SmartCapture (AI Scan).
 *
 * Supports: Gemini, OpenAI, Anthropic (Claude), DeepSeek.
 * BYOK: each store (tenant) can configure its own provider + API key + model via
 * tenant-scoped Settings (smartcapture_provider / smartcapture_api_key / smartcapture_model).
 * Falls back to the legacy chatbot key (treated as Gemini) and then the platform key.
 *
 * Input types:
 *  - image : one to N (config max_files) base64 images / PDFs, treated as pages of ONE document
 *  - audio : a single base64 audio clip (recorded or uploaded)
 *  - text  : raw pasted / typed text
 */
class AiExtractionService
{
    /**
     * Resolve the effective AI configuration for the current tenant.
     *
     * @return array{provider:string, api_key:?string, model:string, byok:bool}
     */
    public function resolveConfig(): array
    {
        // 1. Dedicated per-store SmartCapture settings (BYOK)
        $tenantKey      = SettingsHelper::get('smartcapture_api_key');
        $tenantProvider = SettingsHelper::get('smartcapture_provider');
        $tenantModel    = SettingsHelper::get('smartcapture_model');

        if (!empty($tenantKey)) {
            $provider = $this->normalizeProvider($tenantProvider ?: 'gemini');
            return [
                'provider' => $provider,
                'api_key'  => $tenantKey,
                'model'    => $tenantModel ?: config("smartcapture.default_models.{$provider}"),
                'byok'     => true,
            ];
        }

        // 2. Legacy tenant chatbot key (historically a Gemini key)
        $legacyKey = SettingsHelper::get('chatbot_api_key') ?? SettingsHelper::get('openai_api_key');
        if (!empty($legacyKey)) {
            return [
                'provider' => 'gemini',
                'api_key'  => $legacyKey,
                'model'    => config('smartcapture.default_models.gemini'),
                'byok'     => true,
            ];
        }

        // 3. Platform-level fallback
        $provider = $this->normalizeProvider(config('smartcapture.provider', 'gemini'));
        $key = $provider === 'gemini'
            ? (config('smartcapture.gemini_key') ?: config('smartcapture.api_key'))
            : config('smartcapture.api_key');
        $key = $key ?: env('GEMINI_API_KEY') ?: env('CHATBOT_API_KEY') ?: env('OPENAI_API_KEY');

        return [
            'provider' => $provider,
            'api_key'  => $key,
            'model'    => config('smartcapture.model') ?: config("smartcapture.default_models.{$provider}"),
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

    /**
     * Extract structured transaction data.
     *
     * @param string $inputType 'image' | 'audio' | 'text'
     * @param array  $payload   image => [['base64'=>..,'mime'=>..], ...] (max 5)
     *                          audio => ['base64'=>..,'mime'=>..]
     *                          text  => ['text'=>..]
     * @param array  $context   ['existing_products'=>[], 'parties'=>[], 'expense_categories'=>[]]
     */
    public function extract(
        string $inputType,
        array $payload,
        ?string $targetType = null,
        ?string $customCommand = null,
        array $context = []
    ): array {
        $config = $this->resolveConfig();

        if (empty($config['api_key'])) {
            throw new \Exception('No AI API key is configured. Add your own key in AI Scan settings.');
        }

        if (!config("smartcapture.capabilities.{$config['provider']}.{$inputType}", false)) {
            $pretty = ucfirst($config['provider']);
            throw new \Exception("{$pretty} does not support {$inputType} input. Switch the AI provider in AI Scan settings (Gemini supports photos, audio and text).");
        }

        $prompt = $this->buildPrompt($inputType, $targetType, $customCommand, $context);

        $models = array_values(array_unique(array_filter(array_merge(
            [$config['model']],
            config("smartcapture.fallback_models.{$config['provider']}", [])
        ))));

        $lastException = null;

        foreach ($models as $model) {
            try {
                $raw = match ($config['provider']) {
                    'gemini'    => $this->callGemini($config['api_key'], $model, $inputType, $payload, $prompt),
                    'openai'    => $this->callOpenAi($config['api_key'], $model, $inputType, $payload, $prompt),
                    'anthropic' => $this->callAnthropic($config['api_key'], $model, $inputType, $payload, $prompt),
                    'deepseek'  => $this->callDeepSeek($config['api_key'], $model, $inputType, $payload, $prompt),
                    default     => throw new \Exception("Unsupported provider: {$config['provider']}"),
                };

                return $this->parseJson($raw);
            } catch (\Exception $e) {
                $lastException = $e;
                Log::warning("SmartCapture [{$config['provider']}/{$model}] {$inputType} extraction failed — " . $e->getMessage());
                continue;
            }
        }

        Log::error("SmartCapture extraction failed on all models ({$config['provider']}): " . ($lastException?->getMessage() ?? 'unknown'));
        throw $lastException ?? new \Exception('AI extraction failed on all configured models.');
    }

    /**
     * Lightweight connectivity test for the settings screen. Returns ['ok'=>bool,'message'=>string].
     */
    public function testConnection(string $provider, string $apiKey, ?string $model = null): array
    {
        $provider = $this->normalizeProvider($provider);
        $model = $model ?: config("smartcapture.default_models.{$provider}");

        try {
            $raw = match ($provider) {
                'gemini'    => $this->callGemini($apiKey, $model, 'text', ['text' => 'ping'], 'Reply with exactly this JSON: {"ok": true}'),
                'openai'    => $this->callOpenAi($apiKey, $model, 'text', ['text' => 'ping'], 'Reply with exactly this JSON: {"ok": true}'),
                'anthropic' => $this->callAnthropic($apiKey, $model, 'text', ['text' => 'ping'], 'Reply with exactly this JSON: {"ok": true}'),
                'deepseek'  => $this->callDeepSeek($apiKey, $model, 'text', ['text' => 'ping'], 'Reply with exactly this JSON: {"ok": true}'),
            };
            return ['ok' => true, 'message' => "Connected to {$provider} ({$model}) successfully."];
        } catch (\Exception $e) {
            return ['ok' => false, 'message' => 'Connection failed: ' . $e->getMessage()];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Provider transports
    // ─────────────────────────────────────────────────────────────────────────

    private function callGemini(string $apiKey, string $model, string $inputType, array $payload, string $prompt): string
    {
        $parts = [];

        if ($inputType === 'image') {
            foreach ($payload as $file) {
                $parts[] = ['inline_data' => ['mime_type' => $file['mime'], 'data' => $file['base64']]];
            }
        } elseif ($inputType === 'audio') {
            $parts[] = ['inline_data' => ['mime_type' => $payload['mime'], 'data' => $payload['base64']]];
        } else {
            $prompt .= "\n\n[USER PROVIDED TEXT]\n" . ($payload['text'] ?? '');
        }

        $parts[] = ['text' => $prompt];

        $response = Http::timeout(60)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
            [
                'contents' => [['parts' => $parts]],
                'generationConfig' => [
                    'temperature'     => 0.0,
                    'maxOutputTokens' => 3000,
                ],
            ]
        );

        if ($response->failed()) {
            throw new \Exception('Gemini request failed (' . $response->status() . '): ' . mb_substr($response->body(), 0, 300));
        }

        $text = $response->json('candidates.0.content.parts.0.text');
        if (!$text) {
            throw new \Exception('Empty response from Gemini.');
        }

        return $text;
    }

    private function callOpenAi(string $apiKey, string $model, string $inputType, array $payload, string $prompt): string
    {
        // Audio: transcribe with Whisper first, then run a text extraction pass.
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
                        'image_url' => ['url' => "data:{$file['mime']};base64,{$file['base64']}"],
                    ];
                }
            }
        } else {
            $content = $prompt . "\n\n[USER PROVIDED TEXT]\n" . ($payload['text'] ?? '');
        }

        $response = Http::timeout(60)
            ->withToken($apiKey)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model'           => $model,
                'temperature'     => 0.0,
                'response_format' => ['type' => 'json_object'],
                'messages'        => [['role' => 'user', 'content' => $content]],
            ]);

        if ($response->failed()) {
            throw new \Exception('OpenAI request failed (' . $response->status() . '): ' . mb_substr($response->body(), 0, 300));
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

        $response = Http::timeout(60)
            ->withToken($apiKey)
            ->attach('file', $binary, "memo.{$ext}")
            ->post('https://api.openai.com/v1/audio/transcriptions', [
                'model' => 'whisper-1',
            ]);

        if ($response->failed()) {
            throw new \Exception('OpenAI transcription failed (' . $response->status() . '): ' . mb_substr($response->body(), 0, 300));
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

        $response = Http::timeout(60)
            ->withHeaders([
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
            ])
            ->post('https://api.anthropic.com/v1/messages', [
                'model'      => $model,
                'max_tokens' => 3000,
                'messages'   => [['role' => 'user', 'content' => $content]],
            ]);

        if ($response->failed()) {
            throw new \Exception('Anthropic request failed (' . $response->status() . '): ' . mb_substr($response->body(), 0, 300));
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

        $response = Http::timeout(60)
            ->withToken($apiKey)
            ->post('https://api.deepseek.com/chat/completions', [
                'model'           => $model,
                'temperature'     => 0.0,
                'response_format' => ['type' => 'json_object'],
                'messages'        => [[
                    'role'    => 'user',
                    'content' => $prompt . "\n\n[USER PROVIDED TEXT]\n" . ($payload['text'] ?? ''),
                ]],
            ]);

        if ($response->failed()) {
            throw new \Exception('DeepSeek request failed (' . $response->status() . '): ' . mb_substr($response->body(), 0, 300));
        }

        $text = $response->json('choices.0.message.content');
        if (!$text) {
            throw new \Exception('Empty response from DeepSeek.');
        }

        return $text;
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
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Failed to parse AI output as JSON. Raw: ' . mb_substr($text, 0, 300));
        }

        return $decoded;
    }

    private function buildPrompt(string $inputType, ?string $targetType, ?string $customCommand, array $context): string
    {
        $sourceDescription = match ($inputType) {
            'image' => "You will receive one or more photos/scans (up to 5) that together form ONE business document — a printed OR HANDWRITTEN receipt, invoice, bill, order list or note. Multiple images are pages/sections of the SAME document: merge them into a single result and do NOT duplicate line items that appear across overlapping photos.",
            'audio' => "You will receive a voice memo. Transcribe it carefully (it may be in any language or mix languages) and extract the transaction it describes.",
            default => "You will receive raw text (typed or pasted) describing a business transaction — it may be an itemised list, a copied invoice, chat message, or free-form note.",
        };

        $prompt = "You are a precise data extraction engine for a retail POS and ERP system.\n"
            . $sourceDescription . "\n"
            . "Return ONLY a valid JSON object. No explanation. No markdown fences.\n"
            . "Output structure (use null for anything not present — NEVER invent data):\n"
            . "{\n"
            . "  \"action\": \"purchase\" | \"sale\" | \"expense\" | \"return\" | \"proposal\" | \"pre_invoice\" | \"pre_purchase\" | \"recurring_invoice\" | \"purchase_return\",\n"
            . "  \"party\": \"supplier or customer name, or null\",\n"
            . "  \"date\": \"YYYY-MM-DD or null\",\n"
            . "  \"reference\": \"invoice/bill/receipt number or null\",\n"
            . "  \"expense_category\": \"category name if this is an expense, else null\",\n"
            . "  \"notes\": \"any other important info (payment terms, discounts mentioned, etc.) or null\",\n"
            . "  \"items\": [\n"
            . "    { \"name\": \"item name as written/spoken\", \"qty\": number, \"unit_price\": number or null, \"matched_sku\": \"SKU from the store catalog if you are confident it is the same product, else null\" }\n"
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
            . "EXTRACTION ACCURACY RULES (CRITICAL):\n"
            . "- Read handwriting patiently, character by character; use row context (qty × price = total) to disambiguate unclear digits.\n"
            . "- If a line total and quantity are visible but unit price is not, derive unit_price = total / qty.\n"
            . "- If quantity is not visible/spoken, use 1. If unit price is truly unknown, use null.\n"
            . "- Capture EVERY line item. Do not skip small or partially legible lines; extract your best reading of them.\n"
            . "- Never invent products, parties, prices or quantities that are not in the source.\n"
            . "- Ignore non-item lines like subtotal, tax, total, thank-you notes — but use them to validate your numbers.";

        if ($targetType) {
            $prompt .= "\n\n[TARGET DOCUMENT TYPE]\nThe user explicitly requested to create a '{$targetType}'. You MUST set \"action\" to exactly '{$targetType}'.";
        }

        if ($customCommand) {
            $prompt .= "\n\n[USER INSTRUCTIONS]\nRespect these additional user instructions while extracting:\n\"{$customCommand}\"";
        }

        $existingProducts = $context['existing_products'] ?? [];
        if (!empty($existingProducts)) {
            $prompt .= "\n\n[STORE PRODUCT CATALOG]\n"
                . "This store's catalog (name + SKU):\n"
                . json_encode($existingProducts) . "\n\n"
                . "TRANSLATION & CATALOG MAPPING RULES:\n"
                . "1. The source may be in any language (Urdu, Hindi, Arabic, French, Spanish...) or use local/colloquial words ('pani' = water, 'doodh' = milk, 'aloo' = potato). Translate all item names, party names and descriptions to English.\n"
                . "2. Before finalizing each item name, cross-reference it against the catalog above (exact, phonetic or semantic match).\n"
                . "   - If it corresponds to a catalog product, output the EXACT catalog product name as \"name\" AND set \"matched_sku\" to that product's SKU.\n"
                . "   - Example: source says 'pani' and catalog has 'Water Bottle 500ml' → name = 'Water Bottle 500ml', matched_sku = its SKU.\n"
                . "3. If no catalog product corresponds, translate the name to English, output it as-is and set matched_sku to null.";
        } else {
            $prompt .= "\n\nTRANSLATION RULES:\nThe source may be in any language. Translate all extracted item names, party names and descriptions to English. Set matched_sku to null for every item.";
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

        return $prompt;
    }
}
