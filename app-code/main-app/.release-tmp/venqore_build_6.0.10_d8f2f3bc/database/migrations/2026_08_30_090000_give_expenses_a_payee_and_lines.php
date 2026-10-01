<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * An expense could name a payee only as free text, could only ever be one
 * amount, and was always assumed to be paid in full the moment it was
 * recorded. None of those is true of a real shop: the electricity bill is one
 * voucher with three lines on it, and the man who fixed the shutter is owed
 * until Friday.
 *
 * Everything here is nullable or defaulted, so nothing that exists changes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            if (! Schema::hasColumn('expenses', 'party_id')) {
                /* The payee as a PARTY, so an unpaid expense can show up in
                   their ledger instead of only in a text field. */
                $table->uuid('party_id')->nullable()->index();
            }
            if (! Schema::hasColumn('expenses', 'amount_paid')) {
                $table->decimal('amount_paid', 20, 4)->default(0);
            }
            if (! Schema::hasColumn('expenses', 'grand_total')) {
                /* Validated by the controller since the day it was written and
                   never once stored, because it was not fillable. */
                $table->decimal('grand_total', 20, 4)->default(0);
            }
        });

        /* Every expense recorded before today was, by the app's own rules, paid
           in full the moment it was written down. Leaving these at zero would
           make the whole history read as unpaid to the first report that looks
           at them — which is the report these columns exist for. */
        \Illuminate\Support\Facades\DB::table('expenses')->update([
            'grand_total' => \Illuminate\Support\Facades\DB::raw('amount + COALESCE(tax_amount, 0)'),
            'amount_paid' => \Illuminate\Support\Facades\DB::raw('amount + COALESCE(tax_amount, 0)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            foreach (['party_id', 'amount_paid', 'grand_total'] as $c) {
                if (Schema::hasColumn('expenses', $c)) $table->dropColumn($c);
            }
        });
    }
};
