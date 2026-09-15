<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_plan_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('override_key', 100);
            $table->string('override_value', 255)->nullable();
            $table->string('original_value', 255)->nullable();
            $table->text('reason')->nullable();
            $table->unsignedBigInteger('applied_by');
            $table->timestamp('expires_at')->nullable();

            $table->timestamps();

            $table->unique(['tenant_id', 'override_key']);
            $table->index(['tenant_id']);
            $table->index(['expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_plan_overrides');
    }
};
