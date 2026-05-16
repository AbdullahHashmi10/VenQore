<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Add reserved_quantity to stocks
        if (!Schema::hasColumn('stocks', 'reserved_quantity')) {
            Schema::table('stocks', function (Blueprint $table) {
                $table->decimal('reserved_quantity', 15, 2)->default(0)->after('quantity');
            });
        }

        // 2. Create Sales Orders Table (Holds Inventory)
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_number')->unique();
            $table->foreignUuid('customer_id')->nullable()->constrained('parties')->nullOnDelete();
            $table->string('customer_name')->nullable();
            $table->date('order_date');
            $table->date('delivery_date')->nullable();
            $table->string('status')->default('pending'); // pending, confirmed (holds stock), completed (converted to sale), cancelled
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->constrained();
            $table->timestamps();
        });

        Schema::create('sales_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sales_order_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained();
            $table->integer('quantity_requested');
            $table->integer('quantity_reserved')->default(0); // How much actually successfully held
            $table->decimal('unit_price', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });

        // 3. Create Purchase Proposals Table (Planning for Purchases)
        Schema::create('purchase_proposals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference_number')->unique();
            $table->foreignUuid('supplier_id')->nullable()->constrained('parties')->nullOnDelete();
            $table->string('status')->default('draft');
            $table->text('notes')->nullable();
            $table->decimal('estimated_total', 15, 2)->default(0);
            $table->foreignId('user_id')->constrained();
            $table->timestamps();
        });

        Schema::create('purchase_proposal_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('purchase_proposal_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->integer('quantity');
            $table->decimal('estimated_cost', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_proposal_items');
        Schema::dropIfExists('purchase_proposals');
        Schema::dropIfExists('sales_order_items');
        Schema::dropIfExists('sales_orders');
        Schema::table('stocks', function (Blueprint $table) {
            $table->dropColumn('reserved_quantity');
        });
    }
};


