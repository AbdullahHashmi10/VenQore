<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Register tiered report plan feature keys in plan_limits per SPEC_REPORTING_TIERS_FINAL.
     */
    public function up(): void
    {
        (new \Database\Seeders\PlanFeatureMatrixSeeder)->run();
    }

    public function down(): void
    {
        // Non-destructive down migration
    }
};
