<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop unique index first, then widen the column, then re-add index
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropUnique('journal_entries_idempotency_key_unique');
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->string('idempotency_key', 100)->nullable()->change();
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->unique('idempotency_key');
        });
    }

    public function down(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropUnique('journal_entries_idempotency_key_unique');
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->string('idempotency_key', 36)->nullable()->change();
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->unique('idempotency_key');
        });
    }
};
