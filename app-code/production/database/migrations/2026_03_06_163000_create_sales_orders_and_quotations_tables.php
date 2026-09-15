<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sales_orders')) {
            Schema::create('sales_orders', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('party_id');
                $table->uuid('warehouse_id');
                $table->date('order_date');
                $table->date('delivery_date')->nullable();
                $table->enum('status', ['open','converted','cancelled'])->default('open');
                $table->decimal('total_amount', 15, 2)->default(0);
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('created_by');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('sales_order_items')) {
            Schema::create('sales_order_items', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('sales_order_id');
                $table->uuid('product_id');
                $table->decimal('qty', 10, 4);
                $table->string('sale_uom', 20);
                $table->decimal('unit_price', 15, 2);
                $table->decimal('discount_percent', 5, 2)->default(0);
                $table->decimal('tax_rate', 5, 2)->default(0);
                $table->decimal('line_total', 15, 2);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('quotations')) {
            Schema::create('quotations', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('quotation_number', 50)->unique();
                $table->uuid('party_id');
                $table->date('quotation_date');
                $table->date('valid_until')->nullable();
                $table->enum('status', ['draft','sent','accepted','rejected','expired'])->default('draft');
                $table->decimal('total_amount', 15, 2)->default(0);
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('created_by');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('quotation_items')) {
            Schema::create('quotation_items', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('quotation_id');
                $table->uuid('product_id');
                $table->decimal('qty', 10, 4);
                $table->string('sale_uom', 20);
                $table->decimal('unit_price', 15, 2);
                $table->decimal('discount_percent', 5, 2)->default(0);
                $table->decimal('tax_rate', 5, 2)->default(0);
                $table->decimal('line_total', 15, 2);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        // Safe down
        Schema::dropIfExists('quotation_items');
        Schema::dropIfExists('quotations');
        Schema::dropIfExists('sales_order_items');
        Schema::dropIfExists('sales_orders');
    }
};
