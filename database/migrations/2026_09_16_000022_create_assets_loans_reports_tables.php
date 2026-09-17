<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations (§5.4 Data Capture: Fixed Assets, Loans, Report Runs).
     */
    public function up(): void
    {
        if (!Schema::hasTable('fixed_assets')) {
            Schema::create('fixed_assets', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('tenant_id')->index();
                $table->string('asset_number', 64)->nullable()->index();
                $table->string('name', 255);
                $table->string('category', 64)->default('Equipment')->index();
                $table->date('purchase_date')->index();
                $table->decimal('purchase_cost', 15, 2)->default(0.00);
                $table->decimal('salvage_value', 15, 2)->default(0.00);
                $table->unsignedInteger('useful_life_months')->default(60);
                $table->string('depreciation_method', 32)->default('straight_line');
                $table->decimal('accumulated_depreciation', 15, 2)->default(0.00);
                $table->decimal('net_book_value', 15, 2)->default(0.00);
                $table->date('warranty_until')->nullable();
                $table->string('status', 32)->default('active')->index();
                $table->timestamps();

                $table->index(['tenant_id', 'status']);
                $table->index(['tenant_id', 'category']);
            });
        }

        if (!Schema::hasTable('loans')) {
            Schema::create('loans', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('tenant_id')->index();
                $table->string('lender_name', 255)->index();
                $table->string('loan_number', 64)->nullable();
                $table->decimal('principal_amount', 15, 2)->default(0.00);
                $table->decimal('interest_rate', 8, 4)->default(0.0000);
                $table->unsignedInteger('term_months')->default(12);
                $table->date('start_date')->index();
                $table->decimal('emi_amount', 15, 2)->default(0.00);
                $table->decimal('outstanding_balance', 15, 2)->default(0.00);
                $table->string('status', 32)->default('active')->index();
                $table->timestamps();

                $table->index(['tenant_id', 'status']);
            });
        }

        if (!Schema::hasTable('loan_installments')) {
            Schema::create('loan_installments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('tenant_id')->index();
                $table->unsignedBigInteger('loan_id')->index();
                $table->date('due_date')->index();
                $table->decimal('emi_amount', 15, 2)->default(0.00);
                $table->decimal('principal_component', 15, 2)->default(0.00);
                $table->decimal('interest_component', 15, 2)->default(0.00);
                $table->dateTime('paid_at')->nullable();
                $table->string('status', 32)->default('due')->index();
                $table->timestamps();

                $table->index(['tenant_id', 'loan_id', 'status']);
                $table->index(['tenant_id', 'due_date']);
            });
        }

        if (!Schema::hasTable('report_definitions')) {
            Schema::create('report_definitions', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('tenant_id')->index();
                $table->string('name', 255);
                $table->string('type', 64)->default('standard');
                $table->json('query_params')->nullable();
                $table->boolean('is_scheduled')->default(false)->index();
                $table->unsignedInteger('run_count')->default(0);
                $table->dateTime('last_run_at')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'is_scheduled']);
            });
        }

        if (!Schema::hasTable('report_runs')) {
            Schema::create('report_runs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('tenant_id')->index();
                $table->unsignedBigInteger('report_definition_id')->nullable()->index();
                $table->unsignedBigInteger('ran_by')->nullable()->index();
                $table->dateTime('ran_at')->index();
                $table->unsignedInteger('duration_ms')->default(0);
                $table->string('status', 32)->default('completed');
                $table->timestamps();

                $table->index(['tenant_id', 'ran_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_runs');
        Schema::dropIfExists('report_definitions');
        Schema::dropIfExists('loan_installments');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('fixed_assets');
    }
};
