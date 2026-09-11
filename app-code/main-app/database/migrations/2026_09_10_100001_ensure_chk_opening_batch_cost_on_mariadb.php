<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Ensure inventory_batches.chk_opening_batch_cost exists on MariaDB installs
 * (opening stock must carry a real cost — rulebook S-055 / B19).
 *
 * 2026_03_05_182418 only added it for the `mysql` driver; production and the
 * test suite use Laravel's `mariadb` driver, so it was never installed there.
 * That migration now accepts `mariadb` for fresh installs; this one back-fills
 * databases where it already ran. Idempotent.
 *
 * Existing zero-cost opening batches cannot be repaired automatically (there
 * is no true cost to put back), so if any exist the constraint is NOT added
 * and the rows are logged for the owner to correct; re-run with
 * `php artisan migrate:refresh --path=database/migrations/2026_09_10_100001_ensure_chk_opening_batch_cost_on_mariadb.php`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        $exists = DB::table('information_schema.TABLE_CONSTRAINTS')
            ->where('CONSTRAINT_SCHEMA', DB::connection()->getDatabaseName())
            ->where('TABLE_NAME', 'inventory_batches')
            ->where('CONSTRAINT_NAME', 'chk_opening_batch_cost')
            ->exists();
        if ($exists) {
            return;
        }

        $bad = DB::table('inventory_batches')
            ->where('batch_type', 'opening')
            ->where(fn ($q) => $q->whereNull('unit_cost')->orWhere('unit_cost', '<=', 0));
        if ((clone $bad)->exists()) {
            Log::critical('chk_opening_batch_cost NOT added: opening batches with zero/empty cost exist. Give them a real cost, then re-run this migration.', [
                'batch_ids' => (clone $bad)->limit(200)->pluck('id')->all(),
            ]);
            return;
        }

        DB::statement("ALTER TABLE inventory_batches ADD CONSTRAINT chk_opening_batch_cost CHECK (unit_cost > 0 OR batch_type <> 'opening')");
    }

    public function down(): void
    {
        // The constraint belongs to 2026_03_05_182418, whose down() removes it.
    }
};
