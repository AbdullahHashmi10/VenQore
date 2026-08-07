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
        Schema::create('invoice_reminders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('invoice_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->constrained('parties')->cascadeOnDelete();
            $table->dateTime('scheduled_at');
            $table->string('type')->default('whatsapp');
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_reminders');
    }
};
