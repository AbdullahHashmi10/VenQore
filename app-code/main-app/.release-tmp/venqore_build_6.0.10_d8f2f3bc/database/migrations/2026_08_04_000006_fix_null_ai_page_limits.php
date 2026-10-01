<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix managed tenants with null or zero ai_pages_limit
        DB::table('tenants')
            ->where('ai_status', 'managed')
            ->where(function ($query) {
                $query->whereNull('ai_pages_limit')
                      ->orWhere('ai_pages_limit', '<=', 0);
            })
            ->update([
                'ai_pages_limit'   => 500,
                'ai_queries_limit' => 2500,
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op for data fix
    }
};
