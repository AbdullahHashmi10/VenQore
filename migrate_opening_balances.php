<?php
/**
 * VenQore ERP — Party Opening Balance Migration
 * 
 * Seeds all party opening balances from parties.current_balance
 * into the V3 journal (journal_entries + journal_items).
 *
 * Safe to run multiple times — uses idempotency_key to prevent duplicates.
 * Does NOT modify any existing data.
 *
 * Run: D:\Software\XAMPP\php\php.exe migrate_opening_balances.php
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// ── Account IDs ──────────────────────────────────────────────────────────────
$acct = DB::table('accounts')->whereIn('code', ['1200', '2000', '7000'])
    ->pluck('id', 'code');

if (!isset($acct['1200'], $acct['2000'], $acct['7000'])) {
    die("ERROR: Missing required accounts (1200, 2000, or 7000). Aborting.\n");
}

$AR   = $acct['1200']; // Accounts Receivable  (debit-normal)
$AP   = $acct['2000']; // Accounts Payable     (credit-normal)
$OBE  = $acct['7000']; // Opening Balance Equity

// ── Load parties with non-zero balance ───────────────────────────────────────
$parties = DB::table('parties')
    ->where('current_balance', '!=', 0)
    ->select('id', 'name', 'type', 'current_balance')
    ->get();

// We need a valid user_id for the FK constraint on journal_entries
$adminUserId = DB::table('users')->orderBy('created_at')->value('id');
if (!$adminUserId) {
    die("ERROR: No users found in the database. Aborting.\n");
}

echo "Found {$parties->count()} parties with non-zero balances.\n";
echo str_repeat('-', 60) . "\n";

$created  = 0;
$skipped  = 0;
$errors   = 0;

foreach ($parties as $party) {
    $balance = (float) $party->current_balance;
    if ($balance == 0) continue;

    // Idempotency key — prevents duplicate entries if script is re-run
    $idempotencyKey = 'opening_balance_migration_' . $party->id;

    // Check if already migrated
    $exists = DB::table('journal_entries')
        ->where('idempotency_key', $idempotencyKey)
        ->exists();

    if ($exists) {
        echo "SKIP  [{$party->type}] {$party->name} — already migrated\n";
        $skipped++;
        continue;
    }

    DB::beginTransaction();
    try {
        $entryId = (string) Str::ulid();
        $now     = now();

        // ── Journal Entry header ─────────────────────────────────────────────
        DB::table('journal_entries')->insert([
            'id'               => $entryId,
            'date'             => now()->toDateString(),
            'reference_type'   => 'opening_balance',
            'reference'        => $party->id,
            'description'      => 'Opening Balance: ' . $party->name,
            'idempotency_key'  => $idempotencyKey,
            'party_id'         => $party->id,
            'user_id'          => $adminUserId,
            'is_reversed'      => 0,
            'is_reversal'      => 0,
            'created_at'       => $now,
            'updated_at'       => $now,
        ]);

        // ── Journal Items (double entry) ─────────────────────────────────────
        if ($party->type === 'customer') {
            // Customer owes us money → AR is a Debit
            // DR 1200 Accounts Receivable / CR 7000 Opening Balance Equity
            $items = [
                ['account_id' => $AR,  'debit' => $balance, 'credit' => 0],
                ['account_id' => $OBE, 'debit' => 0,        'credit' => $balance],
            ];
            $direction = "DR AR {$balance}";
        } else {
            // Supplier — we owe them money → AP is a Credit
            // DR 7000 Opening Balance Equity / CR 2000 Accounts Payable
            $items = [
                ['account_id' => $OBE, 'debit' => $balance, 'credit' => 0],
                ['account_id' => $AP,  'debit' => 0,        'credit' => $balance],
            ];
            $direction = "CR AP {$balance}";
        }

        foreach ($items as $item) {
            DB::table('journal_items')->insert([
                'id'               => (string) Str::ulid(),
                'journal_entry_id' => $entryId,
                'account_id'       => $item['account_id'],
                'debit'            => $item['debit'],
                'credit'           => $item['credit'],
                'created_at'       => $now,
                'updated_at'       => $now,
            ]);
        }

        DB::commit();
        echo "OK    [{$party->type}] {$party->name} — {$direction}\n";
        $created++;

    } catch (\Exception $e) {
        DB::rollBack();
        echo "ERROR [{$party->type}] {$party->name} — {$e->getMessage()}\n";
        $errors++;
    }
}

echo str_repeat('-', 60) . "\n";
echo "Done. Created: {$created} | Skipped: {$skipped} | Errors: {$errors}\n\n";

// ── Verification ─────────────────────────────────────────────────────────────
echo "=== VERIFICATION ===\n";

$arBalance = DB::table('journal_items')
    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
    ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
    ->where('accounts.code', '1200')
    ->where('journal_entries.is_reversed', 0)
    ->selectRaw('COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) as balance')
    ->value('balance');

$apBalance = DB::table('journal_items')
    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
    ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
    ->where('accounts.code', '2000')
    ->where('journal_entries.is_reversed', 0)
    ->selectRaw('COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) as balance')
    ->value('balance');

$trialBalance = DB::table('journal_items')
    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
    ->where('journal_entries.is_reversed', 0)
    ->selectRaw('ABS(COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0)) as diff')
    ->value('diff');

$legacyAR = DB::table('parties')->where('type', 'customer')->sum('current_balance');
$legacyAP = DB::table('parties')->where('type', 'supplier')->sum('current_balance');

echo "Journal AR (account 1200): Rs " . number_format($arBalance, 2) . "\n";
echo "Legacy  AR (parties table): Rs " . number_format($legacyAR, 2) . "\n";
echo "Match: " . (abs($arBalance - $legacyAR) < 1 ? "✅ YES" : "❌ NO — diff: " . abs($arBalance - $legacyAR)) . "\n\n";

echo "Journal AP (account 2000): Rs " . number_format($apBalance, 2) . "\n";
echo "Legacy  AP (parties table): Rs " . number_format($legacyAP, 2) . "\n";
echo "Match: " . (abs($apBalance - $legacyAP) < 1 ? "✅ YES" : "❌ NO — diff: " . abs($apBalance - $legacyAP)) . "\n\n";

echo "Trial Balance (must be 0.00): Rs " . number_format($trialBalance, 2) . "\n";
echo ($trialBalance < 0.01 ? "✅ BALANCED" : "❌ OUT OF BALANCE") . "\n";
