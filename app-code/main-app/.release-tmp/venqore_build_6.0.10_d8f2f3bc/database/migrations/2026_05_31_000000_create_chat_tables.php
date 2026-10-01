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
        // 1. chat_sessions
        Schema::create('chat_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->char('session_uuid', 36)->unique();
            $table->string('visitor_name', 100)->nullable();
            $table->string('visitor_email', 150)->nullable();
            $table->enum('status', [
                'bot_active',
                'human_requested',
                'agent_claimed',
                'agent_active',
                'idle_offline',
                'resolved'
            ])->default('bot_active');
            $table->unsignedBigInteger('claimed_by')->nullable();
            $table->timestamp('claimed_at')->nullable();
            $table->char('claim_lock_token', 36)->nullable();
            $table->timestamp('claim_lock_expires')->nullable();
            $table->string('escalation_reason', 255)->nullable();
            $table->boolean('ticket_created')->default(false);
            $table->boolean('ai_disabled')->default(false);
            $table->timestamp('last_message_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status'], 'idx_tenant_status');
            $table->index('claimed_by', 'idx_claimed_by');
            $table->index('session_uuid', 'idx_session_uuid');

            // Foreign keys
            $table->foreign('claimed_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // 2. chat_messages
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->enum('sender_type', ['visitor', 'bot', 'agent', 'system']);
            $table->unsignedBigInteger('sender_id')->nullable();
            $table->string('sender_name', 100)->nullable();
            $table->text('body');
            $table->json('metadata')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->index(['session_id', 'created_at'], 'idx_session_created');

            $table->foreign('session_id')->references('id')->on('chat_sessions')->onDelete('cascade');
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('set null');
        });

        // 3. agent_typing_events
        Schema::create('agent_typing_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->unsignedBigInteger('agent_id');
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->unique(['session_id', 'agent_id'], 'uq_agent_session');

            $table->foreign('session_id')->references('id')->on('chat_sessions')->onDelete('cascade');
            $table->foreign('agent_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 4. canned_responses
        Schema::create('canned_responses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('shortcode', 50);
            $table->string('title', 150);
            $table->text('body');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'shortcode'], 'idx_tenant_shortcode');

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('canned_responses');
        Schema::dropIfExists('agent_typing_events');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_sessions');
    }
};
