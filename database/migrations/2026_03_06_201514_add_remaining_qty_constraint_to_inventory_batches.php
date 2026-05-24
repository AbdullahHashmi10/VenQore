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
            
            DB::statement('ALTER TABLE inventory_batches ADD CONSTRAINT chk_remaining_qty_positive CHECK (remaining_qty >= 0)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE inventory_batches DROP CONSTRAINT chk_remaining_qty_positive');
        }
    }
};
