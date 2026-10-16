<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phones running the VenQore app that agreed to notifications (FCM registration tokens).
 * A token belongs to the signed-in person; it is revoked at sign-out and when FCM says it is dead.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('device_tokens')) {
            return;
        }

        Schema::create('device_tokens', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id')->index();
            $t->char('token_hash', 64)->unique();
            $t->text('token');
            $t->string('platform', 20)->default('android');
            $t->string('app_version', 40)->nullable();
            $t->timestamp('last_seen_at')->nullable();
            $t->timestamp('revoked_at')->nullable();
            $t->timestamps();

            $t->index(['user_id', 'revoked_at'], 'device_tokens_user_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_tokens');
    }
};
