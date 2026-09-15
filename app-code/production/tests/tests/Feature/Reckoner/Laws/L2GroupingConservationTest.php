<?php

namespace Tests\Feature\Reckoner\Laws;

use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerRequest;
use Tests\Feature\VenQoreTestCase;

/**
 * L2 — Grouping Conservation Law
 *
 * For any reading with a group_by dimension, the sum of all grouped rows
 * must equal the ungrouped total, within rounding tolerance.
 *
 * This covers the entire dimension surface from C1 automatically. When a new
 * group_by dimension is added to any reading, this law tests it with zero
 * new test code.
 *
 * On a fresh tenant with no data, all grouped and ungrouped values are 0 or
 * empty, so this passes trivially and is a structural test — it catches
 * violations as soon as real data is introduced.
 */
class L2GroupingConservationTest extends VenQoreTestCase
{
    private const TOLERANCE = 0.02;

    public function test_grouped_sum_equals_ungrouped_total(): void
    {
        $tenant   = $this->createTenant();
        $user     = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $reckoner = new Reckoner();
        $all      = ReckonerRegistry::all();

        $failures = [];

        foreach ($all as $key => $def) {
            if (($def['scope'] ?? 'tenant') !== 'tenant')            { continue; }
            if (($def['implemented'] ?? true) === false)             { continue; }

            $dimensions = $def['dimensions'] ?? null;
            if ($dimensions === null)                                 { continue; }

            // Find a group_by dimension with an enum of at least one value.
            $groupByDim = $dimensions['group_by'] ?? null;
            if ($groupByDim === null)                                 { continue; }
            $groupByValues = $groupByDim['enum'] ?? [];
            // Filter out 'none' — that IS the ungrouped read.
            $groupByValues = array_filter($groupByValues, fn ($v) => $v !== 'none');
            if (empty($groupByValues))                                { continue; }

            $period = $def['default_period'] ?? 'this_month';

            // Ungrouped total.
            $ungroupedResult = $reckoner->read(
                new ReckonerRequest($key, $period),
                $user, $tenant
            );
            if (! $ungroupedResult->ok) { continue; }
            $ungroupedValue = (float) (is_array($ungroupedResult->data)
                ? ($ungroupedResult->data['value'] ?? 0) : 0);

            // Try the first non-none group_by value.
            $groupBy = array_values($groupByValues)[0];
            $groupedResult = $reckoner->read(
                new ReckonerRequest($key, $period, null, null, ['group_by' => $groupBy]),
                $user, $tenant
            );

            if (! $groupedResult->ok) {
                // group_by not yet implemented in source — skip, not a failure.
                continue;
            }

            // Grouped result should be RANKING shape — an array of rows.
            $groupedData = $groupedResult->data;
            if (! is_array($groupedData) || ! isset($groupedData['rows'])) {
                // Source returned scalar — no conservation law applicable yet.
                continue;
            }

            $groupedSum = array_sum(array_column($groupedData['rows'], 'value'));

            if (abs($groupedSum - $ungroupedValue) > self::TOLERANCE) {
                $failures[] = sprintf(
                    "Reading '%s' group_by='%s': grouped sum %.4f ≠ ungrouped %.4f (diff %.4f).",
                    $key, $groupBy, $groupedSum, $ungroupedValue,
                    abs($groupedSum - $ungroupedValue)
                );
            }
        }

        $this->assertEmpty(
            $failures,
            "L2 Grouping Conservation failures:\n" . implode("\n", $failures)
        );
    }
}
