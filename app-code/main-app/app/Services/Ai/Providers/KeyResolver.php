<?php

namespace App\Services\Ai\Providers;

use App\Models\Setting;
use App\Models\Tenant;

class KeyResolver
{
    /**
     * Resolve the effective API key, provider, model, and key mode for an AI request.
     * Single unified chain replacing the four historical chains.
     *
     * @return array{api_key: ?string, provider: string, model: string, key_mode: string}
     *         key_mode: 'byok' | 'platform_paid' | 'platform_free'
     */
    public function resolve(
        ?Tenant $tenant = null,
        ?string $feature = null,
        ?string $entitlementMode = null,
        ?string $requestedProvider = null,
        ?string $requestedModel = null
    ): array {
        $feature = $feature ?: 'default';

        // 1. Tenant BYOK Check (strictly tenant-scoped)
        if ($tenant) {
            $tenantSettings = Setting::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->whereIn('key', [
                    'smartcapture_api_key', 'smartcapture_provider', 'smartcapture_model',
                    'chatbot_api_key',
                    'openai_api_key', 'ai_provider', 'ai_model',
                ])
                ->pluck('value', 'key');

            $byokKey = $tenantSettings->get('smartcapture_api_key')
                ?: $tenantSettings->get('openai_api_key')
                ?: $tenantSettings->get('chatbot_api_key');

            if (!empty($byokKey)) {
                $provider = $requestedProvider
                    ?: $tenantSettings->get('smartcapture_provider')
                    ?: $tenantSettings->get('ai_provider');

                if (!$provider) {
                    $provider = (str_starts_with($byokKey, 'sk-') && !str_starts_with($byokKey, 'AIza')) ? 'openai' : 'gemini';
                }

                $model = $requestedModel
                    ?: $tenantSettings->get('smartcapture_model')
                    ?: $tenantSettings->get('ai_model')
                    ?: config("ai_models.{$feature}.model", 'gemini-2.5-flash-lite');

                return [
                    'api_key'  => trim($byokKey),
                    'provider' => strtolower($provider),
                    'model'    => $model,
                    'key_mode' => 'byok',
                ];
            }
        }

        // 2. Platform Key Resolution (Managed or Free)
        $profile = config("ai_models.{$feature}") ?? config('ai_models.default', []);
        $provider = strtolower($requestedProvider ?: ($profile['provider'] ?? 'gemini'));
        $model = $requestedModel ?: ($profile['model'] ?? 'gemini-2.5-flash-lite');

        // Staff operations operate on real tenant data and resolve to the platform paid key.
        // Free tier is strictly reserved for trial/free allowance and public marketing tools.
        $isFreeTier = in_array($entitlementMode, ['free', 'public_tool'], true)
            || $feature === 'public_tool';

        if ($isFreeTier) {
            $apiKey = config('smartcapture.free_api_key')
                ?: (config('smartcapture.gemini_key') ?: env('GEMINI_API_KEY') ?: config('smartcapture.api_key'));
            $keyMode = 'platform_free';
        } else {
            if ($provider === 'gemini') {
                $apiKey = config('smartcapture.gemini_key')
                    ?: env('GEMINI_API_KEY')
                    ?: config('services.gemini.key')
                    ?: config('smartcapture.api_key');
            } elseif ($provider === 'openai') {
                $apiKey = config('services.openai.key')
                    ?: env('OPENAI_API_KEY')
                    ?: config('smartcapture.api_key');
            } elseif ($provider === 'anthropic') {
                $apiKey = config('services.anthropic.key') ?: env('ANTHROPIC_API_KEY');
            } elseif ($provider === 'deepseek') {
                $apiKey = config('services.deepseek.key') ?: env('DEEPSEEK_API_KEY');
            } else {
                $apiKey = config('smartcapture.gemini_key') ?: env('GEMINI_API_KEY');
            }
            $keyMode = 'platform_paid';
        }

        return [
            'api_key'  => $apiKey ? trim($apiKey) : null,
            'provider' => $provider,
            'model'    => $model,
            'key_mode' => $keyMode,
        ];
    }
}
