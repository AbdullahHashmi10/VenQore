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
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('sku')->unique()->nullable(); // Matches WooCommerce
            $table->enum('type', ['standard', 'weighted', 'composite'])->default('standard');
            $table->decimal('price', 10, 2);
            $table->decimal('cost_price', 10, 2)->default(0); // Weighted Average
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->string('base_unit'); // kg, box, pcs
            $table->string('secondary_unit')->nullable(); // carton
            $table->decimal('conversion_rate', 10, 4)->nullable();
            $table->integer('min_stock_alert')->default(0);
            $table->timestamps();
        });

        Schema::create('product_barcodes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->string('barcode')->unique();
            $table->timestamps();
        });

        Schema::create('stocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 10, 4); // Supports decimals for weighted items
            $table->enum('status', ['available', 'expired', 'claim_pending', 'damaged'])->default('available');
            $table->timestamps();
        });

        // Schema::create('recipes', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('parent_product_id')->constrained('products')->cascadeOnDelete();
        //     $table->foreignId('child_product_id')->constrained('products')->cascadeOnDelete();
        //     $table->decimal('quantity_required', 10, 4);
        //     $table->timestamps();
        // });

        Schema::create('production_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity_made', 10, 4);
            $table->date('date');
            $table->timestamps();
        });

        Schema::create('parties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->enum('type', ['customer', 'supplier']);
            $table->decimal('opening_balance', 10, 2)->default(0);
            $table->decimal('current_balance', 10, 2)->default(0);
            $table->decimal('credit_limit', 10, 2)->nullable();
            $table->string('payment_terms')->nullable(); // Net 30
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('party_id')->constrained()->cascadeOnDelete();
            $table->string('invoice_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->enum('type', ['debit', 'credit']);
            $table->decimal('running_balance', 10, 2);
            $table->timestamps();
        });

        Schema::create('transaction_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('payment_transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->foreignUuid('invoice_transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_allocations');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('parties');
        Schema::dropIfExists('production_runs');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('stocks');
        Schema::dropIfExists('product_barcodes');
        Schema::dropIfExists('products');
    }
};


