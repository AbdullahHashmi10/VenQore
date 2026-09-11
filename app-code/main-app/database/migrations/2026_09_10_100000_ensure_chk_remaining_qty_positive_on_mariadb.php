<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Ensure the inventory_batches.chk_remaining_qty_positive CHECK constraint exists on
 * MariaDB installs.
 *
 * The constraint migrations (2026_03_06_201514 and 2026_07_21_000000) originally
 * gated on getDriverName() === 'mysql'. Production and the test suite connect through
 * Laravel's separate `mariadb` driver, so on those databases both migrations ran as
 * no-ops and the DB-level "no oversell" guard was never installed. Those migrations now
 * accept `mariadb` (for fresh installs); this one back-fills databases where they have
 * already been recorded as run.
 *
 * Idempotent: does nothing when the constraint is already present.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        if ($this->constraintExists()) {
            return;
        }

        // Adding a CHECK constraint validates existing rows, so repair any row that would
        // violate it first (same policy as 2026_03_06_201514: clamp to zero).
        $violating = DB::table('inventory_batches')
            ->where('remaining_qty', '<', 0)
            ->where('batch_type', '!=', 'negative_stock');

        $count = (clone $violating)->count();
        if ($count > 0) {
            Log::warning('ensure_chk_remaining_qty_positive: clamping negative remaining_qty to 0 before adding CHECK constraint.', [
                'rows' => $count,
                'batch_ids' => (clone $violating)->limit(100)->pluck('id')->all(),
            ]);
            $violating->update(['remaining_qty' => 0]);
        }

        DB::statement("ALTER TABLE inventory_batches ADD CONSTRAINT chk_remaining_qty_positive CHECK (remaining_qty >= 0 OR batch_type = 'negative_stock')");
    }

    public function down(): void
    {
        // Intentionally a no-op: the constraint belongs to 2026_03_06_201514 /
        // 2026_07_21_000000, whose down() methods remove it.
    }

    private function constraintExists(): bool
    {
        return DB::table('information_schema.TABLE_CONSTRAINTS')
            ->where('CONSTRAINT_SCHEMA', DB::connection()->getDatabaseName())
            ->where('TABLE_NAME', 'inventory_batches')
            ->where('CONSTRAINT_NAME', 'chk_remaining_qty_positive')
            ->exists();
    }
};
