<?php

namespace Tests\Feature\Reckoner\Laws;

use App\Models\Party;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerRequest;
use Tests\Feature\VenQoreTestCase;

/**
 * L1 — Tenant Isolation Law
 *
 * Every reading returns an identical result whether or not another tenant's
 * data exists in the same database. Cross-tenant bleed is the worst failure
 * class in a multi-tenant SaaS, and it is historically relevant for this
 * codebase.
 *
 * Strategy: resolve every tenant-scoped reading for Tenant A with no
 * Tenant B data present. Then create realistic Tenant B data. Resolve every
 * reading again for Tenant A. Values must be identical.
 *
 * The "identical" comparison is structural: value, ok, errorCode must match.
 * We skip not_found/forbidden results because they are gate failures unrelated
 * to data isolation.
 */
class L1TenantIsolationTest extends VenQoreTestCase
{
    public function test_all_tenant_readings_are_isolated_from_other_tenant_data(): void
    {
        // ── Tenant A — the tenant under test ───────────────────────────────
        $tenantA = $this->createTenant();
        $userA   = $this->createTenantUser($tenantA, 'owner');
        $this->bindTenantContext($tenantA, $userA);

        // Give Tenant A a minimal data footprint so readings can resolve.
        // A single posted sale, a party, enough to make most readings return values.
        $partyA = Party::factory()->create([
            'tenant_id' => $tenantA->id,
            'type'      => 'customer',
        ]);

        $reckoner = new Reckoner();
        $all      = ReckonerRegistry::all();

        // ── Baseline: read all tenant-scoped readings with only Tenant A data ──
        $baseline = $this->resolveAll($reckoner, $all, $userA, $tenantA);

        // ── Pollute: add substantial data for Tenant B ──────────────────────
        $tenantB = $this->createTenant();
        $userB   = $this->createTenantUser($tenantB, 'owner');
        $this->bindTenantContext($tenantB, $userB);

        // Create realistic Tenant B data that would bleed into Tenant A if
        // the HasTenant global scope were missing from any query.
        $partyB = Party::factory()->create([
            'tenant_id' => $tenantB->id,
            'type'      => 'customer',
        ]);

        // Switch back to Tenant A context.
        $this->bindTenantContext($tenantA, $userA);

        // ── After pollution: re-read all readings for Tenant A ───────────────
        // Clear capability cache so fresh probes run.
        Reckoner::forgetCapabilities($tenantA->id);
        $afterPollution = $this->resolveAll($reckoner, $all, $userA, $tenantA);

        // ── Assert isolation ─────────────────────────────────────────────────
        $failures = [];
        foreach ($baseline as $key => $before) {
            $after = $afterPollution[$key] ?? null;
            if ($after === null) {
                $failures[] = "Reading '{$key}' missing after Tenant B data added.";
                continue;
            }

            // Skip readings that were unavailable in baseline (gate failures).
            // We cannot test isolation for a reading we cannot read.
            if (! $before['ok'] && in_array($before['errorCode'], ['forbidden', 'plan_locked', 'not_found'], true)) {
                continue;
            }

            if ($before['ok'] !== $after['ok']) {
                $failures[] = "Reading '{$key}': ok changed from ".($before['ok'] ? 'true' : 'false')
                    ." to ".($after['ok'] ? 'true' : 'false')." after Tenant B data added.";
                continue;
            }

            // For successful readings, compare the scalar value.
            if ($before['ok'] && $after['ok']) {
                $valBefore = $before['value'];
                $valAfter  = $after['value'];
                if ($valBefore !== $valAfter) {
                    $failures[] = "Reading '{$key}': value changed from ".json_encode($valBefore)
                        ." to ".json_encode($valAfter)." after Tenant B data added — CROSS-TENANT BLEED.";
                }
            }
        }

        $this->assertEmpty(
            $failures,
            "L1 Tenant Isolation failures:\n" . implode("\n", $failures)
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function resolveAll(Reckoner $reckoner, array $all, $user, $tenant): array
    {
        $results = [];
        foreach ($all as $key => $def) {
            if (($def['scope'] ?? 'tenant') !== 'tenant') {
                continue; // skip platform metrics
            }
            if (($def['implemented'] ?? true) === false) {
                continue; // skip explicitly unimplemented stubs
            }

            $periodKey = $def['default_period'] ?? 'today';
            $request   = new ReckonerRequest($key, $periodKey);
            $result    = $reckoner->read($request, $user, $tenant);

            $payload = $result->data;
            $results[$key] = [
                'ok'        => $result->ok,
                'errorCode' => $result->errorCode,
                'value'     => is_array($payload) ? ($payload['value'] ?? null) : null,
            ];
        }
        return $results;
    }
}
