<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('woo_connections', function (Blueprint $table) {
            $table->string('site_url')->nullable()->change();
            $table->text('consumer_key')->nullable()->change();
            $table->text('consumer_secret')->nullable()->change();
            $table->string('setup_token')->nullable()->after('uuid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('woo_connections', function (Blueprint $table) {
            $table->string('site_url')->nullable(false)->change();
            $table->text('consumer_key')->nullable(false)->change();
            $table->text('consumer_secret')->nullable(false)->change();
            $table->dropColumn('setup_token');
        });
    }
};
