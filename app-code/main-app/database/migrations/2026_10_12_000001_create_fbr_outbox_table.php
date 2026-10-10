<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FBR outbox (sale reliability, 9 Oct 2026) — additive only.
 *
 * A sale used to be reported to FBR from INSIDE its database transaction: the
 * till waited on FBR while holding the sale's locks, and a sale FBR could not
 * be reached for was never reported again. Now the sale writes one row here in
 * the same transaction (so a committed sale always has its report queued),
 * and the report is sent after commit and retried by `fbr:flush-outbox`.
 *
 * status: pending → sending → sent | failed (retried) | rejected (FBR said no;
 * needs a person) | dead (gave up after the last attempt).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('fbr_outbox')) {
            return;
        }
        Schema::create('fbr_outbox', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->unsignedBigInteger('tenant_id')->index();
            $table->char('sale_id', 36)->unique();
            $table->string('status', 16)->default('pending');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('next_attempt_at')->nullable();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->string('last_code', 16)->nullable();
            $table->text('last_error')->nullable();
            $table->string('fbr_invoice_number')->nullable();
            $table->timestamps();
            $table->index(['status', 'next_attempt_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fbr_outbox');
    }
};
