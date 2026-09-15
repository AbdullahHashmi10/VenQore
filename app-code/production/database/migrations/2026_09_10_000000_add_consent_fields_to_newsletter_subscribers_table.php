<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
            $table->string('confirmation_token', 64)->nullable()->unique()->after('interest');
            $table->string('unsubscribe_token', 64)->nullable()->unique()->after('confirmation_token');
            $table->timestamp('confirmed_at')->nullable()->after('unsubscribe_token');
            $table->timestamp('unsubscribed_at')->nullable()->after('confirmed_at');
            $table->string('consent_ip', 45)->nullable()->after('unsubscribed_at');
        });
    }

    public function down(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->string('status')->default('subscribed')->change();
            $table->dropUnique(['confirmation_token']);
            $table->dropUnique(['unsubscribe_token']);
            $table->dropColumn([
                'confirmation_token',
                'unsubscribe_token',
                'confirmed_at',
                'unsubscribed_at',
                'consent_ip',
            ]);
        });
    }
};
