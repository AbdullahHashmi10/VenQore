<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('variant_attributes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->foreignUuid('attribute_id')->constrained('product_attributes')->onDelete('cascade');
            $table->string('value'); // e.g., "Red", "Large", "Cotton"
            $table->timestamps();

            $table->unique(['variant_id', 'attribute_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variant_attributes');
    }
};


