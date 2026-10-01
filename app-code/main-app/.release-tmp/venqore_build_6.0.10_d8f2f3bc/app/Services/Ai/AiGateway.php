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
        protected KeyResolver $keyResolver,
        protected ?AiScopeGuard $scopeGuard = null
    ) {
        $this->scopeGuard ??= app(AiScopeGuard::class);
    }

    /**
     * Single entry point to run AI operations.
     * Executes non-optional guards in strict order:
     * 1. Entitlement check (per-feature — see entitlementFor())
     * 1b. Scope guard (AiScopeGuard) — off-purpose / abusive input rejected here,
     *     BEFORE rate limit and spend, so it costs nothing. Allowed requests get
     *     their output-token ceiling and scope contract applied.
     * 2. Rate limit
     * 3. Spend cap
     * 4. Resolver pipeline (+ output guard for strip_code features)
     * 5. Telemetry & reconciliation (in finally)
     */
    public function resolve(AiRequest $request): AiResult
    {
        $admission = $this->admit($request);
        if ($admission instanceof AiResult) {
            return $admission;
        }

        $feature = $request->feature;
        $tenant = $admission['tenant'];

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
                $result = $this->scopeGuard->guardOutput($request, $result);
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
            $this->settle($admission, $actualCost);

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
     * Metered execution for a pipeline that cannot run through the resolver
     * chain yet — today only the SmartCapture image extraction
     * (AiExtractionService -> SmartCaptureExtractionBridge), whose multimodal
     * transport and model-substitution logic ModelResolver does not implement.
     *
     * Runs EXACTLY the same admission as resolve() — entitlement, scope, rate
     * limit ({feature}:{tenant|anon:ipHash}, anon_day_limit), spend cap
     * (per-tenant / per-IP anon_spend_cap + anon_global_spend_cap) — then the
     * operation, then reconciles the reservation. Call sites therefore still
     * never touch the limiter or spend guard themselves.
     *
     * $operation receives the (prepared) AiRequest and returns an AiResult or
     * any value (wrapped as a success). Reconciliation of the reservation:
     *   - AiResult with costUsd > 0      -> reconciled to that cost
     *   - AiResult with model === null   -> no upstream call happened, refunded
     *   - anything else / a throw        -> the estimate stands (the safe
     *     direction: an upstream call may have been billed). Throws are
     *     re-thrown to the call site.
     *
     * Usage telemetry is NOT recorded here: the bridge records each upstream
     * call itself, and recording again would double-count.
     */
    public function meter(AiRequest $request, callable $operation): AiResult
    {
        $admission = $this->admit($request);
        if ($admission instanceof AiResult) {
            return $admission;
        }

        $actualCost = null;

        try {
            $outcome = $operation($request);

            if ($outcome instanceof AiResult) {
                if ($outcome->costUsd > 0) {
                    $actualCost = $outcome->costUsd;
                } elseif ($outcome->model === null) {
                    $actualCost = 0.0;
                }

                return $outcome;
            }

            return AiResult::success($outcome);
        } finally {
            $this->settle($admission, $actualCost);
        }
    }

    /**
     * Steps 1–3 shared by resolve() and meter(). Returns a failure AiResult to
     * short-circuit, or the admission ticket settle() needs.
     *
     * @return AiResult|array{tenant: ?Tenant, est_cost: float, reservations: list<string>}
     */
    private function admit(AiRequest $request): AiResult|array
    {
        $feature = $request->feature;
        $tenant = $request->tenant ?: (app()->bound('current.tenant') ? app('current.tenant') : null);
        if ($tenant && $tenant->id === null) {
            $tenant = null; // placeholder tenant models (id=null) are anonymous traffic
        }
        $clientIp = request()?->ip() ?? '127.0.0.1';
        $ipHash = substr(hash('sha256', $clientIp . (config('app.key') ?: 'venqore-salt')), 0, 16);
        $tenantId = $tenant ? (string) $tenant->id : "anon:{$ipHash}";

        // 1. Entitlement Check — only for features that HAVE an entitlement in
        //    AiEntitlementService. Public / plan-gated features skip it instead
        //    of borrowing the scan allowance (see entitlementFor()).
        $entitlementType = $this->entitlementFor($feature);
        if ($tenant && $entitlementType !== null && app()->bound(AiEntitlementService::class)) {
            $entitlement = app(AiEntitlementService::class);
            $check = $entitlementType === 'query' ? $entitlement->checkQuery() : $entitlement->checkScan();
            if (!$check['allowed']) {
                return AiResult::failure($check['reason'] ?? 'not_allowed', $entitlement->lockMessage($check, $feature));
            }
            if (!$request->entitlementMode) {
                $request->entitlementMode = $check['mode'] ?? null;
            }
        }

        // 1b. Scope guard — deterministic, zero cost, recorded as out_of_scope.
        $rejected = $this->screen($request);
        if ($rejected !== null) {
            return $rejected;
        }
        $this->scopeGuard->prepare($request);

        // 2. Rate Limit Check (per-tenant or per-IP)
        $rateCheck = $this->rateLimiter->tryAcquire("{$feature}:{$tenantId}");
        if (!$rateCheck['ok']) {
            return AiResult::failure('rate_limited', 'High traffic rate limit exceeded.');
        }

        // 3. Spend Cap Check
        $profile = config("ai_models.{$feature}") ?? config('ai_models.default', []);
        $estCost = (float) ($profile['est_cost_usd'] ?? config("ai_limits.features.{$feature}.estimated_cost", 0.0015));
        $spendCap = (float) config("ai_limits.features.{$feature}.spend_cap", 3.00);

        $isManagedOrPlatform = in_array($request->entitlementMode, ['managed', 'free', 'public_tool', null], true);
        $ticket = [
            'tenant'       => $tenant,
            'est_cost'     => $estCost,
            'reservations' => [], // spend scopes actually recorded, reconciled by settle()
        ];

        if ($isManagedOrPlatform) {
            // Each entry: [scope, cap, failure message]. All are reserved or none.
            $capacityMsg = 'Global AI capacity temporarily reached. Please try again shortly.';
            $sessionMsg = 'Daily AI spend limit reached for this session.';
            $scopes = [];

            // Platform-wide ceiling for the feature, across ALL callers (tenant
            // or anonymous) — for public, tenant-keyed surfaces like visitor_chat.
            $platformCap = config("ai_limits.features.{$feature}.global_spend_cap");
            if (is_numeric($platformCap)) {
                $scopes[] = ["{$feature}:platform", (float) $platformCap, $capacityMsg];
            }

            if (!$tenant) {
                // Anonymous: global anonymous ceiling + a much smaller per-IP cap.
                $globalCap = (float) (config("ai_limits.features.{$feature}.anon_global_spend_cap")
                    ?? config("ai_limits.features.{$feature}.spend_cap", 3.00) * 5);
                $spendCap = (float) (config("ai_limits.features.{$feature}.anon_spend_cap") ?? $spendCap);
                $scopes[] = ["{$feature}:global", $globalCap, $capacityMsg];
            } elseif (!auth()->check()) {
                // Unauthenticated visitor on a tenant's public surface (store
                // chat widget): per-IP ceiling on top of the per-tenant one.
                $ipCap = config("ai_limits.features.{$feature}.ip_spend_cap");
                if (is_numeric($ipCap)) {
                    $scopes[] = ["{$feature}:ip:{$ipHash}", (float) $ipCap, $sessionMsg];
                }
            }

            $scopes[] = ["{$feature}:{$tenantId}", $spendCap, $sessionMsg];

            foreach ($scopes as [$scope, $cap, $message]) {
                if (!$this->spendGuard->checkAndRecord($scope, $estCost, $cap)) {
                    // Give back what was already reserved — nothing was spent.
                    // (The refused scope itself stays tripped for the day.)
                    $this->settle($ticket, 0.0);
                    return AiResult::failure('spend_capped', $message);
                }
                $ticket['reservations'][] = $scope;
            }
        }

        return $ticket;
    }

    /**
     * Reconcile the spend reservations made by admit(). A null cost keeps the
     * estimate (unknown actual cost).
     */
    private function settle(array $ticket, ?float $actualCost): void
    {
        if ($actualCost === null) {
            return;
        }

        foreach ($ticket['reservations'] as $scope) {
            try {
                $this->spendGuard->reconcile($scope, $ticket['est_cost'], $actualCost);
            } catch (\Throwable $e) {
                Log::warning("AiGateway: spend reconcile failed for {$scope}: " . $e->getMessage());
            }
        }
    }

    /**
     * Which AiEntitlementService check governs a feature: 'scan', 'query', or
     * null (no entitlement concept — skip the step rather than apply the wrong
     * allowance). Set per feature as ai_limits.features.{feature}.entitlement;
     * features not listed there keep the historical default (scan, or query
     * for 'query') so nothing unlisted silently loses its gate.
     */
    public function entitlementFor(string $feature): ?string
    {
        $configured = config("ai_limits.features.{$feature}");
        if (is_array($configured) && array_key_exists('entitlement', $configured)) {
            $type = $configured['entitlement'];
            return in_array($type, ['scan', 'query'], true) ? $type : null;
        }

        return $feature === 'query' ? 'query' : 'scan';
    }

    /**
     * Scope pre-check without resolving. Call sites that must NOT mutate state
     * for an off-purpose turn (e.g. the discovery builder, which must not
     * advance the session) call this first; resolve() runs the same check
     * itself, so skipping it is never a bypass. A rejection is recorded in
     * ai_usage_events (success=false, error_code=out_of_scope, cost 0).
     *
     * @return AiResult|null failure result when rejected, null when allowed
     */
    public function screen(AiRequest $request): ?AiResult
    {
        $rejected = $this->scopeGuard->screen($request);
        if ($rejected === null) {
            return null;
        }

        $tenant = $request->tenant ?: (app()->bound('current.tenant') ? app('current.tenant') : null);

        Log::info("AiGateway: out_of_scope rejection ({$request->feature})", [
            'reason'    => $rejected->raw['scope_reason'] ?? null,
            'tenant_id' => $tenant?->id,
        ]);

        $this->usageRecorder->record([
            'tenant_id'     => $tenant?->id,
            'user_id'       => $request->user?->id ?? auth()->id(),
            'feature'       => $request->feature,
            'provider'      => 'none',
            'model'         => 'scope_guard',
            'key_mode'      => 'none',
            'input_type'    => 'text',
            'pages'         => 0,
            'prompt_tokens' => 0,
            'output_tokens' => 0,
            'cost_usd'      => 0.0,
            'latency_ms'    => 0,
            'success'       => false,
            'error_code'    => AiScopeGuard::FAILURE_CODE,
        ]);

        return $rejected;
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
