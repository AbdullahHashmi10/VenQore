<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // MariaDB (Laravel's separate `mariadb` driver — used in production and tests)
        // enforces CHECK constraints since 10.2, exactly like MySQL 8.0.16+.
        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            // 2026-09-10: never rewrite stock to make the constraint fit (this
            // used to clamp every negative quantity to 0). Installed only when
            // the data is clean; otherwise logged and left to venqore:db-guards.
            \App\Support\InventoryDbGuards::installIfClean('chk_remaining_qty_positive');
        } elseif (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement("
                CREATE TRIGGER chk_remaining_qty_positive_update
                BEFORE UPDATE ON inventory_batches
                FOR EACH ROW
                WHEN NEW.remaining_qty < 0 AND NEW.batch_type IS NOT 'negative_stock'
                BEGIN
                    SELECT RAISE(ABORT, 'CHECK constraint failed: chk_remaining_qty_positive');
                END;
            ");
            DB::statement("
                CREATE TRIGGER chk_remaining_qty_positive_insert
                BEFORE INSERT ON inventory_batches
                FOR EACH ROW
                WHEN NEW.remaining_qty < 0 AND NEW.batch_type IS NOT 'negative_stock'
                BEGIN
                    SELECT RAISE(ABORT, 'CHECK constraint failed: chk_remaining_qty_positive');
                END;
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE inventory_batches DROP CONSTRAINT chk_remaining_qty_positive');
        } elseif (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('DROP TRIGGER IF EXISTS chk_remaining_qty_positive_update');
            DB::statement('DROP TRIGGER IF EXISTS chk_remaining_qty_positive_insert');
        }
    }
};
