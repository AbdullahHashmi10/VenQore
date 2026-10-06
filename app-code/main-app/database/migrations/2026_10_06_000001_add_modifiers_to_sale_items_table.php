<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add-ons chosen on a sale line ("Extra cheese +100", "No onions"), kept as a
 * snapshot — name and price at the moment of sale — so a receipt reprinted next
 * year still says what was sold even if the add-on is renamed or repriced later.
 *
 * `unit_price` already INCLUDES the add-ons' price_delta; this column is the
 * explanation of that number, never an extra amount to add on top of it.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('sale_items') && !Schema::hasColumn('sale_items', 'modifiers')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->json('modifiers')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sale_items') && Schema::hasColumn('sale_items', 'modifiers')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->dropColumn('modifiers');
            });
        }
    }
};
