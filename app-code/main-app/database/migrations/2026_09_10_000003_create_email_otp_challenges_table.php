<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AUTH-01 (2026-09-10): one row per emailed one-time code challenge.
 *
 * The code itself is never stored — only an HMAC keyed with the app secret.
 * `payload` (encrypted) carries pending-signup data (name, password HASH) or a
 * pending Google link, so no user/store is created until the code is proven.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_otp_challenges', function (Blueprint $table) {
            $table->string('id', 40)->primary();              // opaque random id
            $table->string('purpose', 20);                    // signup | login | link_google
            $table->string('email', 255);
            $table->unsignedBigInteger('user_id')->nullable();
            $table->text('payload')->nullable();              // encrypted JSON
            $table->string('code_hash', 64);
            $table->string('session_hash', 64);               // binds to the browser session
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->unsignedTinyInteger('sends')->default(1);
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamps();

            $table->index(['email', 'purpose']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_otp_challenges');
    }
};
