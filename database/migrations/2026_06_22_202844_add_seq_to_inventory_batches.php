<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasColumn('inventory_batches', 'seq')) {
            DB::statement('ALTER TABLE inventory_batches ADD COLUMN seq BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE AFTER id');
        }
    }
    public function down(): void {
        if (Schema::hasColumn('inventory_batches', 'seq')) {
            DB::statement('ALTER TABLE inventory_batches DROP COLUMN seq');
        }
    }
};
