<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Fixes chk_remaining_qty_positive constraint on production MySQL/MariaDB instances
     * where the constraint was originally applied without the batch_type = 'negative_stock' exception.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            // Drop old constraint if present (trying both MySQL/MariaDB drop syntaxes)
            try {
                DB::statement("ALTER TABLE inventory_batches DROP CONSTRAINT chk_remaining_qty_positive");
            } catch (\Throwable $e) {
                try {
                    DB::statement("ALTER TABLE inventory_batches DROP CHECK chk_remaining_qty_positive");
                } catch (\Throwable $e2) {
                    // Constraint did not exist or already dropped
                }
            }

            // Re-create constraint with the explicit negative_stock exception
            DB::statement("ALTER TABLE inventory_batches ADD CONSTRAINT chk_remaining_qty_positive CHECK (remaining_qty >= 0 OR batch_type = 'negative_stock')");
        } elseif ($driver === 'sqlite') {
            // Drop and recreate SQLite triggers to ensure negative_stock exception is present
            DB::statement('DROP TRIGGER IF EXISTS chk_remaining_qty_positive_update');
            DB::statement('DROP TRIGGER IF EXISTS chk_remaining_qty_positive_insert');

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
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            try {
                DB::statement("ALTER TABLE inventory_batches DROP CONSTRAINT chk_remaining_qty_positive");
            } catch (\Throwable $e) {
                try {
                    DB::statement("ALTER TABLE inventory_batches DROP CHECK chk_remaining_qty_positive");
                } catch (\Throwable $e2) {}
            }
        }
    }
};
