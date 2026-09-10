<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (\Illuminate\Support\Facades\Schema::hasTable('service_tools')) {
            \Illuminate\Support\Facades\DB::table('service_tools')->truncate();
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE service_tools MODIFY product_id CHAR(36) NOT NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (\Illuminate\Support\Facades\Schema::hasTable('service_tools')) {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE service_tools MODIFY product_id BIGINT UNSIGNED NOT NULL");
        }
    }
};
