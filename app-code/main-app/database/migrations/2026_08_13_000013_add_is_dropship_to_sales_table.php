<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('sales', 'is_dropship')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->boolean('is_dropship')->default(false)->after('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('sales', 'is_dropship')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropColumn('is_dropship');
            });
        }
    }
};
