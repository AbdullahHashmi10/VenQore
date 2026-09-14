<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Error Logs — captures both backend exceptions and frontend JS errors ──
        Schema::create('error_logs', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('backend');         // 'backend' | 'frontend'
            $table->string('message', 1000);
            $table->string('url', 500)->nullable();            // page URL where it happened
            $table->string('method', 10)->nullable();          // GET/POST etc
            $table->text('stack_trace')->nullable();
            $table->string('file', 500)->nullable();
            $table->unsignedInteger('line')->nullable();
            $table->string('status_code', 10)->nullable();     // 500, 404, etc.
            $table->uuid('tenant_id')->nullable()->index();    // which store
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_agent', 500)->nullable();
            $table->string('ip_address', 50)->nullable();
            $table->boolean('is_resolved')->default(false)->index();
            $table->text('resolution_note')->nullable();
            $table->unsignedInteger('occurrence_count')->default(1);
            $table->string('fingerprint', 64)->nullable()->index(); // hash for deduplication
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
            $table->index(['type', 'is_resolved', 'created_at']);
        });

        // ── Contact Submissions — from the Marketing/Contact page ──
        Schema::create('contact_submissions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('subject')->nullable();
            $table->string('company')->nullable();
            $table->text('message');
            $table->string('source')->default('contact_page'); // contact_page | support_widget
            $table->string('status')->default('new');          // new | read | replied | closed
            $table->text('admin_note')->nullable();
            $table->string('ip_address', 50)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_submissions');
        Schema::dropIfExists('error_logs');
    }
};
