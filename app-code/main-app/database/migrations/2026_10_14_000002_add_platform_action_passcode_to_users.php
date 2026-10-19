<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The Hashmi Dashboard action passcode used to live on a store membership
 * (tenant_user.security_pin) chosen by users.last_store_id ?: 1 — so setting it
 * silently created an OWNER membership in store #1, and the passcode stopped
 * working whenever last_store_id changed. It now lives on the user.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'platform_action_passcode')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('platform_action_passcode', 255)->nullable()->after('platform_pin');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'platform_action_passcode')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('platform_action_passcode');
            });
        }
    }
};
