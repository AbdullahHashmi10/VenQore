<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('recipe_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('product_id')->constrained()->onDelete('cascade'); // The ingredient product
            $table->decimal('quantity', 10, 3); // Quantity needed (can be fractional)
            $table->string('unit')->default('pcs'); // g, kg, ml, l, pcs, etc.
            $table->decimal('cost_per_unit', 10, 2)->nullable(); // Cost at time of recipe creation
            $table->integer('sort_order')->default(0); // For display ordering
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_ingredients');
    }
};


