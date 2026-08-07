<?php

namespace App\Http\Controllers;

use App\Helpers\SettingsHelper;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChatbotSettingsController extends Controller
{
    /**
     * Render the dedicated Chatbot Settings page in the owner dashboard.
     */
    public function index()
    {
        $globalSettings = Setting::withoutGlobalScopes()->whereNull('tenant_id')->pluck('value', 'key');

        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $messages = \App\Models\ChatMessage::where('sender_type', \App\Models\ChatMessage::SENDER_BOT)
            ->where('metadata->api_key_type', 'global')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->get();

        $inputTokens = 0;
        $outputTokens = 0;
        $modelBreakdown = [];

        foreach ($messages as $msg) {
            $meta = $msg->metadata ?? [];
            $input = (int) ($meta['prompt_tokens'] ?? 0);
            $output = (int) ($meta['completion_tokens'] ?? 0);
            $model = $meta['model'] ?? 'unknown';

            $inputTokens += $input;
            $outputTokens += $output;

            if ($input > 0 || $output > 0) {
                $modelBreakdown[$model] = ($modelBreakdown[$model] ?? 0) + $input + $output;
            }
        }

        $totalTokens = $inputTokens + $outputTokens;
        $estimatedCost = ($inputTokens * 0.075 / 1000000) + ($outputTokens * 0.30 / 1000000);

        return Inertia::render('Settings/ChatbotSettings', [
            'settings' => [
                'chatbot_api_key'      => $globalSettings->get('chatbot_api_key', ''),
                'chatbot_custom_rules' => $globalSettings->get('chatbot_custom_rules', ''),
            ],
            'usageStats' => [
                'input_tokens' => $inputTokens,
                'output_tokens' => $outputTokens,
                'total_tokens' => $totalTokens,
                'estimated_cost' => round($estimatedCost, 6),
                'billing_cycle' => now()->format('F Y'),
                'models' => $modelBreakdown,
            ],
            'context' => 'platform', // This is the VenQore company-level support bot
        ]);
    }

    /**
     * Update the chatbot settings in the database.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'chatbot_api_key' => 'nullable|string|max:255',
            'chatbot_custom_rules' => 'nullable|string|max:5000',
        ]);

        // Save settings securely for global context (tenant_id = null)
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['key' => 'chatbot_api_key', 'tenant_id' => null],
            ['value' => $data['chatbot_api_key'] ?? '']
        );

        Setting::withoutGlobalScopes()->updateOrCreate(
            ['key' => 'chatbot_custom_rules', 'tenant_id' => null],
            ['value' => $data['chatbot_custom_rules'] ?? '']
        );

        // Clear settings cache
        \Illuminate\Support\Facades\Cache::forget('settings:global');
        \Illuminate\Support\Facades\Cache::forget('settings:system_defaults');

        return back()->with('success', 'Chatbot settings updated successfully.');
    }

    /**
     * Test the AI connection with the provided API key.
     */
    public function testConnection(Request $request)
    {
        $request->validate([
            'api_key' => 'required|string',
        ]);

        $apiKey = $request->input('api_key');

        $modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
        $lastError = null;
        $success = false;

        foreach ($modelsToTry as $model) {
            try {
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
                $response = \Illuminate\Support\Facades\Http::timeout(8)
                    ->post($url, [
                        'contents' => [
                            [
                                'role' => 'user',
                                'parts' => [
                                    ['text' => 'Ping']
                                ]
                            ]
                        ]
                    ]);

                if ($response->successful()) {
                    $success = true;
                    break;
                }

                $errorData = $response->json();
                $lastError = $errorData['error']['message'] ?? 'API connection failed with status code ' . $response->status();
            } catch (\Exception $e) {
                $lastError = $e->getMessage();
            }
        }

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Connection verified successfully!',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $lastError ?? 'Verification failed.',
        ], 400);
    }
}

