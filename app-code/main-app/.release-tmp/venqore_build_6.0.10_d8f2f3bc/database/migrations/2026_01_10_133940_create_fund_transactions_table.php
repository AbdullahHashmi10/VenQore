<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fund_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('type', ['add', 'remove', 'transfer', 'adjust'])->index();
            $table->foreignUuid('from_account_id')->nullable()->constrained('bank_accounts')->nullOnDelete();
            $table->foreignUuid('to_account_id')->nullable()->constrained('bank_accounts')->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2)->nullable();
            $table->decimal('balance_after', 15, 2)->nullable();
            $table->string('reason')->nullable();
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['from_account_id', 'created_at']);
            $table->index(['to_account_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fund_transactions');
    }
};


