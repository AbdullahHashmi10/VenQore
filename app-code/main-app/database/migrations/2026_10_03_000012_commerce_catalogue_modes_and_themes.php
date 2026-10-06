<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->string('customer_mode', 24)->default('ordering')->after('show_images');
            $table->string('catalogue_theme', 32)->default('visual-grid')->after('customer_mode');
        });
    }

    public function down(): void
    {
        Schema::table('storefronts', fn (Blueprint $table) => $table->dropColumn(['customer_mode', 'catalogue_theme']));
    }
};
