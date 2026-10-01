<?php

namespace App\Services\Ai\Providers;

use App\Models\Setting;
use App\Models\Tenant;
use App\Support\PlatformAiKeys;

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
        //    Keys come from the Hashmi Dashboard (Platform → Settings → AI keys):
        //    a FREE Gemini key for free/public usage and PAID keys per provider
        //    for managed usage. See App\Support\PlatformAiKeys.
        $profile = config("ai_models.{$feature}") ?? config('ai_models.default', []);
        $keys = new PlatformAiKeys();

        $profileProvider = strtolower($profile['provider'] ?? 'gemini');
        $profileModel = $profile['model'] ?? 'gemini-2.5-flash-lite';

        // Staff operations operate on real tenant data and resolve to the platform paid key.
        // Free tier is strictly reserved for trial/free allowance and public marketing tools.
        $isFreeTier = in_array($entitlementMode, ['free', 'public_tool'], true)
            || $feature === 'public_tool';

        if ($isFreeTier) {
            [$apiKey, $keyProvider, $fromFreePool] = $keys->freeTierKey(
                strtolower($requestedProvider ?: ($keys->paidProvider() ?: $profileProvider))
            );
            $provider = $keyProvider ?: strtolower($requestedProvider ?: $profileProvider);
            $model = $requestedModel
                ?: ($fromFreePool ? $keys->freeModel() : null)
                ?: $this->modelFor($provider, $profileProvider, $profileModel, $fromFreePool ? null : $keys->paidModel());
            $keyMode = 'platform_free';
        } else {
            $provider = strtolower($requestedProvider ?: ($keys->paidProvider() ?: $profileProvider));
            $model = $requestedModel ?: $this->modelFor($provider, $profileProvider, $profileModel, $keys->paidModel());
            $apiKey = $keys->paidKey($provider);
            $keyMode = 'platform_paid';
        }

        return [
            'api_key'  => $apiKey ? trim($apiKey) : null,
            'provider' => $provider,
            'model'    => $model,
            'key_mode' => $keyMode,
        ];
    }

    /**
     * Pick a model that matches the provider: the dashboard model if set, the
     * feature profile's model when the provider is the profile's provider,
     * otherwise that provider's default model.
     */
    private function modelFor(string $provider, string $profileProvider, string $profileModel, ?string $dashboardModel): string
    {
        if ($dashboardModel) {
            return $dashboardModel;
        }
        if ($provider === $profileProvider) {
            return $profileModel;
        }

        return (string) config("smartcapture.default_models.{$provider}", $profileModel);
    }
}
