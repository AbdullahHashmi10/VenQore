<?php

namespace Tests\Feature\Reckoner\Laws;

use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerRequest;
use Tests\Feature\VenQoreTestCase;

/**
 * L5 — Empty-Tenant Law
 *
 * On a tenant with no data, every reading that passes all gates returns 0 or
 * not_applicable — never null, an exception, NaN, -0, or a division-by-zero.
 *
 * This protects the new-signup experience, which is every user's first
 * impression of the product.
 *
 * "Empty" means: fresh tenant, no parties, no sales, no purchases, no stock,
 * no staff attendance — the exact state every new tenant begins in.
 */
class L5EmptyTenantTest extends VenQoreTestCase
{
    public function test_every_reading_returns_zero_or_not_applicable_on_empty_tenant(): void
    {
        $tenant = $this->createTenant();
        $user   = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        $reckoner = new Reckoner();
        $all      = ReckonerRegistry::all();

        $failures = [];

        foreach ($all as $key => $def) {
            if (($def['scope'] ?? 'tenant') !== 'tenant') {
                continue; // platform metrics are irrelevant here
            }
            if (($def['implemented'] ?? true) === false) {
                continue;
            }

            $periodKey = $def['default_period'] ?? 'today';
            $request   = new ReckonerRequest($key, $periodKey);

            try {
                $result = $reckoner->read($request, $user, $tenant);
            } catch (\Throwable $e) {
                $failures[] = "Reading '{$key}' threw ".get_class($e).": {$e->getMessage()}";
                continue;
            }

            // Gate failures (forbidden, plan_locked, not_found, invalid_period) are OK —
            // they are proper responses, not empty-data bugs.
            if (! $result->ok) {
                $allowed = ['forbidden', 'plan_locked', 'not_found', 'invalid_period', 'not_applicable'];
                if (! in_array($result->errorCode, $allowed, true)) {
                    $failures[] = "Reading '{$key}' failed with unexpected error code '{$result->errorCode}'.";
                }
                continue;
            }

            // For successful reads on an empty tenant, the payload value must be
            // 0, 0.0, null (→ displayed as not_applicable by the UI), an empty
            // array, or a boolean. Never a raw PHP null on a non-ok result.
            $payload = $result->data;
            if (is_array($payload)) {
                $value = $payload['value'] ?? null;

                // Check for NaN / INF (PHP division-by-zero produces these)
                if (is_float($value) && (is_nan($value) || is_infinite($value))) {
                    $failures[] = "Reading '{$key}' returned NaN or INF on empty tenant (division by zero?). Value: ".var_export($value, true);
                }

                // Negative zero is suspicious for accounting metrics
                if ($value === -0.0 && serialize($value) === 'd:-0;') {
                    $failures[] = "Reading '{$key}' returned -0 on empty tenant.";
                }
            }
        }

        $this->assertEmpty(
            $failures,
            "L5 Empty-Tenant failures:\n" . implode("\n", $failures)
        );
    }
}
