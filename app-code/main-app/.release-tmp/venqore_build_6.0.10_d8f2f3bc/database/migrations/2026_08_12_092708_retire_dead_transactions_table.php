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
        Schema::dropIfExists('transactions');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->foreignUuid('party_id')->constrained('parties')->onDelete('restrict');
            $table->string('invoice_id')->nullable();
            $table->decimal('amount', 20, 4);
            $table->string('type');
            $table->decimal('running_balance', 20, 4)->nullable();
            $table->timestamps();
        });
    }
};
