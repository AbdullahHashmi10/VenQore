<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products');
            $table->string('batch_number');
            $table->date('manufacturing_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('initial_quantity', 10, 2)->default(0); // For reference
            $table->decimal('current_quantity', 10, 2)->default(0); // If we decide to track strictly
            $table->foreignUuid('supplier_id')->nullable()->constrained('parties');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Unique constraint
            $table->unique(['product_id', 'batch_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_batches');
    }
};


