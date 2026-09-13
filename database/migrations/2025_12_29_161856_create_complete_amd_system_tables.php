<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->nullable();
            $table->foreignUuid('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->timestamps();
        });

        // Brands
        Schema::create('brands', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->timestamps();
        });

        // Product Units (Box of 12 logic)
        Schema::create('product_units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->string('base_unit'); // pcs
            $table->string('secondary_unit')->nullable(); // box
            $table->decimal('conversion_rate', 10, 4)->nullable(); // 12
            $table->timestamps();
        });

        // Batches (Expiry tracking)
        Schema::create('batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->string('batch_number');
            $table->date('expiry_date')->nullable();
            $table->date('mfg_date')->nullable();
            $table->decimal('mrp', 10, 2)->nullable();
            $table->decimal('quantity', 10, 4);
            $table->timestamps();
        });

        // Invoices (The Core Transaction Table)
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_number')->unique();
            $table->date('date');
            $table->foreignUuid('party_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['sale', 'purchase', 'sale_return', 'purchase_return', 'estimate'])->default('sale');
            $table->enum('status', ['paid', 'unpaid', 'partial'])->default('unpaid');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('round_off', 10, 2)->default(0);
            $table->decimal('total_amount', 12, 2);
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // Cashier
            $table->timestamps();
        });

        // Invoice Items
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('batch_id')->nullable()->constrained('batches')->nullOnDelete();
            $table->decimal('quantity', 10, 4);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->timestamps();
        });

        // Payments - MOVED TO SEPARATE MIGRATION
        // Schema::create('payments', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('party_id')->nullable()->constrained()->nullOnDelete();
        //     $table->decimal('amount', 10, 2);
        //     $table->date('date');
        //     $table->enum('method', ['cash', 'bank', 'cheque', 'upi', 'card'])->default('cash');
        //     $table->string('reference_number')->nullable(); // Cheque No / Transaction ID
        //     $table->text('notes')->nullable();
        //     $table->timestamps();
        // });

        // Payment Allocations (Bill-wise linking) - REMOVED FOR NOW
        // Schema::create('payment_allocations', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
        //     $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
        //     $table->decimal('amount', 10, 2);
        //     $table->timestamps();
        // });

        // Bank Accounts
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // Cash Drawer, Meezan Bank
            $table->string('account_number')->nullable();
            $table->enum('type', ['cash', 'bank', 'mobile_wallet'])->default('bank');
            $table->decimal('opening_balance', 12, 2)->default(0);
            $table->decimal('current_balance', 12, 2)->default(0);
            $table->timestamps();
        });

        // Expenses
        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('category'); // Rent, Electricity, Staff Tea
            $table->decimal('amount', 10, 2);
            $table->date('date');
            $table->foreignUuid('bank_account_id')->nullable()->constrained()->nullOnDelete(); // Paid via
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Parked Sales (Hold Bill feature)
        Schema::create('parked_sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->json('cart_data'); // Entire cart state
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parked_sales');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('bank_accounts');
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('batches');
        Schema::dropIfExists('product_units');
        Schema::dropIfExists('brands');
        Schema::dropIfExists('categories');
    }
};


