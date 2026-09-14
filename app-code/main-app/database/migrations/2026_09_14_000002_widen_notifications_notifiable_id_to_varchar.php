<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('notifications')) {
            try {
                DB::statement("ALTER TABLE notifications MODIFY notifiable_id VARCHAR(64) NOT NULL");
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Migration alter notifications notifiable_id notice: ' . $e->getMessage());
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('notifications')) {
            try {
                DB::statement("ALTER TABLE notifications MODIFY notifiable_id CHAR(36) NOT NULL");
            } catch (\Throwable $e) {
                // Ignore rollback failure
            }
        }
    }
};
