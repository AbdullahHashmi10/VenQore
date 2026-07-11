<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * L032 — Proof-of-possession pairing for terminal claiming.
 *
 * Closes the residual terminal-hijack gap: previously any unauthenticated
 * caller could be first to claim a not-yet-paired terminal by supplying a
 * store slug and a guessed device_id. Now, binding a terminal to a tenant on
 * first contact requires a one-time pairing token that a tenant admin issued
 * in-app.
 *
 *   - terminals gains `paired_at` (when it was bound to a tenant).
 *   - terminal_pairing_tokens holds short-lived, single-use tokens per tenant.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('terminals', function (Blueprint $table) {
            if (!Schema::hasColumn('terminals', 'paired_at')) {
                $table->dateTime('paired_at')->nullable()->after('is_active');
            }
        });

        if (!Schema::hasTable('terminal_pairing_tokens')) {
            Schema::create('terminal_pairing_tokens', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->unsignedBigInteger('tenant_id')->index();
                $table->string('token', 100)->unique();
                $table->string('label')->nullable();       // e.g. "Front counter"
                $table->uuid('terminal_id')->nullable();    // set once consumed
                $table->dateTime('expires_at')->nullable();
                $table->dateTime('used_at')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('terminal_pairing_tokens');

        Schema::table('terminals', function (Blueprint $table) {
            if (Schema::hasColumn('terminals', 'paired_at')) {
                $table->dropColumn('paired_at');
            }
        });
    }
};
