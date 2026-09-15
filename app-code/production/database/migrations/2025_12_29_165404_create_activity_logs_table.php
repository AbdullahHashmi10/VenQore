<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action'); // 'sale', 'purchase', 'stock_adjustment', 'expense', etc.
            $table->string('description'); // "Ali sold Invoice #104"
            $table->uuidMorphs('subject'); // Polymorphic relation to Invoice, Product, etc.
            $table->json('properties')->nullable(); // Additional metadata
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};


