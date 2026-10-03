<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $t) {
            $t->boolean('show_images')->default(true);
        });
        Schema::table('storefront_products', function (Blueprint $t) {
            $t->string('image_path', 191)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('storefront_products', fn (Blueprint $t) => $t->dropColumn('image_path'));
        Schema::table('storefronts', fn (Blueprint $t) => $t->dropColumn('show_images'));
    }
};
