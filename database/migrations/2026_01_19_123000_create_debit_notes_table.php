<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('debit_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference_number')->unique();
            $table->foreignUuid('supplier_id')->constrained('parties'); // Assuming 'parties' table (suppliers)
            $table->foreignUuid('purchase_id')->nullable()->constrained('purchase_orders'); // Optional link to original bill
            $table->date('date');
            $table->decimal('amount', 15, 2);
            $table->string('reason')->nullable();
            $table->enum('status', ['pending', 'approved'])->default('pending');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('debit_note_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('debit_note_id')->constrained('debit_notes')->onDelete('cascade');
            $table->foreignUuid('product_id')->constrained('products');
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('debit_note_items');
        Schema::dropIfExists('debit_notes');
    }
};


