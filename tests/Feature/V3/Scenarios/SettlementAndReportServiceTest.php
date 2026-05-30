<?php

namespace Tests\Feature\V3\Scenarios;

use Tests\TestCase;
use App\Services\V3\SettlementService;
use App\Services\V3\ReportService;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class SettlementAndReportServiceTest extends TestCase
{
    use DatabaseTransactions;

    private SettlementService $settlement;
    private ReportService     $reports;
    private AccountingService $accounting;
    private FifoService       $fifo;

    private string $employeeId;
    private string $warehouseId;
    private string $productId;
    private string $customerId;

    protected function setUp(): void
    {
        parent::setUp();

        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);

        $this->settlement = app(SettlementService::class);
        $this->reports    = app(ReportService::class);
        $this->accounting = app(AccountingService::class);
        $this->fifo       = app(FifoService::class);

        $this->seedAccounts();
        $this->warehouseId = $this->seedWarehouse();
        $this->productId   = $this->seedProduct();
        $this->customerId  = $this->seedParty('customer');
        $this->employeeId  = $this->seedEmployee(30000.00); // Rs.30,000/month
    }

    // ═══════════════════════════════════════════════════════════════════
    // SETTLEMENT SERVICE TESTS (B27)
    // ═══════════════════════════════════════════════════════════════════

    // ─── TEST 1: B27 posts correct composite journal entry ────────────
    /** @test */
    public function b27_posts_correct_composite_journal_entry()
    {
        // Employee worked 15 days of final month = Rs.15,000 salary
        // Gratuity = Rs.20,000, Notice pay = Rs.5,000
        $this->settlement->processSettlement([
            'employee_id'          => $this->employeeId,
            'settlement_date'      => now()->toDateString(),
            'partial_month_salary' => 15000.00,
            'gratuity'             => 20000.00,
            'notice_pay'           => 5000.00,
            'leave_encashment'     => 0.00,
            'payment_method'       => 'cash',
        ]);

        $account6100 = DB::table('accounts')->where('code', '6100')->first();
        $account6800 = DB::table('accounts')->where('code', '6800')->first();
        $account2400 = DB::table('accounts')->where('code', '2400')->first();
        $account1000 = DB::table('accounts')->where('code', '1000')->first();

        // Find the accrual journal entry
        $accrualJe = DB::table('journal_entries')
            ->where('reference_type', 'settlement_accrual')
            ->where('reference', $this->employeeId)
            ->first();

        $this->assertNotNull($accrualJe);

        // 6100 DR = partial month salary Rs.15,000
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $accrualJe->id,
            'account_id'       => $account6100->id,
            'debit'            => 15000.00,
        ]);

        // 6800 DR = gratuity + notice = Rs.25,000
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $accrualJe->id,
            'account_id'       => $account6800->id,
            'debit'            => 25000.00,
        ]);

        // 2400 CR = total payable Rs.40,000
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $accrualJe->id,
            'account_id'       => $account2400->id,
            'credit'           => 40000.00,
        ]);

        // Find the payment journal entry
        $paymentJe = DB::table('journal_entries')
            ->where('reference_type', 'settlement_payment')
            ->where('reference', $this->employeeId)
            ->first();

        $this->assertNotNull($paymentJe);

        // 2400 DR = Rs.40,000
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $paymentJe->id,
            'account_id'       => $account2400->id,
            'debit'            => 40000.00,
        ]);

        // 1000 CR = Rs.40,000
        $this->assertDatabaseHas('journal_items', [
            'journal_entry_id' => $paymentJe->id,
            'account_id'       => $account1000->id,
            'credit'           => 40000.00,
        ]);
    }

    // ─── TEST 2: B27 marks employee as terminated ─────────────────────
    /** @test */
    public function b27_marks_employee_as_terminated()
    {
        $this->settlement->processSettlement([
            'employee_id'          => $this->employeeId,
            'settlement_date'      => now()->toDateString(),
            'partial_month_salary' => 10000.00,
            'gratuity'             => 15000.00,
            'notice_pay'           => 0.00,
            'leave_encashment'     => 2000.00,
            'payment_method'       => 'cash',
        ]);

        $this->assertDatabaseHas('employees', [
            'id'               => $this->employeeId,
            'status'           => 'terminated',
            'termination_date' => now()->toDateString(),
        ]);
    }

    // ─── TEST 3: B27 requires manager approval ────────────────────────
    /** @test */
    public function b27_requires_approved_by_on_journal_entry()
    {
        $this->settlement->processSettlement([
            'employee_id'          => $this->employeeId,
            'settlement_date'      => now()->toDateString(),
            'partial_month_salary' => 10000.00,
            'gratuity'             => 5000.00,
            'notice_pay'           => 0.00,
            'leave_encashment'     => 0.00,
            'payment_method'       => 'cash',
            'approved_by'          => '99',
        ]);

        $accrualJe = DB::table('journal_entries')
            ->where('reference_type', 'settlement_accrual')
            ->where('reference', $this->employeeId)
            ->first();

        $this->assertEquals('99', $accrualJe->approved_by);
    }

    // ═══════════════════════════════════════════════════════════════════
    // REPORT SERVICE TESTS
    // ═══════════════════════════════════════════════════════════════════

    // ─── TEST 4: Trial Balance — debits equal credits ─────────────────
    /** @test */
    public function trial_balance_debits_equal_credits()
    {
        // Post a known balanced entry
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'test',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'TB test entry',
        ], [
            ['account_code' => '1000', 'debit'  => 5000.00, 'credit' => 0],
            ['account_code' => '4000', 'debit'  => 0,       'credit' => 5000.00],
        ]);

        $tb = $this->reports->trialBalance();

        $this->assertArrayHasKey('rows',          $tb);
        $this->assertArrayHasKey('grand_debit',   $tb);
        $this->assertArrayHasKey('grand_credit',  $tb);

        // The fundamental rule: total debits must equal total credits
        $this->assertEquals($tb['grand_debit'], $tb['grand_credit']);
    }

    // ─── TEST 5: P&L — Revenue minus COGS minus Expenses ─────────────
    /** @test */
    public function profit_and_loss_calculates_correctly()
    {
        // Revenue entry: Rs.10,000
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'sale',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'PL revenue test',
        ], [
            ['account_code' => '1200', 'debit'  => 10000.00, 'credit' => 0],
            ['account_code' => '4000', 'debit'  => 0,        'credit' => 10000.00],
        ]);

        // COGS entry: Rs.6,000
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'sale',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'PL COGS test',
        ], [
            ['account_code' => '5000', 'debit'  => 6000.00, 'credit' => 0],
            ['account_code' => '1100', 'debit'  => 0,       'credit' => 6000.00],
        ]);

        // Expense entry: Rs.1,000
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'expense',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'PL expense test',
        ], [
            ['account_code' => '6000', 'debit'  => 1000.00, 'credit' => 0],
            ['account_code' => '1000', 'debit'  => 0,       'credit' => 1000.00],
        ]);

        $pl = $this->reports->profitAndLoss(
            now()->startOfMonth(),
            now()->endOfMonth()
        );

        $this->assertArrayHasKey('total_revenue', $pl);
        $this->assertArrayHasKey('total_cogs',    $pl);
        $this->assertArrayHasKey('gross_profit',  $pl);
        $this->assertArrayHasKey('total_expenses',$pl);
        $this->assertArrayHasKey('net_profit',    $pl);

        $this->assertEquals(10000.00, $pl['total_revenue']);
        $this->assertEquals(6000.00,  $pl['total_cogs']);
        $this->assertEquals(4000.00,  $pl['gross_profit']);  // 10000 - 6000
        $this->assertEquals(1000.00,  $pl['total_expenses']);
        $this->assertEquals(3000.00,  $pl['net_profit']);    // 4000 - 1000
    }

    // ─── TEST 6: Balance Sheet — Assets = Liabilities + Equity ───────
    /** @test */
    public function balance_sheet_balances_to_the_paisa()
    {
        // Capital injection: DR Cash / CR Owner's Capital
        $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'capital',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'BS test capital injection',
        ], [
            ['account_code' => '1000', 'debit'  => 50000.00, 'credit' => 0],
            ['account_code' => '3000', 'debit'  => 0,        'credit' => 50000.00],
        ]);

        $bs = $this->reports->balanceSheet(now());

        $this->assertArrayHasKey('total_assets',      $bs);
        $this->assertArrayHasKey('total_liabilities', $bs);
        $this->assertArrayHasKey('total_equity',      $bs);

        // Assets = Liabilities + Equity
        $this->assertEquals(
            $bs['total_assets'],
            round($bs['total_liabilities'] + $bs['total_equity'], 2)
        );
    }

    // ─── TEST 7: Inventory valuation = batch qty × unit cost ─────────
    /** @test */
    public function inventory_valuation_matches_batch_totals()
    {
        // Create two batches
        $this->fifo->receiveBatch($this->productId, $this->warehouseId, 10, 100.00, 'purchase');
        $this->fifo->receiveBatch($this->productId, $this->warehouseId, 5,  200.00, 'purchase');

        $valuation = $this->reports->inventoryValuation();

        // Total expected = (10×100) + (5×200) = 1000 + 1000 = 2000
        $productLine = collect($valuation['rows'])
            ->firstWhere('product_id', $this->productId);

        $this->assertNotNull($productLine);
        $this->assertEquals(2000.00, $productLine['total_value']);
    }

    // ─── TEST 8: Aged receivables buckets correctly ───────────────────
    /** @test */
    public function aged_receivables_buckets_invoices_correctly()
    {
        $saleId = Str::uuid()->toString();
        // Post a sale dated 45 days ago — should land in 31-60 bucket
        DB::table('sales')->insert([
            'id'             => $saleId,
            'reference_number' => 'INV-TEST-45',
            'party_id'       => $this->customerId,
            'subtotal'       => 3000.00,
            'discount'       => 0,
            'tax'            => 0,
            'total'          => 3000.00,
            'invoice_total'  => 3000.00,
            'status'         => 'posted',
            'payment_status' => 'unpaid',
            'warehouse_id'   => $this->warehouseId,
            'user_id'        => auth()->id(),
            'posted_at'      => now()->subDays(45)->toDateString(),
            'created_at'     => now()->subDays(45),
            'updated_at'     => now()->subDays(45),
        ]);

        $this->accounting->createEntry([
            'entry_date'     => now()->subDays(45)->toDateString(),
            'reference_type' => 'sale',
            'reference_id'   => $saleId,
            'description'    => 'Old invoice for aging',
            'party_id'       => $this->customerId,
        ], [
            ['account_code' => '1200', 'debit'  => 3000.00, 'credit' => 0,       'party_id' => $this->customerId],
            ['account_code' => '4000', 'debit'  => 0,       'credit' => 3000.00],
        ]);

        $ar = $this->reports->agedReceivables();

        $this->assertArrayHasKey('summary',       $ar);
        // Keys inside summary are 0-30, 31-60, 61-90, 90+ based on the service buckets
        $this->assertArrayHasKey('0-30',          $ar['summary']);
        $this->assertArrayHasKey('31-60',         $ar['summary']);
        $this->assertArrayHasKey('61-90',         $ar['summary']);
        $this->assertArrayHasKey('90+',           $ar['summary']);

        // The 45-day old entry should be in the 31-60 bucket
        $this->assertGreaterThanOrEqual(3000.00, $ar['summary']['31-60']);
    }

    // ─── TEST 9: Reversed entries excluded from all reports ──────────
    /** @test */
    public function reversed_entries_are_excluded_from_reports()
    {
        // Post an entry then reverse it
        $entry = $this->accounting->createEntry([
            'entry_date'     => now()->toDateString(),
            'reference_type' => 'sale',
            'reference_id'   => Str::uuid()->toString(),
            'description'    => 'Entry to be reversed',
        ], [
            ['account_code' => '1000', 'debit'  => 9999.00, 'credit' => 0],
            ['account_code' => '4000', 'debit'  => 0,       'credit' => 9999.00],
        ]);

        $this->accounting->reverseEntry($entry->id, 'Test reversal');

        $tb = $this->reports->trialBalance();

        // Reversed entry + its reversal cancel each other out
        // The Rs.9999 should NOT appear as a net balance in either account
        $cashLine = collect($tb['rows'])->firstWhere('code', '1000');
        if ($cashLine) {
            // Any balance in 1000 should not include the reversed Rs.9999
            $this->assertNotEquals(9999.00, abs($cashLine['balance']));
        }

        // Total debits still equal total credits
        $this->assertEquals($tb['grand_debit'], $tb['grand_credit']);
    }

    // ═══════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════

    private function seedAccounts(): void
    {
        $accounts = [
            ['1000', 'Cash in Hand',              'asset',     'debit'],
            ['1010', 'Bank Account',              'asset',     'debit'],
            ['1100', 'Inventory Asset',            'asset',     'debit'],
            ['1200', 'Accounts Receivable',        'asset',     'debit'],
            ['2000', 'Accounts Payable',           'liability', 'credit'],
            ['2400', 'Salary Payable',             'liability', 'credit'],
            ['3000', "Owner's Capital",            'equity',    'credit'],
            ['4000', 'Sales Revenue',              'income',    'credit'],
            ['5000', 'Cost of Goods Sold',         'expense',   'debit'],
            ['6000', 'Operating Expenses',         'expense',   'debit'],
            ['6100', 'Salary Expense',             'expense',   'debit'],
            ['6800', 'Gratuity & Severance',       'expense',   'debit'],
        ];
        foreach ($accounts as [$code, $name, $type, $balance]) {
            if (!DB::table('accounts')->where('code', $code)->exists()) {
                DB::table('accounts')->insert([
                    'id'             => Str::uuid()->toString(),
                    'code'           => $code,
                    'name'           => $name,
                    'type'           => $type,
                    'normal_balance' => $balance,
                    'is_active'      => 1,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }
        }
    }

    private function seedWarehouse(): string
    {
        $id = Str::uuid()->toString();
        DB::table('warehouses')->insert([
            'id'         => $id,
            'name'       => 'Main Warehouse',
            'is_default' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function seedProduct(): string
    {
        $id = Str::uuid()->toString();
        DB::table('products')->insert([
            'id'         => $id,
            'name'       => 'Report Test Product',
            'sku'        => 'RPT-' . Str::random(5),
            'base_unit'  => 'PCS',
            'price'      => 10.00,
            'cost_price' => 5.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function seedParty(string $type): string
    {
        $id = Str::uuid()->toString();
        DB::table('parties')->insert([
            'id'         => $id,
            'name'       => ucfirst($type) . ' ' . Str::random(4),
            'type'       => $type,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function seedEmployee(float $salary): string
    {
        $id = Str::uuid()->toString();
        DB::table('employees')->insert([
            'id'             => $id,
            'name'           => 'Test Employee',
            'monthly_salary' => $salary,
            'hire_date'      => now()->subYear()->toDateString(),
            'status'         => 'active',
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
        return $id;
    }
}
