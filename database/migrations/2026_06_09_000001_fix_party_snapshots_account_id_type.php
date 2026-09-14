<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('party_snapshots')) {
            Schema::table('party_snapshots', function (Blueprint $table) {
                $table->char('account_id', 36)->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('party_snapshots')) {
            Schema::table('party_snapshots', function (Blueprint $table) {
                $table->unsignedBigInteger('account_id')->nullable()->change();
            });
        }
    }
};
