<?php

namespace App\Services\SmartCapture;

use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiExtractionService
{
    /**
     * Resolve the API Key to use (custom setting first, fallback to env).
     */
    private function getApiKey(): ?string
    {
        return SettingsHelper::get('chatbot_api_key') 
            ?? SettingsHelper::get('openai_api_key')
            ?? config('smartcapture.gemini_key')
            ?? env('GEMINI_API_KEY')
            ?? env('CHATBOT_API_KEY')
            ?? env('OPENAI_API_KEY');
    }

    /**
     * Extract transaction details from a base64 encoded image or PDF.
     */
    public function extractFromImage(string $base64Image, string $mimeType, ?string $targetType = null, ?string $customCommand = null, array $existingProducts = []): array
    {
        $apiKey = $this->getApiKey();
        if (!$apiKey) {
            throw new \Exception("Gemini API key is not configured.");
        }

        $preferredModel = config('smartcapture.model', 'gemini-2.5-flash');
        $modelsToTry = array_unique([
            $preferredModel,
            'gemini-2.5-flash',
            'gemini-2.5-flash-lite',
            'gemini-3.5-flash',
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite'
        ]);

        $prompt = $this->imagePrompt($targetType, $customCommand, $existingProducts);
        $lastException = null;

        foreach ($modelsToTry as $model) {
            try {
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

                $response = Http::timeout(30)
                    ->post($url, [
                        'contents' => [[
                            'parts' => [
                                [
                                    'inline_data' => [
                                        'mime_type' => $mimeType,
                                        'data' => $base64Image
                                    ]
                                ],
                                ['text' => $prompt]
                            ]
                        ]],
                        'generationConfig' => [
                            'temperature' => 0.0,
                            'maxOutputTokens' => 1500,
                        ]
                    ]);

                if ($response->failed()) {
                    throw new \Exception("Gemini Extraction Request failed with status: " . $response->status() . " Body: " . $response->body());
                }

                $rawText = $response->json('candidates.0.content.parts.0.text');
                if (!$rawText) {
                    throw new \Exception("Empty response from Gemini.");
                }

                return $this->parseJson($rawText);

            } catch (\Exception $e) {
                $lastException = $e;
                Log::warning("SmartCapture Gemini Image Extraction failed for [{$model}] — " . $e->getMessage());
                continue;
            }
        }

        Log::error("SmartCapture Gemini Image Extraction failed: " . ($lastException ? $lastException->getMessage() : 'unknown'));
        throw $lastException ?? new \Exception("All Gemini models failed to extract data from image.");
    }

    /**
     * Extract transaction details from a base64 encoded audio memo.
     */
    public function extractFromAudio(string $base64Audio, string $mimeType, ?string $targetType = null, ?string $customCommand = null, array $existingProducts = []): array
    {
        $apiKey = $this->getApiKey();
        if (!$apiKey) {
            throw new \Exception("Gemini API key is not configured.");
        }

        $preferredModel = config('smartcapture.model', 'gemini-2.5-flash');
        $modelsToTry = array_unique([
            $preferredModel,
            'gemini-2.5-flash',
            'gemini-2.5-flash-lite',
            'gemini-3.5-flash',
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite'
        ]);

        $prompt = $this->audioPrompt($targetType, $customCommand, $existingProducts);
        $lastException = null;

        foreach ($modelsToTry as $model) {
            try {
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

                $response = Http::timeout(30)
                    ->post($url, [
                        'contents' => [[
                            'parts' => [
                                [
                                    'inline_data' => [
                                        'mime_type' => $mimeType,
                                        'data' => $base64Audio
                                    ]
                                ],
                                ['text' => $prompt]
                            ]
                        ]],
                        'generationConfig' => [
                            'temperature' => 0.0,
                            'maxOutputTokens' => 1000,
                        ]
                    ]);

                if ($response->failed()) {
                    throw new \Exception("Gemini Audio Extraction Request failed with status: " . $response->status() . " Body: " . $response->body());
                }

                $rawText = $response->json('candidates.0.content.parts.0.text');
                if (!$rawText) {
                    throw new \Exception("Empty response from Gemini.");
                }

                return $this->parseJson($rawText);

            } catch (\Exception $e) {
                $lastException = $e;
                Log::warning("SmartCapture Gemini Audio Extraction failed for [{$model}] — " . $e->getMessage());
                continue;
            }
        }

        Log::error("SmartCapture Gemini Audio Extraction failed: " . ($lastException ? $lastException->getMessage() : 'unknown'));
        throw $lastException ?? new \Exception("All Gemini models failed to extract data from audio.");
    }

    /**
     * Clean and parse json response from Gemini text output.
     */
    private function parseJson(string $text): array
    {
        $clean = trim($text);
        
        // Strip markdown code fences if present
        if (str_starts_with($clean, '```')) {
            $clean = preg_replace('/^```(?:json)?/i', '', $clean);
            $clean = preg_replace('/```$/', '', $clean);
            $clean = trim($clean);
        }

        $decoded = json_decode($clean, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("Failed to parse extracted text to JSON. Content: " . $text);
        }

        return $decoded;
    }

    /**
     * Prompt for parsing bill/invoice snap.
     */
    private function imagePrompt(?string $targetType = null, ?string $customCommand = null, array $existingProducts = []): string
    {
        $prompt = "You are a data extraction engine for a retail POS and ERP system.\n"
            . "Analyze this invoice or receipt image and return ONLY a valid JSON. No explanation. No markdown fences.\n"
            . "Ensure the output exactly follows this structure:\n"
            . "{\n"
            . "  \"action\": \"purchase\" or \"sale\" or \"expense\" or \"return\" or \"proposal\" or \"pre_invoice\" or \"pre_purchase\" or \"recurring_invoice\" or \"purchase_return\",\n"
            . "  \"party\": \"supplier or customer name, or null\",\n"
            . "  \"items\": [\n"
            . "    { \"name\": \"product name as written\", \"qty\": number, \"unit_price\": number or null }\n"
            . "  ]\n"
            . "}\n\n"
            . "Rules:\n"
            . "- Map to 'purchase' if this is a bill or invoice from a supplier.\n"
            . "- Map to 'sale' if this is a checkout ticket or customer receipt.\n"
            . "- Map to 'expense' if it's an operating expense like electricity, rent, internet or fuel.\n"
            . "- Map to 'return' if it's a return note or credit note.\n"
            . "- Map to 'proposal' if it's a proposal or quote for a customer.\n"
            . "- Map to 'pre_invoice' if it's a sales order or booking confirmation.\n"
            . "- Map to 'pre_purchase' if it's a purchase order to a supplier.\n"
            . "- Map to 'recurring_invoice' if it's a template for recurring customer invoices.\n"
            . "- Map to 'purchase_return' if it's a debit note or return to a supplier.\n"
            . "- Extract quantity exactly. If not visible, return 1.\n"
            . "- Extract unit price exactly. If not visible, return null.\n"
            . "- Never invent products, parties, or numbers. Return null for fields that are missing.";

        if ($targetType) {
            $prompt .= "\n\n[TARGET DOCUMENT TYPE OPTION]\n"
                . "The user explicitly requested to create a: '{$targetType}'. Therefore, you MUST set the \"action\" field to exactly '{$targetType}' in the JSON output.";
        }

        if ($customCommand) {
            $prompt .= "\n\n[USER COMMANDS / INSTRUCTIONS]\n"
                . "The user gave these additional instructions. Please respect them while extracting the data:\n"
                . "\"{$customCommand}\"";
        }

        if (!empty($existingProducts)) {
            $prompt .= "\n\n[EXISTING STORE PRODUCTS DATABASE]\n"
                . "The user's database contains these existing products (names and SKUs):\n"
                . json_encode($existingProducts) . "\n\n"
                . "CRITICAL TRANSLATION & MAPPING RULES:\n"
                . "1. The receipt/invoice image might be written in a language other than English (e.g. Urdu, Hindi, French, Spanish, Arabic, etc.) or contain handwritten/local words (e.g. 'pani' for water, 'doodh' for milk, 'allo' for potato).\n"
                . "2. You MUST translate all extracted item names, party names, and descriptions to English.\n"
                . "3. However, before finalizing the translated item name, cross-reference it against the list of EXISTING STORE PRODUCTS above.\n"
                . "   - If the item in the receipt/memo corresponds to one of the products in the database list (either by exact translation, phonetic match, or semantic meaning), you MUST map and set the \"name\" of the item to match the EXACT product name from the database list.\n"
                . "   - For example, if the receipt has 'pani' or 'water' and the database list has a product named 'Water Bottle 500ml', you must output 'Water Bottle 500ml' as the item name.\n"
                . "4. If there is no corresponding product in the database, translate the item name to English and output it as is.";
        } else {
            $prompt .= "\n\nTRANSLATION RULES:\n"
                . "The receipt/invoice image might be written in a language other than English (e.g. Urdu, Hindi, French, Spanish). You MUST translate all extracted item names, party names, and descriptions to English in your JSON output.";
        }

        return $prompt;
    }

    /**
     * Prompt for parsing spoken memo audio.
     */
    private function audioPrompt(?string $targetType = null, ?string $customCommand = null, array $existingProducts = []): string
    {
        $prompt = "You are a data extraction engine for a retail POS and ERP system.\n"
            . "Listen to this voice memo or audio clip, transcribe it, and return ONLY a valid JSON. No explanation. No markdown fences.\n"
            . "Ensure the output exactly follows this structure:\n"
            . "{\n"
            . "  \"action\": \"purchase\" or \"sale\" or \"expense\" or \"return\" or \"proposal\" or \"pre_invoice\" or \"pre_purchase\" or \"recurring_invoice\" or \"purchase_return\",\n"
            . "  \"party\": \"supplier or customer name, or null\",\n"
            . "  \"items\": [\n"
            . "    { \"name\": \"product name as spoken\", \"qty\": number, \"unit_price\": number or null }\n"
            . "  ]\n"
            . "}\n\n"
            . "Identify intent keywords to choose 'action':\n"
            . "- 'bought', 'purchased', 'got from', 'invoice from' -> 'purchase'\n"
            . "- 'sold', 'checkout', 'sale to', 'customer bought' -> 'sale'\n"
            . "- 'paid for', 'utility', 'electricity', 'rent', 'petrol', 'fuel' -> 'expense'\n"
            . "- 'returned', 'customer return', 'refund item' -> 'return'\n"
            . "- 'proposal', 'quote', 'estimate' -> 'proposal'\n"
            . "- 'pre invoice', 'sales order', 'booking' -> 'pre_invoice'\n"
            . "- 'pre purchase', 'purchase order' -> 'pre_purchase'\n"
            . "- 'recurring invoice', 'subscription' -> 'recurring_invoice'\n"
            . "- 'purchase return', 'supplier return', 'debit note' -> 'purchase_return'\n\n"
            . "Rules:\n"
            . "- If quantity is not spoken, assume 1.\n"
            . "- If unit price is not spoken, return null.\n"
            . "- Never guess quantities or insert products not present in the audio.";

        if ($targetType) {
            $prompt .= "\n\n[TARGET DOCUMENT TYPE OPTION]\n"
                . "The user explicitly requested to create a: '{$targetType}'. Therefore, you MUST set the \"action\" field to exactly '{$targetType}' in the JSON output.";
        }

        if ($customCommand) {
            $prompt .= "\n\n[USER COMMANDS / INSTRUCTIONS]\n"
                . "The user gave these additional instructions. Please respect them while extracting the data:\n"
                . "\"{$customCommand}\"";
        }

        if (!empty($existingProducts)) {
            $prompt .= "\n\n[EXISTING STORE PRODUCTS DATABASE]\n"
                . "The user's database contains these existing products (names and SKUs):\n"
                . json_encode($existingProducts) . "\n\n"
                . "CRITICAL TRANSLATION & MAPPING RULES:\n"
                . "1. The voice memo/audio clip might be spoken in a language other than English (e.g. Urdu, Hindi, French, Spanish, Arabic, etc.) or contain spoken local/colloquial words (e.g. 'pani' for water, 'doodh' for milk, 'allo' for potato).\n"
                . "2. You MUST translate all extracted item names, party names, and descriptions to English.\n"
                . "3. However, before finalizing the translated item name, cross-reference it against the list of EXISTING STORE PRODUCTS above.\n"
                . "   - If the item in the receipt/memo corresponds to one of the products in the database list (either by exact translation, phonetic match, or semantic meaning), you MUST map and set the \"name\" of the item to match the EXACT product name from the database list.\n"
                . "   - For example, if the speaker says 'pani' or 'water' and the database list has a product named 'Water Bottle 500ml', you must output 'Water Bottle 500ml' as the item name.\n"
                . "4. If there is no corresponding product in the database, translate the item name to English and output it as is.";
        } else {
            $prompt .= "\n\nTRANSLATION RULES:\n"
                . "The voice memo/audio clip might be spoken in a language other than English (e.g. Urdu, Hindi, French, Spanish). You MUST translate all extracted item names, party names, and descriptions to English in your JSON output.";
        }

        return $prompt;
    }
}
