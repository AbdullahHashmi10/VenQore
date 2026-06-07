<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained()->onDelete('cascade');
            $table->string('sku')->unique()->nullable();
            $table->string('variant_name'); // e.g., "Red - Large"
            $table->decimal('price', 10, 2)->nullable(); // Override price if different
            $table->decimal('cost_price', 10, 2)->nullable(); // Override cost if different
            $table->integer('stock')->default(0); // Variant-specific stock
            $table->string('barcode')->nullable();
            $table->string('image')->nullable(); // Variant-specific image
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};


