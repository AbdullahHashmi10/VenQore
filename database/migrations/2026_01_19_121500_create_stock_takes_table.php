<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_takes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference_number')->unique();
            $table->foreignUuid('warehouse_id')->constrained('warehouses');
            $table->date('date');
            $table->enum('status', ['draft', 'completed'])->default('draft');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('stock_take_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_take_id')->constrained('stock_takes')->onDelete('cascade');
            $table->foreignUuid('product_id')->constrained('products');
            $table->decimal('expected_quantity', 10, 2)->default(0);
            $table->decimal('counted_quantity', 10, 2)->default(0);
            $table->decimal('difference', 10, 2)->default(0); // counted - expected
            $table->decimal('cost_price', 15, 2)->default(0); // Cost at time of audit
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_take_items');
        Schema::dropIfExists('stock_takes');
    }
};


