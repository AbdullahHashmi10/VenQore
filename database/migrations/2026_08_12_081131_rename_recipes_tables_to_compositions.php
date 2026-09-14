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
        // 1. Rename tables
        if (Schema::hasTable('recipes') && !Schema::hasTable('compositions')) {
            Schema::rename('recipes', 'compositions');
        }

        if (Schema::hasTable('recipe_ingredients') && !Schema::hasTable('composition_items')) {
            Schema::rename('recipe_ingredients', 'composition_items');
        }

        if (Schema::hasTable('recipe_media') && !Schema::hasTable('composition_media')) {
            Schema::rename('recipe_media', 'composition_media');
        }

        // 2. Rename columns
        if (Schema::hasTable('composition_items')) {
            Schema::table('composition_items', function (Blueprint $table) {
                if (Schema::hasColumn('composition_items', 'recipe_id')) {
                    $table->renameColumn('recipe_id', 'composition_id');
                }
            });
        }

        if (Schema::hasTable('composition_media')) {
            Schema::table('composition_media', function (Blueprint $table) {
                if (Schema::hasColumn('composition_media', 'recipe_id')) {
                    $table->renameColumn('recipe_id', 'composition_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Rename columns back
        if (Schema::hasTable('composition_media')) {
            Schema::table('composition_media', function (Blueprint $table) {
                if (Schema::hasColumn('composition_media', 'composition_id')) {
                    $table->renameColumn('composition_id', 'recipe_id');
                }
            });
        }

        if (Schema::hasTable('composition_items')) {
            Schema::table('composition_items', function (Blueprint $table) {
                if (Schema::hasColumn('composition_items', 'composition_id')) {
                    $table->renameColumn('composition_id', 'recipe_id');
                }
            });
        }

        // 2. Rename tables back
        if (Schema::hasTable('composition_media') && !Schema::hasTable('recipe_media')) {
            Schema::rename('composition_media', 'recipe_media');
        }

        if (Schema::hasTable('composition_items') && !Schema::hasTable('recipe_ingredients')) {
            Schema::rename('composition_items', 'recipe_ingredients');
        }

        if (Schema::hasTable('compositions') && !Schema::hasTable('recipes')) {
            Schema::rename('compositions', 'recipes');
        }
    }
};
