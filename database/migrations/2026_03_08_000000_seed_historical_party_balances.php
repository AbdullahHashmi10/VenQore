<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Get required accounts and a system user
        $arAccount     = DB::table('accounts')->where('code', '1200')->first();
        $apAccount     = DB::table('accounts')->where('code', '2000')->first();
        $equityAccount = DB::table('accounts')->where('code', '7000')->first();
        $systemUser    = DB::table('users')->orderBy('created_at')->first();

        if (!$arAccount || !$apAccount || !$equityAccount || !$systemUser) {
            return; // Required resources not found, cannot seed
        }

        // 2. Fetch all parties with non-zero legacy balances
        $parties = DB::table('parties')->where('current_balance', '!=', 0)->get();

        foreach ($parties as $party) {
            // Skip if this party already has an opening balance entry to prevent duplication
            $exists = DB::table('journal_entries')
                ->where('reference_type', 'opening_balance')
                ->where('narration', "Legacy Opening Balance Seeding for {$party->name}")
                ->exists();

            if ($exists) {
                continue;
            }

            $amount = abs((float) $party->current_balance);
            $isPositive = ((float) $party->current_balance) > 0;
            $entryId = Str::uuid()->toString();

            // Create Journal Entry header
            DB::table('journal_entries')->insert([
                'id'             => $entryId,
                'date'           => now()->toDateString(),
                'description'    => 'Opening Balance',
                'narration'      => "Legacy Opening Balance Seeding for {$party->name}",
                'reference_type' => 'opening_balance',
                'user_id'        => $systemUser->id,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);

            // Determine Debit and Credit based on Party Type and Balance direction
            $debitAccount = null;
            $creditAccount = null;

            if ($party->type === 'customer') {
                if ($isPositive) {
                    // Customer owes us money -> Debit AR, Credit Equity
                    $debitAccount = $arAccount->id;
                    $creditAccount = $equityAccount->id;
                } else {
                    // We owe customer (Advance) -> Debit Equity, Credit AR
                    $debitAccount = $equityAccount->id;
                    $creditAccount = $arAccount->id;
                }
            } else {
                // Assuming Supplier
                if ($isPositive) {
                    // We owe supplier money -> Debit Equity, Credit AP
                    $debitAccount = $equityAccount->id;
                    $creditAccount = $apAccount->id;
                } else {
                    // Supplier owes us (Advance) -> Debit AP, Credit Equity
                    $debitAccount = $apAccount->id;
                    $creditAccount = $equityAccount->id;
                }
            }

            // Insert 2 Journal Items (Double-Entry)
            DB::table('journal_items')->insert([
                [
                    'id' => Str::uuid()->toString(),
                    'journal_entry_id' => $entryId,
                    'account_id' => $debitAccount,
                    'party_id' => ($debitAccount === $arAccount->id || $debitAccount === $apAccount->id) ? $party->id : null,
                    'debit' => $amount,
                    'credit' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'id' => Str::uuid()->toString(),
                    'journal_entry_id' => $entryId,
                    'account_id' => $creditAccount,
                    'party_id' => ($creditAccount === $arAccount->id || $creditAccount === $apAccount->id) ? $party->id : null,
                    'debit' => 0,
                    'credit' => $amount,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ]);
        }
    }

    public function down(): void
    {
        // Reversing the opening balances
        $entries = DB::table('journal_entries')
            ->where('reference_type', 'opening_balance')
            ->where('narration', 'like', 'Legacy Opening Balance Seeding%')
            ->pluck('id');

        if ($entries->isNotEmpty()) {
            DB::table('journal_items')->whereIn('journal_entry_id', $entries)->delete();
            DB::table('journal_entries')->whereIn('id', $entries)->delete();
        }
    }
};
