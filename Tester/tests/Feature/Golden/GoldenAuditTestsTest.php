<?php

namespace Tests\Feature\Golden;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * @group golden
 * @group audit
 *
 * PHPUnit wrapper around the two standalone audit sweeps:
 *   - audit:ledger-truth --strict   (154-route Ledger Truth Sweep)
 *   - audit:data-integrity          (8-check Pricing/Data Integrity Sweep)
 *
 * This makes both sweeps part of the same suite that runs the rest of the
 * Golden tests and the Sentinel isolation trap (Tester/phpunit.xml's
 * "Feature" testsuite resolves to Tester/tests/Feature — this file must
 * live under that directory to be picked up; it was previously misplaced
 * at the project root's tests/Feature/, which is not part of any
 * registered PHPUnit testsuite and was never actually being run as part
 * of a full-suite pass).
 */
class GoldenAuditTestsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @test
     * Test that the Ledger Truth Audit passes cleanly in strict mode
     * (0 mismatches AND 0 unverified LEDGER-DERIVED metrics).
     */
    public function test_ledger_truth_audit(): void
    {
        putenv('APP_ENV=testing');

        // Run the seeder first to ensure clean state
        $this->artisan('db:seed', ['--class' => 'GoldenAuditSeeder'])
            ->assertExitCode(0);

        // Run the ledger truth audit
        $this->artisan('audit:ledger-truth', ['--strict' => true])
            ->assertExitCode(0);
    }

    /**
     * @test
     * Test that the Data & Pricing Integrity Audit (8 checks: POS pricing/stock,
     * Sales, Purchases, Proposals, Debit Notes, Payments, Sales Orders,
     * Purchase Orders) passes cleanly.
     */
    public function test_data_integrity_audit(): void
    {
        putenv('APP_ENV=testing');

        // Run the seeder first to ensure clean state
        $this->artisan('db:seed', ['--class' => 'GoldenAuditSeeder'])
            ->assertExitCode(0);

        // Run the data integrity audit
        $this->artisan('audit:data-integrity')
            ->assertExitCode(0);
    }
}
