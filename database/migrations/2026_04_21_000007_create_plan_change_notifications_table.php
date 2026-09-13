<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_change_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->enum('type', [
                'upgrade', 'downgrade', 'limit_increase', 'limit_decrease',
                'feature_added', 'feature_removed', 'extension', 'expiry_warning', 'manual_override'
            ]);
            $table->string('title', 255);
            $table->text('message');
            $table->json('details')->nullable();
            $table->boolean('is_read')->default(false);
            $table->enum('sent_by', ['system', 'admin'])->default('system');
            $table->unsignedBigInteger('admin_user_id')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'is_read']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_change_notifications');
    }
};
