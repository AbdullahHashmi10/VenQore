<?php

namespace App\Services\Ai\Resolvers;

use App\Services\Ai\AiRequest;
use App\Services\Ai\AiResult;

interface AiResolver
{
    /**
     * Attempt to satisfy the AI request through this resolver pipeline step.
     * Returns an AiResult on success, or null to pass through to the next resolver.
     */
    public function attempt(AiRequest $request): ?AiResult;
}
