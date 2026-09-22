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
        // 1. Approval Documents table
        if (!Schema::hasTable('approval_documents')) {
            Schema::create('approval_documents', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('tenant_id')->index();
                $table->string('document_type', 64)->index();
                $table->string('document_number', 64)->nullable();
                $table->string('status', 32)->default('pending')->index();
                $table->unsignedBigInteger('maker_id')->index();
                $table->unsignedBigInteger('reviewer_id')->nullable()->index();
                $table->unsignedBigInteger('current_revision_id')->nullable();
                $table->unsignedInteger('version')->default(1);
                $table->string('idempotency_key', 100)->nullable();
                $table->decimal('amount', 15, 2)->default(0.00);
                $table->string('currency', 10)->default('PKR');
                $table->text('description')->nullable();
                $table->string('entity_type', 128)->nullable();
                $table->unsignedBigInteger('entity_id')->nullable();
                $table->string('posted_entity_type', 128)->nullable();
                $table->unsignedBigInteger('posted_entity_id')->nullable();
                $table->timestamp('posted_at')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'status'], 'appr_docs_tenant_status_idx');
                $table->index(['tenant_id', 'document_type', 'status'], 'appr_docs_tenant_type_status_idx');
                $table->unique(['tenant_id', 'idempotency_key'], 'appr_docs_tenant_idempotency_unique');
            });
        }

        // 2. Approval Revisions table
        if (!Schema::hasTable('approval_revisions')) {
            Schema::create('approval_revisions', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('approval_document_id');
                $table->unsignedInteger('revision_number')->default(1);
                $table->unsignedBigInteger('maker_id')->index();
                $table->json('payload');
                $table->string('summary_hash', 64)->index();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('approval_document_id', 'fk_appr_revs_doc_id')
                    ->references('id')
                    ->on('approval_documents')
                    ->onDelete('cascade');

                $table->unique(['approval_document_id', 'revision_number'], 'appr_revs_doc_rev_unique');
            });
        }

        // 3. Approval Transitions table
        if (!Schema::hasTable('approval_transitions')) {
            Schema::create('approval_transitions', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('approval_document_id');
                $table->unsignedBigInteger('actor_id')->nullable()->index();
                $table->unsignedBigInteger('source_revision_id')->nullable();
                $table->string('from_status', 32);
                $table->string('to_status', 32);
                $table->json('reason_codes')->nullable();
                $table->text('notes')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('approval_document_id', 'fk_appr_trans_doc_id')
                    ->references('id')
                    ->on('approval_documents')
                    ->onDelete('cascade');

                $table->index(['approval_document_id', 'created_at'], 'appr_trans_doc_created_idx');
            });
        }

        // 4. Approval Return Reasons table
        if (!Schema::hasTable('approval_return_reasons')) {
            Schema::create('approval_return_reasons', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('tenant_id')->nullable()->index();
                $table->string('code', 64);
                $table->string('label', 255);
                $table->boolean('requires_notes')->default(false);
                $table->json('applies_to')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['tenant_id', 'code'], 'appr_return_reasons_tenant_code_unique');
            });
        }

        // 5. Tenant Users columns
        if (Schema::hasTable('tenant_users')) {
            Schema::table('tenant_users', function (Blueprint $table) {
                if (!Schema::hasColumn('tenant_users', 'transaction_approval_mode')) {
                    $table->string('transaction_approval_mode', 32)->default('inherit')->after('status');
                }
                if (!Schema::hasColumn('tenant_users', 'approval_mode_changed_by')) {
                    $table->unsignedBigInteger('approval_mode_changed_by')->nullable()->after('transaction_approval_mode');
                }
                if (!Schema::hasColumn('tenant_users', 'approval_mode_changed_at')) {
                    $table->timestamp('approval_mode_changed_at')->nullable()->after('approval_mode_changed_by');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tenant_users')) {
            Schema::table('tenant_users', function (Blueprint $table) {
                if (Schema::hasColumn('tenant_users', 'approval_mode_changed_at')) {
                    $table->dropColumn('approval_mode_changed_at');
                }
                if (Schema::hasColumn('tenant_users', 'approval_mode_changed_by')) {
                    $table->dropColumn('approval_mode_changed_by');
                }
                if (Schema::hasColumn('tenant_users', 'transaction_approval_mode')) {
                    $table->dropColumn('transaction_approval_mode');
                }
            });
        }

        Schema::dropIfExists('approval_transitions');
        Schema::dropIfExists('approval_revisions');
        Schema::dropIfExists('approval_return_reasons');
        Schema::dropIfExists('approval_documents');
    }
};
