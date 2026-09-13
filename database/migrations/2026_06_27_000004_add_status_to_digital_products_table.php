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
        Schema::table('digital_products', function (Blueprint $table) {
            $table->string('status')->default('soon'); // active, dev, soon
        });

        // Migrate existing is_done values to status column
        DB::table('digital_products')->where('is_done', true)->update(['status' => 'active']);
        DB::table('digital_products')->where('is_done', false)->update(['status' => 'dev']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('digital_products', function (Blueprint $table) {
            $table->dropColumn(['status']);
        });
    }
};
