<?php

namespace Tests\Feature;

use Tests\TestCase;

class GoldenAuditTestsTest extends TestCase
{
    /**
     * Test that the Ledger Truth Audit passes cleanly.
     */
    public function test_ledger_truth_audit(): void
    {
        putenv('APP_ENV=testing');

        // Run the seeder first to ensure clean state
        $this->artisan('db:seed', ['--class' => 'GoldenAuditSeeder', '--force' => true])
            ->assertExitCode(0);

        // Run the ledger truth audit
        $this->artisan('audit:ledger-truth')
            ->assertExitCode(0);
    }

    /**
     * Test that the Data & Pricing Integrity Audit passes cleanly.
     */
    public function test_data_integrity_audit(): void
    {
        putenv('APP_ENV=testing');

        // Run the data integrity audit
        $this->artisan('audit:data-integrity')
            ->assertExitCode(0);
    }
}
