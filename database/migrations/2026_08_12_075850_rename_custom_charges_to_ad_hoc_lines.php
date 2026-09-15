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
        if (Schema::hasTable('custom_charges') && !Schema::hasTable('ad_hoc_lines')) {
            Schema::rename('custom_charges', 'ad_hoc_lines');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('ad_hoc_lines') && !Schema::hasTable('custom_charges')) {
            Schema::rename('ad_hoc_lines', 'custom_charges');
        }
    }
};
