<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * V3 CONSOLIDATION — PHASE 1: SCHEMA PARITY
 * See V3_CONSOLIDATION_PLAN.md §1a / §1b.
 *
 * Purely additive. Every column is nullable or defaulted, no foreign keys are
 * touched and no data moves. Safe to deploy to production ahead of Phase 2.
 *
 * These columns close the gap between the legacy `invoices` (type='purchase')
 * header and the V3 `purchases` header so the Phase 3 backfill has somewhere to
 * put every legacy field.
 *
 * DELIBERATELY NOT ADDED: `purchases.paid_amount`.
 * Paid amount is derived from the ledger (sum of AP debits on non-reversed
 * `purchase_payment` entries). A stored column drifts — that is the bug this
 * whole consolidation exists to fix. The Phase 6 guardrail test asserts this
 * column never appears.
 *
 * MariaDB 10.5 notes: no `SKIP LOCKED`, no `JSON_TABLE`, no utf8mb4_0900_*
 * collations are used here. `decimal(20,4)` and `after()` are both supported.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            // Legacy `invoices.discount` — header-level discount, applied before tax.
            if (! Schema::hasColumn('purchases', 'discount')) {
                $table->decimal('discount', 20, 4)->default(0)->after('tax');
            }

            // Legacy `invoices.round_off` — rounding adjustment on the grand total.
            if (! Schema::hasColumn('purchases', 'round_off')) {
                $table->decimal('round_off', 20, 4)->default(0)->after('discount');
            }

            // Legacy `invoices.notes`.
            if (! Schema::hasColumn('purchases', 'notes')) {
                $table->text('notes')->nullable()->after('payment_method');
            }

            // Legacy `invoices.reference` — the supplier's own document reference.
            if (! Schema::hasColumn('purchases', 'reference')) {
                $table->string('reference', 100)->nullable()->after('invoice_number');
            }

            // Legacy `invoices.due_date` — payment terms date.
            if (! Schema::hasColumn('purchases', 'due_date')) {
                $table->date('due_date')->nullable()->after('purchase_date');
            }

            // Legacy overloaded `invoices.status` carried BOTH the money state
            // (paid/partial/unpaid) and the goods state (pending/partial/received)
            // in one column. That overloading is exactly what left unpaid
            // purchases stuck on 'pending'. V3 splits them:
            //   payment_status  — already exists, owned by PaymentService
            //   workflow_status — added here, owned by the receive flow
            //
            // Default 'received' because every purchase created by V3
            // PurchaseService::store() receives stock immediately.
            if (! Schema::hasColumn('purchases', 'workflow_status')) {
                $table->string('workflow_status', 30)
                    ->default('received')
                    ->after('payment_status');
            }
        });

        // Index the new workflow column — the purchases list filters on it.
        Schema::table('purchases', function (Blueprint $table) {
            if (! $this->hasIndex('purchases', 'purchases_workflow_status_index')) {
                $table->index('workflow_status', 'purchases_workflow_status_index');
            }
        });

        Schema::table('purchase_items', function (Blueprint $table) {
            // Legacy `invoice_items.product_variant_id`. V3 had no variant support.
            if (! Schema::hasColumn('purchase_items', 'variant_id')) {
                $table->uuid('variant_id')->nullable()->after('product_id');
            }

            // Legacy `invoice_items` line-level discount.
            if (! Schema::hasColumn('purchase_items', 'discount_amount')) {
                $table->decimal('discount_amount', 20, 4)->default(0)->after('unit_cost');
            }

            // Legacy `invoice_items.received_qty` — needed for the partial-receive
            // workflow ported in Phase 2. V3 assumed full receipt on creation.
            if (! Schema::hasColumn('purchase_items', 'received_qty')) {
                $table->decimal('received_qty', 10, 4)->default(0)->after('qty');
            }
        });
    }

    public function down(): void
    {
        // Written properly on purpose — this is the rollback for Phase 3.
        Schema::table('purchases', function (Blueprint $table) {
            if ($this->hasIndex('purchases', 'purchases_workflow_status_index')) {
                $table->dropIndex('purchases_workflow_status_index');
            }
        });

        Schema::table('purchases', function (Blueprint $table) {
            foreach (['discount', 'round_off', 'notes', 'reference', 'due_date', 'workflow_status'] as $col) {
                if (Schema::hasColumn('purchases', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('purchase_items', function (Blueprint $table) {
            foreach (['variant_id', 'discount_amount', 'received_qty'] as $col) {
                if (Schema::hasColumn('purchase_items', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }

    /** MariaDB-safe index existence check (no information_schema privileges assumed). */
    private function hasIndex(string $table, string $index): bool
    {
        try {
            return collect(
                Schema::getConnection()->select("SHOW INDEX FROM `{$table}`")
            )->contains(fn ($row) => ($row->Key_name ?? null) === $index);
        } catch (\Throwable $e) {
            return false;
        }
    }
};
