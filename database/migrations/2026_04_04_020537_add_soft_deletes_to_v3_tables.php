<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->softDeletes();
        });
        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->softDeletes();
        });
        Schema::table('proposals', function (Blueprint $table) {
            $table->softDeletes();
        });
        Schema::table('proposal_items', function (Blueprint $table) {
            $table->softDeletes();
        });
        Schema::table('sale_items', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('proposal_items', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
