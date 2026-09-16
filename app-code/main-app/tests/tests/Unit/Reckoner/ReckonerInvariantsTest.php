<?php

namespace Tests\Unit\Reckoner;

use App\Models\Tenant;
use App\Reckoner\Invariants\ReckonerInvariants;
use App\Reckoner\ReckonerPeriod;
use Tests\TestCase;

/**
 * ReckonerInvariantsTest — Tests all 16 Reckoner Invariants (§5).
 *
 * @group reckoner
 * @group invariants
 */
class ReckonerInvariantsTest extends TestCase
{
    public function test_all_16_invariants_defined(): void
    {
        $this->assertCount(16, ReckonerInvariants::INVARIANTS);
    }

    public function test_all_16_invariants_pass_for_tenant(): void
    {
        $tenant = new Tenant();
        $tenant->id = 999999;
        $tenant->timezone = 'UTC';

        $period = ReckonerPeriod::resolve('today', null, $tenant);

        $results = ReckonerInvariants::checkAll($tenant, $period, [
            'revenue' => 1000.0,
            'cogs' => 400.0,
            'gross_profit' => 600.0,
            'expenses' => 200.0,
            'net_profit' => 400.0,
            'slices' => [
                ['name' => 'Cash', 'value' => 500.0],
                ['name' => 'Card', 'value' => 500.0],
            ],
            'value' => 1000.0,
            'series' => [
                ['x' => '2026-09-01', 'y' => 200.0],
                ['x' => '2026-09-02', 'y' => 1000.0],
            ],
            'status' => 'ok',
        ]);

        $this->assertCount(16, $results);

        foreach ($results as $key => $check) {
            $this->assertTrue(
                $check['passed'],
                "Invariant '{$key}' failed: " . ($check['message'] ?? '')
            );
        }
    }
}
