<?php
$cashBank = \App\Models\BankAccount::where('account_type', 'cash')->first();
echo "Cash Bank ID: " . $cashBank->id . "\n";

$ins = \Illuminate\Support\Facades\DB::table('fund_transactions')->where('to_account_id', $cashBank->id)->get();
echo "Fund Ins: " . count($ins) . "\n";
print_r($ins->pluck('id')->toArray());
