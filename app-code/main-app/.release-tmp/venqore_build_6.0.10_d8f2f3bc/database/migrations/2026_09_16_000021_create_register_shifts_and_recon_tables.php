<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations (§5.4 Data Capture: Cash Register & Bank Reconciliation).
     */
    public function up(): void
    {
        if (!Schema::hasTable('register_shifts')) {
            Schema::create('register_shifts', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('tenant_id')->index();
                $table->string('register_id')->nullable()->index();
                $table->unsignedBigInteger('opened_by')->index();
                $table->dateTime('opened_at')->index();
                $table->decimal('opening_float', 15, 2)->default(0.00);
                $table->unsignedBigInteger('closed_by')->nullable();
                $table->dateTime('closed_at')->nullable()->index();
                $table->decimal('expected_cash', 15, 2)->default(0.00);
                $table->decimal('counted_cash', 15, 2)->default(0.00);
                $table->decimal('variance', 15, 2)->default(0.00);
                $table->string('status', 32)->default('open')->index();
                $table->timestamps();

                $table->index(['tenant_id', 'status']);
                $table->index(['tenant_id', 'opened_at']);
            });
        }

        if (Schema::hasTable('sales') && !Schema::hasColumn('sales', 'register_shift_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->unsignedBigInteger('register_shift_id')->nullable()->after('warehouse_id')->index();
            });
        }

        if (!Schema::hasTable('bank_statement_lines')) {
            Schema::create('bank_statement_lines', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('tenant_id')->index();
                $table->string('bank_account_id', 64)->index();
                $table->date('statement_date')->index();
                $table->string('reference', 255)->nullable();
                $table->decimal('amount', 15, 2)->default(0.00);
                $table->string('type', 16)->default('credit');
                $table->string('matched_entry_id', 64)->nullable()->index();
                $table->dateTime('matched_at')->nullable();
                $table->string('status', 32)->default('unreconciled')->index();
                $table->timestamps();

                $table->index(['tenant_id', 'bank_account_id', 'status']);
                $table->index(['tenant_id', 'statement_date']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_statement_lines');

        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'register_shift_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropColumn('register_shift_id');
            });
        }

        Schema::dropIfExists('register_shifts');
    }
};
