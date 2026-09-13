<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('base_unit')->nullable(); // e.g., pcs
            $table->string('secondary_unit')->nullable(); // e.g., box
            $table->decimal('conversion_rate', 10, 4)->nullable(); // e.g., 12
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['base_unit', 'secondary_unit', 'conversion_rate']);
        });
    }
};


