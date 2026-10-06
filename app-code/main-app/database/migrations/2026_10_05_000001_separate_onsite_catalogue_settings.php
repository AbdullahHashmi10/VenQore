<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->string('onsite_catalogue_theme', 32)->default('visual-grid')->after('counter_qr_enabled');
            $table->boolean('onsite_show_images')->default(true)->after('onsite_catalogue_theme');
            $table->string('onsite_name', 150)->nullable()->after('onsite_show_images');
            $table->string('onsite_tagline', 240)->nullable()->after('onsite_name');
            $table->string('onsite_logo_path')->nullable()->after('onsite_tagline');
            $table->string('onsite_banner_path')->nullable()->after('onsite_logo_path');
            $table->string('onsite_lan_url', 255)->nullable()->after('onsite_banner_path');
        });
    }

    public function down(): void
    {
        Schema::table('storefronts', fn (Blueprint $table) => $table->dropColumn([
            'onsite_catalogue_theme', 'onsite_show_images', 'onsite_name', 'onsite_tagline',
            'onsite_logo_path', 'onsite_banner_path', 'onsite_lan_url',
        ]));
    }
};
