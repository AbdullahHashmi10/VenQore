<?php

namespace Tests\Feature\Module;

use App\Engines\ServiceEngine;
use App\Models\ServiceJob;
use App\Services\ServiceBillingService;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * STEP 8 — THE BLOCKING TEST.
 *
 * From VENQORE_FINAL_BUILD_PLAN, step 8, verbatim:
 *
 *     "Tests (blocking): ServiceOnlySaleTest — revenue posts, NO COGS, NO
 *      stock movement, ledger balances. This is the newest code in your engine
 *      (migration 12 Aug) — do not ship a service preset until it's green."
 *
 * Until every test in this file passes:
 *   - config/modules.php keeps services at status 'building'
 *   - the freelancer, salon and repair_workshop presets stay blocked_by it
 *   - the AI never proposes a service-shaped system
 *
 * WHY THIS MATTERS MORE THAN IT LOOKS
 * -----------------------------------
 * The entire Services module exists to make one promise: a freelancer gets
 * "invoicing that adds up" without ever being shown an accounting menu. That
 * promise is only true if service revenue reaches the ledger. If it does not,
 * the customer bills Rs. 312,000 and their profit report says zero — and they
 * find out at tax time, not on day one.
 */
class ServiceOnlySaleTest extends VenQoreTestCase
{
    private ServiceBillingService $billing;

    protected function setUp(): void
    {
        parent::setUp();
        $this->billing = app(ServiceBillingService::class);
    }

    // ══════════════════════════════════════════ THE FOUR ACCEPTANCE CHECKS ══

    #[Test]
    public function a_service_sale_posts_revenue_to_the_ledger(): void
    {
        $job = $this->jobWorth(50000.00);

        $before = $this->revenueBalance();
        $sale = $this->billing->invoiceJob($job->fresh());
        $after = $this->revenueBalance();

        $this->assertEqualsWithDelta(
            50000.00,
            $after - $before,
            0.01,
            'Service revenue did not reach the ledger. This is the failure that makes "you earned Rs. 312,000 this month" a lie.'
        );

        $this->assertNotNull($sale->id);
    }

    #[Test]
    public function a_service_sale_records_no_cogs(): void
    {
        $job = $this->jobWorth(50000.00);

        $before = $this->cogsBalance();
        $this->billing->invoiceJob($job->fresh());
        $after = $this->cogsBalance();

        $this->assertEqualsWithDelta(
            0.00,
            $after - $before,
            0.01,
            'A service posted a cost of goods sold. There are no goods. Margin on every service job would be wrong.'
        );
    }

    #[Test]
    public function a_service_sale_moves_no_stock(): void
    {
        $job = $this->jobWorth(50000.00);

        $before = DB::table('stock_movements')->count();
        $this->billing->invoiceJob($job->fresh());
        $after = DB::table('stock_movements')->count();

        $this->assertSame(
            $before,
            $after,
            'A service sale moved stock. SaleService bypasses FIFO only when products.type = "service" — check the product this job billed against.'
        );
    }

    #[Test]
    public function the_ledger_balances_after_a_service_sale(): void
    {
        $job = $this->jobWorth(50000.00);
        $sale = $this->billing->invoiceJob($job->fresh());

        $entry = DB::table('journal_entries')
            ->where('reference', $sale->invoice_number)
            ->orWhere('source_id', $sale->id)
            ->first();

        $this->assertNotNull($entry, 'No journal entry was created for the service sale.');

        $sums = DB::table('journal_items')
            ->where('journal_entry_id', $entry->id)
            ->selectRaw('SUM(debit) AS d, SUM(credit) AS c')
            ->first();

        $this->assertEqualsWithDelta(
            (float) $sums->d,
            (float) $sums->c,
            0.01,
            'Debits and credits do not match. An unbalanced entry is silent corruption — it will not surface until somebody runs a trial balance months from now.'
        );
    }

    // ══════════════════════════════════════════ THE BUG STEP 8 FIXES ════════

    #[Test]
    public function the_invoice_number_comes_from_the_sequence_service(): void
    {
        // THE ORIGINAL BUG: ServiceEngine::convertJobToInvoice() generated
        // 'INV-' . substr(md5(uniqid()), 0, 8). Random, non-sequential, and
        // legally useless in a jurisdiction that audits invoice numbering.
        $first  = $this->billing->invoiceJob($this->jobWorth(1000.00)->fresh());
        $second = $this->billing->invoiceJob($this->jobWorth(1000.00)->fresh());

        foreach ([$first, $second] as $sale) {
            $this->assertDoesNotMatchRegularExpression(
                '/^INV-[0-9a-f]{8}$/',
                $sale->invoice_number,
                'This is the md5 pattern from the old convertJobToInvoice(). The Qore bypass is still in place.'
            );
        }

        $this->assertNotSame($first->invoice_number, $second->invoice_number);
    }

    #[Test]
    public function invoicing_the_same_job_twice_does_not_bill_it_twice(): void
    {
        $job = $this->jobWorth(50000.00);

        $first = $this->billing->invoiceJob($job->fresh());
        $countAfterFirst = DB::table('sales')->count();

        $second = $this->billing->invoiceJob($job->fresh());

        $this->assertSame($first->id, $second->id, 'A second invoice was created for the same job.');
        $this->assertSame($countAfterFirst, DB::table('sales')->count());
    }

    #[Test]
    public function a_job_with_no_billable_lines_refuses_clearly(): void
    {
        $job = $this->jobWorth(0.00, withLines: false);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/no billable lines/i');

        $this->billing->invoiceJob($job->fresh());
    }

    // ══════════════════════════════════════════ PARTS ON A SERVICE JOB ══════

    #[Test]
    public function a_part_fitted_during_a_job_does_move_stock(): void
    {
        // A workshop that fits a Rs. 2,000 part SHOULD see it leave inventory.
        // Only the LABOUR is exempt from FIFO — not everything on the invoice.
        $job = $this->jobWorth(5000.00);
        $product = $this->stockedProduct(qty: 10, cost: 1200.00);

        $job->lines()->create([
            'kind'        => 'part',
            'product_id'  => $product->id,
            'description' => 'Compressor',
            'quantity'    => 1,
            'unit_price'  => 2000.00,
            'tax_rate'    => 0,
        ]);

        $before = DB::table('stock_movements')->count();
        $this->billing->invoiceJob($job->fresh());

        $this->assertGreaterThan(
            $before,
            DB::table('stock_movements')->count(),
            'A physical part on a service job must still deduct stock. Only labour is exempt.'
        );
    }

    // ══════════════════════════════════════════ HOURLY BILLING ══════════════

    #[Test]
    public function hours_round_the_way_a_tradesperson_expects(): void
    {
        $b = $this->billing;

        // 15-minute increments, rounded up — the default and the common trade
        // convention. 61 minutes bills as 1.25 hours, not 1.0166.
        $this->assertSame(1.5,    $b->roundHours(90, 15, 'up'));
        $this->assertSame(1.25,   $b->roundHours(61, 15, 'up'));
        $this->assertSame(1.0,    $b->roundHours(61, 15, 'nearest'));
        $this->assertSame(1.0,    $b->roundHours(61, 15, 'down'));
        $this->assertSame(1.0167, $b->roundHours(61, 15, 'exact'));

        // Exactly on a boundary must not round up a whole extra block —
        // billing 90 minutes as 1.75 hours is the kind of thing a customer
        // notices once and never forgets.
        $this->assertSame(1.5, $b->roundHours(90, 30, 'up'));
    }

    // ------------------------------------------------------------- helpers
    // Adapt these to your existing factories; the assertions above do not
    // depend on how a job gets made.

    private function jobWorth(float $amount, bool $withLines = true): ServiceJob
    {
        $engine = app(ServiceEngine::class);
        $party = $this->makeCustomer();

        return $engine->createJob([
            'tenant_id' => $this->tenant->id,
            'party_id'  => $party->id,
            'title'     => 'Test job',
            'status'    => 'completed',
            'lines'     => $withLines ? [[
                'kind'        => 'service',
                'product_id'  => $this->serviceProduct()->id,
                'description' => 'Labour',
                'quantity'    => 1,
                'unit_price'  => $amount,
                'tax_rate'    => 0,
            ]] : [],
        ]);
    }

    private function serviceProduct()
    {
        return \App\Models\Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type'      => 'service',
        ]);
    }

    private function stockedProduct(int $qty, float $cost)
    {
        $product = \App\Models\Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type'      => 'product',
        ]);

        // Receive stock through the normal purchase path so FIFO has batches.
        $this->receiveStock($product, $qty, $cost);

        return $product;
    }

    private function makeCustomer()
    {
        return \App\Models\Party::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type'      => 'customer',
        ]);
    }

    /** Balance of the revenue account. Adjust the account code to your COA. */
    private function revenueBalance(): float
    {
        return (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('je.tenant_id', $this->tenant->id)
            ->where('ji.account_code', '4000')
            ->selectRaw('SUM(ji.credit) - SUM(ji.debit) AS balance')
            ->value('balance');
    }

    /** Balance of the COGS account. Adjust the account code to your COA. */
    private function cogsBalance(): float
    {
        return (float) DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->where('je.tenant_id', $this->tenant->id)
            ->where('ji.account_code', '5000')
            ->selectRaw('SUM(ji.debit) - SUM(ji.credit) AS balance')
            ->value('balance');
    }
}
