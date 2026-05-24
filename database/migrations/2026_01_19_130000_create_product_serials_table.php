<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_serials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products');
            $table->string('serial_number')->unique();
            $table->enum('status', ['available', 'sold', 'returned', 'defective', 'transfer'])->default('available');
            $table->foreignUuid('warehouse_id')->nullable()->constrained('warehouses');
            $table->foreignUuid('purchase_id')->nullable()->constrained('purchase_orders'); // Origin
            $table->foreignUuid('sale_id')->nullable()->constrained('sales'); // If sold
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_serials');
    }
};


