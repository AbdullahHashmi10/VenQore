<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * email_suppressions — global do-not-send list.
 *
 * PLATFORM-LEVEL TABLE. No tenant_id.
 *
 * Checked before EVERY outbound marketing send, across both the tools
 * program and the existing newsletter_subscribers list. Once an address
 * is here it is permanently excluded from marketing mail; re-subscription
 * requires a fresh double opt-in, which clears the row only when
 * reason = 'unsubscribed'. hard_bounce, complaint and manual suppressions
 * are not auto-cleared.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_suppressions', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('reason'); // unsubscribed | hard_bounce | complaint | manual
            $table->string('source')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_suppressions');
    }
};
