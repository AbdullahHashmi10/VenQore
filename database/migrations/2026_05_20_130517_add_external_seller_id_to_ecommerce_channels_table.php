<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ecommerce_channels', function (Blueprint $table) {
            $table->string('external_seller_id')->nullable()->after('platform');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ecommerce_channels', function (Blueprint $table) {
            $table->dropColumn('external_seller_id');
        });
    }
};
