<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('chat_sessions', function (Blueprint $table) {
            $table->unsignedBigInteger('referred_to')->nullable()->after('claimed_by');
            $table->string('sub_status', 50)->nullable()->after('status'); // e.g. 'fixed', 'pending'

            $table->foreign('referred_to')->references('id')->on('users')->onDelete('set null');
            $table->index('referred_to', 'idx_referred_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_sessions', function (Blueprint $table) {
            $table->dropForeign(['referred_to']);
            $table->dropIndex('idx_referred_to');
            $table->dropColumn(['referred_to', 'sub_status']);
        });
    }
};
