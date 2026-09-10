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
        
        // Check if platform key was set directly in Hashmi Dashboard (global setting with tenant_id = null)
        $globalSettings = Setting::withoutGlobalScopes()
            ->whereNull('tenant_id')
            ->whereIn('key', ['gemini_api_key', 'ai_api_key', 'global_ai_api_key', 'openai_api_key', 'ai_provider', 'ai_model'])
            ->pluck('value', 'key');

        $provider = strtolower($requestedProvider ?: ($globalSettings->get('ai_provider') ?: ($profile['provider'] ?? 'gemini')));
        $model = $requestedModel ?: ($globalSettings->get('ai_model') ?: ($profile['model'] ?? 'gemini-3.1-flash-lite'));

        $dashboardGeminiKey = $globalSettings->get('gemini_api_key') ?: $globalSettings->get('ai_api_key') ?: $globalSettings->get('global_ai_api_key');
        $dashboardOpenAiKey = $globalSettings->get('openai_api_key');

        // Staff operations operate on real tenant data and resolve to the platform paid key.
        // Free tier is strictly reserved for trial/free allowance and public marketing tools.
        $isFreeTier = in_array($entitlementMode, ['free', 'public_tool'], true)
            || $feature === 'public_tool';

        if ($isFreeTier) {
            $apiKey = $dashboardGeminiKey
                ?: config('smartcapture.free_api_key')
                ?: (config('smartcapture.gemini_key') ?: config('services.gemini.key') ?: config('smartcapture.api_key'));
            $keyMode = 'platform_free';
        } else {
            if ($provider === 'gemini') {
                $apiKey = $dashboardGeminiKey
                    ?: config('smartcapture.gemini_key')
                    ?: config('services.gemini.key')
                    ?: config('smartcapture.api_key');
            } elseif ($provider === 'openai') {
                $apiKey = $dashboardOpenAiKey
                    ?: config('services.openai.key')
                    ?: config('smartcapture.api_key');
            } elseif ($provider === 'anthropic') {
                $apiKey = config('services.anthropic.key');
            } elseif ($provider === 'deepseek') {
                $apiKey = config('services.deepseek.key');
            } else {
                $apiKey = $dashboardGeminiKey ?: config('smartcapture.gemini_key') ?: config('services.gemini.key');
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
