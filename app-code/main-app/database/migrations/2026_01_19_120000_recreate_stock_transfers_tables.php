<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop tables if they exist (clean slate for this feature)
        Schema::dropIfExists('stock_transfer_items');
        Schema::dropIfExists('stock_transfers');

        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference_number')->unique();
            $table->foreignUuid('from_warehouse_id')->constrained('warehouses'); // Assuming 'warehouses' table exists
            $table->foreignUuid('to_warehouse_id')->constrained('warehouses');
            $table->date('transfer_date');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('stock_transfer_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_transfer_id')->constrained('stock_transfers')->onDelete('cascade');
            $table->foreignUuid('product_id')->constrained('products');
            $table->integer('quantity');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfer_items');
        Schema::dropIfExists('stock_transfers');
    }
};


