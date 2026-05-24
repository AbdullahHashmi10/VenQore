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
        Schema::table('recipes', function (Blueprint $table) {
            $table->decimal('labor_cost', 10, 2)->default(0)->after('yield_unit');
            $table->decimal('overhead_cost', 10, 2)->default(0)->after('labor_cost');
        });

        // Add wastage_percent to recipe_ingredients
        Schema::table('recipe_ingredients', function (Blueprint $table) {
            $table->decimal('wastage_percent', 5, 2)->default(0)->after('unit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            $table->dropColumn(['labor_cost', 'overhead_cost']);
        });

        Schema::table('recipe_ingredients', function (Blueprint $table) {
            $table->dropColumn('wastage_percent');
        });
    }
};


