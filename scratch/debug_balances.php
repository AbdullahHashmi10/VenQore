<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Party;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use Illuminate\Support\Facades\DB;

$tenant = \App\Models\Tenant::first();
echo "TENANT Slug: " . ($tenant ? $tenant->slug : "NONE") . "\n";
echo "TENANT ID: " . ($tenant ? $tenant->id : "NONE") . "\n";

if ($tenant) {
    app()->instance('current.tenant', $tenant);
}

$arAccount = Account::where('code', '1200')->first();
$apAccount = Account::where('code', '2000')->first();

echo "AR Account: " . ($arAccount ? $arAccount->id : "NOT FOUND") . "\n";
echo "AP Account: " . ($apAccount ? $apAccount->id : "NOT FOUND") . "\n";

$partiesCount = Party::count();
echo "Total Parties: $partiesCount\n";

$receivables = DB::table('journal_items')
    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
    ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
    ->where('accounts.code', '1200')
    ->where('journal_entries.is_reversed', 0)
    ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as net')
    ->value('net');

echo "Raw Receivables (no tenant scope on accounts/entries): $receivables\n";

if ($tenant) {
    $receivablesScoped = DB::table('journal_items')
        ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
        ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
        ->where('accounts.tenant_id', $tenant->id)
        ->where('accounts.code', '1200')
        ->where('journal_entries.tenant_id', $tenant->id)
        ->where('journal_entries.is_reversed', 0)
        ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as net')
        ->value('net');
    echo "Scoped Receivables (tenant_id = {$tenant->id}): $receivablesScoped\n";
}

$firstParty = Party::first();
if ($firstParty) {
    echo "First Party Name: {$firstParty->name}, ID: {$firstParty->id}\n";
    
    $netAR = DB::table('journal_items')
        ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.party_id', $firstParty->id)
        ->where('journal_entries.is_reversed', 0)
        ->where('journal_items.account_id', $arAccount?->id)
        ->selectRaw('SUM(COALESCE(journal_items.debit,0)) - SUM(COALESCE(journal_items.credit,0)) as balance')
        ->value('balance') ?? 0;
    echo "First Party netAR: $netAR\n";
}
