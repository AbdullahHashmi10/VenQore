<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Short-lived drafts for the conversational invoice assistant.
 *
 * Additive and independent of every financial table. A draft is provenance and
 * working state, never an invoice: cancelling or expiring one changes no stock,
 * balance or ledger. No raw audio, PINs or credentials are stored here.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('invoice_assistant_drafts')) {
            return;
        }

        Schema::create('invoice_assistant_drafts', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->unsignedBigInteger('tenant_id');
            $t->unsignedBigInteger('user_id');
            $t->unsignedSmallInteger('schema_version')->default(1);
            $t->unsignedInteger('revision')->default(1);
            $t->string('status', 24)->default('interpreting');
            $t->string('input_mode', 12)->default('text');
            $t->unsignedTinyInteger('turns')->default(1);

            $t->json('intent')->nullable();
            $t->json('choices')->nullable();      // operator selections (customer / product ids / units)
            $t->json('resolved')->nullable();
            $t->json('unresolved')->nullable();
            $t->string('candidate_set_id', 40)->nullable();
            $t->text('transcript')->nullable();   // sanitized speech transcript only
            $t->json('request_log')->nullable(); // bounded: request_id => {hash,op}

            $t->string('create_request_id', 64)->nullable();
            $t->string('provider', 24)->nullable();
            $t->string('model', 64)->nullable();
            $t->decimal('cost_usd', 12, 8)->default(0);

            $t->timestamp('expires_at')->nullable();
            $t->timestamp('handed_off_at')->nullable();
            $t->string('claim_token', 40)->nullable();
            $t->timestamp('claimed_at')->nullable();
            $t->timestamp('applied_at')->nullable();

            // Outcome of the NORMAL save, linked only after the backend validated it.
            $t->string('sale_id', 64)->nullable();
            $t->string('outcome', 24)->nullable();   // posted | pending_approval
            $t->string('failure_code', 48)->nullable();
            $t->timestamps();

            $t->index(['tenant_id', 'user_id', 'status'], 'ia_drafts_owner_status');
            $t->index('expires_at', 'ia_drafts_expires');
            $t->unique(['tenant_id', 'user_id', 'create_request_id'], 'ia_drafts_create_request');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_assistant_drafts');
    }
};
