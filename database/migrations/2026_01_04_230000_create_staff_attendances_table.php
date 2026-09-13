<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('staff_attendances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->dateTime('check_in');
            $table->dateTime('check_out')->nullable();
            $table->integer('total_gap_minutes')->default(0);
            $table->string('status')->default('active'); // active, completed
            $table->timestamps();
        });

        Schema::create('staff_activity_gaps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('staff_attendance_id')->constrained('staff_attendances')->onDelete('cascade');
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->string('reason')->nullable(); // 'working', 'power_failure', 'other'
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_activity_gaps');
        Schema::dropIfExists('staff_attendances');
    }
};


