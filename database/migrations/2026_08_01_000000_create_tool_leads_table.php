<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * tool_leads — Free Tools program (SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md §4.3)
 *
 * PLATFORM-LEVEL TABLE. Deliberately has NO tenant_id column and must never
 * be queried through a tenant scope — leads come from anonymous public
 * visitors to /tools/* pages, not from any store's data.
 *
 * Two-track email model (plan §6.3):
 *   Track 1 (always): ToolDeliveryMail sends the requested artifact regardless
 *                      of marketing_consent. This row's `status` starts 'pending'.
 *   Track 2 (only if marketing_consent = true): ToolConsentConfirmMail sends a
 *                      double opt-in confirmation. status becomes 'confirmed'
 *                      only after the link is clicked (confirmed_at set).
 *
 * Only status='confirmed' AND marketing_consent=true AND not present in
 * email_suppressions is ever eligible for a promotional send.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tool_leads', function (Blueprint $table) {
            $table->id();

            // Identity — email is NOT unique: one person may use several tools.
            $table->string('email')->index();
            $table->string('name')->nullable();
            $table->string('company')->nullable();

            // Provenance
            $table->string('tool_slug')->index();
            $table->string('deliverable')->nullable();
            $table->json('context')->nullable();
            $table->string('country', 2)->nullable();
            $table->string('referrer', 512)->nullable();
            $table->json('utm')->nullable();

            // Consent — the legally load-bearing columns. Populated ONLY when
            // marketing_consent is true (see ToolLeadService::capture()).
            $table->boolean('marketing_consent')->default(false);
            $table->string('consent_text_hash', 64)->nullable();
            $table->string('consent_ip', 45)->nullable();
            $table->string('consent_user_agent', 512)->nullable();
            $table->timestamp('consent_at')->nullable();

            // Double opt-in
            $table->string('confirm_token', 64)->nullable()->unique();
            $table->timestamp('confirm_sent_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();

            // Lifecycle: pending | confirmed | unsubscribed | bounced | complained
            $table->string('status')->default('pending')->index();
            $table->string('unsubscribe_token', 64)->unique();
            $table->timestamp('unsubscribed_at')->nullable();
            $table->timestamp('last_emailed_at')->nullable();

            $table->timestamps();

            $table->index(['status', 'marketing_consent']);
            $table->index(['tool_slug', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tool_leads');
    }
};
