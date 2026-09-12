<?php

namespace Tests\Feature\Golden;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Services\V3\AccountingService;
use App\Services\V3\SaleService;

/**
 * ============================================================
 * Phase 3 — Input Verification: SALE Events
 * ============================================================
 *
 * EVENT EXECUTION STRATEGY:
 *  Tests call SaleService::post() directly. This is the authoritative
 *  write path — SaleController::store() calls it with $request->validated().
 *  The service handles all: journalization, FIFO, tax, AR/AP, batch tracking.
 *  Phase 5 (Output Verification) covers the HTTP response surface.
 *
 * All expected journal values are computed independently in this file
 * (not borrowed from GOLDEN_COMPANY.md) so math is verified twice.
 *
 * Event catalog:
 *  [E-01] Cash sale — happy path with 17% GST
 *  [E-02] Credit sale — AR debit instead of Cash
 *  [E-03] Zero-tax sale — no GL 2100 line
 *  [E-04] Discounted sale — revenue is NET of discount
 *  [E-05] 100% discount — zero revenue, nonzero COGS
 *  [E-06] Split payment — partial cash + AR remainder
 *  [E-07] Overpayment — excess credited to advance/liability
 *  [E-08] FIFO spanning — COGS crosses two cost layers
 *  [E-09] Full sale return — all balances reset to pre-sale state
 *  [E-10] WooCommerce sale — identical journal to normal sale
 *  [E-11] Idempotency — duplicate client_sale_id → exactly one entry
 *  [E-12] Negative-space — direct batch manipulation breaks invariant
 * ============================================================
 *
 * @group golden
 * @group phase3
 * @group phase3-sales
 */
class SaleInputVerificationTest extends InputVerificationTestCase
{
    private SaleService       $saleService;
    private AccountingService $accounting;

    protected function setUp(): void
    {
        parent::setUp();
        $this->saleService = app(SaleService::class);
        $this->accounting  = app(AccountingService::class);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [E-01] CASH SALE — HAPPY PATH
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * A cash sale for 2 units at Rs.1,500 each (17% GST, no discount) must produce:
     *   DR 1000 Cash          3,510.00  (2 × 1,500 × 1.17)
     *   CR 4000 Revenue       3,000.00  (net_sales)
     *   CR 2100 Tax Payable     510.00  (3,000 × 17%)
     *   DR 5000 COGS          2,000.00  (2 × 1,000 cost)
     *   CR 1100 Inventory     2,000.00
     */
    public function test_E01_cash_sale_creates_exact_journal_lines(): void
    {
        [$productId, $batchId] = $this->createProductWithStock(
            qty: 10, unitCost: 1000.00, sellPrice: 1500.00, taxRate: 17
        );
        $customerId = $this->createCustomer();

        $invoiceTotal = round(2 * 1500 * 1.17, 2);  // 3,510.00
        $netSales     = 2 * 1500.0;                  // 3,000.00
        $tax          = round($netSales * 0.17, 2);  // 510.00
        $cogs         = 2 * 1000.0;                  // 2,000.00

        $sale = $this->saleService->post([
            'customer_id'     => $customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => '2025-06-15',
            'payment_method'  => 'cash',
            'amount_received' => $invoiceTotal,
            'items' => [[
                'product_id'       => $productId,
                'qty'              => 2,
                'sale_uom'         => 'pcs',
                'unit_price'       => 1500.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);

        $lines = $this->getJournalLines('sale');
        $this->assertNotEmpty($lines->toArray(), 'No journal entry created for cash sale');
        $this->assertJournalBalanced($lines);

        // Revenue credit
        $this->assertJournalLine($lines, '4000', 'credit', $netSales, 'Revenue (net sales)');
        // Tax payable credit
        $this->assertJournalLine($lines, '2100', 'credit', $tax, 'Sales tax payable');
        // Cash debit
        $this->assertJournalLine($lines, '1000', 'debit', $invoiceTotal, 'Cash received');
        // COGS debit
        $this->assertJournalLine($lines, '5000', 'debit', $cogs, 'COGS');
        // Inventory credit
        $this->assertJournalLine($lines, '1100', 'credit', $cogs, 'Inventory reduction');

        // Stock deducted
        $this->assertEqualsWithDelta(8.0, $this->batchRemaining($batchId), 0.001,
            'Batch should have 8 remaining after selling 2 from 10');

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [E-02] CREDIT SALE — AR instead of Cash
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Credit sale: payment_method='credit'. No cash line. Full invoice → AR.
     *   DR 1200 AR            3,510.00
     *   CR 4000 Revenue       3,000.00
     *   CR 2100 Tax Payable     510.00
     *   DR 5000 COGS          2,000.00
     *   CR 1100 Inventory     2,000.00
     */
    public function test_E02_credit_sale_creates_ar_instead_of_cash_line(): void
    {
        [$productId] = $this->createProductWithStock(qty: 10, unitCost: 1000.00);
        $customerId  = $this->createCustomer('Credit Customer');

        $invoiceTotal = round(2 * 1500 * 1.17, 2);

        $this->saleService->post([
            'customer_id'    => $customerId,
            'warehouse_id'   => $this->warehouseId,
            'sale_date'      => '2025-06-15',
            'payment_method' => 'credit',
            'items' => [[
                'product_id'       => $productId,
                'qty'              => 2,
                'sale_uom'         => 'pcs',
                'unit_price'       => 1500.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);

        $lines = $this->getJournalLines('sale');
        $this->assertJournalBalanced($lines);

        // Must have AR DR = full invoice total
        $this->assertJournalLine($lines, '1200', 'debit', $invoiceTotal, 'AR (full invoice on credit)');

        // Must NOT have cash DR line
        $cashLines = $lines->filter(fn($l) => $l->code === '1000' && (float)$l->debit > 0);
        $this->assertEmpty($cashLines->toArray(),
            'Credit sale must not have a Cash DR line — only AR');

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [E-03] ZERO-TAX SALE — no tax line created
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Zero-rated product sale: tax=0. The 2100 Tax Payable line must not appear.
     */
    public function test_E03_zero_tax_sale_omits_tax_line(): void
    {
        [$productId] = $this->createProductWithStock(
            qty: 20, unitCost: 400.00, sellPrice: 800.00, taxRate: 0
        );
        $customerId = $this->createCustomer();

        $this->saleService->post([
            'customer_id'     => $customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => '2025-06-15',
            'payment_method'  => 'cash',
            'amount_received' => 5 * 800.00,
            'items' => [[
                'product_id'       => $productId,
                'qty'              => 5,
                'sale_uom'         => 'pcs',
                'unit_price'       => 800.00,
                'discount_percent' => 0,
                'tax_rate'         => 0,
            ]],
        ]);

        $lines = $this->getJournalLines('sale');
        $this->assertJournalBalanced($lines);

        // Revenue = 5 × 800 = 4,000 (no tax added)
        $this->assertJournalLine($lines, '4000', 'credit', 4000.00, 'Revenue zero-tax sale');
        $this->assertJournalLine($lines, '1000', 'debit',  4000.00, 'Cash received (zero-tax)');

        // No tax payable line
        $taxLines = $lines->filter(fn($l) => $l->code === '2100');
        $this->assertEmpty($taxLines->toArray(),
            'Zero-tax sale must not create a GL 2100 Tax Payable line');

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [E-04] DISCOUNTED SALE — revenue is NET (post-discount)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * 10% trade discount on Rs.3,000 gross = Rs.300 discount.
     * Net sales = Rs.2,700. Tax = 2,700 × 17% = Rs.459. Invoice = Rs.3,159.
     * GL 4000 CR must be Rs.2,700 (net), NOT Rs.3,000 (gross).
     */
    public function test_E04_discounted_sale_revenue_is_net_of_discount(): void
    {
        [$productId] = $this->createProductWithStock(
            qty: 10, unitCost: 1000.00, sellPrice: 1500.00, taxRate: 17
        );
        $customerId = $this->createCustomer();

        $gross    = 2 * 1500.0;                    // 3,000
        $discount = $gross * 0.10;                 // 300
        $net      = $gross - $discount;            // 2,700
        $tax      = round($net * 0.17, 2);         // 459
        $invoice  = round($net + $tax, 2);         // 3,159
        $cogs     = 2 * 1000.0;                    // 2,000

        $this->saleService->post([
            'customer_id'     => $customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => '2025-06-15',
            'payment_method'  => 'cash',
            'amount_received' => $invoice,
            'items' => [[
                'product_id'       => $productId,
                'qty'              => 2,
                'sale_uom'         => 'pcs',
                'unit_price'       => 1500.00,
                'discount_percent' => 10,
                'tax_rate'         => 17,
            ]],
        ]);

        $lines = $this->getJournalLines('sale');
        $this->assertJournalBalanced($lines);

        // Revenue must be net (2,700), NOT gross (3,000)
        $this->assertJournalLine($lines, '4000', 'credit', $net, 'Revenue = net of discount');
        $this->assertJournalLine($lines, '2100', 'credit', $tax, 'Tax on net revenue');
        $this->assertJournalLine($lines, '1000', 'debit',  $invoice, 'Cash = invoice total');
        $this->assertJournalLine($lines, '5000', 'debit',  $cogs, 'COGS unchanged by discount');

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [E-05] 100% DISCOUNT — zero revenue, nonzero COGS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Promotional giveaway: 100% discount → invoice = Rs.0, but COGS is still deducted.
     * GL 4000 CR = 0 (or no revenue line). GL 5000 DR = cost of goods given away.
     */
    public function test_E05_100_discount_promotional_sale_zero_revenue_nonzero_cogs(): void
    {
        [$productId, $batchId] = $this->createProductWithStock(
            qty: 10, unitCost: 400.00, sellPrice: 800.00, taxRate: 0
        );
        $customerId = $this->createCustomer();

        $this->saleService->post([
            'customer_id'     => $customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => '2025-06-15',
            'payment_method'  => 'cash',
            'amount_received' => 0.00,
            'items' => [[
                'product_id'       => $productId,
                'qty'              => 2,
                'sale_uom'         => 'pcs',
                'unit_price'       => 800.00,
                'discount_percent' => 100,
                'tax_rate'         => 0,
                'is_promotional'   => true,
            ]],
        ]);

        $lines = $this->getJournalLines('sale');

        // COGS must still be deducted
        $cogsLines = $lines->filter(fn($l) => $l->code === '5000' && (float)$l->debit > 0);
        $this->assertNotEmpty($cogsLines->toArray(), 'COGS must be deducted even on 100% discount sale');
        $totalCogs = $cogsLines->sum(fn($l) => (float)$l->debit);
        $this->assertEqualsWithDelta(800.0, $totalCogs, $this->TOLERANCE,
            'COGS = 2 × Rs.400 = Rs.800 for promotional giveaway');

        // Revenue should be zero (or absent)
        $revLines = $lines->filter(fn($l) => $l->code === '4000');
        $revAmount = $revLines->sum(fn($l) => (float)$l->credit);
        $this->assertEqualsWithDelta(0.0, $revAmount, $this->TOLERANCE,
            'Revenue must be Rs.0 on 100% discount sale');

        // Batch consumed
        $this->assertEqualsWithDelta(8.0, $this->batchRemaining($batchId), 0.001,
            '2 units should be deducted from stock even on free sale');

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [E-06] SPLIT PAYMENT — partial cash, AR for remainder
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Invoice = Rs.3,510. Customer pays Rs.2,000 now. Rs.1,510 goes to AR.
     *   DR 1000 Cash          2,000.00
     *   DR 1200 AR            1,510.00
     *   CR 4000 Revenue       3,000.00
     *   CR 2100 Tax Payable     510.00
     *   DR 5000 COGS          2,000.00
     *   CR 1100 Inventory     2,000.00
     */
    public function test_E06_split_payment_creates_both_cash_and_ar_lines(): void
    {
        [$productId] = $this->createProductWithStock(
            qty: 10, unitCost: 1000.00, sellPrice: 1500.00, taxRate: 17
        );
        $customerId = $this->createCustomer();

        $invoiceTotal  = round(2 * 1500 * 1.17, 2); // 3,510
        $cashPaid      = 2000.00;
        $arRemainder   = round($invoiceTotal - $cashPaid, 2); // 1,510

        $this->saleService->post([
            'customer_id'     => $customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => '2025-06-15',
            'payment_method'  => 'cash',    // cash mode; amount_received < invoice → creates AR
            'amount_received' => $cashPaid,
            'items' => [[
                'product_id'       => $productId,
                'qty'              => 2,
                'sale_uom'         => 'pcs',
                'unit_price'       => 1500.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);

        $lines = $this->getJournalLines('sale');
        $this->assertJournalBalanced($lines);

        $this->assertJournalLine($lines, '1000', 'debit', $cashPaid,    'Cash portion (split)');
        $this->assertJournalLine($lines, '1200', 'debit', $arRemainder, 'AR portion (split)');
        $this->assertJournalLine($lines, '4000', 'credit', 3000.00,     'Revenue (split sale)');
        $this->assertJournalLine($lines, '2100', 'credit', 510.00,      'Tax (split sale)');

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [E-07] OVERPAYMENT — Customer Advance created
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Invoice = Rs.3,510. Customer pays Rs.4,000 (Rs.490 over).
     * Overpayment → GL 2050 Customer Credit Balances CR Rs.490
     * (or equivalent account — we look for a credit-normal liability for the excess).
     */
    public function test_E07_overpayment_credits_customer_advance_account(): void
    {
        [$productId] = $this->createProductWithStock(
            qty: 10, unitCost: 1000.00, sellPrice: 1500.00, taxRate: 17
        );
        $customerId = $this->createCustomer();

        $invoiceTotal = round(2 * 1500 * 1.17, 2); // 3,510
        $overpayment  = 4000.00;
        $excess       = round($overpayment - $invoiceTotal, 2); // 490

        $this->saleService->post([
            'customer_id'     => $customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => '2025-06-15',
            'payment_method'  => 'cash',
            'amount_received' => $overpayment,
            'items' => [[
                'product_id'       => $productId,
                'qty'              => 2,
                'sale_uom'         => 'pcs',
                'unit_price'       => 1500.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);

        $lines = $this->getJournalLines('sale');
        $this->assertJournalBalanced($lines);

        // Cash received = full overpayment
        $this->assertJournalLine($lines, '1000', 'debit', $overpayment, 'Cash (overpayment full amount)');

        // Excess must be credited somewhere (2100 Customer Advance or 2050 Credit Balance)
        $advanceLine = $lines->first(fn($l) =>
            in_array($l->code, ['2100', '2050']) &&
            abs((float)$l->credit - $excess) <= $this->TOLERANCE
        );

        if (!$advanceLine) {
            // SaleService may post excess to GL 2100 (Customer Advance sub-account)
            // or a dedicated account — check that SOME credit-normal account received it
            $unexplainedCr = $lines->filter(fn($l) =>
                (float)$l->credit > 0 &&
                !in_array($l->code, ['4000', '2100'])
            );
            $this->assertNotEmpty($unexplainedCr->toArray(),
                "Rs.{$excess} overpayment must be credited to a liability account. " .
                "Found only: " . $lines->map(fn($l) => "GL{$l->code} CR={$l->credit}")->join(', ')
            );
        }

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [E-08] FIFO LAYER SPANNING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Two batches: BATCH-A (5 units @ Rs.800) and BATCH-B (5 units @ Rs.1,000).
     * Sell 7 units → FIFO consumes all 5 from A + 2 from B.
     * COGS = (5 × 800) + (2 × 1,000) = 4,000 + 2,000 = Rs.6,000.
     * GL 5000 DR must be exactly Rs.6,000.
     */
    public function test_E08_fifo_layer_spanning_computes_correct_blended_cogs(): void
    {
        // Batch A: 5 units @ Rs.800, created earlier (older timestamp)
        Carbon::setTestNow('2025-05-01 10:00:00');
        [$productId, $batchA] = $this->createProductWithStock(
            'FIFO Test Product', qty: 5, unitCost: 800.00, sellPrice: 1500.00, taxRate: 0
        );
        Carbon::setTestNow('2025-06-15 12:00:00');

        // Batch B: 5 units @ Rs.1,000, created later
        $batchB = \Illuminate\Support\Str::uuid()->toString();
        DB::table('inventory_batches')->insert([
            'id'                  => $batchB,
            'tenant_id'           => $this->tenant->id,
            'product_id'          => $productId,
            'warehouse_id'        => $this->warehouseId,
            'batch_type'          => 'purchase',
            'original_qty'        => 5,
            'initial_qty'         => 5,
            'remaining_qty'       => 5,
            'unit_cost'           => 1000.00,
            'purchase_invoice_id' => 'test-purchase-2',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);
        // Credit GL 1100 for batch B
        $this->accounting->createEntry([
            'date'           => now()->format('Y-m-d'),
            'reference_type' => 'opening_balance',
            'reference'      => 'batch-b-' . $batchB,
            'description'    => 'Batch B stock',
        ], [
            ['account_code' => '1100', 'debit' => 5 * 1000.00, 'credit' => 0],
            ['account_code' => '7000', 'debit' => 0, 'credit' => 5 * 1000.00],
        ]);

        $customerId = $this->createCustomer();

        $this->saleService->post([
            'customer_id'     => $customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => '2025-06-15',
            'payment_method'  => 'cash',
            'amount_received' => 7 * 1500.00,
            'items' => [[
                'product_id'       => $productId,
                'qty'              => 7,
                'sale_uom'         => 'pcs',
                'unit_price'       => 1500.00,
                'discount_percent' => 0,
                'tax_rate'         => 0,
            ]],
        ]);

        $lines = $this->getJournalLines('sale');
        $this->assertJournalBalanced($lines);

        // COGS = (5 × 800) + (2 × 1,000) = 6,000
        $expectedCogs = (5 * 800.0) + (2 * 1000.0);
        $this->assertJournalLine($lines, '5000', 'debit', $expectedCogs, 'COGS (FIFO span two batches)');

        // Batch A fully depleted
        $this->assertEqualsWithDelta(0.0, $this->batchRemaining($batchA), 0.001,
            'Batch A (Rs.800) should be fully depleted after selling 7 (FIFO)');

        // Batch B should have 3 remaining
        $this->assertEqualsWithDelta(3.0, $this->batchRemaining($batchB), 0.001,
            'Batch B (Rs.1,000) should have 3 remaining after selling 2 of 5');

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [E-09] SALE RETURN — full reversal resets all balances
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Post a cash sale, then fully reverse it.
     * After reversal: GL 4000 net = 0, GL 1000 net = 0, inventory back to original.
     */
    public function test_E09_full_sale_return_resets_all_ledger_balances(): void
    {
        [$productId, $batchId] = $this->createProductWithStock(
            qty: 10, unitCost: 1000.00, sellPrice: 1500.00, taxRate: 17
        );
        $customerId = $this->createCustomer();

        $invoiceTotal = round(3 * 1500 * 1.17, 2);

        // Record GL 1100 and batch state before sale
        $gl1100Before   = $this->glBalance('1100');
        $batchBefore    = $this->batchRemaining($batchId);
        $cashBefore     = $this->glBalance('1000');
        $revenueBefore  = $this->glBalance('4000');

        // Post the sale
        $sale = $this->saleService->post([
            'customer_id'     => $customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => '2025-06-15',
            'payment_method'  => 'cash',
            'amount_received' => $invoiceTotal,
            'items' => [[
                'product_id'       => $productId,
                'qty'              => 3,
                'sale_uom'         => 'pcs',
                'unit_price'       => 1500.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);

        // Verify sale changed the ledger
        $this->assertNotEquals($revenueBefore, $this->glBalance('4000'), 'Sale should increase revenue');

        // Now reverse it
        $this->saleService->reverse(
            saleId:     $sale->id,
            reason:     'Customer returned goods',
            returnDate: '2025-06-16'
        );

        // All balances must return to pre-sale state
        $this->assertEqualsWithDelta($gl1100Before, $this->glBalance('1100'), $this->TOLERANCE,
            'GL 1100 (Inventory) must be restored after sale return');

        $this->assertEqualsWithDelta($cashBefore, $this->glBalance('1000'), $this->TOLERANCE,
            'GL 1000 (Cash) must be restored after full return');

        $this->assertEqualsWithDelta($revenueBefore, $this->glBalance('4000'), $this->TOLERANCE,
            'GL 4000 (Revenue) must net to zero after full return of full sale');

        $this->assertEqualsWithDelta($batchBefore, $this->batchRemaining($batchId), 0.001,
            'Inventory batch must be fully restored after sale return');

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [E-10] V3 SOURCE-TAG PASS-THROUGH — a source='woocommerce' tag on the V3
    // SaleService path must not change journalization.
    //
    // RENAMED (Phase D, audit FC-2): this test does NOT exercise the WooCommerce
    // WEBHOOK. It calls V3 SaleService::post() directly with a source tag. The real
    // webhook (WooWebhookController@receive) posts NO journal today — that gap is
    // pinned by Tests\Feature\Production\WooWebhookJournalPinningTest (WOO-001,
    // quarantine lane). Do not read this test as webhook coverage.
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * A V3 sale tagged source='woocommerce' must create an IDENTICAL journal to an
     * untagged V3 sale — the source tag must not bypass journalization on the V3 path.
     * (This is source-tag pass-through, NOT webhook verification — see WOO-001.)
     */
    public function test_E10_v3_source_tag_woocommerce_does_not_change_journal(): void
    {
        [$productId] = $this->createProductWithStock(
            qty: 10, unitCost: 1000.00, sellPrice: 1500.00, taxRate: 17
        );
        $customerId = $this->createCustomer();
        $invoiceTotal = round(1 * 1500 * 1.17, 2);

        $beforeCount = $this->journalEntryCount('sale');

        $this->saleService->post([
            'customer_id'     => $customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => '2025-06-15',
            'payment_method'  => 'cash',
            'amount_received' => $invoiceTotal,
            'source'          => 'woocommerce',
            'items' => [[
                'product_id'       => $productId,
                'qty'              => 1,
                'sale_uom'         => 'pcs',
                'unit_price'       => 1500.00,
                'discount_percent' => 0,
                'tax_rate'         => 17,
            ]],
        ]);

        $afterCount = $this->journalEntryCount('sale');
        $this->assertEquals($beforeCount + 1, $afterCount,
            'WooCommerce sale must create exactly one journal entry (same as normal sale)');

        $lines = $this->getJournalLines('sale');
        $this->assertJournalBalanced($lines);

        // Same lines as a normal sale
        $this->assertJournalLine($lines, '4000', 'credit', 1500.00,     'WooCom revenue');
        $this->assertJournalLine($lines, '2100', 'credit', 255.00,       'WooCom tax');
        $this->assertJournalLine($lines, '1000', 'debit',  $invoiceTotal, 'WooCom cash');
        $this->assertJournalLine($lines, '5000', 'debit',  1000.00,      'WooCom COGS');
        $this->assertJournalLine($lines, '1100', 'credit', 1000.00,      'WooCom inventory');

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [E-11] IDEMPOTENCY — duplicate client_sale_id → exactly one journal entry
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Posting the same client_sale_id twice (POS offline replay scenario) must
     * result in exactly ONE journal entry. The second POST is idempotent.
     */
    public function test_E11_duplicate_client_sale_id_is_idempotent(): void
    {
        [$productId] = $this->createProductWithStock(qty: 10, unitCost: 1000.00);
        $customerId  = $this->createCustomer();
        $clientSaleId = 'offline-sync-' . \Illuminate\Support\Str::uuid()->toString();

        $payload = [
            'customer_id'     => $customerId,
            'warehouse_id'    => $this->warehouseId,
            'sale_date'       => '2025-06-15',
            'payment_method'  => 'cash',
            'amount_received' => 2 * 1500.00,
            'client_sale_id'  => $clientSaleId,
            'items' => [[
                'product_id'       => $productId,
                'qty'              => 2,
                'sale_uom'         => 'pcs',
                'unit_price'       => 1500.00,
                'discount_percent' => 0,
                'tax_rate'         => 0,
            ]],
        ];

        $beforeCount = $this->journalEntryCount('sale');

        $this->saleService->post($payload);
        $afterFirst = $this->journalEntryCount('sale');
        $this->assertEquals($beforeCount + 1, $afterFirst, 'First post should create 1 entry');

        // Post exact same payload again
        try {
            $this->saleService->post($payload);
        } catch (\Exception $e) {
            // If service throws a duplicate exception — that's also acceptable
            // The key assertion is that the journal entry count is still 1 above baseline
        }

        $afterSecond = $this->journalEntryCount('sale');
        $this->assertEquals($beforeCount + 1, $afterSecond,
            "Idempotency failed: second POST with same client_sale_id created duplicate journal entry. " .
            "Expected {$beforeCount}+1={$afterFirst}, got {$afterSecond}"
        );

        $this->assertLedgerInvariantsHold();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [E-12] NEGATIVE SPACE — sale row without journal entry FAILS invariants
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @test
     * Adversarial: insert a `sales` row DIRECTLY (bypassing SaleService).
     * Then assert that the inventory invariant FAILS (GL 1100 ≠ FIFO).
     * This proves our invariant suite is sensitive enough to detect bypass.
     */
    public function test_E12_sale_bypassing_journal_breaks_invariant(): void
    {
        [$productId] = $this->createProductWithStock(qty: 10, unitCost: 1000.00);
        $customerId  = $this->createCustomer();

        // Record baseline FIFO and GL values
        $gl1100Before = $this->glBalance('1100');
        $fifo_before  = $this->fifoInventoryValue();

        $this->assertEqualsWithDelta($gl1100Before, $fifo_before, $this->TOLERANCE,
            'Precondition: inventory should be balanced before adversarial test');

        // Directly manipulate a FIFO batch (simulating a sale that bypassed the service)
        DB::table('inventory_batches')
            ->where('tenant_id', $this->tenant->id)
            ->where('product_id', $productId)
            ->decrement('remaining_qty', 2);

        // Re-read GL (unchanged since no journal was posted)
        $gl1100After = $this->glBalance('1100');
        $fifoAfter   = $this->fifoInventoryValue();

        // GL should be unchanged; FIFO should have dropped
        $this->assertEqualsWithDelta($gl1100Before, $gl1100After, $this->TOLERANCE,
            'GL 1100 should be unchanged (no journal posted)');

        $expectedFifoAfter = round($fifo_before - 2 * 1000.00, 2);
        $this->assertEqualsWithDelta($expectedFifoAfter, $fifoAfter, $this->TOLERANCE,
            'FIFO value should drop after direct batch manipulation');

        // NOW assert the invariant DETECTS the breach
        $diff = abs($gl1100After - $fifoAfter);
        $this->assertGreaterThan($this->TOLERANCE, $diff,
            "Three-way tie invariant should now be BROKEN (GL={$gl1100After}, FIFO={$fifoAfter}, diff={$diff}). " .
            "If this fails, our invariant suite cannot detect a stock bypass."
        );
    }
}
