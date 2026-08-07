<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Enforces: opening inventory batches must have unit_cost > 0.
     * MySQL uses a native CHECK constraint.
     * SQLite uses BEFORE INSERT / BEFORE UPDATE triggers (CHECK constraints
     * on existing columns are not supported by SQLite's ALTER TABLE).
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE inventory_batches ADD CONSTRAINT chk_opening_batch_cost CHECK (unit_cost > 0 OR batch_type != "opening")');
        } elseif ($driver === 'sqlite') {
            // SQLite does not support adding CHECK constraints via ALTER TABLE,
            // so we enforce the same rule with triggers instead.
            DB::statement("
                CREATE TRIGGER IF NOT EXISTS trg_chk_opening_batch_cost_insert
                BEFORE INSERT ON inventory_batches
                FOR EACH ROW
                WHEN NEW.batch_type = 'opening' AND (NEW.unit_cost IS NULL OR NEW.unit_cost <= 0)
                BEGIN
                    SELECT RAISE(ABORT, 'chk_opening_batch_cost: opening batches must have unit_cost > 0');
                END
            ");
            DB::statement("
                CREATE TRIGGER IF NOT EXISTS trg_chk_opening_batch_cost_update
                BEFORE UPDATE ON inventory_batches
                FOR EACH ROW
                WHEN NEW.batch_type = 'opening' AND (NEW.unit_cost IS NULL OR NEW.unit_cost <= 0)
                BEGIN
                    SELECT RAISE(ABORT, 'chk_opening_batch_cost: opening batches must have unit_cost > 0');
                END
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE inventory_batches DROP CONSTRAINT chk_opening_batch_cost');
        } elseif ($driver === 'sqlite') {
            DB::statement('DROP TRIGGER IF EXISTS trg_chk_opening_batch_cost_insert');
            DB::statement('DROP TRIGGER IF EXISTS trg_chk_opening_batch_cost_update');
        }
    }
};

