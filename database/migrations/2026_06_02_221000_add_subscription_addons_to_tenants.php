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
            $table->string('ai_status')->default('none')->after('plan');
            $table->integer('ai_queries_limit')->default(0)->after('ai_status');
            $table->integer('ai_queries_used')->default(0)->after('ai_queries_limit');
            $table->integer('ai_scans_limit')->default(0)->after('ai_queries_used');
            $table->integer('ai_scans_used')->default(0)->after('ai_scans_limit');
            $table->json('sync_channels')->nullable()->after('ai_scans_used');
            $table->timestamp('grace_ends_at')->nullable()->after('sync_channels');
            $table->timestamp('view_only_since')->nullable()->after('grace_ends_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'ai_status',
                'ai_queries_limit',
                'ai_queries_used',
                'ai_scans_limit',
                'ai_scans_used',
                'sync_channels',
                'grace_ends_at',
                'view_only_since',
            ]);
        });
    }
};
