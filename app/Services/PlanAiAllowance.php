<?php

namespace App\Services;

use App\Models\Tenant;

/**
 * PlanAiAllowance — gives a tenant the AI allowance its plan advertises.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 *
 * AiEntitlementService reads three columns on the tenant row — ai_status,
 * ai_pages_limit, ai_queries_limit — and nothing else. Until this class, the
 * only thing that ever wrote them was the purchase of a separate AI add-on
 * (Spark/Shop/Pro/Max/BYOK) in ProvisionTenantJob. Buying a *plan* wrote
 * nothing, so every plan customer sat at ai_status = 'none' and fell back to
 * the 10-scan free allowance — while the pricing page promised 10/20/60/150
 * pages and 50/100/400/1000 queries per plan, and the whole product is
 * positioned on AI building the ERP.
 *
 * The allowance itself is read from plan_limits (seeded by
 * PlanFeatureMatrixSeeder), so the pricing table, the plan gate and the tenant
 * meter all trace back to one number per plan. Call this anywhere a tenant's
 * plan is set or changed.
 *
 * Deliberately does NOT touch ai_pages_used / ai_queries_used: the monthly
 * reset (ResetAiUsageJob) owns those, and an upgrade mid-month should raise the
 * ceiling, not silently refund what has already been spent.
 */
class PlanAiAllowance
{
    /**
     * Apply the plan's advertised AI allowance to the tenant.
     *
     * @param  string|null  $plan  Plan slug; falls back to the tenant's own.
     */
    public static function applyTo(Tenant $tenant, ?string $plan = null): void
    {
        $plan = $plan ?: ($tenant->plan ?? 'trial');

        $pages   = PlanRepository::getEffectiveLimit($tenant->id, $plan, 'ai_pages_limit');
        $queries = PlanRepository::getEffectiveLimit($tenant->id, $plan, 'ai_queries_limit');

        $pages   = $pages   === null ? 0 : (int) $pages;
        $queries = $queries === null ? 0 : (int) $queries;

        // Nothing seeded for this plan (fresh install mid-migration, or an
        // unknown slug). Leave the tenant exactly as it was rather than
        // zeroing a working allowance.
        if ($pages <= 0 && $queries <= 0) {
            return;
        }

        $updates = [
            'ai_pages_limit'   => $pages,
            'ai_queries_limit' => $queries,
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
}
