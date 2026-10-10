<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Customer booking page for service businesses (salon, repair, consultant):
| /book/{slug}. Off until the merchant switches it on in store settings.
*/
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('storefronts') && !Schema::hasColumn('storefronts', 'booking_enabled')) {
            Schema::table('storefronts', function (Blueprint $table) {
                $table->boolean('booking_enabled')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('storefronts') && Schema::hasColumn('storefronts', 'booking_enabled')) {
            Schema::table('storefronts', function (Blueprint $table) {
                $table->dropColumn('booking_enabled');
            });
        }
    }
};
