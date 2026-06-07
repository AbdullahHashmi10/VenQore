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
        if (DB::connection()->getDriverName() === 'mysql') {
            // Fix any existing broken data first
            DB::table('inventory_batches')->where('remaining_qty', '<', 0)->update(['remaining_qty' => 0]);
            
            DB::statement("ALTER TABLE inventory_batches ADD CONSTRAINT chk_remaining_qty_positive CHECK (remaining_qty >= 0 OR batch_type = 'negative_stock')");
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
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE inventory_batches DROP CONSTRAINT chk_remaining_qty_positive');
        } elseif (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('DROP TRIGGER IF EXISTS chk_remaining_qty_positive_update');
            DB::statement('DROP TRIGGER IF EXISTS chk_remaining_qty_positive_insert');
        }
    }
};
