<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Photos an owner places on their public store pages, by slot: {"hero": ["commerce/page/…jpg"], "dinein": [...]} */
    public function up(): void
    {
        if (Schema::hasTable('storefronts') && ! Schema::hasColumn('storefronts', 'page_images')) {
            Schema::table('storefronts', function (Blueprint $table) {
                $table->json('page_images')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('storefronts', 'page_images')) {
            Schema::table('storefronts', fn (Blueprint $table) => $table->dropColumn('page_images'));
        }
    }
};
