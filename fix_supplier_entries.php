<?php
use Illuminate\Support\Facades\DB;

$pid = '019ce39f-0188-7044-8533-6f6dfbdb2f72'; 
$arId = DB::table('accounts')->where('code', '1200')->value('id'); 
$apId = DB::table('accounts')->where('code', '2000')->value('id'); 

// Move from AR to AP
DB::table('journal_items')
    ->where('party_id', $pid)
    ->where('account_id', $arId)
    ->update(['account_id' => $apId]); 

// Rebuild balance
app(\App\Services\V3\PartyService::class)->rebuildSnapshot($pid);

echo "Moved entries for party $pid from AR to AP and rebuilt snapshot." . PHP_EOL;
