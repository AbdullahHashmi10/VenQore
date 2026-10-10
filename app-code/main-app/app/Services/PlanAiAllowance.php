<?php

namespace App\Services;

use App\Models\Tenant;

/**
 * PlanAiAllowance — gives a tenant the AI allowance its plan advertises.
 *
 * ── The one number ─────────────────────────────────────────────────────────
 *
 * The plan matrix, the pricing page and the owner's override screen all speak
 * `ai_credits_monthly` (Solo 100 · Starter 500 · Core 2,000 · Scale 10,000;
 * LTD tiers carry `ai_credits_annual`) and `ai_scans_monthly`. The runtime
 * meter, however, is three columns on the tenant row that
 * AiEntitlementService reads: ai_status, ai_pages_limit, ai_queries_limit.
 *
 * This class is the ONLY bridge between them:
 *
 *   ai_queries_limit  = ai_credits_monthly            (Vena / assistant questions)
 *   ai_pages_limit    = ai_scans_monthly              (Smart Capture pages);
 *                       when the plan has no separate scan cap (null), scans
 *                       draw on the same ceiling as questions
 *   -1 anywhere       = unlimited (plan value null, or an owner override of null)
 *
 * Previously this class read `ai_queries_limit` / `ai_pages_limit` from
 * plan_limits. The F2 ghost-key cleanup removed those rows, so every lookup
 * came back empty, the method returned early, and no plan customer ever got a
 * monthly quota: they sat at ai_status = 'none' on the 10-chance free
 * allowance. Legacy keys are still honoured as a fallback for installs that
 * still have them.
 *
 * Deliberately does NOT touch ai_pages_used / ai_queries_used: the monthly
 * reset (ResetAiUsageJob) owns those, and an upgrade mid-month should raise the
 * ceiling, not silently refund what has already been spent.
 */
class PlanAiAllowance
{
    /** @var array<int,bool> tenants already reconciled during this request */
    private static array $healed = [];

    /**
     * What the tenant's plan (plus any owner override) allows.
     *
     * @return array{queries:int,pages:int}|null  null = nothing configured for this plan
     */
    public static function allowanceFor(Tenant $tenant, ?string $plan = null): ?array
    {
        $plan = $plan ?: ($tenant->plan ?? 'trial');
        $id   = (int) $tenant->id;

        // A trial is deliberately left on the free allowance (the free key, the
        // free-scan count). The plan matrix resolves 'trial' to Core's 2,000
        // credits, which would put every trial on the platform's PAID key. An
        // owner can still grant a trial real credits with an override.
        if (PlanRepository::normalizePlanSlug((string) $plan) === 'trial' && !self::hasCreditOverride($id)) {
            return null;
        }

        $credits = PlanRepository::getEffectiveLimit($id, $plan, 'ai_credits_monthly');
        $scans   = PlanRepository::getEffectiveLimit($id, $plan, 'ai_scans_monthly');

        // LTD tiers carry a yearly pool (12k / 30k / 60k). The meter resets
        // monthly, so spread it; it replaces the base plan's monthly figure.
        $annual = PlanRepository::getEffectiveLimit($id, $plan, 'ai_credits_annual');
        if (is_numeric($annual) && (int) $annual > 0) {
            $credits = (int) ceil(((int) $annual) / 12);
        }

        // Legacy keys (older installs / SmartCaptureEnable).
        if ($credits === false) {
            $legacyQ = PlanRepository::getEffectiveLimit($id, $plan, 'ai_queries_limit');
            $legacyP = PlanRepository::getEffectiveLimit($id, $plan, 'ai_pages_limit');
            $queries = is_numeric($legacyQ) ? (int) $legacyQ : 0;
            $pages   = is_numeric($legacyP) ? (int) $legacyP : 0;

            return ($queries <= 0 && $pages <= 0) ? null : ['queries' => $queries, 'pages' => $pages];
        }

        $queries = $credits === null ? -1 : (int) $credits;
        if ($queries === 0) {
            return null; // explicit zero: leave the tenant as it is
        }

        if ($scans === false || $scans === null) {
            $pages = $queries; // no separate scan cap: scans share the ceiling
        } else {
            $pages = (int) $scans;
            if ($pages <= 0) {
                $pages = $queries;
            }
        }

        return ['queries' => $queries, 'pages' => $pages];
    }

    private static function hasCreditOverride(int $tenantId): bool
    {
        try {
            return \App\Models\TenantPlanOverride::withoutTenantScope()
                ->where('tenant_id', $tenantId)
                ->where('override_key', 'ai_credits_monthly')
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->exists();
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Apply the plan's advertised AI allowance to the tenant.
     *
     * @param  string|null  $plan  Plan slug; falls back to the tenant's own.
     */
    public static function applyTo(Tenant $tenant, ?string $plan = null): void
    {
        $allowance = self::allowanceFor($tenant, $plan);

        // Nothing seeded for this plan (fresh install mid-migration, or an
        // unknown slug). Leave the tenant exactly as it was rather than
        // zeroing a working allowance.
        if ($allowance === null) {
            return;
        }

        $updates = [
            'ai_pages_limit'   => $allowance['pages'],
            'ai_queries_limit' => $allowance['queries'],
        ];

        // Never overwrite BYOK. That customer paid a one-time unlock and runs
        // on their own key with no meter; flipping them to 'managed' would
        // start metering them against a limit they never bought.
        if (($tenant->ai_status ?? 'none') !== 'byok') {
            $updates['ai_status'] = 'managed';
        }

        $tenant->update($updates);

        PlanRepository::invalidateTenantCache($tenant->id);
    }

    /**
     * Self-heal, called by AiEntitlementService before every check.
     *
     * Tenants created or changed while the bridge was broken (and tenants whose
     * owner override changed ai_credits_monthly) have a meter that no longer
     * matches their plan. Reconcile when the meter is missing or has drifted;
     * otherwise do nothing. At most once per tenant per request.
     */
    public static function healIfNeeded(Tenant $tenant): void
    {
        $id = (int) $tenant->id;
        if (!$id || isset(self::$healed[$id])) {
            return;
        }
        self::$healed[$id] = true;

        $status = $tenant->ai_status ?? 'none';
        if ($status === 'byok') {
            return;
        }

        try {
            $allowance = self::allowanceFor($tenant);
        } catch (\Throwable) {
            return;
        }
        if ($allowance === null) {
            return;
        }

        // Fill in only what is MISSING (status 'none', or a limit that is 0).
        // Anything already positive was set deliberately — by a purchase, a
        // top-up or the owner — and must not be touched here. Plan changes and
        // override edits call applyTo() explicitly.
        $updates = [];
        if ((int) ($tenant->ai_queries_limit ?? 0) === 0) {
            $updates['ai_queries_limit'] = $allowance['queries'];
        }
        if ((int) ($tenant->ai_pages_limit ?? 0) === 0) {
            $updates['ai_pages_limit'] = $allowance['pages'];
        }
        if ($status !== 'managed') {
            $updates['ai_status'] = 'managed';
        }

        if ($updates) {
            $tenant->update($updates);
            PlanRepository::invalidateTenantCache($tenant->id);
        }
    }
}
