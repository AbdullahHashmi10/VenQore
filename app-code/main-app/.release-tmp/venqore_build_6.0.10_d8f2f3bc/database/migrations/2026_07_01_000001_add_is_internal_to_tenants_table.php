<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds an `is_internal` flag to tenants so platform-owner / internal / test
 * stores can be excluded from money & counts everywhere (Roadmap T1.1).
 *
 * Incremental & reversible. MySQL only (per project DB policy).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (! Schema::hasColumn('tenants', 'is_internal')) {
                $table->boolean('is_internal')->default(false)->after('is_demo');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'is_internal')) {
                $table->dropColumn('is_internal');
            }
        });
    }
};
