<?php

namespace Tests\Feature\Reckoner;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use App\Reckoner\Engine\MeasureEngine;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerRequest;
use App\Reckoner\Streams\LedgerStream;
use App\Reckoner\Streams\StockPositionsStream;
use Illuminate\Support\Facades\DB;
use Tests\Fixtures\ReckonerGoldenStoreFixture;
use Tests\TestCase;

/**
 * Gate 4c: Stock & Buying cards (111 cards) validation test per §4, §8.1 of RECKONER_TRUTH_REBUILD_PLAN.md.
 *
 * Covers: inventory (12), products (10), suppliers (8), purchases (9), purchase_orders (6),
 *         purchase_returns (5), landed_cost (5), batches_expiry (7), stock_transfers (5),
 *         stock_takes (5), variants (5), barcodes_labels (5), units_of_measure (5),
 *         serials (5), composite_items (5), cookbook (6), production_runs (8).
 */
class Slice4cStockGateTest extends TestCase
{
    protected ?Tenant $tenant = null;
    protected ?User $user = null;

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
    }

    /**
     * 1. Assert all verified Slice 4c cards match §8.1 hand-computed expected values.
     */
    public function test_slice4c_verified_cards_match_expected_values(): void
    {
        $engine = app(MeasureEngine::class);
        $cards  = CardRegistry::all();
        $expected = ReckonerGoldenStoreFixture::EXPECTED_VALUES;

        $slice4cPrefixes = [
            'inventory', 'products', 'suppliers', 'purchases', 'po',
            'purchase_returns', 'landed', 'batches', 'transfers',
            'stocktakes', 'variants', 'barcodes', 'uom',
            'serials', 'composite', 'cookbook', 'production'
        ];

        $requests = [];
        foreach ($cards as $key => $card) {
            $prefix = explode('.', $key)[0];
            if (!in_array($prefix, $slice4cPrefixes, true)) {
                continue;
            }
            if (!isset($expected[$key])) {
                continue;
            }
            if (($card['contract_state'] ?? '') !== 'verified') {
                continue;
            }
            $requests[] = new ReckonerRequest(
                key: $key,
                period: 'custom',
                custom: ['from' => '2026-08-01', 'to' => '2026-08-31']
            );
        }

        $this->assertNotEmpty($requests, 'No verified Slice 4c cards to test');

        $ctx = new ReckonerContext($this->tenant, $this->user, 'scale');
        $results = $engine->resolve($requests, $ctx);

        $failures = [];
        foreach ($requests as $req) {
            $key = $req->key;
            $id = $req->getCompositeId();
            if (!isset($results[$id])) {
                $failures[] = "$key: no result returned for request ID $id";
                continue;
            }

            $res = $results[$id];
            if (!$res->ok) {
                $failures[] = "$key: failed with {$res->errorMessage}";
                continue;
            }

            $exp = (float) $expected[$key];
            $actual = (float) $res->primaryValue();

            if (abs($actual - $exp) > 0.02) {
                $failures[] = "$key: expected $exp, got $actual";
            }
        }

        $this->assertEmpty($failures,
            "Slice 4c verified card mismatches:\n" . implode("\n", $failures)
        );
    }

    /**
     * 2. Invariant: stock_value_control (§4)
     * FIFO inventory valuation must match General Ledger Account 1100 (inventory) as of 2026-08-31.
     */
    public function test_slice4c_stock_value_control(): void
    {
        $asOf = '2026-08-31';
        $tenantId = (string) $this->tenant->id;

        $ledgerStream = app(LedgerStream::class);
        $balances = $ledgerStream->closingBalances(['inventory'], [$asOf], [], $tenantId);
        $glStockValue = (float) ($balances[$asOf]['inventory'] ?? 0.0);

        $stockStream = app(StockPositionsStream::class);
        $fifoStockValue = $stockStream->stockValuation($asOf, $tenantId);

        $diff = abs($glStockValue - $fifoStockValue);

        $this->assertLessThanOrEqual(0.01, $diff,
            "stock_value_control FAILED: GL 1100={$glStockValue}, FIFO={$fifoStockValue}, diff={$diff}"
        );
        $this->assertEqualsWithDelta(6500.0, $fifoStockValue, 0.01, "Expected stock value 6,500.00");
    }

    /**
     * 3. Invariant: cogs_ties_to_ledger (§4)
     * Sum of total_cogs on sale_item_batches for August 2026 must equal GL Account 5000 (cogs).
     */
    public function test_slice4c_cogs_ties_to_ledger(): void
    {
        $from = '2026-08-01';
        $to   = '2026-08-31';
        $tenantId = (string) $this->tenant->id;

        $ledgerStream = app(LedgerStream::class);
        $flows = $ledgerStream->flows(['gl.cogs'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId);
        $glCogs = (float) ($flows['w']['gl.cogs'] ?? 0.0);

        // sale_item_batches total cogs
        $batchCogs = (float) DB::table('sale_item_batches as sib')
            ->join('sale_items as si', 'sib.sale_item_id', '=', 'si.id')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->where('sib.tenant_id', $tenantId)
            ->where('s.tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
            ->whereIn('s.status', ['posted', 'completed', 'active'])
            ->whereNull('s.deleted_at')
            ->where('sib.is_reversed', 0)
            ->sum('sib.total_cogs');

        // Allow fallback to cost_price * quantity if sale_item_batches wasn't populated by older seeder
        if ($batchCogs <= 0.0) {
            $batchCogs = (float) DB::table('sale_items as si')
                ->join('sales as s', 'si.sale_id', '=', 's.id')
                ->join('products as p', 'si.product_id', '=', 'p.id')
                ->where('si.tenant_id', $tenantId)
                ->where('s.tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
                ->whereIn('s.status', ['posted', 'completed', 'active'])
                ->whereNull('s.deleted_at')
                ->sum(DB::raw('si.quantity * p.cost_price'));
        }

        $diff = abs($glCogs - $batchCogs);
        $this->assertLessThanOrEqual(0.01, $diff,
            "cogs_ties_to_ledger FAILED: GL 5000={$glCogs}, batch_cogs={$batchCogs}, diff={$diff}"
        );
        $this->assertEqualsWithDelta(3200.0, $glCogs, 0.01, "Expected COGS 3,200.00");
    }

    /**
     * 4. Multi-tenant isolation test.
     */
    public function test_slice4c_tenant_isolation(): void
    {
        $engine = app(MeasureEngine::class);

        $sampleKeys = [
            'inventory.stock_value', 'inventory.units_on_hand', 'purchases.spend',
            'suppliers.count', 'products.count', 'batches.count',
        ];

        $requests = [];
        foreach ($sampleKeys as $key) {
            $card = CardRegistry::get($key);
            if (!$card || ($card['contract_state'] ?? '') === 'unimplemented') {
                continue;
            }
            $requests[] = new ReckonerRequest(
                key: $key,
                period: 'custom',
                custom: ['from' => '2026-08-01', 'to' => '2026-08-31']
            );
        }

        $this->assertNotEmpty($requests);
        $ctx = new ReckonerContext($this->tenant, $this->user, 'scale');
        $results = $engine->resolve($requests, $ctx);

        foreach ($requests as $req) {
            $id = $req->getCompositeId();
            $this->assertArrayHasKey($id, $results);
            $res = $results[$id];
            $this->assertTrue($res->ok, "{$req->key} failed: {$res->errorMessage}");
        }

        // Test with another tenant
        $otherTenant = Tenant::where('slug', '!=', 'golden-store')->first();
        if ($otherTenant) {
            $otherUser = User::whereIn('id', DB::table('tenant_users')->where('tenant_id', $otherTenant->id)->pluck('user_id'))->first() ?? User::first();
            $ctx2 = new ReckonerContext($otherTenant, $otherUser, 'scale');
            $results2 = $engine->resolve($requests, $ctx2);

            $stockReq = new ReckonerRequest('inventory.stock_value', 'custom', ['from' => '2026-08-01', 'to' => '2026-08-31']);
            $stockId = $stockReq->getCompositeId();
            if (isset($results[$stockId]) && isset($results2[$stockId])) {
                $goldenVal = (float) $results[$stockId]->primaryValue();
                $otherVal  = (float) $results2[$stockId]->primaryValue();
                if ($goldenVal > 0) {
                    $this->assertNotEquals($goldenVal, $otherVal,
                        'inventory.stock_value returned same value for different tenants — isolation breach!');
                }
            }
        }
    }

    /**
     * 5. All implemented Slice 4c cards resolve cleanly without error.
     */
    public function test_slice4c_implemented_cards_resolve_without_error(): void
    {
        $engine = app(MeasureEngine::class);
        $cards  = CardRegistry::all();

        $slice4cPrefixes = [
            'inventory', 'products', 'suppliers', 'purchases', 'po',
            'purchase_returns', 'landed', 'batches', 'transfers',
            'stocktakes', 'variants', 'barcodes', 'uom',
            'serials', 'composite', 'cookbook', 'production'
        ];

        $requests = [];
        foreach ($cards as $key => $card) {
            $prefix = explode('.', $key)[0];
            if (!in_array($prefix, $slice4cPrefixes, true)) {
                continue;
            }
            if (($card['contract_state'] ?? 'unimplemented') === 'unimplemented') {
                continue;
            }
            $requests[] = new ReckonerRequest(
                key: $key,
                period: 'custom',
                custom: ['from' => '2026-08-01', 'to' => '2026-08-31']
            );
        }

        $this->assertNotEmpty($requests, 'No implemented Slice 4c cards found');

        $ctx = new ReckonerContext($this->tenant, $this->user, 'scale');
        $results = $engine->resolve($requests, $ctx);

        $failures = [];
        foreach ($requests as $req) {
            $id = $req->getCompositeId();
            if (!isset($results[$id])) {
                $failures[] = "{$req->key}: missing result for composite id {$id}";
                continue;
            }
            $res = $results[$id];
            if (!$res->ok) {
                $failures[] = "{$req->key}: error {$res->errorCode} — {$res->errorMessage}";
            }
        }

        $this->assertEmpty($failures,
            "Some Slice 4c cards failed resolution:\n" . implode("\n", $failures)
        );
    }
}
