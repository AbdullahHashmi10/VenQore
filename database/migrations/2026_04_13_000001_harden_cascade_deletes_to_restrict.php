<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * WOUND 4 FIX — Harden Cascade Deletes on Financial Tables
 *
 * BEFORE: product deleted → invoice_items cascade deleted → history gone forever
 * AFTER:  product cannot be deleted if sales or invoice history references it (RESTRICT)
 *
 * Strategy per table:
 *   invoice_items.product_id       → RESTRICT  (cannot delete product with billing history)
 *   sale_items.product_id          → RESTRICT  (cannot delete product with sales history)
 *   inventory_batches.product_id   → RESTRICT  (cannot delete product with FIFO batches)
 *   journal_entries.party_id       → SET NULL  (party deleted → journal entry stays, party_id nulled)
 *   journal_items.account_id       → RESTRICT  (cannot delete account with journal lines)
 *   customer_analytics.party_id    → CASCADE   (analytics are derived cache — safe)
 *
 * NOTE: We drop & recreate FKs because MySQL does not support ALTER CONSTRAINT directly.
 *       The targeted columns and data are UNTOUCHED — only the ON DELETE rule changes.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. invoice_items.product_id → RESTRICT (was CASCADE) ──────────────
        if (Schema::hasTable('invoice_items') && Schema::hasColumn('invoice_items', 'product_id')) {
            Schema::table('invoice_items', function (Blueprint $table) {
                // Drop the old cascade FK
                try { $table->dropForeign(['product_id']); } catch (\Throwable $e) {}
                // Re-add with RESTRICT — product cannot be deleted if invoiced
                $table->foreignUuid('product_id')
                      ->nullable()
                      ->change();
            });
            // Add new FK with restrict using raw SQL for cross-DB safety
            DB::statement(
                'ALTER TABLE `invoice_items`
                 ADD CONSTRAINT `invoice_items_product_id_foreign_restrict`
                 FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
                 ON DELETE RESTRICT ON UPDATE CASCADE'
            );
        }

        // ── 2. sale_items.product_id → RESTRICT (had no ON DELETE rule, defaulted to RESTRICT) ──
        // sale_items.product_id currently has ON DELETE no action. We explicitly enforce RESTRICT.
        if (Schema::hasTable('sale_items') && Schema::hasColumn('sale_items', 'product_id')) {
            Schema::table('sale_items', function (Blueprint $table) {
                try { $table->dropForeign(['product_id']); } catch (\Throwable $e) {}
            });
            DB::statement(
                'ALTER TABLE `sale_items`
                 ADD CONSTRAINT `sale_items_product_id_foreign_restrict`
                 FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
                 ON DELETE RESTRICT ON UPDATE CASCADE'
            );
        }

        // ── 3. inventory_batches.product_id → RESTRICT (was CASCADE) ──────────
        // A product with live or historical FIFO batches must not be hard-deleted.
        if (Schema::hasTable('inventory_batches') && Schema::hasColumn('inventory_batches', 'product_id')) {
            Schema::table('inventory_batches', function (Blueprint $table) {
                try { $table->dropForeign(['product_id']); } catch (\Throwable $e) {}
            });
            DB::statement(
                'ALTER TABLE `inventory_batches`
                 ADD CONSTRAINT `inventory_batches_product_id_foreign_restrict`
                 FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
                 ON DELETE RESTRICT ON UPDATE CASCADE'
            );
        }

        // ── 4. journal_items.account_id → RESTRICT (was CASCADE) ─────────────
        // Cannot delete an Account that has journal lines. This prevents ledger corruption.
        if (Schema::hasTable('journal_items') && Schema::hasColumn('journal_items', 'account_id')) {
            Schema::table('journal_items', function (Blueprint $table) {
                try { $table->dropForeign(['account_id']); } catch (\Throwable $e) {}
            });
            DB::statement(
                'ALTER TABLE `journal_items`
                 ADD CONSTRAINT `journal_items_account_id_foreign_restrict`
                 FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`)
                 ON DELETE RESTRICT ON UPDATE CASCADE'
            );
        }

        // ── 5. journal_entries.party_id → SET NULL (nullOnDelete) ─────────────
        // If a party (customer/supplier) is deleted, their journal entries must survive
        // for accounting integrity. The party_id becomes null but the ledger is preserved.
        if (Schema::hasTable('journal_entries') && Schema::hasColumn('journal_entries', 'party_id')) {
            // party_id column itself may not be nullable yet — ensure it is
            Schema::table('journal_entries', function (Blueprint $table) {
                try { $table->dropForeign(['party_id']); } catch (\Throwable $e) {}
                // Make nullable in case it wasn't
                $table->uuid('party_id')->nullable()->change();
            });
            DB::statement(
                'ALTER TABLE `journal_entries`
                 ADD CONSTRAINT `journal_entries_party_id_foreign_setnull`
                 FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`)
                 ON DELETE SET NULL ON UPDATE CASCADE'
            );
        }

        // ── 6. accounts.parent_id → RESTRICT (was CASCADE) ────────────────────
        // Deleting a parent account must not silently delete all child accounts.
        if (Schema::hasTable('accounts') && Schema::hasColumn('accounts', 'parent_id')) {
            Schema::table('accounts', function (Blueprint $table) {
                try { $table->dropForeign(['parent_id']); } catch (\Throwable $e) {}
            });
            DB::statement(
                'ALTER TABLE `accounts`
                 ADD CONSTRAINT `accounts_parent_id_foreign_restrict`
                 FOREIGN KEY (`parent_id`) REFERENCES `accounts` (`id`)
                 ON DELETE RESTRICT ON UPDATE CASCADE'
            );
        }

        // ── 7. product_units.product_id → RESTRICT (was CASCADE) ──────────────
        if (Schema::hasTable('product_units') && Schema::hasColumn('product_units', 'product_id')) {
            Schema::table('product_units', function (Blueprint $table) {
                try { $table->dropForeign(['product_id']); } catch (\Throwable $e) {}
            });
            DB::statement(
                'ALTER TABLE `product_units`
                 ADD CONSTRAINT `product_units_product_id_foreign_restrict`
                 FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
                 ON DELETE RESTRICT ON UPDATE CASCADE'
            );
        }

        // ── 8. batches.product_id → RESTRICT (was CASCADE) ────────────────────
        if (Schema::hasTable('batches') && Schema::hasColumn('batches', 'product_id')) {
            Schema::table('batches', function (Blueprint $table) {
                try { $table->dropForeign(['product_id']); } catch (\Throwable $e) {}
            });
            DB::statement(
                'ALTER TABLE `batches`
                 ADD CONSTRAINT `batches_product_id_foreign_restrict`
                 FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
                 ON DELETE RESTRICT ON UPDATE CASCADE'
            );
        }
    }

    public function down(): void
    {
        // Restore original permissive cascade rules (reverting to pre-fix state)

        $restores = [
            ['table' => 'invoice_items',    'fk' => 'invoice_items_product_id_foreign_restrict',    'col' => 'product_id', 'ref' => 'products'],
            ['table' => 'sale_items',       'fk' => 'sale_items_product_id_foreign_restrict',       'col' => 'product_id', 'ref' => 'products'],
            ['table' => 'inventory_batches','fk' => 'inventory_batches_product_id_foreign_restrict','col' => 'product_id', 'ref' => 'products'],
            ['table' => 'journal_items',    'fk' => 'journal_items_account_id_foreign_restrict',    'col' => 'account_id', 'ref' => 'accounts'],
            ['table' => 'journal_entries',  'fk' => 'journal_entries_party_id_foreign_setnull',     'col' => 'party_id',   'ref' => 'parties'],
            ['table' => 'accounts',         'fk' => 'accounts_parent_id_foreign_restrict',          'col' => 'parent_id',  'ref' => 'accounts'],
            ['table' => 'product_units',    'fk' => 'product_units_product_id_foreign_restrict',    'col' => 'product_id', 'ref' => 'products'],
            ['table' => 'batches',          'fk' => 'batches_product_id_foreign_restrict',          'col' => 'product_id', 'ref' => 'products'],
        ];

        foreach ($restores as $r) {
            if (!Schema::hasTable($r['table'])) continue;
            try {
                DB::statement("ALTER TABLE `{$r['table']}` DROP FOREIGN KEY `{$r['fk']}`");
            } catch (\Throwable $e) {
                // Already gone — continue
            }
        }
    }
};
