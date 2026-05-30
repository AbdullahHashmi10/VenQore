<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drm_licenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id')->nullable()->index();
            $table->string('license_key')->unique();
            $table->string('hardware_fingerprint')->nullable();
            $table->timestamp('last_validated_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->integer('grace_period_days')->default(30);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drm_licenses');
    }
};
