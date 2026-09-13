<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Add device_id to terminals if it doesn't exist
        if (Schema::hasTable('terminals') && !Schema::hasColumn('terminals', 'device_id')) {
            Schema::table('terminals', function (Blueprint $table) {
                $table->string('device_id')->nullable()->after('name');
            });
        }

        // Create terminal_activities table
        Schema::create('terminal_activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('terminal_id')->nullable();
            $table->string('device_id')->nullable();
            $table->dateTime('away_at');
            $table->dateTime('back_at');
            $table->integer('duration_seconds');
            $table->string('screenshot_path')->nullable();
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->timestamps();

            // Foreign key relation if tables exist
            if (Schema::hasTable('terminals')) {
                $table->foreign('terminal_id')->references('id')->on('terminals')->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('terminal_activities');
        if (Schema::hasTable('terminals') && Schema::hasColumn('terminals', 'device_id')) {
            Schema::table('terminals', function (Blueprint $table) {
                $table->dropColumn('device_id');
            });
        }
    }
};
