<?php

namespace App\Services\Ai\Resolvers;

use App\Services\Ai\AiRequest;
use App\Services\Ai\AiResult;
use App\Services\Ai\Providers\AnthropicProvider;
use App\Services\Ai\Providers\DeepSeekProvider;
use App\Services\Ai\Providers\GeminiProvider;
use App\Services\Ai\Providers\KeyResolver;
use App\Services\Ai\Providers\OpenAiProvider;
use App\Services\Ai\Providers\ProviderContract;

class ModelResolver implements AiResolver
{
    public function __construct(
        protected KeyResolver $keyResolver,
        protected GeminiProvider $gemini,
        protected OpenAiProvider $openai,
        protected AnthropicProvider $anthropic,
        protected DeepSeekProvider $deepseek
    ) {}

    public function attempt(AiRequest $request): ?AiResult
    {
        $keyConfig = $this->keyResolver->resolve(
            tenant: $request->tenant,
            feature: $request->feature,
            entitlementMode: $request->entitlementMode,
            requestedProvider: $request->preferredProvider,
            requestedModel: $request->preferredModel
        );

        if (empty($keyConfig['api_key'])) {
            $mode = $keyConfig['key_mode'] ?? null;
            // Say WHOSE key is missing. A store on the monthly quota is never
            // told to "add a key": the missing key is VenQore's, and the owner
            // must fix it in the Hashmi Dashboard.
            $message = $mode === 'byok'
                ? 'Your own AI key is missing. Add it in AI settings.'
                : 'No platform AI key is available for provider: ' . ($keyConfig['provider'] ?? 'unknown');
            \Illuminate\Support\Facades\Log::error('AiGateway: no usable API key', [
                'feature'  => $request->feature,
                'provider' => $keyConfig['provider'] ?? null,
                'key_mode' => $mode,
                'tenant'   => $request->tenant?->id,
                'hint'     => 'Hashmi Dashboard → Platform Settings → AI keys: save a paid key (or the free key for free-tier calls).',
            ]);
            $failure = AiResult::failure('no_key', $message);
            $failure->keyMode = $mode;
            $failure->provider = 'none';

            return $failure;
        }

        $provider = $this->getProvider($keyConfig['provider'] ?? 'gemini');
        $result = $provider->call($request, $keyConfig);
        $result->source = 'model';
        $result->keyMode = $keyConfig['key_mode'] ?? null;

        return $result;
    }

    public function getProvider(string $provider): ProviderContract
    {
        return match (strtolower(trim($provider))) {
            'openai'    => $this->openai,
            'anthropic' => $this->anthropic,
            'deepseek'  => $this->deepseek,
            default     => $this->gemini,
        };
    }
}
