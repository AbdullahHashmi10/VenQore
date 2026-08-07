<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shared_products', function (Blueprint $table) {
            $table->id();
            $table->string('barcode', 64)->unique();
            $table->string('canonical_name', 255);
            $table->string('brand', 128)->nullable();
            $table->string('pack_size', 64)->nullable();
            $table->string('category', 128)->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('confirmations')->default(1);
            $table->boolean('is_published')->default(false);
            $table->timestamps();

            $table->index('is_published');
        });

        Schema::create('shared_product_aliases', function (Blueprint $table) {
            $table->id();
            $table->string('alias', 255);
            $table->foreignId('shared_product_id')->constrained('shared_products')->onDelete('cascade');
            $table->unsignedInteger('hits')->default(1);
            $table->timestamps();

            $table->index(['alias', 'shared_product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shared_product_aliases');
        Schema::dropIfExists('shared_products');
    }
};
