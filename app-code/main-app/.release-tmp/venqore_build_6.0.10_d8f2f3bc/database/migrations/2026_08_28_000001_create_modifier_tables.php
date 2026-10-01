<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|==============================================================================
| Modifiers — "no onions", "large", "extra shot"
|==============================================================================
|
| WHY THESE ARE NOT PRODUCTS
| --------------------------
| A modifier is not a catalogue line. "Extra cheese" has no stock, no barcode
| and no meaning on its own, and putting it in `products` would put it in every
| product grid, every stock report and every valuation — which is the mistake
| that made "Regular / Large" appear as two unrelated SKUs on the old build.
|
| WHY THE PRICE IS A DELTA, NOT A PRICE
| -------------------------------------
| The same "Large" is +80 on a coffee and +150 on a pizza only if you model it
| per product; modelled as a delta on a shared group it stays one row that the
| kitchen and the receipt both read the same way. The delta is SIGNED — "no
| cheese, -30" is a real menu item in half the restaurants that will run this.
|
| WHY min/max LIVE ON THE GROUP
| -----------------------------
| "Pick exactly one size" and "pick up to three toppings" are the same control
| with different bounds. One group shape covers both, so the register does not
| need a second widget and the validation has one place to live.
|==============================================================================
*/
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('modifier_groups')) {
            Schema::create('modifier_groups', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id');
                $table->string('name', 80);                             // "Size", "Toppings", "Cooked to"

                // 0/1 = optional single choice. 1/1 = must pick one (a size).
                // 0/N = up to N extras. The register reads only these two numbers.
                $table->unsignedTinyInteger('min_select')->default(0);
                $table->unsignedTinyInteger('max_select')->default(1);

                // Redundant with min_select >= 1 on purpose: it is the flag the
                // UI blocks "Add to order" on, and a rule you can read at a
                // glance is a rule that gets configured correctly.
                $table->boolean('required')->default(false);

                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->index(['tenant_id']);
            });
        }

        if (!Schema::hasTable('modifiers')) {
            Schema::create('modifiers', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id');
                $table->unsignedBigInteger('modifier_group_id');
                $table->string('name', 80);

                // SIGNED. 20,4 to match every other money column in this schema
                // (2026_06_21_130243 standardised them); a modifier priced in a
                // different precision than the line it changes rounds wrong.
                $table->decimal('price_delta', 20, 4)->default(0);

                // Pre-ticked when the group opens — "regular ice" on an iced
                // drink. Saves the most common order a tap.
                $table->boolean('is_default')->default(false);

                // 86'd for the night. Kept off a soft delete so tomorrow's
                // service just flips it back.
                $table->boolean('available')->default(true);

                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->index(['tenant_id', 'modifier_group_id']);
            });
        }

        if (!Schema::hasTable('product_modifier_group')) {
            Schema::create('product_modifier_group', function (Blueprint $table) {
                $table->id();

                // products.id is a UUID (2025_12_29_153358_create_amd_tables).
                // A bigint here would silently truncate every key it stored.
                $table->uuid('product_id');
                $table->unsignedBigInteger('modifier_group_id');

                // Order the groups are presented in FOR THIS PRODUCT: size
                // first on a drink, doneness first on a steak, same group.
                $table->integer('sort_order')->default(0);

                $table->unique(['product_id', 'modifier_group_id']);
                $table->index('modifier_group_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_modifier_group');
        Schema::dropIfExists('modifiers');
        Schema::dropIfExists('modifier_groups');
    }
};
