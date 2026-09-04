<?php

namespace Tests\Feature\Reckoner\Laws;

use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerRequest;
use Tests\Feature\VenQoreTestCase;

/**
 * L4 — Comparison Symmetry Law
 *
 * For any reading that supports_comparison: true, the comparison_value
 * embedded in a primary result must equal a standalone direct read of the
 * previous period window.
 *
 * Catches: comparison windows computed by a different code path than primary
 * windows (a historically common source of -1% / +1% off-by-one errors).
 */
class L4ComparisonSymmetryTest extends VenQoreTestCase
{
    private const TOLERANCE = 0.01;

    public function test_comparison_value_equals_direct_previous_period_read(): void
    {
        $tenant   = $this->createTenant();
        $user     = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $reckoner = new Reckoner();
        $all      = ReckonerRegistry::all();

        $failures = [];

        // Use 'this_month' — it has a well-defined comparison window ('last_month').
        $primaryPeriod  = 'this_month';
        $comparePeriod  = 'last_month';

        foreach ($all as $key => $def) {
            if (($def['scope'] ?? 'tenant') !== 'tenant')            { continue; }
            if (($def['supports_comparison'] ?? false) !== true)     { continue; }
            if (! in_array($primaryPeriod, $def['periods'] ?? [], true)) { continue; }
            if (! in_array($comparePeriod, $def['periods'] ?? [], true)) { continue; }
            if (($def['implemented'] ?? true) === false)             { continue; }

            // Primary read for this_month — will embed a comparison_value = last_month.
            $primaryResult = $reckoner->read(
                new ReckonerRequest($key, $primaryPeriod),
                $user, $tenant
            );

            // Direct standalone read of last_month.
            $directResult = $reckoner->read(
                new ReckonerRequest($key, $comparePeriod),
                $user, $tenant
            );

            // If either reading failed for legitimate reasons (no data, plan), skip.
            if (! $primaryResult->ok || ! $directResult->ok) { continue; }

            $primaryData    = $primaryResult->data;
            $embeddedPrev   = is_array($primaryData) ? ($primaryData['previous'] ?? null) : null;
            $directValue    = is_array($directResult->data) ? ($directResult->data['value'] ?? null) : null;

            if ($embeddedPrev === null && $directValue === null) { continue; } // both null = OK
            if ($embeddedPrev === null || $directValue === null) { continue; } // asymmetric null = skip (no comparison window yet)

            $diff = abs((float) $embeddedPrev - (float) $directValue);
            if ($diff > self::TOLERANCE) {
                $failures[] = sprintf(
                    "Reading '%s': embedded previous=%.4f ≠ direct last_month=%.4f (diff %.4f).",
                    $key, $embeddedPrev, $directValue, $diff
                );
            }
        }

        $this->assertEmpty(
            $failures,
            "L4 Comparison Symmetry failures:\n" . implode("\n", $failures)
        );
    }
}
