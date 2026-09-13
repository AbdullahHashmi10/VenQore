<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the `business_type` column the Reckoner build spec (§6.3, §4.1
 * capabilities, Phase 4 ReckonerLabels) assumes exists on `tenants` but
 * did not, as of Phase 1. This is what unblocks:
 *
 *   - ReckonerSettings::dormantDays() reading a REAL per-tenant default
 *     instead of falling back to 'generic' for every store.
 *   - Phase 4 ReckonerLabels' business-type label map.
 *   - has_restaurant / has_manufacturing-style capability probes that
 *     want to know what KIND of store this is, not just what it has
 *     recorded.
 *
 * Nullable, indexed, defaults to null (never a fabricated guess) — an
 * existing store's business type is unknown until the owner sets it via
 * onboarding or Settings; the Reckoner treats null exactly like 'generic'.
 * Nothing about this migration assumes new stores get any particular type.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('tenants', 'business_type')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('business_type', 32)->nullable()->after('name')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('tenants', 'business_type')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->dropColumn('business_type');
            });
        }
    }
};
