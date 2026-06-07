<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index('name');
            $table->index('sku');
            $table->index('category_id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->index('reference_number');
            $table->index('customer_id');
            $table->index('created_at');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->index('product_id');
            $table->index('sale_id');
        });

        Schema::table('parties', function (Blueprint $table) {
            $table->index('name');
            $table->index('phone');
            $table->index('type');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->index('invoice_number');
            $table->index('date');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('created_at');
            // $table->index('party_id'); // Column does not exist
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['code']);
            $table->dropIndex(['category_id']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['invoice_number']);
            $table->dropIndex(['customer_id']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
            $table->dropIndex(['sale_id']);
        });

        Schema::table('parties', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['phone']);
            $table->dropIndex(['type']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['invoice_number']);
            $table->dropIndex(['date']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['payment_date']);
            $table->dropIndex(['party_id']);
        });
    }
};


