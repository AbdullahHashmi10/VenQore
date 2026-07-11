<?php

namespace Tests\Feature\Money;

use App\Models\Party;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * B6 — Split-Payment Reconciliation Property Test
 *
 * Guards the invariants of the split-payment path across many randomised
 * cash + bank + credit combinations:
 *
 *  Invariant I   — Payment legs sum to invoice_total
 *                  SUM(payments.amount WHERE sale_id = X) == sale.invoice_total
 *
 *  Invariant II  — Trial balance stays zero after every sale
 *                  SUM(journal_items.debit) == SUM(journal_items.credit) [per tenant]
 *
 *  Invariant III — Sale header math: net_sales + total_tax == invoice_total
 *
 *  Invariant IV  — Credit leg decrements customer current_balance by exactly
 *                  the credit leg amount
 *
 * Implementation notes:
 *  - Leg amounts are generated with integer-cent arithmetic to ensure they
 *    sum exactly (no floating-point drift in the HTTP payload).
 *  - The test uses RefreshDatabase so every iteration starts fresh; the
 *    trial-balance assertion is therefore absolute (cumulative-correct).
 *  - 25 iterations: varied leg splits including zero-credit (cash+bank only)
 *    and zero-bank (cash+credit only).
 */
class SplitPaymentReconcileTest extends VenQoreTestCase
{
    private $tenant;
    private string $warehouseId;
    private Party $customer;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('b6-split-store', 'ltd_3');
        $this->actingAsOwner($this->tenant);
        $this->seedTenantDefaults($this->tenant);

        $this->warehouseId = DB::table('warehouses')
            ->where('tenant_id', $this->tenant->id)
            ->value('id');

        // One customer reused across all iterations; balance is rebuilt from ledger.
        $this->customer = Party::factory()->customer()->create([
            'tenant_id'       => $this->tenant->id,
            'current_balance' => 0.00,
        ]);

        // Fixed-price product: price=100, tax=0 → invoice_total = qty × 100 exactly.
        $this->product = Product::factory()->create([
            'tenant_id'  => $this->tenant->id,
            'cost_price' => 50.00,
            'price'      => 100.00,
            'tax_rate'   => 0,
        ]);

        // Ample stock so no iteration is blocked.
        Stock::create([
            'tenant_id'    => $this->tenant->id,
            'product_id'   => $this->product->id,
            'warehouse_id' => $this->warehouseId,
            'quantity'     => 10000,
        ]);

        DB::table('inventory_batches')->insert([
            'id'            => Str::uuid()->toString(),
            'tenant_id'     => $this->tenant->id,
            'product_id'    => $this->product->id,
            'warehouse_id'  => $this->warehouseId,
            'unit_cost'     => 50.00,
            'original_qty'  => 10000,
            'initial_qty'   => 10000,
            'remaining_qty' => 10000,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Generate (cashCents, bankCents, creditCents) summing exactly to $totalCents.
     * Uses deterministic, non-repeating ratios keyed by iteration seed.
     *
     * The table below shows which fraction of each leg is used per seed mod 5:
     *   seed%5=0 → heavy cash, small credit
     *   seed%5=1 → cash+bank only (credit=0)
     *   seed%5=2 → heavy credit
     *   seed%5=3 → equal thirds (approx)
     *   seed%5=4 → bank+credit, no cash
     */
    private function splitLegs(int $totalCents, int $seed): array
    {
        switch ($seed % 5) {
            case 0: // heavy cash, small credit
                $cashCents   = (int) round($totalCents * 0.60);
                $bankCents   = (int) round($totalCents * 0.25);
                break;
            case 1: // cash + bank only (no credit)
                $cashCents   = (int) round($totalCents * 0.55);
                $bankCents   = $totalCents - $cashCents;
                return [$cashCents, $bankCents, 0];
            case 2: // heavy credit
                $cashCents   = (int) round($totalCents * 0.20);
                $bankCents   = (int) round($totalCents * 0.15);
                break;
            case 3: // roughly equal thirds
                $cashCents   = (int) round($totalCents / 3);
                $bankCents   = (int) round($totalCents / 3);
                break;
            default: // bank + credit, minimal cash
                $cashCents   = (int) round($totalCents * 0.05);
                $bankCents   = (int) round($totalCents * 0.50);
                break;
        }
        $creditCents = $totalCents - $cashCents - $bankCents;
        if ($creditCents < 0) {
            // safety: fall back to even split
            $cashCents   = (int) round($totalCents / 2);
            $bankCents   = $totalCents - $cashCents;
            $creditCents = 0;
        }
        return [$cashCents, $bankCents, $creditCents];
    }

    // ─── Property Test ───────────────────────────────────────────────────────

    public function test_B6_split_payment_legs_always_sum_to_the_invoice_total_and_books_balance(): void
    {
        $iterations       = 25;
        $cumulativeCredit = 0.0; // tracks expected customer.current_balance

        for ($i = 0; $i < $iterations; $i++) {
            // ── Pick a random sale size (1–10 units, price=100, tax=0) ──────
            $qty          = ($i % 10) + 1; // deterministic so failures are reproducible
            $invoiceTotal = round($qty * 100.00, 2);

            // Integer-cent split — guarantees legs sum exactly to invoice_total.
            $totalCents                           = (int) ($invoiceTotal * 100);
            [$cashCents, $bankCents, $creditCents] = $this->splitLegs($totalCents, $i);

            $cashAmt   = round($cashCents   / 100, 2);
            $bankAmt   = round($bankCents   / 100, 2);
            $creditAmt = round($creditCents / 100, 2);

            // Guard helper correctness.
            $this->assertEqualsWithDelta(
                $invoiceTotal,
                $cashAmt + $bankAmt + $creditAmt,
                0.001,
                "Iteration {$i}: splitLegs helper produced legs that don't sum to invoice_total."
            );

            // ── Build payments array ─────────────────────────────────────────
            $paymentsPayload = [];
            if ($cashAmt   > 0) $paymentsPayload[] = ['method' => 'cash',   'amount' => $cashAmt];
            if ($bankAmt   > 0) $paymentsPayload[] = ['method' => 'bank',   'amount' => $bankAmt];
            if ($creditAmt > 0) $paymentsPayload[] = ['method' => 'credit', 'amount' => $creditAmt];

            // ── POST sale ───────────────────────────────────────────────────
            $payload = [
                'customer_id'    => $this->customer->id,
                'warehouse_id'   => $this->warehouseId,
                'items'          => [[
                    'product_id' => $this->product->id,
                    'quantity'   => $qty,
                    'price'      => 100.00,
                    'discount'   => 0,
                ]],
                'payment_method' => 'split',
                'amount_paid'    => $invoiceTotal,
                'payments'       => $paymentsPayload,
                'add_to_ledger'  => true,
            ];

            $response = $this->postJson("/s/{$this->tenant->slug}/sales", $payload);

            if ($response->status() !== 200) {
                $this->fail(
                    "Iteration {$i}: POST /sales returned status {$response->status()}.\n" .
                    "Response: " . json_encode($response->json(), JSON_PRETTY_PRINT) . "\n" .
                    "Payload:  " . json_encode($payload, JSON_PRETTY_PRINT)
                );
            }

            $saleId = $response->json('sale_id');
            $this->assertNotEmpty($saleId, "Iteration {$i}: missing sale_id in response.");

            // ── Invariant I: SUM(payments.amount) == invoice_total ───────────
            $legSum = (float) Payment::where('sale_id', $saleId)->sum('amount');
            $this->assertEqualsWithDelta(
                $invoiceTotal,
                $legSum,
                0.01,
                "Iteration {$i}: SUM(payments.amount)={$legSum} ≠ invoice_total={$invoiceTotal}."
            );

            // Individual leg rows
            if ($cashAmt > 0) {
                $row = Payment::where('sale_id', $saleId)->where('method', 'cash')->first();
                $this->assertNotNull($row, "Iteration {$i}: cash payment row missing.");
                $this->assertEqualsWithDelta($cashAmt, (float) $row->amount, 0.001,
                    "Iteration {$i}: cash leg amount mismatch (expected {$cashAmt}, got {$row->amount}).");
            }
            if ($bankAmt > 0) {
                $row = Payment::where('sale_id', $saleId)->where('method', 'bank')->first();
                $this->assertNotNull($row, "Iteration {$i}: bank payment row missing.");
                $this->assertEqualsWithDelta($bankAmt, (float) $row->amount, 0.001,
                    "Iteration {$i}: bank leg amount mismatch (expected {$bankAmt}, got {$row->amount}).");
            }
            if ($creditAmt > 0) {
                $row = Payment::where('sale_id', $saleId)->where('method', 'credit')->first();
                $this->assertNotNull($row, "Iteration {$i}: credit payment row missing.");
                $this->assertEqualsWithDelta($creditAmt, (float) $row->amount, 0.001,
                    "Iteration {$i}: credit leg amount mismatch (expected {$creditAmt}, got {$row->amount}).");
            }

            // ── Invariant II: Trial balance is zero (cumulative) ─────────────
            $this->assertTrialBalanceZero($this->tenant);

            // ── Invariant III: net_sales + total_tax + shipping == invoice_total
            $sale = Sale::findOrFail($saleId);
            $netSales    = (float) $sale->net_sales;
            $totalTax    = (float) $sale->total_tax;
            $shipping    = (float) $sale->shipping_charges;
            $storedTotal = (float) $sale->invoice_total;

            $this->assertEqualsWithDelta(
                $storedTotal,
                $netSales + $totalTax + $shipping,
                0.01,
                "Iteration {$i}: header invariant broken — " .
                "net_sales({$netSales}) + total_tax({$totalTax}) + shipping({$shipping}) " .
                "= " . ($netSales + $totalTax + $shipping) . " ≠ invoice_total({$storedTotal})."
            );

            // ── Invariant IV: credit leg decrements customer current_balance ──
            // Payment::updatePartyBalance() decrements current_balance by the credit
            // leg amount (method==='credit' AND type='in' branch in Payment model).
            if ($creditAmt > 0) {
                $cumulativeCredit += $creditAmt;
                $this->customer->refresh();
                $expectedBalance = round(-$cumulativeCredit, 2);
                $actualBalance   = round((float) $this->customer->current_balance, 2);

                $this->assertEqualsWithDelta(
                    $expectedBalance,
                    $actualBalance,
                    0.01,
                    "Iteration {$i}: customer current_balance = {$actualBalance} ≠ expected {$expectedBalance} " .
                    "after cumulative credit of {$cumulativeCredit}."
                );
            }

            // ── Journal entries exist for each leg ───────────────────────────
            if ($cashAmt > 0) {
                $this->assertJournalEntry([
                    'tenant_id'    => $this->tenant->id,
                    'account_code' => '1000',  // Cash
                    'debit'        => $cashAmt,
                ]);
            }
            if ($bankAmt > 0) {
                $this->assertJournalEntry([
                    'tenant_id'    => $this->tenant->id,
                    'account_code' => '1010',  // Bank
                    'debit'        => $bankAmt,
                ]);
            }
            if ($creditAmt > 0) {
                $this->assertJournalEntry([
                    'tenant_id'    => $this->tenant->id,
                    'account_code' => '1200',  // Accounts Receivable
                    'debit'        => $creditAmt,
                ]);
            }
        } // end for
    }
}
