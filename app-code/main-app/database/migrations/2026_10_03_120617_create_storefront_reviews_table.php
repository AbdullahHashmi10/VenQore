<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('storefront_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('storefront_id')->index();
            $table->unsignedBigInteger('tenant_id')->index();
            $table->string('customer_name', 150);
            $table->string('customer_phone', 40)->index();
            $table->string('customer_email', 150)->nullable();
            $table->unsignedTinyInteger('rating')->default(5);
            $table->text('review')->nullable();
            $table->boolean('is_verified_purchaser')->default(false);
            $table->timestamps();

            $table->index(['storefront_id', 'customer_phone']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('storefront_reviews');
    }
};
