<?php

namespace Tests\Feature\Golden;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\V3\AccountingService;

/**
 * ============================================================
 * Phase 3 — Input Verification: EXPENSE & PAYMENT Events
 * ============================================================
 *
 * Event catalog:
 *  [X-01] Cash expense — GL 6000 DR, GL 1000 CR
 *  [X-02] Bank expense — GL 6000 DR, GL 1010 CR
 *  [X-03] Expense with input tax — GL 2300 DR added
 *  [X-04] Customer payment received — reduces AR, increases Cash
 *  [X-05] Supplier payment made — reduces AP, reduces Cash
 *  [X-06] Partial customer payment — AR partially reduced
 *  [X-07] Overpayment receipt — excess goes to Customer Advance liability
 *  [X-08] Manual journal entry — any valid entry posted via AccountingService
 *  [X-09] Opening balance — correctly books equity and asset accounts
 *
 * @group golden
 * @group phase3
 * @group phase3-expenses
 */
class ExpensePaymentInputVerificationTest extends InputVerificationTestCase
{
    private AccountingService $accounting;

    protected function setUp(): void
    {
        parent::setUp();
        $this->accounting = app(AccountingService::class);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [X-01] CASH EXPENSE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Cash expense of Rs.15,000 (salaries).
     *   DR 6000 Operating Expenses  15,000.00
     *   CR 1000 Cash               15,000.00
     * GL 1000 balance must drop by exactly Rs.15,000.
     */
    public function test_X01_cash_expense_debits_opex_credits_cash(): void
    {
        $cashBefore  = $this->glBalance('1000');
        $opexBefore  = $this->glBalance('6000');

        // Use ExpenseController route (real HTTP)
        $response = $this->v3Post('expenses', [
            'description'    => 'Staff Salaries June',
            'expense_date'   => '2025-06-15',
            'amount'         => 15000.00,
            'payment_method' => 'cash',
            'input_tax'      => 0,
        ]);

        $response->assertSuccessful();

        $lines = $this->getJournalLines('operating_expense');
        $this->assertNotEmpty($lines->toArray(), 'No journal entry created for expense');
        $this->assertJournalBalanced($lines, ' [X-01]');

        $this->assertJournalLine($lines, '6000', 'debit',  15000.00, '[X-01] OpEx debit');
        $this->assertJournalLine($lines, '1000', 'credit', 15000.00, '[X-01] Cash credit');

        // No tax line when input_tax = 0
        $taxLines = $lines->filter(fn($l) => $l->code === '2300');
        $this->assertEmpty($taxLines->toArray(), '[X-01] Zero input-tax expense must not create GL 2300 line');

        // GL balances move correctly
        $this->assertEqualsWithDelta($cashBefore - 15000.00, $this->glBalance('1000'), $this->TOLERANCE,
            '[X-01] Cash balance should drop by Rs.15,000');
        $this->assertEqualsWithDelta($opexBefore + 15000.00, $this->glBalance('6000'), $this->TOLERANCE,
            '[X-01] OpEx balance should rise by Rs.15,000');

        $this->assertLedgerInvariantsHold('[X-01]');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [X-02] BANK EXPENSE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Bank expense (rent paid via bank). Must credit GL 1010 (Bank), not GL 1000 (Cash).
     */
    public function test_X02_bank_expense_credits_bank_not_cash(): void
    {
        // Fund the bank account first
        $this->accounting->createEntry([
            'date'           => '2025-06-01',
            'reference_type' => 'opening_balance',
            'reference'      => 'bank-opening',
            'description'    => 'Opening Bank Balance',
        ], [
            ['account_code' => '1010', 'debit'  => 100000.00, 'credit' => 0],
            ['account_code' => '7000', 'debit'  => 0, 'credit' => 100000.00],
        ]);

        $bankBefore = $this->glBalance('1010');

        $response = $this->v3Post('expenses', [
            'description'    => 'Office Rent Q2',
            'expense_date'   => '2025-06-15',
            'amount'         => 50000.00,
            'payment_method' => 'bank',
            'input_tax'      => 0,
        ]);

        $response->assertSuccessful();

        $lines = $this->getJournalLines('operating_expense');
        $this->assertJournalBalanced($lines, ' [X-02]');

        $this->assertJournalLine($lines, '6000', 'debit',  50000.00, '[X-02] OpEx debit');
        $this->assertJournalLine($lines, '1010', 'credit', 50000.00, '[X-02] Bank credit (not cash)');

        $cashLines = $lines->filter(fn($l) => $l->code === '1000' && (float)$l->credit > 0);
        $this->assertEmpty($cashLines->toArray(), '[X-02] Bank expense must not credit Cash (GL 1000)');

        $this->assertEqualsWithDelta($bankBefore - 50000.00, $this->glBalance('1010'), $this->TOLERANCE,
            '[X-02] Bank balance should drop by Rs.50,000');

        $this->assertLedgerInvariantsHold('[X-02]');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [X-03] EXPENSE WITH INPUT TAX
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Utility bill Rs.10,000 + Rs.1,700 input tax (17% GST on utilities).
     *   DR 6000 OpEx           10,000.00
     *   DR 2300 Input Tax       1,700.00
     *   CR 1000 Cash           11,700.00
     */
    public function test_X03_expense_with_input_tax_creates_gl_2300_line(): void
    {
        $response = $this->v3Post('expenses', [
            'description'    => 'Electricity Bill with GST',
            'expense_date'   => '2025-06-15',
            'amount'         => 10000.00,
            'payment_method' => 'cash',
            'input_tax'      => 1700.00,
        ]);

        $response->assertSuccessful();

        $lines = $this->getJournalLines('operating_expense');
        $this->assertJournalBalanced($lines, ' [X-03]');

        $this->assertJournalLine($lines, '6000', 'debit',  10000.00, '[X-03] Expense amount debit');
        $this->assertJournalLine($lines, '2300', 'debit',   1700.00, '[X-03] Input tax debit (recoverable)');
        $this->assertJournalLine($lines, '1000', 'credit', 11700.00, '[X-03] Cash credit (expense + tax)');

        $this->assertLedgerInvariantsHold('[X-03]');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [X-04] CUSTOMER PAYMENT RECEIVED — full invoice settlement
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Customer who owes Rs.10,000 pays in full.
     *   DR 1000 Cash     10,000.00
     *   CR 1200 AR       10,000.00
     * After payment: AR balance for this customer = 0.
     */
    public function test_X04_customer_payment_received_reduces_ar(): void
    {
        // 1. Create an AR balance via a credit sale
        [$productId] = $this->createProductWithStock(
            qty: 10, unitCost: 1000.00, sellPrice: 1500.00, taxRate: 0
        );
        $customerId = $this->createCustomer();

        $saleService = app(\App\Services\V3\SaleService::class);
        $sale = $saleService->post([
            'customer_id'    => $customerId,
            'warehouse_id'   => $this->warehouseId,
            'sale_date'      => '2025-06-14',
            'payment_method' => 'credit',
            'items' => [[
                'product_id'       => $productId,
                'qty'              => 5,
                'sale_uom'         => 'pcs',
                'unit_price'       => 1500.00,
                'discount_percent' => 0,
                'tax_rate'         => 0,
            ]],
        ]);

        $invoiceTotal = 5 * 1500.00; // 7,500
        $arBefore    = $this->glBalance('1200'); // should be Rs.7,500
        $this->assertEqualsWithDelta($invoiceTotal, $arBefore, $this->TOLERANCE,
            '[X-04] Precondition: AR should equal invoice total after credit sale');

        $cashBefore = $this->glBalance('1000');

        // 2. Post the customer payment
        $response = $this->v3Post('customer-payments', [
            'customer_id'    => $customerId,
            'payment_date'   => '2025-06-15',
            'amount'         => $invoiceTotal,
            'payment_method' => 'cash',
            'reference_note' => 'Payment for invoice ' . $sale->id,
            'allocations' => [[
                'sale_id' => $sale->id,
                'amount'  => $invoiceTotal,
            ]],
        ]);

        $response->assertSuccessful();

        $paymentLines = $this->getJournalLines('customer_payment');
        $this->assertJournalBalanced($paymentLines, ' [X-04]');

        $this->assertJournalLine($paymentLines, '1000', 'debit',  $invoiceTotal, '[X-04] Cash DR (payment received)');
        $this->assertJournalLine($paymentLines, '1200', 'credit', $invoiceTotal, '[X-04] AR CR (settled)');

        // AR must now be zero
        $this->assertEqualsWithDelta(0.0, $this->glBalance('1200'), $this->TOLERANCE,
            '[X-04] AR balance must be zero after full settlement');

        // Cash must have increased
        $this->assertEqualsWithDelta($cashBefore + $invoiceTotal, $this->glBalance('1000'), $this->TOLERANCE,
            '[X-04] Cash balance must increase by invoice total');

        $this->assertLedgerInvariantsHold('[X-04]');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [X-05] SUPPLIER PAYMENT MADE — reduces AP
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Supplier owed Rs.11,700 (goods + GST). Pay Rs.11,700 in cash.
     *   DR 2000 AP      11,700.00
     *   CR 1000 Cash    11,700.00
     * After payment: AP balance = 0.
     */
    public function test_X05_supplier_payment_made_reduces_ap(): void
    {
        // Create AP balance via credit purchase
        $vendorId  = $this->createVendor('Main Supplier');
        $productId = Str::uuid()->toString();
        DB::table('products')->insert(['base_unit' => 'pcs', 
            'id' => $productId, 'tenant_id' => $this->tenant->id,
            'name' => 'AP Test Product', 'sku' => 'APT-' . substr($productId, 0, 8),
            'price' => 2000.00, 'cost_price' => 1000.00, 'tax_rate' => 17,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $purchaseSvc = app(\App\Services\V3\PurchaseService::class);
        $purchase    = $purchaseSvc->store([
            'vendor_id'      => $vendorId,
            'warehouse_id'   => $this->warehouseId,
            'purchase_date'  => '2025-06-10',
            'payment_method' => 'credit',
            'items' => [[
                'product_id' => $productId,
                'qty'        => 10,
                'unit_cost'  => 1000.00,
                'tax_rate'   => 17,
            ]],
        ]);

        $totalOwed = round(10 * 1000 * 1.17, 2); // 11,700
        $apBefore  = $this->glBalance('2000');
        $this->assertEqualsWithDelta($totalOwed, $apBefore, $this->TOLERANCE,
            '[X-05] Precondition: AP should equal purchase total');

        $cashBefore = $this->glBalance('1000');

        // Post the supplier payment
        $response = $this->v3Post('supplier-payments', [
            'supplier_id'    => $vendorId,
            'payment_date'   => '2025-06-15',
            'amount'         => $totalOwed,
            'payment_method' => 'cash',
            'reference_note' => 'Pay purchase ' . $purchase->id,
            'allocations' => [[
                'purchase_id' => $purchase->id,
                'amount'      => $totalOwed,
            ]],
        ]);

        $response->assertSuccessful();

        $paymentLines = $this->getJournalLines('supplier_payment');
        $this->assertJournalBalanced($paymentLines, ' [X-05]');

        $this->assertJournalLine($paymentLines, '2000', 'debit',  $totalOwed, '[X-05] AP DR (cleared)');
        $this->assertJournalLine($paymentLines, '1000', 'credit', $totalOwed, '[X-05] Cash CR (paid out)');

        $this->assertEqualsWithDelta(0.0, $this->glBalance('2000'), $this->TOLERANCE,
            '[X-05] AP balance must be zero after full supplier payment');
        $this->assertEqualsWithDelta($cashBefore - $totalOwed, $this->glBalance('1000'), $this->TOLERANCE,
            '[X-05] Cash must decrease by payment amount');

        $this->assertLedgerInvariantsHold('[X-05]');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [X-06] PARTIAL CUSTOMER PAYMENT — AR partially reduced
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Invoice = Rs.7,500. Customer pays Rs.5,000 now.
     * AR should drop to Rs.2,500, NOT to zero.
     */
    public function test_X06_partial_payment_reduces_ar_by_exact_amount(): void
    {
        [$productId] = $this->createProductWithStock(
            qty: 10, unitCost: 1000.00, sellPrice: 1500.00, taxRate: 0
        );
        $customerId = $this->createCustomer('Partial Payer');

        $saleService = app(\App\Services\V3\SaleService::class);
        $sale = $saleService->post([
            'customer_id'    => $customerId,
            'warehouse_id'   => $this->warehouseId,
            'sale_date'      => '2025-06-14',
            'payment_method' => 'credit',
            'items' => [[
                'product_id' => $productId, 'qty' => 5, 'sale_uom' => 'pcs',
                'unit_price' => 1500.00, 'discount_percent' => 0, 'tax_rate' => 0,
            ]],
        ]);

        $invoiceTotal   = 5 * 1500.00;      // 7,500
        $partialPayment = 5000.00;
        $expectedAr     = $invoiceTotal - $partialPayment; // 2,500

        $response = $this->v3Post('customer-payments', [
            'customer_id'    => $customerId,
            'payment_date'   => '2025-06-15',
            'amount'         => $partialPayment,
            'payment_method' => 'cash',
            'allocations' => [[
                'sale_id' => $sale->id,
                'amount'  => $partialPayment,
            ]],
        ]);

        $response->assertSuccessful();

        $this->assertEqualsWithDelta($expectedAr, $this->glBalance('1200'), $this->TOLERANCE,
            "[X-06] AR must be Rs.{$expectedAr} after partial payment of Rs.{$partialPayment}");

        $this->assertLedgerInvariantsHold('[X-06]');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [X-08] MANUAL JOURNAL ENTRY — direct AccountingService post
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * A directly posted journal entry (e.g., accountant correction):
     *   DR 5200 Rent Expense     20,000.00
     *   CR 1000 Cash             20,000.00
     * Must be balanced and must show in trial balance.
     */
    public function test_X08_manual_journal_entry_posts_and_balances(): void
    {
        $cashBefore = $this->glBalance('1000');

        $this->accounting->createEntry([
            'date'           => '2025-06-15',
            'reference_type' => 'manual_entry',
            'reference'      => Str::uuid()->toString(),
            'description'    => 'Manual: Prepaid Rent Q3',
        ], [
            ['account_code' => '5200', 'debit' => 20000.00, 'credit' => 0.00],
            ['account_code' => '1000', 'debit' => 0.00,     'credit' => 20000.00],
        ]);

        $lines = $this->getJournalLines('manual_entry');
        $this->assertNotEmpty($lines->toArray(), '[X-08] Manual journal entry not created');
        $this->assertJournalBalanced($lines, ' [X-08]');

        $this->assertJournalLine($lines, '5200', 'debit',  20000.00, '[X-08] Rent expense DR');
        $this->assertJournalLine($lines, '1000', 'credit', 20000.00, '[X-08] Cash CR');

        $this->assertEqualsWithDelta($cashBefore - 20000.00, $this->glBalance('1000'), $this->TOLERANCE,
            '[X-08] Cash must drop by manual entry amount');

        $this->assertLedgerInvariantsHold('[X-08]');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [X-09] OPENING BALANCE — equity + asset account correctly booked
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Opening balance: Rs.500,000 cash, Rs.200,000 bank, Rs.50,000 AR.
     * All credited against GL 7000 Opening Balance Equity.
     * Balance sheet equation must hold immediately after opening.
     */
    public function test_X09_opening_balance_creates_balanced_equity_entry(): void
    {
        $cashOpening = 500000.00;
        $bankOpening = 200000.00;
        $arOpening   = 50000.00;
        $total       = $cashOpening + $bankOpening + $arOpening;

        $this->accounting->createEntry([
            'date'           => '2025-01-01',
            'reference_type' => 'opening_balance',
            'reference'      => 'ob-' . Str::uuid()->toString(),
            'description'    => 'Opening Balances',
        ], [
            ['account_code' => '1000', 'debit' => $cashOpening, 'credit' => 0],
            ['account_code' => '1010', 'debit' => $bankOpening, 'credit' => 0],
            ['account_code' => '1200', 'debit' => $arOpening,   'credit' => 0],
            ['account_code' => '7000', 'debit' => 0, 'credit' => $total],
        ]);

        $lines = $this->getJournalLines('opening_balance');
        // Filter to just this entry (exclude stock opening balances from setUp)
        $obLines = $lines->where('credit', $total)->first()
            ? $lines->filter(fn($l) => $l->entry_id === $lines->where(fn($l) => $l->code === '7000' && abs((float)$l->credit - $total) < 0.01)->first()?->entry_id)
            : $lines;

        $this->assertJournalBalanced($lines, ' [X-09]');

        // GL 7000 (Opening Balance Equity) should have total as credit
        $equityCredit = $lines->filter(fn($l) => $l->code === '7000')->sum(fn($l) => (float)$l->credit);
        $this->assertGreaterThanOrEqual($total - $this->TOLERANCE, $equityCredit,
            '[X-09] GL 7000 Opening Balance Equity must be credited with at least opening balance total');

        $this->assertLedgerInvariantsHold('[X-09]');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [X-10] UNBALANCED JOURNAL ENTRY REJECTED
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Attempting to post a journal entry with Σ DR ≠ Σ CR must throw an exception.
     * AccountingService must enforce the double-entry invariant.
     */
    public function test_X10_unbalanced_journal_entry_is_rejected_by_accounting_service(): void
    {
        $this->expectException(\Exception::class);

        $this->accounting->createEntry([
            'date'           => '2025-06-15',
            'reference_type' => 'manual_entry',
            'reference'      => Str::uuid()->toString(),
            'description'    => 'INTENTIONALLY UNBALANCED',
        ], [
            ['account_code' => '5200', 'debit' => 10000.00, 'credit' => 0],
            ['account_code' => '1000', 'debit' => 0,        'credit' => 9999.00], // Rs.1 short
        ]);
    }
}
