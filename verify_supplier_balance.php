<?php
use App\Models\Party;
use Illuminate\Support\Facades\DB;
$p = Party::where('name','Supplier 2')->first();
$apId = \App\Models\Account::where('code','2000')->value('id');
$debit = DB::table('journal_items')->join('journal_entries','journal_items.journal_entry_id','=','journal_entries.id')->where('journal_entries.party_id',$p->id)->where('journal_entries.is_reversed',0)->where('journal_items.account_id',$apId)->sum('journal_items.debit');
$credit = DB::table('journal_items')->join('journal_entries','journal_items.journal_entry_id','=','journal_entries.id')->where('journal_entries.party_id',$p->id)->where('journal_entries.is_reversed',0)->where('journal_items.account_id',$apId)->sum('journal_items.credit');
echo 'Debit: ' . $debit . ' Credit: ' . $credit . ' Balance: ' . ($credit - $debit) . "\n";
