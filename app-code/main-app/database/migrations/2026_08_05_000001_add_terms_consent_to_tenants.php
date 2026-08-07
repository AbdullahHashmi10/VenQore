<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'terms_accepted_at')) {
                $table->timestamp('terms_accepted_at')->nullable()->after('setup_completed');
            }
            if (!Schema::hasColumn('tenants', 'terms_version')) {
                $table->string('terms_version', 20)->nullable()->after('terms_accepted_at');
            }
            if (!Schema::hasColumn('tenants', 'shared_catalog_opt_out')) {
                $table->boolean('shared_catalog_opt_out')->default(false)->after('terms_version');
            }
            if (!Schema::hasColumn('tenants', 'ai_accuracy_opt_in')) {
                $table->boolean('ai_accuracy_opt_in')->default(false)->after('shared_catalog_opt_out');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['terms_accepted_at', 'terms_version', 'shared_catalog_opt_out', 'ai_accuracy_opt_in']);
        });
    }
};
