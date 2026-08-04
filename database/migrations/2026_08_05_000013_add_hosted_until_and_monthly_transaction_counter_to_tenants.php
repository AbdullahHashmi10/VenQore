<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'hosted_until')) {
                $table->timestamp('hosted_until')->nullable()->after('status');
            }
            if (!Schema::hasColumn('tenants', 'transactions_this_month')) {
                $table->unsignedInteger('transactions_this_month')->default(0)->after('hosted_until');
            }
            if (!Schema::hasColumn('tenants', 'transactions_reset_at')) {
                $table->date('transactions_reset_at')->nullable()->after('transactions_this_month');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['hosted_until', 'transactions_this_month', 'transactions_reset_at']);
        });
    }
};
