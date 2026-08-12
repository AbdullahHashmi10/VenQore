<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * V3 CONSOLIDATION — PHASE 3, step 2.
 * See V3_CONSOLIDATION_PLAN.md §Phase 3.
 *
 * `2026_02_04_171548_add_landed_cost_to_expenses.php` hard-constrained
 * `expenses.purchase_id` to `invoices(id)`. Because the backfill preserves every
 * UUID, NO DATA CHANGES HERE — this migration only drops that constraint and
 * re-adds it against `purchases`.
 *
 * ⚠️ RUN ORDER MATTERS. This must run AFTER
 * `php artisan purchases:migrate-legacy --commit`. If any expense still points
 * at an invoice row that has not been copied into `purchases`, adding the new
 * constraint fails. The guard below refuses to proceed in that case rather than
 * leaving the table with no constraint at all.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('expenses', 'purchase_id')) {
            return;
        }

        $orphans = DB::table('expenses as e')
            ->whereNotNull('e.purchase_id')
            ->whereNotExists(fn ($q) => $q->select(DB::raw(1))->from('purchases')
                ->whereColumn('purchases.id', 'e.purchase_id'))
            ->count();

        if ($orphans > 0) {
            throw new RuntimeException(
                "Refusing to repoint expenses.purchase_id: {$orphans} expense row(s) reference a purchase " .
                'that does not exist in `purchases`. Run `php artisan purchases:migrate-legacy --commit` first, ' .
                'then `php artisan purchases:reconcile`. See V3_CONSOLIDATION_PLAN.md Phase 3.'
            );
        }

        $this->dropForeignIfExists('expenses', 'expenses_purchase_id_foreign');

        Schema::table('expenses', function (Blueprint $table) {
            $table->foreign('purchase_id', 'expenses_purchase_id_foreign')
                ->references('id')->on('purchases')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('expenses', 'purchase_id')) {
            return;
        }

        $this->dropForeignIfExists('expenses', 'expenses_purchase_id_foreign');

        if (Schema::hasTable('invoices')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->foreign('purchase_id', 'expenses_purchase_id_foreign')
                    ->references('id')->on('invoices')
                    ->nullOnDelete();
            });
        }
    }

    /** MariaDB 10.5 has no `DROP FOREIGN KEY IF EXISTS`. */
    private function dropForeignIfExists(string $table, string $constraint): void
    {
        try {
            DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$constraint}`");
        } catch (\Throwable $e) {
            // Not present — nothing to drop.
        }
    }
};
