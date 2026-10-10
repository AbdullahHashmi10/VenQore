<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/* Which storefront design the public shop uses: auto (restaurant when Front of House is on), restaurant, or default. */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('storefronts') && !Schema::hasColumn('storefronts', 'storefront_template')) {
            Schema::table('storefronts', function (Blueprint $table) {
                $table->string('storefront_template', 20)->default('auto');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('storefronts') && Schema::hasColumn('storefronts', 'storefront_template')) {
            Schema::table('storefronts', function (Blueprint $table) {
                $table->dropColumn('storefront_template');
            });
        }
    }
};
