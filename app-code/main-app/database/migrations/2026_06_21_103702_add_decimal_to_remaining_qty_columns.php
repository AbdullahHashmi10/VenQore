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
        if (Schema::hasTable('product_variants') && Schema::hasColumn('product_variants', 'stock')) {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->decimal('stock', 12, 4)->default(0)->change();
            });
        }

        if (Schema::hasTable('proposal_items') && Schema::hasColumn('proposal_items', 'quantity')) {
            Schema::table('proposal_items', function (Blueprint $table) {
                $table->decimal('quantity', 12, 4)->change();
            });
        }

        if (Schema::hasTable('sales_order_items')) {
            Schema::table('sales_order_items', function (Blueprint $table) {
                if (Schema::hasColumn('sales_order_items', 'quantity_requested')) {
                    $table->decimal('quantity_requested', 12, 4)->change();
                }
                if (Schema::hasColumn('sales_order_items', 'quantity_reserved')) {
                    $table->decimal('quantity_reserved', 12, 4)->change();
                }
            });
        }

        if (Schema::hasTable('stock_transfer_items') && Schema::hasColumn('stock_transfer_items', 'quantity')) {
            Schema::table('stock_transfer_items', function (Blueprint $table) {
                $table->decimal('quantity', 12, 4)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('product_variants') && Schema::hasColumn('product_variants', 'stock')) {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->integer('stock')->default(0)->change();
            });
        }

        if (Schema::hasTable('proposal_items') && Schema::hasColumn('proposal_items', 'quantity')) {
            Schema::table('proposal_items', function (Blueprint $table) {
                $table->integer('quantity')->change();
            });
        }

        if (Schema::hasTable('sales_order_items')) {
            Schema::table('sales_order_items', function (Blueprint $table) {
                if (Schema::hasColumn('sales_order_items', 'quantity_requested')) {
                    $table->integer('quantity_requested')->change();
                }
                if (Schema::hasColumn('sales_order_items', 'quantity_reserved')) {
                    $table->integer('quantity_reserved')->change();
                }
            });
        }

        if (Schema::hasTable('stock_transfer_items') && Schema::hasColumn('stock_transfer_items', 'quantity')) {
            Schema::table('stock_transfer_items', function (Blueprint $table) {
                $table->integer('quantity')->change();
            });
        }
    }
};
