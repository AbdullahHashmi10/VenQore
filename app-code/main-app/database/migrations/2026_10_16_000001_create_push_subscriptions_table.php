<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Browser/PWA push subscriptions (Web Push, VAPID). One row per browser profile.
 *
 * A subscription belongs to a store and to a person in it: a rider employee (reached from the
 * rider link or the signed-in "My rides" page) and, when known, the login behind it. The endpoint
 * is unique, so subscribing again from the same browser updates the row instead of duplicating it.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('push_subscriptions')) {
            return;
        }

        Schema::create('push_subscriptions', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('tenant_id')->index();
            $t->unsignedBigInteger('user_id')->nullable()->index();
            $t->string('employee_id', 36)->nullable();
            $t->char('endpoint_hash', 64)->unique();
            $t->text('endpoint');
            $t->string('p256dh', 255);
            $t->string('auth_token', 255);
            $t->string('content_encoding', 20)->default('aes128gcm');
            $t->string('user_agent', 255)->nullable();
            $t->timestamp('last_used_at')->nullable();
            $t->timestamp('revoked_at')->nullable();
            $t->timestamps();

            $t->index(['tenant_id', 'employee_id', 'revoked_at'], 'push_sub_employee_idx');
            $t->index(['tenant_id', 'user_id', 'revoked_at'], 'push_sub_user_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
