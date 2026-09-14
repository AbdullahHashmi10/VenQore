<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SEC-11 (2026-09-10): join codes move from "VQ-XXXX" (≈1.6M combinations,
 * guessable across all stores) to "VQ-XXXX-XXXX" (32^8 ≈ 1.1e12). Existing
 * codes keep working until an owner rotates them or a member is removed.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('tenants', 'join_code')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('join_code', 16)->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        // Intentionally not narrowing: new 12-char codes would be truncated.
    }
};
