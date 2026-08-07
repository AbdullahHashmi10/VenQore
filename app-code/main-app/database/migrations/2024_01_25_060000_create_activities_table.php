<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type'); // 'sale', 'purchase', 'payment_in', 'payment_out', 'expense', etc.
            $table->text('description');
            $table->decimal('amount', 15, 2)->default(0);
            $table->char('reference_id', 36)->nullable(); // invoice_id, payment_id, etc.
            $table->string('reference_type')->nullable(); // 'invoice', 'payment', 'expense'
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->json('metadata')->nullable(); // Extra data as JSON
            $table->timestamps();

            $table->index(['type', 'created_at']);
            $table->index('reference_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};


