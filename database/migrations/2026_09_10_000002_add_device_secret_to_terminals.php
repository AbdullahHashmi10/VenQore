<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SEC-04 (2026-09-10): per-terminal device credential.
 * Only the SHA-256 of the secret is stored; the plain secret is returned to the
 * device exactly once (at pairing, or on first heartbeat for terminals paired
 * before this change) and must accompany every later terminal API call.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('terminals') && !Schema::hasColumn('terminals', 'device_secret_hash')) {
            Schema::table('terminals', function (Blueprint $table) {
                $table->string('device_secret_hash', 64)->nullable()->after('device_id');
                $table->timestamp('device_secret_issued_at')->nullable()->after('device_secret_hash');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('terminals') && Schema::hasColumn('terminals', 'device_secret_hash')) {
            Schema::table('terminals', function (Blueprint $table) {
                $table->dropColumn(['device_secret_hash', 'device_secret_issued_at']);
            });
        }
    }
};
