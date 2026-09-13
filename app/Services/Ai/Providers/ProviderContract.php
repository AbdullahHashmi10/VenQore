<?php

namespace App\Services\Ai\Providers;

use App\Services\Ai\AiRequest;
use App\Services\Ai\AiResult;

interface ProviderContract
{
    /**
     * Execute an upstream AI call and return a unified AiResult.
     */
    public function call(AiRequest $request, array $keyConfig): AiResult;

    /**
     * Test connection credentials for this provider.
     */
    public function testConnection(string $apiKey, string $model): array;
}
