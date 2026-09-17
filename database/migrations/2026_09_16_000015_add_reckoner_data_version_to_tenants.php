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
        if (Schema::hasTable('tenants') && !Schema::hasColumn('tenants', 'reckoner_data_version')) {
            Schema::table('tenants', function (Blueprint $t) {
                $t->unsignedBigInteger('reckoner_data_version')->default(0);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tenants') && Schema::hasColumn('tenants', 'reckoner_data_version')) {
            Schema::table('tenants', function (Blueprint $t) {
                $t->dropColumn('reckoner_data_version');
            });
        }
    }
};
