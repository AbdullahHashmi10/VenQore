<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journal_items', function (Blueprint $table) {
            if (!Schema::hasColumn('journal_items', 'bank_account_id')) {
                $table->uuid('bank_account_id')->nullable()->after('party_id');
            }
            $table->index(['tenant_id', 'bank_account_id']);
        });
    }

    public function down(): void
    {
        Schema::table('journal_items', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'bank_account_id']);
            $table->dropColumn('bank_account_id');
        });
    }
};