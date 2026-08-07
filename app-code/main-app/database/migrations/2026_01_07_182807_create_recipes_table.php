<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('recipes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignUuid('product_id')->constrained()->onDelete('cascade'); // The finished product this recipe produces
            $table->decimal('yield_quantity', 10, 2)->default(1); // How many units this recipe produces
            $table->string('yield_unit')->default('pcs'); // Unit of yield (pcs, kg, l, etc.)
            $table->decimal('estimated_cost', 10, 2)->nullable(); // Auto-calculated from ingredients
            $table->integer('preparation_time')->nullable(); // in minutes
            $table->text('instructions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipes');
    }
};


