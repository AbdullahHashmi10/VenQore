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
        // 1. Fiscal Years table
        if (!Schema::hasTable('fiscal_years')) {
            Schema::create('fiscal_years', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('tenant_id', 64)->index();
                $table->string('name', 100);
                $table->date('start_date');
                $table->date('end_date');
                // Statuses: draft, open, closing, closed, reopened
                $table->string('status', 32)->default('draft')->index();
                $table->string('retained_earnings_account_id', 64)->nullable();
                $table->string('close_journal_entry_id', 64)->nullable();
                $table->unsignedBigInteger('opened_by')->nullable();
                $table->timestamp('opened_at')->nullable();
                $table->unsignedBigInteger('closing_requested_by')->nullable();
                $table->unsignedBigInteger('closing_approved_by')->nullable();
                $table->timestamp('closed_at')->nullable();
                $table->unsignedBigInteger('reopened_by')->nullable();
                $table->timestamp('reopened_at')->nullable();
                $table->text('reopen_reason')->nullable();
                $table->unsignedInteger('close_version')->default(1);
                $table->string('preview_hash', 64)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'status'], 'fy_tenant_status_idx');
                $table->index(['tenant_id', 'start_date', 'end_date'], 'fy_tenant_dates_idx');
            });
        }

        // 2. Accounting Period Locks table
        if (!Schema::hasTable('accounting_period_locks')) {
            Schema::create('accounting_period_locks', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('tenant_id', 64)->index();
                $table->string('fiscal_year_id', 64)->nullable()->index();
                // Lock types: soft, all_users, hard
                $table->string('lock_type', 32)->default('soft');
                $table->date('locked_through_date');
                $table->string('reason', 255)->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->boolean('is_active')->default(true)->index();
                $table->timestamps();

                $table->index(['tenant_id', 'is_active', 'locked_through_date'], 'apl_tenant_active_date_idx');
            });
        }

        // 3. Accounting Lock Exceptions table
        if (!Schema::hasTable('accounting_lock_exceptions')) {
            Schema::create('accounting_lock_exceptions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('tenant_id', 64)->index();
                $table->string('period_lock_id', 64)->nullable()->index();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                // Scope: user, all_users
                $table->string('scope', 32)->default('user');
                $table->timestamp('valid_from');
                $table->timestamp('expires_at');
                $table->text('reason');
                $table->unsignedBigInteger('granted_by');
                $table->unsignedBigInteger('revoked_by')->nullable();
                $table->timestamp('revoked_at')->nullable();
                $table->boolean('is_active')->default(true)->index();
                $table->timestamps();

                $table->index(['tenant_id', 'is_active', 'valid_from', 'expires_at'], 'ale_tenant_active_validity_idx');
            });
        }

        // 4. Fiscal Year Close Checks table
        if (!Schema::hasTable('fiscal_year_close_checks')) {
            Schema::create('fiscal_year_close_checks', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('tenant_id', 64)->index();
                $table->string('fiscal_year_id', 64)->index();
                $table->string('check_key', 64);
                // Severity: blocking, warning, informational
                $table->string('severity', 32);
                // Status: pass, fail, warning, overridden
                $table->string('status', 32);
                $table->text('measured_value')->nullable();
                $table->unsignedBigInteger('reviewed_by')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('override_reason')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'fiscal_year_id', 'check_key'], 'fycc_tenant_fy_key_idx');
            });
        }

        // 5. Fiscal Year Events table (Immutable History)
        if (!Schema::hasTable('fiscal_year_events')) {
            Schema::create('fiscal_year_events', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('tenant_id', 64)->index();
                $table->string('fiscal_year_id', 64)->nullable()->index();
                $table->string('event_type', 64)->index();
                $table->unsignedBigInteger('actor_id')->nullable();
                $table->json('payload')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index(['tenant_id', 'created_at'], 'fye_tenant_created_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fiscal_year_events');
        Schema::dropIfExists('fiscal_year_close_checks');
        Schema::dropIfExists('accounting_lock_exceptions');
        Schema::dropIfExists('accounting_period_locks');
        Schema::dropIfExists('fiscal_years');
    }
};
