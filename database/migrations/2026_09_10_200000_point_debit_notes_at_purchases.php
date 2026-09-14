<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Debit notes: let a note name the bill it answers, and be refunded.
 *
 *  1. `debit_notes.purchase_id` was created with a foreign key to
 *     `purchase_orders`, while DebitNoteController validates it against
 *     `purchases` (where V3 purchases live) and the Create screen picks from
 *     purchases. Every note raised against a bill therefore died on the
 *     constraint. The key now points at `purchases`.
 *
 *  2. DebitNoteController::refund() marks a note 'refunded' — the Show screen
 *     has a badge for it — but the status enum only held pending / approved,
 *     so the refund was refused by the column after the money had been
 *     booked in the same transaction, and rolled back.
 *
 * MySQL / MariaDB only (SQLite neither enforces the enum nor can alter keys).
 * Idempotent.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        $schema = DB::connection()->getDatabaseName();

        $fks = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', $schema)
            ->where('TABLE_NAME', 'debit_notes')
            ->where('COLUMN_NAME', 'purchase_id')
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->get(['CONSTRAINT_NAME', 'REFERENCED_TABLE_NAME']);

        foreach ($fks as $fk) {
            if ($fk->REFERENCED_TABLE_NAME !== 'purchases') {
                DB::statement("ALTER TABLE debit_notes DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
            }
        }

        if (! $fks->contains(fn ($fk) => $fk->REFERENCED_TABLE_NAME === 'purchases')) {
            $orphans = DB::table('debit_notes')
                ->whereNotNull('purchase_id')
                ->whereNotIn('purchase_id', DB::table('purchases')->select('id'))
                ->pluck('id');

            if ($orphans->isEmpty()) {
                DB::statement('ALTER TABLE debit_notes ADD CONSTRAINT debit_notes_purchase_id_purchases_foreign '
                    . 'FOREIGN KEY (purchase_id) REFERENCES purchases (id) ON DELETE SET NULL');
            } else {
                Log::warning('debit_notes.purchase_id → purchases key NOT added: some notes name a purchase that does not exist.', [
                    'debit_note_ids' => $orphans->take(200)->all(),
                ]);
            }
        }

        DB::statement("ALTER TABLE debit_notes MODIFY status ENUM('pending','approved','refunded') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        // Pointing the key back at purchase_orders would only restore the bug.
    }
};
