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
        Schema::create('daily_snapshots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->date('date')->index();

            // Financial Snapshot Values
            $table->decimal('sales_value', 15, 2)->default(0.00);
            $table->decimal('purchases_value', 15, 2)->default(0.00); // Added here to avoid ordering conflict with the alter migration
            $table->decimal('stock_value', 15, 2)->default(0.00);
            $table->decimal('payables_value', 15, 2)->default(0.00);
            $table->decimal('receivables_value', 15, 2)->default(0.00);
            $table->decimal('cash_value', 15, 2)->default(0.00);
            $table->decimal('expense_value', 15, 2)->default(0.00);

            // Dynamic memo note from admin / owner
            $table->text('note')->nullable();

            $table->timestamps();

            // Enforce single snapshot per store per day
            $table->unique(['tenant_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_snapshots');
    }
};
