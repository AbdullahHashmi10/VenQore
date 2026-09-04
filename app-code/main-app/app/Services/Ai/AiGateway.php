<?php

namespace App\Services\Ai;

use App\Models\Tenant;
use App\Services\Ai\Providers\KeyResolver;
use App\Services\Ai\Resolvers\AiResolver;
use App\Services\Ai\Resolvers\ModelResolver;
use App\Services\SmartCapture\AiEntitlementService;
use Illuminate\Support\Facades\Log;

class AiGateway
{
    public function __construct(
        protected AiRateLimiter $rateLimiter,
        protected AiSpendGuard $spendGuard,
        protected AiUsageRecorder $usageRecorder,
        protected KeyResolver $keyResolver
    ) {}

    /**
     * Single entry point to run AI operations.
     * Executes non-optional guards in strict order:
     * 1. Entitlement check
     * 2. Rate limit
     * 3. Spend cap
     * 4. Resolver pipeline
     * 5. Telemetry & reconciliation (in finally)
     */
    public function resolve(AiRequest $request): AiResult
    {
        $feature = $request->feature;
        $tenant = $request->tenant ?: (app()->bound('current.tenant') ? app('current.tenant') : null);
        $tenantId = $tenant ? (string) $tenant->id : 'global';

        // 1. Entitlement Check
        if ($tenant && app()->bound(AiEntitlementService::class)) {
            $entitlement = app(AiEntitlementService::class);
            $check = ($feature === 'query') ? $entitlement->checkQuery() : $entitlement->checkScan();
            if (!$check['allowed']) {
                return AiResult::failure($check['reason'] ?? 'not_allowed', $entitlement->lockMessage($check, $feature));
            }
            if (!$request->entitlementMode) {
                $request->entitlementMode = $check['mode'] ?? null;
            }
        }

        // 2. Rate Limit Check
        $rateCheck = $this->rateLimiter->tryAcquire("{$feature}:{$tenantId}");
        if (!$rateCheck['ok']) {
            return AiResult::failure('rate_limited', 'High traffic rate limit exceeded.');
        }

        // 3. Spend Cap Check
        $profile = config("ai_models.{$feature}") ?? config('ai_models.default', []);
        $estCost = (float) ($profile['est_cost_usd'] ?? config("ai_limits.features.{$feature}.estimated_cost", 0.0015));
        $spendCap = (float) config("ai_limits.features.{$feature}.spend_cap", 3.00);

        $isManagedOrPlatform = in_array($request->entitlementMode, ['managed', 'free', 'public_tool', null], true);
        $spendRecorded = false;

        if ($isManagedOrPlatform) {
            $spendRecorded = $this->spendGuard->checkAndRecord("{$feature}:{$tenantId}", $estCost, $spendCap);
            if (!$spendRecorded) {
                return AiResult::failure('spend_capped', 'Daily AI spend limit reached for this store.');
            }
        }

        // 4. Resolver Pipeline
        $result = null;
        $actualCost = 0.0;
        $resolvers = config('ai_limits.resolvers', [ModelResolver::class]);

        try {
            foreach ($resolvers as $resolverClass) {
                /** @var AiResolver $resolver */
                $resolver = app($resolverClass);
                $res = $resolver->attempt($request);
                if ($res !== null) {
                    $result = $res;
                    break;
                }
            }

            if (!$result) {
                $result = AiResult::failure('no_resolver_match', 'No resolver in pipeline could handle this request.');
            }

            if ($result->ok) {
                $actualCost = $result->costUsd;
            }

            return $result;
        } catch (\Throwable $e) {
            Log::error("AiGateway exception during resolve({$feature}): " . $e->getMessage(), [
                'exception' => $e,
            ]);
            $result = AiResult::failure('gateway_exception', $e->getMessage());
            return $result;
        } finally {
            // 5. Telemetry & Reconcile in finally block
            if ($spendRecorded) {
                $this->spendGuard->reconcile("{$feature}:{$tenantId}", $estCost, $actualCost);
            }

            if ($result) {
                $this->usageRecorder->record([
                    'tenant_id'       => $tenant?->id,
                    'user_id'         => $request->user?->id ?? auth()->id(),
                    'feature'         => $feature,
                    'provider'        => $result->provider ?? 'gemini',
                    'model'           => $result->model ?? 'gemini-2.5-flash-lite',
                    'key_mode'        => $result->keyMode ?? (($request->entitlementMode === 'byok') ? 'byok' : 'platform_paid'),
                    'input_type'      => is_array($request->input) && isset($request->input['image']) ? 'image' : 'text',
                    'prompt_tokens'   => $result->promptTokens,
                    'output_tokens'   => $result->outputTokens,
                    'cost_usd'        => $actualCost,
                    'latency_ms'      => $result->latencyMs,
                    'success'         => $result->ok,
                    'error_code'      => $result->failureCode,
                ]);
            }
        }
    }

    /**
     * Single entry point to test AI credentials for any provider.
     */
    public function testConnection(string $provider, string $apiKey, string $model): array
    {
        $modelResolver = app(ModelResolver::class);
        $providerInstance = $modelResolver->getProvider($provider);
        return $providerInstance->testConnection($apiKey, $model);
    }
}
