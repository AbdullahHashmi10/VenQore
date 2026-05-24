<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            // Add bank_name column (separate from general name)
            $table->string('bank_name')->nullable()->after('name');
            // Add notes column
            $table->text('notes')->nullable()->after('current_balance');
            // Rename type to account_type for clarity
            // Note: SQLite doesn't support renameColumn well, so we'll just add a new column
            $table->string('account_type')->nullable()->after('type');
        });

        // Copy type values to account_type
        DB::table('bank_accounts')->update(['account_type' => DB::raw('type')]);
    }

    public function down(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->dropColumn(['bank_name', 'notes', 'account_type']);
        });
    }
};


