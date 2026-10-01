<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Manufacturing Rules: Which products trigger auto-manufacturing
        Schema::create('manufacturing_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained()->onDelete('cascade'); // The finished product
            $table->string('name'); // e.g., "Garam Masala Production"
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Manufacturing Ingredients: What raw materials are needed
        Schema::create('manufacturing_ingredients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('rule_id')->constrained('manufacturing_rules')->onDelete('cascade');
            $table->foreignUuid('ingredient_product_id')->constrained('products')->onDelete('cascade'); // Raw material
            $table->decimal('quantity_per_unit', 10, 2); // e.g., 200g pepper per 1kg Garam Masala
            $table->string('unit')->default('g'); // g, kg, ml, l, pcs
            $table->timestamps();
        });

        // Manufacturing Logs: Track when auto-deduction happens
        Schema::create('manufacturing_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('rule_id')->constrained('manufacturing_rules')->onDelete('cascade');
            $table->foreignUuid('sale_id')->constrained()->onDelete('cascade'); // Which sale triggered it
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Who made the sale
            $table->decimal('quantity_produced', 10, 2); // How much finished product
            $table->text('deductions')->nullable(); // JSON of what was deducted
            $table->text('notification_message')->nullable(); // What was shown to user
            $table->timestamp('manufactured_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manufacturing_logs');
        Schema::dropIfExists('manufacturing_ingredients');
        Schema::dropIfExists('manufacturing_rules');
    }
};


