<?php

namespace Tests\Feature\Reckoner;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\Engine\MeasureEngine;
use App\Reckoner\Invariants\ReckonerInvariants;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerRequest;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Fixtures\ReckonerGoldenStoreFixture;
use Tests\TestCase;

/**
 * Gate 5: Adversarial Invariant Corruption and Recovery Tests (§5.5, Gate 5).
 *
 * Corrupts one side of each control at a time, asserts immediate invariant failure
 * and fail-closed card behavior, restores data, and asserts complete recovery.
 */
class AdversarialInvariantGateTest extends TestCase
{
    protected ?Tenant $tenant = null;
    protected ?User $user = null;
    protected ?ReckonerPeriod $period = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::where('slug', 'golden-store')->first();
        if (!$this->tenant) {
            $built = ReckonerGoldenStoreFixture::build(http: $this);
            $this->tenant = $built['tenant'];
            $this->user   = $built['user'];
        } else {
            $this->user = User::where('email', 'golden-owner@venqore.com')->first();
        }

        $this->period = ReckonerPeriod::resolve('custom', ['from' => '2026-08-01', 'to' => '2026-08-31'], $this->tenant);
    }

    /**
     * 1. Balanced Books: Corrupt via unbalanced raw journal line -> assert fail -> restore -> assert pass.
     */
    public function test_adversarial_balanced_books_corruption_and_recovery(): void
    {
        // 1. Initial state must pass
        $initial = ReckonerInvariants::check('balanced_books', $this->tenant, $this->period);
        $this->assertSame('pass', $initial['status'], "balanced_books must pass initially");

        // 2. Corrupt: insert an unbalanced debit line
        $entry = DB::table('journal_entries')
            ->where('tenant_id', $this->tenant->id)
            ->whereBetween('date', ['2026-08-01', '2026-08-31'])
            ->first();
        $this->assertNotNull($entry);

        $corruptItemId = (string) Str::uuid();
        DB::table('journal_items')->insert([
            'id'               => $corruptItemId,
            'tenant_id'        => $this->tenant->id,
            'journal_entry_id' => $entry->id,
            'account_id'       => DB::table('accounts')->where('tenant_id', $this->tenant->id)->value('id'),
            'debit'            => 999.00,
            'credit'           => 0.00,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        try {
            // 3. Assert invariant detects corruption and FAILS
            $corrupted = ReckonerInvariants::check('balanced_books', $this->tenant, $this->period);
            $this->assertSame('fail', $corrupted['status'], "balanced_books must FAIL when books are unbalanced");
            $this->assertFalse($corrupted['passed']);
            $this->assertEqualsWithDelta(999.00, $corrupted['difference'], 0.05);
        } finally {
            // 4. Restore: remove the corrupt item
            DB::table('journal_items')->where('id', $corruptItemId)->delete();
        }

        // 5. Assert recovery
        $recovered = ReckonerInvariants::check('balanced_books', $this->tenant, $this->period);
        $this->assertSame('pass', $recovered['status'], "balanced_books must recover and pass after cleanup");
        $this->assertTrue($recovered['passed']);
    }

    /**
     * 2. Revenue Ties to Ledger: Corrupt sales.net_sales -> assert fail & books_disagree -> restore -> assert pass.
     */
    public function test_adversarial_revenue_ties_to_ledger_corruption_and_recovery(): void
    {
        $engine = app(MeasureEngine::class);
        $ctx = new ReckonerContext($this->tenant, $this->user, 'scale');
        $req = new ReckonerRequest('core.revenue', 'custom', ['from' => '2026-08-01', 'to' => '2026-08-31']);

        // 1. Initial state passes
        $initial = ReckonerInvariants::check('revenue_ties_to_ledger', $this->tenant, $this->period);
        $this->assertSame('pass', $initial['status']);

        $sale = DB::table('sales')
            ->where('tenant_id', $this->tenant->id)
            ->whereNull('original_sale_id')
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), ['2026-08-01', '2026-08-31'])
            ->first();
        $this->assertNotNull($sale);
        $originalNetSales = (float) $sale->net_sales;

        try {
            // 2. Corrupt: modify sale net_sales directly in database
            DB::table('sales')->where('id', $sale->id)->update(['net_sales' => $originalNetSales + 500.00]);

            // 3. Invariant must FAIL
            $corrupted = ReckonerInvariants::check('revenue_ties_to_ledger', $this->tenant, $this->period);
            $this->assertSame('fail', $corrupted['status'], "revenue_ties_to_ledger must FAIL when sales disagree with GL");
            $this->assertEqualsWithDelta(500.00, $corrupted['difference'], 0.05);

            // 4. Card resolution must fail-closed with books_disagree
            $res = $engine->resolve([$req], $ctx);
            $cardResult = $res[$req->getCompositeId()];
            $this->assertFalse($cardResult->ok, "Card must return ok=false when ledger control fails");
            $this->assertSame('error', $cardResult->status);
            $this->assertSame('books_disagree', $cardResult->errorCode);
        } finally {
            // 5. Restore original value
            DB::table('sales')->where('id', $sale->id)->update(['net_sales' => $originalNetSales]);
        }

        // 6. Assert recovery
        $recovered = ReckonerInvariants::check('revenue_ties_to_ledger', $this->tenant, $this->period);
        $this->assertSame('pass', $recovered['status'], "revenue_ties_to_ledger must recover and pass");

        $res2 = $engine->resolve([$req], $ctx);
        $this->assertTrue($res2[$req->getCompositeId()]->ok, "Card must return ok=true after restoration");
    }

    /**
     * 3. Stock Value Control: Corrupt inventory_batches unit_cost -> assert fail & books_disagree -> restore -> assert pass.
     */
    public function test_adversarial_stock_value_control_corruption_and_recovery(): void
    {
        $engine = app(MeasureEngine::class);
        $ctx = new ReckonerContext($this->tenant, $this->user, 'scale');
        $req = new ReckonerRequest('inventory.stock_value', 'custom', ['from' => '2026-08-01', 'to' => '2026-08-31']);

        // 1. Initial state passes
        $initial = ReckonerInvariants::check('stock_value_control', $this->tenant, $this->period);
        $this->assertSame('pass', $initial['status']);

        $batch = DB::table('inventory_batches')
            ->where('tenant_id', $this->tenant->id)
            ->first();
        $this->assertNotNull($batch);
        $originalUnitCost = (float) $batch->unit_cost;

        try {
            // 2. Corrupt batch unit cost
            DB::table('inventory_batches')->where('id', $batch->id)->update(['unit_cost' => $originalUnitCost + 100.00]);

            // 3. Invariant must FAIL
            $corrupted = ReckonerInvariants::check('stock_value_control', $this->tenant, $this->period);
            $this->assertSame('fail', $corrupted['status'], "stock_value_control must FAIL when batches disagree with GL 1100");

            // 4. Card resolution must fail-closed with books_disagree
            $res = $engine->resolve([$req], $ctx);
            $cardResult = $res[$req->getCompositeId()];
            $this->assertFalse($cardResult->ok);
            $this->assertSame('error', $cardResult->status);
            $this->assertSame('books_disagree', $cardResult->errorCode);
        } finally {
            // 5. Restore original batch cost
            DB::table('inventory_batches')->where('id', $batch->id)->update(['unit_cost' => $originalUnitCost]);
        }

        // 6. Assert recovery
        $recovered = ReckonerInvariants::check('stock_value_control', $this->tenant, $this->period);
        $this->assertSame('pass', $recovered['status']);

        $res2 = $engine->resolve([$req], $ctx);
        $this->assertTrue($res2[$req->getCompositeId()]->ok);
    }

    /**
     * 4. Unknown invariant strictly fails closed.
     */
    public function test_unknown_invariant_strictly_fails(): void
    {
        $res = ReckonerInvariants::check('non_existent_fake_invariant', $this->tenant, $this->period);
        $this->assertSame('fail', $res['status'], "Unknown invariant must strictly return status: fail");
        $this->assertFalse($res['passed']);
    }

    /**
     * 5. Probe command executes cleanly and writes to reckoner_invariant_runs.
     */
    public function test_probe_command_executes_and_logs_cleanly(): void
    {
        $runsBefore = DB::table('reckoner_invariant_runs')->where('tenant_id', $this->tenant->id)->count();

        $exitCode = Artisan::call('reckoner:probe', [
            '--tenant' => 'golden-store',
            '--from'   => '2026-08-01',
            '--to'     => '2026-08-31',
        ]);

        $this->assertSame(0, $exitCode, "reckoner:probe must exit with code 0 on golden-store");

        $runsAfter = DB::table('reckoner_invariant_runs')->where('tenant_id', $this->tenant->id)->count();
        $this->assertGreaterThan($runsBefore, $runsAfter, "reckoner:probe must log runs to reckoner_invariant_runs");

        $latestRun = DB::table('reckoner_invariant_runs')
            ->where('tenant_id', $this->tenant->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($latestRun);
        $this->assertSame('pass', $latestRun->status);
    }

    /**
     * 6. Channels Sum to Sales: Corrupt breakdown context -> assert fail -> restore -> assert pass.
     */
    public function test_adversarial_channels_sum_to_sales_corruption_and_recovery(): void
    {
        // 1. Initial state passes without context
        $initial = ReckonerInvariants::check('channels_sum_to_sales', $this->tenant, $this->period);
        $this->assertSame('pass', $initial['status']);
        $this->assertTrue($initial['passed']);
        $totalSales = $initial['expected'];

        // 2. Corrupted card context with mismatched segments
        $corruptCtx = [
            'data' => [
                'segments' => [
                    ['channel' => 'pos', 'value' => 100.00],
                    ['channel' => 'online', 'value' => 200.00],
                ],
            ],
        ];
        $corrupted = ReckonerInvariants::check('channels_sum_to_sales', $this->tenant, $this->period, $corruptCtx);
        $this->assertSame('fail', $corrupted['status'], "channels_sum_to_sales must FAIL when channel segments do not sum to total sales");
        $this->assertFalse($corrupted['passed']);
        $this->assertEqualsWithDelta(abs(300.00 - $totalSales), $corrupted['difference'], 0.05);

        // 3. Matched context recovers and passes
        $validCtx = [
            'data' => [
                'segments' => [
                    ['channel' => 'pos', 'value' => $totalSales],
                ],
            ],
        ];
        $recovered = ReckonerInvariants::check('channels_sum_to_sales', $this->tenant, $this->period, $validCtx);
        $this->assertSame('pass', $recovered['status'], "channels_sum_to_sales must PASS when segments match total");
        $this->assertTrue($recovered['passed']);
    }

    /**
     * 7. Returns Tie to Ledger: Insert un-journaled return -> assert fail -> delete -> assert pass.
     */
    public function test_adversarial_returns_tie_to_ledger_corruption_and_recovery(): void
    {
        // 1. Initial state passes
        $initial = ReckonerInvariants::check('returns_tie_to_ledger', $this->tenant, $this->period);
        $this->assertSame('pass', $initial['status']);
        $this->assertTrue($initial['passed']);

        // 2. Corrupt: insert an operational return sale with no ledger entry
        $corruptSaleId = (string) Str::uuid();
        DB::table('sales')->insert([
            'id'               => $corruptSaleId,
            'tenant_id'        => $this->tenant->id,
            'user_id'          => $this->user->id,
            'reference_number' => 'TEST-RET-CORRUPT',
            'original_sale_id' => (string) Str::uuid(),
            'net_sales'        => 350.00,
            'total'            => 350.00,
            'subtotal'         => 350.00,
            'status'           => 'returned',
            'posted_at'        => '2026-08-15 12:00:00',
            'created_at'       => '2026-08-15 12:00:00',
            'updated_at'       => '2026-08-15 12:00:00',
        ]);

        try {
            // 3. Invariant must detect discrepancy and FAIL
            $corrupted = ReckonerInvariants::check('returns_tie_to_ledger', $this->tenant, $this->period);
            $this->assertSame('fail', $corrupted['status'], "returns_tie_to_ledger must FAIL when return sale has no GL entry");
            $this->assertFalse($corrupted['passed']);
            $this->assertEqualsWithDelta(350.00, $corrupted['difference'], 0.05);
        } finally {
            // 4. Restore: remove corrupt return sale
            DB::table('sales')->where('id', $corruptSaleId)->delete();
        }

        // 5. Assert recovery
        $recovered = ReckonerInvariants::check('returns_tie_to_ledger', $this->tenant, $this->period);
        $this->assertSame('pass', $recovered['status'], "returns_tie_to_ledger must recover and pass");
        $this->assertTrue($recovered['passed']);
    }
}
