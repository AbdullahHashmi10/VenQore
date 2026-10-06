<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add-ons library (FOH plan, step 1c).
 *
 *  - modifier_groups.is_library : a group created on the Add-ons page, shared
 *    across products and categories, as opposed to one typed inline on a single
 *    product's form (those keep working exactly as before).
 *  - category_modifier_group     : "every product in Pizza offers these five
 *    toppings". categories.id is a UUID, like products.id.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('modifier_groups') && !Schema::hasColumn('modifier_groups', 'is_library')) {
            Schema::table('modifier_groups', function (Blueprint $table) {
                $table->boolean('is_library')->default(false);
            });
        }

        if (!Schema::hasTable('category_modifier_group')) {
            Schema::create('category_modifier_group', function (Blueprint $table) {
                $table->id();
                $table->uuid('category_id');
                $table->unsignedBigInteger('modifier_group_id');
                $table->integer('sort_order')->default(0);

                $table->unique(['category_id', 'modifier_group_id']);
                $table->index('modifier_group_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('category_modifier_group');
        if (Schema::hasColumn('modifier_groups', 'is_library')) {
            Schema::table('modifier_groups', function (Blueprint $table) {
                $table->dropColumn('is_library');
            });
        }
    }
};
