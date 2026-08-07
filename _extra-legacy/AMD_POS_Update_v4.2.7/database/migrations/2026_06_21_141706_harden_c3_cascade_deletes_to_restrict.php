<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            // 1. journal_entries.user_id -> users.id: change ON DELETE CASCADE to ON DELETE RESTRICT (or SET NULL if nullable).
            // Let's check: journal_entries.user_id is nullable? We'll make sure it's nullable or use RESTRICT.
            // RESTRICT is safer to prevent deleting users who posted journals, but SET NULL is also a valid pattern if the column is nullable.
            // Let's use RESTRICT because deleting a user who has financial journal entries shouldn't be allowed (they should be deactivated/soft-deleted).
            if (Schema::hasTable('journal_entries') && Schema::hasColumn('journal_entries', 'user_id')) {
                Schema::table('journal_entries', function (Blueprint $table) {
                    try { $table->dropForeign(['user_id']); } catch (\Throwable $e) {}
                });
                DB::statement(
                    'ALTER TABLE `journal_entries`
                     ADD CONSTRAINT `journal_entries_user_id_foreign_restrict`
                     FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
                     ON DELETE RESTRICT ON UPDATE CASCADE'
                );
            }

            // 2. transactions.party_id -> parties.id: change ON DELETE CASCADE to ON DELETE RESTRICT.
            // A transaction (payment/sale transaction ledger) referencing a party (customer/supplier) should not cascade delete.
            if (Schema::hasTable('transactions') && Schema::hasColumn('transactions', 'party_id')) {
                Schema::table('transactions', function (Blueprint $table) {
                    try { $table->dropForeign(['party_id']); } catch (\Throwable $e) {}
                });
                DB::statement(
                    'ALTER TABLE `transactions`
                     ADD CONSTRAINT `transactions_party_id_foreign_restrict`
                     FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`)
                     ON DELETE RESTRICT ON UPDATE CASCADE'
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            if (Schema::hasTable('journal_entries') && Schema::hasColumn('journal_entries', 'user_id')) {
                Schema::table('journal_entries', function (Blueprint $table) {
                    try { $table->dropForeign(['user_id']); } catch (\Throwable $e) {}
                });
                DB::statement(
                    'ALTER TABLE `journal_entries`
                     ADD CONSTRAINT `journal_entries_user_id_foreign`
                     FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
                     ON DELETE CASCADE ON UPDATE CASCADE'
                );
            }

            if (Schema::hasTable('transactions') && Schema::hasColumn('transactions', 'party_id')) {
                Schema::table('transactions', function (Blueprint $table) {
                    try { $table->dropForeign(['party_id']); } catch (\Throwable $e) {}
                });
                DB::statement(
                    'ALTER TABLE `transactions`
                     ADD CONSTRAINT `transactions_party_id_foreign`
                     FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`)
                     ON DELETE CASCADE ON UPDATE CASCADE'
                );
            }
        }
    }
};

