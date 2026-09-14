<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Fetch all tenants
        $tenants = DB::table('tenants')->get();

        foreach ($tenants as $tenant) {
            // Get trade account IDs for this tenant
            $arAccount = DB::table('accounts')->where('tenant_id', $tenant->id)->where('code', '1200')->first();
            $apAccount = DB::table('accounts')->where('tenant_id', $tenant->id)->where('code', '2000')->first();

            if (!$arAccount || !$apAccount) {
                continue;
            }

            // 2. Fetch all parties for this tenant
            $parties = DB::table('parties')->where('tenant_id', $tenant->id)->get();

            foreach ($parties as $party) {
                // Find any existing active opening balance entry for this party
                $entry = DB::table('journal_entries')
                    ->where('tenant_id', $tenant->id)
                    ->where('is_reversed', 0)
                    ->whereIn('reference_type', ['opening_balance', 'opening_balance_migration'])
                    ->where(function ($q) use ($party) {
                        $q->where('reference', $party->id)
                          ->orWhere('idempotency_key', 'ob_migrate_' . $party->id)
                          ->orWhere('narration', "Legacy Opening Balance Seeding for {$party->name}")
                          ->orWhere('party_id', $party->id);
                    })
                    ->first();

                if ($entry) {
                    // Update journal entry itself to ensure reference and party_id are set correctly
                    DB::table('journal_entries')
                        ->where('id', $entry->id)
                        ->update([
                            'reference' => $party->id,
                            'party_id' => $party->id,
                        ]);

                    // Find the journal item associated with accounts 1200 or 2000 for this entry
                    $item = DB::table('journal_items')
                        ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
                        ->where('journal_items.journal_entry_id', $entry->id)
                        ->whereIn('accounts.code', ['1200', '2000'])
                        ->select('journal_items.id as item_id', 'journal_items.debit', 'journal_items.credit', 'accounts.code')
                        ->first();

                    if ($item) {
                        // Ensure journal item is linked to the party
                        DB::table('journal_items')
                            ->where('id', $item->item_id)
                            ->update([
                                'party_id' => $party->id,
                            ]);

                        $amount = max((float)$item->debit, (float)$item->credit);
                        $type = 'receivable'; // default

                        if ($item->code === '1200') {
                            $type = (float)$item->debit > 0 ? 'receivable' : 'payable';
                        } elseif ($item->code === '2000') {
                            $type = (float)$item->debit > 0 ? 'receivable' : 'payable';
                        }

                        // Update the party record with the correct opening balance and type
                        DB::table('parties')
                            ->where('id', $party->id)
                            ->update([
                                'opening_balance' => $amount,
                                'opening_balance_type' => $type,
                            ]);
                    }
                }
            }
        }
    }

    public function down(): void
    {
        // No down actions needed since this is a data synchronization migration.
    }
};
