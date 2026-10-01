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
        if (!Schema::hasTable('registers')) {
            Schema::create('registers', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id')->index();
                $table->string('name');
                $table->string('code')->nullable();
                $table->uuid('location_id')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamp('last_seen_at')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('user_devices')) {
            Schema::create('user_devices', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->index();
                $table->unsignedBigInteger('tenant_id')->nullable()->index();
                $table->string('device_token_hash')->index();
                $table->string('device_label')->default('Browser / Device');
                $table->string('ip_country', 10)->nullable();
                $table->string('current_session_id')->nullable()->index();
                $table->boolean('is_active')->default(true);
                $table->timestamp('last_active_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_devices');
        Schema::dropIfExists('registers');
    }
};
