<?php

use App\Services\Platform\PlanRestorer;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Re-creates any core plan (trial, solo, starter, core, scale, custom) that was
 * deleted from Platform HQ. Inserts only what is missing; never edits an existing
 * plan or its limits. Safe to run on every server.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('plans') || !Schema::hasTable('plan_limits') || !Schema::hasTable('platforms')) {
            return;
        }

        app(PlanRestorer::class)->restoreMissing();
    }

    public function down(): void
    {
        // Intentionally empty: deleting a core plan again would strand its tenants.
    }
};
