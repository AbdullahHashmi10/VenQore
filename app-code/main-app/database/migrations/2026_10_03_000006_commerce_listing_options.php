<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Online "options" (size, colour…): several real products shown as ONE card with a picker.
 * Every option is its own product, so stock, price, cost, holds and FIFO stay exact per option.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('storefront_products', function (Blueprint $t) {
            $t->string('option_group', 60)->nullable()->after('is_featured');
            $t->string('option_label', 60)->nullable()->after('option_group');
            $t->index(['storefront_id', 'option_group'], 'sfp_option_group_idx');
        });
    }

    public function down(): void
    {
        Schema::table('storefront_products', function (Blueprint $t) {
            $t->dropIndex('sfp_option_group_idx');
            $t->dropColumn(['option_group', 'option_label']);
        });
    }
};
