<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * R3 — Activity logging is broken on any fresh install.
 *
 * `2025_12_29_165404_create_activity_logs_table` created:
 *   - `description`  string  NOT NULL, no default
 *   - `subject_type` string  NOT NULL  (via uuidMorphs('subject'))
 *   - `subject_id`   uuid    NOT NULL  (via uuidMorphs('subject'))
 *
 * `2026_07_08_000002_add_detailed_fields_to_activity_logs_table` then added
 * payload/ip_address/user_agent/is_impersonated, which closed part of the gap.
 *
 * But `App\Traits\HasActivityLog::logActivity()` never writes `description`,
 * and writes `subject_id` as `$model->uuid ?? $model->id` which is null for any
 * model without either. On a fresh-migrated database every insert therefore
 * violates a NOT NULL constraint, throws, and is swallowed by the catch in the
 * trait — so the audit trail silently does not exist.
 *
 * This only "works" on the long-lived `venqore_pos` database because that schema
 * drifted to permit nulls. Every AppSumo buyer is a fresh install, so without
 * this migration none of them would have an audit trail at all.
 *
 * Fix: make the columns the trait does not populate nullable, so a fresh install
 * matches the writer. Uses raw ALTER statements rather than Doctrine DBAL
 * (`->change()`), which is not installed in this project.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('activity_logs')) {
            return;
        }

        // `description` — written by legacy callers, never by HasActivityLog.
        if (Schema::hasColumn('activity_logs', 'description')) {
            DB::statement('ALTER TABLE `activity_logs` MODIFY `description` VARCHAR(255) NULL');
        }

        // uuidMorphs('subject') created these as NOT NULL. HasActivityLog writes
        // subject_id as `$model->uuid ?? $model->id`, which can be null.
        if (Schema::hasColumn('activity_logs', 'subject_type')) {
            DB::statement('ALTER TABLE `activity_logs` MODIFY `subject_type` VARCHAR(255) NULL');
        }

        if (Schema::hasColumn('activity_logs', 'subject_id')) {
            DB::statement('ALTER TABLE `activity_logs` MODIFY `subject_id` CHAR(36) NULL');
        }

        // `action` is written on every path, so it stays NOT NULL.
    }

    public function down(): void
    {
        if (!Schema::hasTable('activity_logs')) {
            return;
        }

        // Backfill before restoring NOT NULL, otherwise the ALTER fails on
        // any row this migration allowed through.
        DB::table('activity_logs')->whereNull('description')->update(['description' => '']);
        DB::table('activity_logs')->whereNull('subject_type')->update(['subject_type' => '']);
        DB::table('activity_logs')->whereNull('subject_id')->update(['subject_id' => '']);

        if (Schema::hasColumn('activity_logs', 'description')) {
            DB::statement('ALTER TABLE `activity_logs` MODIFY `description` VARCHAR(255) NOT NULL');
        }

        if (Schema::hasColumn('activity_logs', 'subject_type')) {
            DB::statement('ALTER TABLE `activity_logs` MODIFY `subject_type` VARCHAR(255) NOT NULL');
        }

        if (Schema::hasColumn('activity_logs', 'subject_id')) {
            DB::statement('ALTER TABLE `activity_logs` MODIFY `subject_id` CHAR(36) NOT NULL');
        }
    }
};
