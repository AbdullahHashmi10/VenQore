<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Online and QR orders can now carry add-ons (size, toppings, cooked-to) and a
| per-line note. `mods` holds [{id, name, group, price_delta}] as the customer
| chose them, so the order keeps reading the same even if the menu changes later.
*/
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('commerce_order_items')) {
            Schema::table('commerce_order_items', function (Blueprint $table) {
                if (!Schema::hasColumn('commerce_order_items', 'mods')) {
                    $table->json('mods')->nullable();
                }
                if (!Schema::hasColumn('commerce_order_items', 'notes')) {
                    $table->string('notes', 200)->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('commerce_order_items')) {
            Schema::table('commerce_order_items', function (Blueprint $table) {
                foreach (['mods', 'notes'] as $c) {
                    if (Schema::hasColumn('commerce_order_items', $c)) {
                        $table->dropColumn($c);
                    }
                }
            });
        }
    }
};
