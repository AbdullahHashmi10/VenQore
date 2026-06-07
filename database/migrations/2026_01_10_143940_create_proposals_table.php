<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('proposals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference_number')->unique();
            $table->foreignUuid('customer_id')->nullable()->constrained('parties')->nullOnDelete();
            $table->string('customer_name')->nullable(); // For keeping name if customer is deleted or walked-in
            $table->date('valid_until')->nullable();
            $table->string('status')->default('draft'); // draft, sent, accepted, declined, expired
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();

            // Planning fields
            $table->decimal('estimated_cost', 15, 2)->default(0); // For user to see potential cost
            $table->decimal('expected_margin', 15, 2)->default(0); // Projected profit

            $table->foreignId('user_id')->constrained();
            $table->timestamps();
        });

        Schema::create('proposal_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('proposal_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('unit_cost', 15, 2)->default(0); // Snapshot of cost at time of proposal
            $table->decimal('total', 15, 2);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposal_items');
        Schema::dropIfExists('proposals');
    }
};


