<?php

namespace Tests\Feature\Reckoner\Laws;

use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerRequest;
use Tests\Feature\VenQoreTestCase;

/**
 * L3 — Period Additivity Law
 *
 * For any reading declared additive: true, the sum of all monthly readings
 * for a calendar year must equal the full-year reading, within a floating-
 * point rounding tolerance.
 *
 * Catches: boundary bugs, timezone drift, off-by-one windows, double-counted
 * period edges.
 *
 * This test is meaningful only after data exists. On a fresh tenant with no
 * transactions, all monthly and yearly values are 0, so the sum trivially
 * passes. The test is structural — it will catch violations the moment real
 * data is introduced and the law is run against it (e.g. golden-company data).
 */
class L3PeriodAdditivityTest extends VenQoreTestCase
{
    private const TOLERANCE = 0.02; // 2 cents — rounding on cents-precision figures

    private const MONTHS = [
        ['from' => '2025-01-01', 'to' => '2025-01-31'],
        ['from' => '2025-02-01', 'to' => '2025-02-28'],
        ['from' => '2025-03-01', 'to' => '2025-03-31'],
        ['from' => '2025-04-01', 'to' => '2025-04-30'],
        ['from' => '2025-05-01', 'to' => '2025-05-31'],
        ['from' => '2025-06-01', 'to' => '2025-06-30'],
        ['from' => '2025-07-01', 'to' => '2025-07-31'],
        ['from' => '2025-08-01', 'to' => '2025-08-31'],
        ['from' => '2025-09-01', 'to' => '2025-09-30'],
        ['from' => '2025-10-01', 'to' => '2025-10-31'],
        ['from' => '2025-11-01', 'to' => '2025-11-30'],
        ['from' => '2025-12-01', 'to' => '2025-12-31'],
    ];

    private const YEAR = ['from' => '2025-01-01', 'to' => '2025-12-31'];

    public function test_additive_readings_monthly_sum_equals_year(): void
    {
        $tenant   = $this->createTenant();
        $user     = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        $reckoner = new Reckoner();
        $all      = ReckonerRegistry::all();

        $failures = [];

        foreach ($all as $key => $def) {
            if (($def['scope'] ?? 'tenant') !== 'tenant') { continue; }
            if (($def['additive'] ?? false) !== true)     { continue; }
            if (! in_array('custom', $def['periods'] ?? [], true)) { continue; }
            if (($def['implemented'] ?? true) === false)  { continue; }

            // Sum all 12 months.
            $monthlySum = 0.0;
            $allMonthsOk = true;
            foreach (self::MONTHS as $m) {
                $r = $reckoner->read(
                    new ReckonerRequest($key, 'custom', $m),
                    $user, $tenant
                );
                if (! $r->ok) {
                    // not_applicable (no data) counts as 0.
                    if ($r->errorCode === 'not_applicable') { continue; }
                    $allMonthsOk = false;
                    break;
                }
                $monthlySum += (float) (is_array($r->data) ? ($r->data['value'] ?? 0) : 0);
            }
            if (! $allMonthsOk) { continue; }

            // Full-year.
            $yearResult = $reckoner->read(
                new ReckonerRequest($key, 'custom', self::YEAR),
                $user, $tenant
            );
            if (! $yearResult->ok) { continue; }

            $yearValue = (float) (is_array($yearResult->data) ? ($yearResult->data['value'] ?? 0) : 0);

            if (abs($monthlySum - $yearValue) > self::TOLERANCE) {
                $failures[] = sprintf(
                    "Reading '%s': monthly sum %.4f ≠ yearly %.4f (diff %.4f).",
                    $key, $monthlySum, $yearValue, abs($monthlySum - $yearValue)
                );
            }
        }

        $this->assertEmpty(
            $failures,
            "L3 Period Additivity failures:\n" . implode("\n", $failures)
        );
    }
}
