<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * V1 Support Inbox — minimal tickets + replies.
 * Full SLA routing, assignment queues, CSAT are V2 features.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('subject');
            $table->text('message');
            $table->string('status', 20)->default('open');   // open, in_progress, resolved, closed
            $table->string('priority', 10)->default('normal'); // low, normal, high, urgent
            $table->string('requester_email')->nullable();
            $table->string('requester_name')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('tenant_id');
        });

        Schema::create('support_ticket_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('support_tickets')->cascadeOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('body');
            $table->boolean('is_platform_owner')->default(false); // false = store user, true = platform team
            $table->timestamps();
        });

        // Webhook log table — stores last 500 Lemon Squeezy webhook events
        Schema::create('webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->string('source', 30)->default('lemon_squeezy'); // extensible
            $table->string('event_type', 80);
            $table->json('payload');
            $table->string('status', 20)->default('received'); // received, processed, failed
            $table->text('error')->nullable();
            $table->string('store_name')->nullable(); // derived from payload for display
            $table->string('plan')->nullable();
            $table->timestamps();

            $table->index(['source', 'created_at']);
            $table->index('event_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_ticket_replies');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('webhook_logs');
    }
};
