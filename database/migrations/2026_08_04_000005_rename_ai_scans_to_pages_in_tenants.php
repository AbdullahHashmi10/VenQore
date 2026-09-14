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
        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'ai_scans_used') && !Schema::hasColumn('tenants', 'ai_pages_used')) {
                $table->renameColumn('ai_scans_used', 'ai_pages_used');
            }
            if (Schema::hasColumn('tenants', 'ai_scans_limit') && !Schema::hasColumn('tenants', 'ai_pages_limit')) {
                $table->renameColumn('ai_scans_limit', 'ai_pages_limit');
            }
            if (!Schema::hasColumn('tenants', 'ai_descriptions_balance')) {
                $table->integer('ai_descriptions_balance')->default(0)->after('ai_status');
            }
            if (!Schema::hasColumn('tenants', 'ai_period_started_at')) {
                $table->timestamp('ai_period_started_at')->nullable()->after('ai_descriptions_balance');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'ai_pages_used') && !Schema::hasColumn('tenants', 'ai_scans_used')) {
                $table->renameColumn('ai_pages_used', 'ai_scans_used');
            }
            if (Schema::hasColumn('tenants', 'ai_pages_limit') && !Schema::hasColumn('tenants', 'ai_scans_limit')) {
                $table->renameColumn('ai_pages_limit', 'ai_scans_limit');
            }
            if (Schema::hasColumn('tenants', 'ai_descriptions_balance')) {
                $table->dropColumn('ai_descriptions_balance');
            }
            if (Schema::hasColumn('tenants', 'ai_period_started_at')) {
                $table->dropColumn('ai_period_started_at');
            }
        });
    }
};
