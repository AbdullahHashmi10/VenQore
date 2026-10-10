<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Till queue telemetry (sale reliability, 9 Oct 2026) — additive only.
 *
 * The server cannot see sales held in a browser while it is offline. When a
 * till reconnects it reports, per device, how many queued sales it still
 * holds in each state and how old the oldest is. One row per store + device,
 * overwritten by each report; `sales:reconcile` lists tills holding sales.
 * No sale content is sent, only counts and ages.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pos_queue_telemetry')) {
            return;
        }
        Schema::create('pos_queue_telemetry', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('device_id', 64);
            $table->unsignedBigInteger('user_id')->nullable();
            $table->json('counts');
            $table->unsignedInteger('unresolved')->default(0);
            $table->timestamp('oldest_unresolved_at')->nullable();
            $table->boolean('storage_persisted')->nullable();
            $table->string('client_build', 64)->nullable();
            $table->timestamp('reported_at');
            $table->timestamps();
            $table->unique(['tenant_id', 'device_id']);
            $table->index(['tenant_id', 'unresolved']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_queue_telemetry');
    }
};
