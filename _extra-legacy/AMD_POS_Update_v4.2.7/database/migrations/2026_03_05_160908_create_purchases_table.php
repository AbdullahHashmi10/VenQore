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
        Schema::create('purchases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('party_id');
            $table->uuid('warehouse_id');
            $table->string('invoice_number')->nullable();
            $table->date('purchase_date');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->string('payment_status', 20)->default('unpaid');
            $table->string('payment_method')->nullable();
            $table->uuid('journal_entry_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();
        });

        Schema::create('purchase_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('purchase_id');
            $table->uuid('product_id');
            $table->decimal('qty', 10, 4);
            $table->decimal('unit_cost', 15, 2);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('business_pct', 5, 2)->default(100);
            $table->decimal('line_total', 15, 2);
            $table->uuid('inventory_batch_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
        Schema::dropIfExists('purchases');
    }
};
