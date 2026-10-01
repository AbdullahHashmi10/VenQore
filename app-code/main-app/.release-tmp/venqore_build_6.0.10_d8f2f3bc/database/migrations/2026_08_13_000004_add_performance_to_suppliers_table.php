<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->integer('lead_time_days')->nullable()->after('payment_terms');
            $table->integer('performance_rating')->nullable()->after('lead_time_days'); // 1-5 stars
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['lead_time_days', 'performance_rating']);
        });
    }
};
