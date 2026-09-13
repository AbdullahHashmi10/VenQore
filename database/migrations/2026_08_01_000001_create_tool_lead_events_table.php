<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * tool_lead_events — append-only audit log for tool_leads.
 *
 * PLATFORM-LEVEL TABLE. No tenant_id.
 *
 * This is what gets produced if a regulator or an ESP abuse desk asks
 * "prove this person opted in." Every consent-relevant transition writes
 * a row here: captured, delivery_sent, confirm_sent, confirmed,
 * unsubscribed, bounced, complained, campaign_sent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tool_lead_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tool_lead_id')->constrained('tool_leads')->cascadeOnDelete();
            $table->string('event');
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['tool_lead_id', 'event']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tool_lead_events');
    }
};
