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
            return AiResult::failure('no_key', 'No API key configured for provider: ' . ($keyConfig['provider'] ?? 'unknown'));
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
