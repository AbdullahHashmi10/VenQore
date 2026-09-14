<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('tenant_id')->index();
            $table->uuid('customer_id')->nullable()->index();
            $table->uuid('warehouse_id')->nullable()->index();
            $table->string('frequency'); // daily, weekly, monthly
            $table->json('items'); // JSON representation of sale items
            $table->date('next_run_date');
            $table->string('status')->default('active'); // active, paused
            $table->timestamp('last_run_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_invoices');
    }
};
