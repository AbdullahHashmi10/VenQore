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
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'kitchen_station')) {
            Schema::table('products', function (Blueprint $table) {
                $table->string('kitchen_station', 32)->nullable()->default('kitchen')->after('skill_tag')
                    ->comment('Prep station routing: kitchen | bar | grill | cold | bakery');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'kitchen_station')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('kitchen_station');
            });
        }
    }
};
