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
        Schema::create('staff_daily_summaries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date'); // The day being summarized
            $table->json('work_intervals')->nullable(); // Array of {start, end, duration}
            $table->decimal('total_hours', 8, 2)->default(0);
            $table->decimal('total_gap_hours', 8, 2)->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_daily_summaries');
    }
};


