<?php

/* sys_gate_5.php */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Services\V3\ReportService;
use Carbon\Carbon;

echo "======================================\n";
echo "PHASE 5 GATES\n";
echo "======================================\n";

// GATE 1: Trial balance — grand debit = grand credit
$g1 = DB::selectOne("
SELECT
    SUM(ji.debit)  AS grand_debit,
    SUM(ji.credit) AS grand_credit,
    ABS(SUM(ji.debit) - SUM(ji.credit)) AS difference
FROM journal_items ji
JOIN journal_entries je ON ji.journal_entry_id = je.id
WHERE je.is_reversed = 0;
");
echo "GATE 1 (Trial Balance Difference): {$g1->difference}\n";

// GATE 2: Balance sheet — assets = liabilities + equity
$reportService = app(ReportService::class);
$bs = $reportService->balanceSheet(Carbon::today());
echo "GATE 2 (Balance Sheet Balanced): " . ($bs['balanced'] ? "TRUE" : "FALSE") . "\n";

// GATE 3: Account 1100 = inventory batch value
$g3 = DB::selectOne("
SELECT
    (SELECT SUM(ji.debit) - SUM(ji.credit)
     FROM journal_items ji
     JOIN journal_entries je ON ji.journal_entry_id = je.id
     JOIN accounts a ON ji.account_id = a.id
     WHERE a.code = '1100' AND je.is_reversed = 0) AS ledger_1100,
    (SELECT SUM(remaining_qty * unit_cost)
     FROM inventory_batches
     WHERE remaining_qty > 0 AND deleted_at IS NULL)  AS batch_value,
    ABS(
        (SELECT SUM(ji.debit) - SUM(ji.credit)
         FROM journal_items ji
         JOIN journal_entries je ON ji.journal_entry_id = je.id
         JOIN accounts a ON ji.account_id = a.id
         WHERE a.code = '1100' AND je.is_reversed = 0)
        -
        (SELECT SUM(remaining_qty * unit_cost)
         FROM inventory_batches
         WHERE remaining_qty > 0 AND deleted_at IS NULL)
    ) AS difference;
");
echo "GATE 3 (Account 1100 vs Batch Value Difference): {$g3->difference}\n";

// GATE 4: Account 5000 = sale_item_batches total cost
$g4 = DB::selectOne("
SELECT
    (SELECT SUM(ji.debit) - SUM(ji.credit)
     FROM journal_items ji
     JOIN journal_entries je ON ji.journal_entry_id = je.id
     JOIN accounts a ON ji.account_id = a.id
     WHERE a.code = '5000' AND je.is_reversed = 0) AS ledger_5000,
    (SELECT SUM(total_cogs)
     FROM sale_item_batches
     WHERE is_reversed = 0)                          AS batch_cogs,
    ABS(
        (SELECT SUM(ji.debit) - SUM(ji.credit)
         FROM journal_items ji
         JOIN journal_entries je ON ji.journal_entry_id = je.id
         JOIN accounts a ON ji.account_id = a.id
         WHERE a.code = '5000' AND je.is_reversed = 0)
        -
        (SELECT SUM(total_cogs) FROM sale_item_batches WHERE is_reversed = 0)
    ) AS difference;
");
echo "GATE 4 (Account 5000 vs Batch COGS Difference): {$g4->difference}\n";

// GATE 5: Account 7000 nets to zero
$g5 = DB::selectOne("
SELECT SUM(ji.debit) - SUM(ji.credit) AS net_7000
FROM journal_items ji
JOIN journal_entries je ON ji.journal_entry_id = je.id
JOIN accounts a ON ji.account_id = a.id
WHERE a.code = '7000' AND je.is_reversed = 0;
");
echo "GATE 5 (Account 7000 Net): {$g5->net_7000}\n";

// GATE 6: Dashboard cash widget = ledger account 1000
$g6 = DB::selectOne("
SELECT
    (SELECT SUM(ji.debit) - SUM(ji.credit)
     FROM journal_items ji
     JOIN journal_entries je ON ji.journal_entry_id = je.id
     JOIN accounts a ON ji.account_id = a.id
     WHERE a.code = '1000' AND je.is_reversed = 0) AS ledger_cash;
");
$dash = app(\App\Http\Controllers\V3\DashboardController::class);
$dashResponse = $dash->index()->getData(true);
echo "GATE 6 (Ledger Cash vs Dashboard Cash): " . 
     ($g6->ledger_cash == $dashResponse['cash'] ? "PASS" : "FAIL ({$g6->ledger_cash} vs {$dashResponse['cash']})") . "\n";
