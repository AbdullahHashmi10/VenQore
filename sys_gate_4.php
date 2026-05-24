<?php

/* sys_gate_4.php */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

// Clean tables relevant to the test
DB::statement('SET FOREIGN_KEY_CHECKS=0;');
DB::table('journal_items')->truncate();
DB::table('journal_entries')->truncate();
DB::table('production_run_materials')->truncate();
DB::table('production_runs')->truncate();
DB::table('sale_item_batches')->truncate();
DB::table('sale_items')->truncate();
DB::table('sales')->truncate();
DB::table('inventory_batches')->truncate();
DB::table('disaster_claims')->truncate();
DB::table('bom_items')->truncate();
DB::table('bill_of_materials')->truncate();
DB::statement('SET FOREIGN_KEY_CHECKS=1;');

$firstUser = DB::table('users')->first();
Auth::loginUsingId($firstUser->id);

$manufacturing = app(\App\Services\V3\ManufacturingService::class);
$settlement = app(\App\Services\V3\SettlementService::class);

$warehouseId = DB::table('warehouses')->where('is_default', 1)->value('id');

$neededAccounts = [
    ['code' => '6400', 'name' => 'Manufacturing Cost', 'type' => 'expense'],
    ['code' => '6410', 'name' => 'Applied Labor', 'type' => 'expense'],
    ['code' => '1100', 'name' => 'Inventory', 'type' => 'asset'],
    ['code' => '1000', 'name' => 'Cash', 'type' => 'asset'],
    ['code' => '1010', 'name' => 'Bank', 'type' => 'asset'],
    ['code' => '2400', 'name' => 'Salary Payable', 'type' => 'liability'],
    ['code' => '6100', 'name' => 'Salary Expense', 'type' => 'expense'],
    ['code' => '6800', 'name' => 'Gratuity', 'type' => 'expense'],
    ['code' => '1350', 'name' => 'Employee Advance', 'type' => 'asset'],
    ['code' => '6900', 'name' => 'Cash Shortage', 'type' => 'expense'],
    ['code' => '6950', 'name' => 'Disaster Loss', 'type' => 'expense'],
    ['code' => '6960', 'name' => 'Insurance Recovery', 'type' => 'revenue'],
    ['code' => '1500', 'name' => 'Fixed Assets', 'type' => 'asset'],
    ['code' => '6600', 'name' => 'Depreciation', 'type' => 'expense'],
    ['code' => '1510', 'name' => 'Acc Depr', 'type' => 'asset'],
    ['code' => '2500', 'name' => 'Loan Payable', 'type' => 'liability'],
    ['code' => '6500', 'name' => 'Loan Interest', 'type' => 'expense'],
    ['code' => '6000', 'name' => 'Op Expense', 'type' => 'expense'],
    ['code' => '2300', 'name' => 'Input Tax', 'type' => 'asset'],
    ['code' => '3000', 'name' => 'Owner Capital', 'type' => 'equity'],
    ['code' => '6200', 'name' => 'Donation', 'type' => 'expense']
];
foreach ($neededAccounts as $acc) {
    if (!DB::table('accounts')->where('code', $acc['code'])->exists()) {
        DB::table('accounts')->insert([
            'id' => Str::uuid()->toString(), 'code' => $acc['code'], 'name' => $acc['name'],
            'type' => $acc['type'], 'is_active' => 1, 'created_at' => now(), 'updated_at' => now()
        ]);
    }
}

// Create a raw material
$rawId = Str::uuid()->toString();
DB::table('products')->insert([
    'id' => $rawId, 'name' => 'Raw Material A', 'type' => 'raw_material', 'base_unit' => 'KG',
    'created_at' => now(), 'updated_at' => now(),
]);
// Initial batch for raw material
DB::table('inventory_batches')->insert([
    'id' => Str::uuid()->toString(), 'product_id' => $rawId, 'warehouse_id' => $warehouseId,
    'batch_type' => 'purchase', 'unit_cost' => 10.00, 'initial_qty' => 500, 'remaining_qty' => 500,
    'created_at' => now(), 'updated_at' => now(),
]);

// Create FG product
$fgId = Str::uuid()->toString();
DB::table('products')->insert([
    'id' => $fgId, 'name' => 'Finished Good A', 'type' => 'finished_good', 'base_unit' => 'PCS',
    'created_at' => now(), 'updated_at' => now(),
]);

// Create BOM
$bomId = Str::uuid()->toString();
DB::table('bill_of_materials')->insert([
    'id' => $bomId, 'product_id' => $fgId, 'version' => 1, 'effective_from' => now()->toDateString(),
    'is_active' => 1, 'created_at' => now(), 'updated_at' => now(),
]);
$bomItemId = Str::uuid()->toString();
DB::table('bom_items')->insert([
    'id' => $bomItemId, 'bom_id' => $bomId, 'product_id' => $rawId,
    'qty_per_unit' => 0.5, 'is_byproduct' => 0, 'created_at' => now(), 'updated_at' => now(),
]);

// ==========================================
// GATE 1: 100-unit production run — WIP balance
// ==========================================
$run = $manufacturing->startRun([
    'bom_id' => $bomId, 'warehouse_id' => $warehouseId,
    'planned_qty' => 100, // 10 batches -> 50 kg raw material
    'labor_cost' => 200.00,
    'labor_type' => 'external', 'payment_method' => 'cash', 'run_date' => now()->toDateString(),
]);

$g1 = DB::table('production_runs')->where('id', $run->id)->first();
$wipMatches = ($g1->wip_balance == ($g1->material_cost + $g1->labor_cost)) && $g1->status === 'in_progress';
echo "GATE 1 (WIP Balance): " . ($wipMatches ? "PASS\n" : "FAIL (WIP: {$g1->wip_balance}, Mat: {$g1->material_cost}, Lab: {$g1->labor_cost}, Status: {$g1->status})\n");

// ==========================================
// GATE 2: FG batch created at combined cost
// ==========================================
$manufacturing->completeRun($run->id, 100.0);
$ib = DB::selectOne("
    SELECT ib.unit_cost, ib.initial_qty, pr.total_cost
    FROM inventory_batches ib
    JOIN production_runs pr ON ib.production_run_id = pr.id
    WHERE ib.batch_type = 'manufactured' AND pr.id = ?
", [$run->id]);
$expectedUnitCost = round($ib->total_cost / $ib->initial_qty, 4);
$unitCostMatches = abs($ib->unit_cost - $expectedUnitCost) < 0.01;
echo "GATE 2 (FG Unit Cost): " . ($unitCostMatches ? "PASS\n" : "FAIL (Unit Cost: {$ib->unit_cost}, Expected: {$expectedUnitCost})\n");

// ==========================================
// GATE 3: B27 composite journal
// ==========================================
$empId = Str::uuid()->toString();
DB::table('employees')->insert([
    'id' => $empId, 'name' => 'John Doe', 'monthly_salary' => 5000,
    'hire_date' => '2020-01-01', 'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
]);

$settlement->processSettlement([
    'employee_id' => $empId, 'settlement_date' => now()->toDateString(), 'payment_method' => 'cash',
    'partial_month_salary' => 2000, 'gratuity' => 5000, 'notice_pay' => 0, 'leave_encashment' => 1000,
    'advance_deduction' => 0,
]);

$g3 = DB::select("
    SELECT je.reference_type, a.code, SUM(ji.debit) dr, SUM(ji.credit) cr
    FROM journal_items ji
    JOIN accounts a ON ji.account_id = a.id
    JOIN journal_entries je ON ji.journal_entry_id = je.id
    WHERE je.reference_type IN ('settlement_accrual','settlement_payment')
      AND je.reference = ?
    GROUP BY je.reference_type, a.code
    ORDER BY je.reference_type, a.code
", [$empId]);
// accrual: 6100(DR 2000), 6800(DR 6000), 2400(CR 8000)
// payment: 2400(DR 8000), 1000(CR 8000)
$passG3 = true;
foreach($g3 as $row) {
    if ($row->reference_type == 'settlement_accrual') {
        if ($row->code == '6100' && $row->dr != 2000) $passG3 = false;
        if ($row->code == '6800' && $row->dr != 6000) $passG3 = false;
        if ($row->code == '2400' && $row->cr != 8000) $passG3 = false;
    }
    if ($row->reference_type == 'settlement_payment') {
        if ($row->code == '2400' && $row->dr != 8000) $passG3 = false;
        if ($row->code == '1000' && $row->cr != 8000) $passG3 = false;
    }
}
echo "GATE 3 (B27 Journal): " . ($passG3 ? "PASS\n" : "FAIL\n");

// ==========================================
// GATE 4: B28 blocked without narration AND blocked for non-manager
// ==========================================
// Create a cashier
$cashierId = Str::uuid()->toString();
DB::table('users')->insert([
    'id' => $cashierId, 'name' => 'Cashier', 'email' => 'cashier'.rand().'@test.com', 'password' => 'xyz',
    'role' => 'cashier', 'created_at' => now(), 'updated_at' => now()
]);
// We can manually test the Controller validations
$request1 = \Illuminate\Http\Request::create('/v3/cash-shortages', 'POST', [
    'amount' => 100, 'shortage_date' => now()->toDateString(), 'narration' => '', 'approved_by' => $firstUser->id
]);
$request2 = \Illuminate\Http\Request::create('/v3/cash-shortages', 'POST', [
    'amount' => 100, 'shortage_date' => now()->toDateString(), 'narration' => 'Valid narration here', 'approved_by' => $cashierId
]);
$c = app(\App\Http\Controllers\V3\CashShortageController::class);

$passG4a = false;
try { $c->store($request1); } catch (\Illuminate\Validation\ValidationException $e) { $passG4a = true; }

$res2 = clone $c->store($request2);
$passG4b = session()->has('errors') && session('errors')->has('approved_by');

echo "GATE 4 (B28 Validation): " . (($passG4a && $passG4b) ? "PASS\n" : "FAIL (Empty narration check: ".($passG4a?'Ok':'Fail').", approver role check: ".($passG4b?'Ok':'Fail').")\n");

// ==========================================
// GATE 5: B29 Step 1 and Step 2 linked
// ==========================================
$claimController = app(\App\Http\Controllers\V3\DisasterClaimController::class);
$claimController->store(\Illuminate\Http\Request::create('/v3/disaster-claims', 'POST', [
    'description' => 'Test flood', 'loss_date' => now()->toDateString(),
    'items' => [['product_id' => $rawId, 'warehouse_id' => $warehouseId, 'qty' => 10]]
]));
$claim = DB::table('disaster_claims')->orderBy('created_at', 'desc')->first();
$claimController->recover(\Illuminate\Http\Request::create('/v3/disaster-claims/'.$claim->id.'/recover', 'POST', [
    'recovery_amount' => 50, 'recovery_date' => now()->toDateString(), 'payment_method' => 'cash'
]), $claim->id);
$claimFinal = DB::table('disaster_claims')->where('id', $claim->id)->first();
$passG5 = $claimFinal->loss_journal_entry_id && $claimFinal->recovery_journal_entry_id && $claimFinal->status === 'closed';
echo "GATE 5 (B29 linking): " . ($passG5 ? "PASS\n" : "FAIL\n");

// ==========================================
// GATE 6: B30 component costs sum to parent
// ==========================================
$disBomId = Str::uuid()->toString();
DB::table('disassembly_boms')->insert([
  'id' => $disBomId, 'product_id' => $fgId, 'created_at' => now(), 'updated_at' => now()
]);
DB::table('disassembly_bom_items')->insert([
  'id' => Str::uuid()->toString(), 'disassembly_bom_id' => $disBomId, 'component_product_id' => $rawId, 'allocation_percent' => 100, 'created_at' => now(), 'updated_at' => now()
]);
$manufacturing->disassemble($fgId, 10, $warehouseId);

$g6 = DB::selectOne("
SELECT
    (SELECT SUM(ji.credit)
     FROM journal_items ji
     JOIN accounts a ON ji.account_id = a.id
     JOIN journal_entries je ON ji.journal_entry_id = je.id
     WHERE je.reference_type = 'disassembly'
       AND a.code = '1100'
       AND ji.credit > 0) as set_fifo_cost,
    (SELECT SUM(ji.debit)
     FROM journal_items ji
     JOIN accounts a ON ji.account_id = a.id
     JOIN journal_entries je ON ji.journal_entry_id = je.id
     WHERE je.reference_type = 'disassembly'
       AND a.code = '1100'
       AND ji.debit > 0) as component_total
");
$passG6 = abs($g6->set_fifo_cost - $g6->component_total) < 0.01;
echo "GATE 6 (B30 disassembly): " . ($passG6 ? "PASS\n" : "FAIL (Set FIFO: {$g6->set_fifo_cost}, Component Total: {$g6->component_total})\n");
