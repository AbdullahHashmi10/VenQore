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
        // 1. Chequebooks table
        if (!Schema::hasTable('cheque_books')) {
            Schema::create('cheque_books', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->unsignedBigInteger('tenant_id')->index();
                $table->char('bank_account_id', 36)->index();
                $table->string('book_number', 100)->nullable();
                $table->string('prefix', 20)->nullable();
                $table->unsignedBigInteger('serial_start');
                $table->unsignedBigInteger('serial_end');
                $table->unsignedSmallInteger('serial_padding')->default(6);
                $table->unsignedInteger('total_leaves')->default(0);
                $table->date('received_date');
                $table->string('status', 32)->default('active')->index();
                $table->text('notes')->nullable();

                // Virtual generated columns for canonical dual-schema property aliases
                $table->string('series_prefix', 20)->virtualAs('prefix')->nullable();
                $table->unsignedBigInteger('start_number')->virtualAs('serial_start');
                $table->unsignedBigInteger('end_number')->virtualAs('serial_end');
                $table->unsignedSmallInteger('padding_zeros')->virtualAs('serial_padding');
                $table->text('description')->virtualAs('notes')->nullable();

                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'bank_account_id', 'status'], 'chq_books_tenant_bank_status_idx');

                // Foreign Keys
                $table->foreign('tenant_id')
                    ->references('id')->on('tenants')
                    ->onDelete('cascade');

                // Bank accounts with registered chequebooks must never cascade delete
                $table->foreign('bank_account_id')
                    ->references('id')->on('bank_accounts')
                    ->onDelete('restrict');

                $table->foreign('created_by')
                    ->references('id')->on('users')
                    ->nullOnDelete();
            });
        }

        // 2. Cheque Leaves table
        if (!Schema::hasTable('cheque_leaves')) {
            Schema::create('cheque_leaves', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->unsignedBigInteger('tenant_id')->index();
                $table->char('cheque_book_id', 36)->index();
                $table->char('bank_account_id', 36)->index();
                $table->string('normalized_serial_number', 64);
                $table->string('display_serial_number', 64);
                $table->unsignedBigInteger('numeric_serial')->index();

                // Virtual generated columns
                $table->unsignedBigInteger('serial_number')->virtualAs('numeric_serial');
                $table->string('cheque_number', 64)->virtualAs('display_serial_number');

                $table->string('status', 32)->default('available')->index();
                $table->unsignedBigInteger('reserved_by_approval_document_id')->nullable()->index();
                $table->char('payment_id', 36)->nullable()->index();
                $table->char('party_id', 36)->nullable()->index();
                $table->decimal('amount', 15, 2)->nullable();
                $table->date('issue_date')->nullable();
                $table->date('cheque_date')->nullable();
                $table->dateTime('cleared_at')->nullable();
                $table->dateTime('bounced_at')->nullable();
                $table->dateTime('voided_at')->nullable();
                $table->dateTime('stopped_at')->nullable();
                $table->text('status_reason')->nullable();
                $table->char('journal_entry_id', 36)->nullable()->index();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();

                $table->unique(
                    ['tenant_id', 'bank_account_id', 'normalized_serial_number'],
                    'chq_leaves_tenant_bank_serial_uniq'
                );
                $table->index(['tenant_id', 'status'], 'chq_leaves_tenant_status_idx');
                $table->index(['tenant_id', 'bank_account_id', 'status'], 'chq_leaves_tenant_bank_status_idx');

                // Foreign Keys
                $table->foreign('tenant_id')
                    ->references('id')->on('tenants')
                    ->onDelete('cascade');

                $table->foreign('cheque_book_id')
                    ->references('id')->on('cheque_books')
                    ->onDelete('restrict');

                $table->foreign('bank_account_id')
                    ->references('id')->on('bank_accounts')
                    ->onDelete('restrict');

                $table->foreign('reserved_by_approval_document_id')
                    ->references('id')->on('approval_documents')
                    ->nullOnDelete();

                $table->foreign('payment_id')
                    ->references('id')->on('payments')
                    ->nullOnDelete();

                $table->foreign('party_id')
                    ->references('id')->on('parties')
                    ->nullOnDelete();

                $table->foreign('journal_entry_id')
                    ->references('id')->on('journal_entries')
                    ->onDelete('restrict');

                $table->foreign('created_by')
                    ->references('id')->on('users')
                    ->nullOnDelete();

                $table->foreign('updated_by')
                    ->references('id')->on('users')
                    ->nullOnDelete();
            });
        }

        // 3. Received Cheques table
        if (!Schema::hasTable('received_cheques')) {
            Schema::create('received_cheques', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->unsignedBigInteger('tenant_id')->index();
                $table->char('party_id', 36)->nullable()->index();
                $table->char('payment_id', 36)->nullable()->index();
                $table->char('sale_id', 36)->nullable()->index();
                $table->char('journal_entry_id', 36)->nullable()->index();
                $table->char('deposit_journal_entry_id', 36)->nullable()->index();
                $table->string('cheque_number', 64);
                $table->string('normalized_cheque_number', 64)->index();
                $table->string('drawer_name', 255)->nullable();
                $table->string('drawer_bank', 255)->nullable();
                $table->string('normalized_drawer_bank', 100)->nullable()->index();
                $table->string('drawer_branch', 255)->nullable();
                $table->date('received_date');
                $table->date('cheque_date');
                $table->decimal('amount', 15, 2);
                $table->char('deposit_bank_account_id', 36)->nullable()->index();
                $table->string('status', 32)->default('received')->index();
                $table->dateTime('deposited_at')->nullable();
                $table->dateTime('cleared_at')->nullable();
                $table->dateTime('bounced_at')->nullable();
                $table->dateTime('returned_at')->nullable();

                // Uniqueness rule and duplicate tracking
                $table->string('duplicate_fingerprint', 64);
                $table->boolean('is_duplicate_override')->default(false);
                $table->text('override_reason')->nullable();
                $table->unsignedBigInteger('override_by')->nullable();
                $table->dateTime('override_at')->nullable();

                $table->text('status_reason')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();

                // True Database-level uniqueness rule
                $table->unique(
                    ['tenant_id', 'duplicate_fingerprint'],
                    'rcvd_chq_tenant_fingerprint_uniq'
                );

                $table->index(['tenant_id', 'status'], 'rcvd_chq_tenant_status_idx');
                $table->index(
                    ['tenant_id', 'normalized_drawer_bank', 'normalized_cheque_number'],
                    'rcvd_chq_bank_serial_idx'
                );

                // Foreign Keys
                $table->foreign('tenant_id')
                    ->references('id')->on('tenants')
                    ->onDelete('cascade');

                $table->foreign('party_id')
                    ->references('id')->on('parties')
                    ->nullOnDelete();

                $table->foreign('payment_id')
                    ->references('id')->on('payments')
                    ->nullOnDelete();

                $table->foreign('sale_id')
                    ->references('id')->on('sales')
                    ->nullOnDelete();

                // Bank accounts with deposited cheques must never cascade delete
                $table->foreign('deposit_bank_account_id')
                    ->references('id')->on('bank_accounts')
                    ->onDelete('restrict');

                // Posted journal entries must never cascade delete
                $table->foreign('journal_entry_id')
                    ->references('id')->on('journal_entries')
                    ->onDelete('restrict');

                $table->foreign('deposit_journal_entry_id')
                    ->references('id')->on('journal_entries')
                    ->onDelete('restrict');

                $table->foreign('created_by')
                    ->references('id')->on('users')
                    ->nullOnDelete();

                $table->foreign('updated_by')
                    ->references('id')->on('users')
                    ->nullOnDelete();

                $table->foreign('override_by')
                    ->references('id')->on('users')
                    ->nullOnDelete();
            });
        }

        // 4. Duplicate Attempt Audit Log
        if (!Schema::hasTable('cheque_duplicate_audit_logs')) {
            Schema::create('cheque_duplicate_audit_logs', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->unsignedBigInteger('tenant_id')->index();
                $table->string('cheque_number', 64);
                $table->string('normalized_cheque_number', 64);
                $table->string('drawer_bank', 255)->nullable();
                $table->string('normalized_drawer_bank', 100)->nullable();
                $table->decimal('amount', 15, 2);
                $table->string('action', 32)->index(); // 'blocked' or 'overridden'
                $table->text('reason')->nullable();
                $table->char('existing_cheque_id', 36)->nullable()->index();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('tenant_id')
                    ->references('id')->on('tenants')
                    ->onDelete('cascade');

                $table->foreign('user_id')
                    ->references('id')->on('users')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cheque_duplicate_audit_logs');
        Schema::dropIfExists('received_cheques');
        Schema::dropIfExists('cheque_leaves');
        Schema::dropIfExists('cheque_books');
    }
};
