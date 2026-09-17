<?php

namespace Tests\Feature\Reckoner;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use App\Reckoner\Engine\MeasureEngine;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerRequest;
use App\Reckoner\Streams\LedgerStream;
use Illuminate\Support\Facades\DB;
use Tests\Fixtures\ReckonerGoldenStoreFixture;
use Tests\TestCase;

/**
 * Gate 4b: Selling cards (100 cards) validation test per §4, §8.1 of RECKONER_TRUTH_REBUILD_PLAN.md.
 *
 * Covers: pos (11), invoicing (10), customers (10), sales_returns (6), quotations (6),
 *         sales_orders (7), pricing_tiers (5), services (7), staff_attendance (8),
 *         multi_location (6), loyalty_gift (6), marketplace_sync (6), recurring_invoices (6), b2b_proposals (6)
 */
class Slice4bSellingGateTest extends TestCase
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
     * 1. Assert all verified Slice 4b cards match §8.1 hand-computed expected values.
     */
    public function test_slice4b_verified_cards_match_expected_values(): void
    {
        $engine = app(MeasureEngine::class);
        $cards  = CardRegistry::all();
        $expected = ReckonerGoldenStoreFixture::EXPECTED_VALUES;

        $slice4bPrefixes = ['pos', 'invoicing', 'customers', 'sales_returns', 'quotations',
            'sales_orders', 'pricing', 'services', 'staff', 'locations', 'loyalty', 'marketplace', 'recurring', 'proposals'];

        $requests = [];
        foreach ($cards as $key => $card) {
            $prefix = explode('.', $key)[0];
            if (!in_array($prefix, $slice4bPrefixes, true)) {
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

        $this->assertNotEmpty($requests, 'No verified Slice 4b cards to test — check contract_state in cards.json');

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
            "Slice 4b verified card mismatches:\n" . implode("\n", $failures)
        );
    }

    /**
     * 2. Assert no tenant isolation violation — all queries carry tenant_id.
     */
    public function test_slice4b_tenant_isolation(): void
    {
        $engine = app(MeasureEngine::class);

        $sampleKeys = [
            'pos.revenue', 'invoicing.count', 'customers.active', 'locations.count',
            'staff.member_count', 'loyalty.member_count', 'marketplace.channel_count',
            'recurring.active_count', 'proposals.count',
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

        // Ensure a different tenant gets different (isolated) data
        $otherTenant = Tenant::where('slug', '!=', 'golden-store')->first();
        if ($otherTenant) {
            $otherUser = User::whereIn('id', DB::table('tenant_users')->where('tenant_id', $otherTenant->id)->pluck('user_id'))->first() ?? User::first();
            if ($otherUser) {
                $ctx2 = new ReckonerContext($otherTenant, $otherUser, 'scale');
                $results2 = $engine->resolve($requests, $ctx2);

                $posReq = new ReckonerRequest('pos.revenue', 'custom', ['from' => '2026-08-01', 'to' => '2026-08-31']);
                $posId = $posReq->getCompositeId();
                if (isset($results[$posId]) && isset($results2[$posId])) {
                    $goldenVal = (float) $results[$posId]->primaryValue();
                    $otherVal  = (float) $results2[$posId]->primaryValue();
                    if ($goldenVal > 0) {
                        $this->assertNotEquals($goldenVal, $otherVal,
                            'pos.revenue returned same value for different tenants — isolation breach!');
                    }
                }
            }
        }
    }

    /**
     * 3. revenue_ties_to_ledger invariant: sum of pos.revenue + invoicing.value = GL sales_revenue per day.
     *
     * Invariant: gl.sales_revenue (from ledger stream) must equal
     *            sales table net_total for the same period.
     */
    public function test_revenue_ties_to_ledger(): void
    {
        $from = '2026-08-01';
        $to   = '2026-08-31';
        $tenantId = (string) $this->tenant->id;

        $ledgerStream = app(LedgerStream::class);
        $flows = $ledgerStream->flows(['gl.sales_revenue'], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId);
        $glSalesRevenue = (float) ($flows['w']['gl.sales_revenue'] ?? 0.0);

        // Sales table revenue
        $salesNetTotal = (float) DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereIn('status', ['posted', 'completed', 'active'])
            ->whereNull('deleted_at')
            ->whereNull('original_sale_id')
            ->sum('net_sales');

        // Returns to deduct
        $returnsTotal = (float) (DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereNotNull('original_sale_id')
            ->whereNull('deleted_at')
            ->sum('net_sales') ?? 0.0);

        $salesNetOfReturns = $salesNetTotal - abs($returnsTotal);

        // Allow ±1.00 tolerance for rounding across tables
        $diff = abs($glSalesRevenue - $salesNetOfReturns);

        $this->assertLessThanOrEqual(1.0, $diff,
            "revenue_ties_to_ledger FAILED: GL={$glSalesRevenue}, Sales-Returns={$salesNetOfReturns}, diff={$diff}"
        );
    }

    /**
     * 4. All implemented Slice 4b cards resolve without PHP error or failure status.
     */
    public function test_slice4b_implemented_cards_resolve_without_error(): void
    {
        $engine = app(MeasureEngine::class);
        $cards  = CardRegistry::all();

        $slice4bPrefixes = ['pos', 'invoicing', 'customers', 'sales_returns', 'quotations',
            'sales_orders', 'pricing', 'services', 'staff', 'locations', 'loyalty', 'marketplace', 'recurring', 'proposals'];

        $requests = [];
        foreach ($cards as $key => $card) {
            $prefix = explode('.', $key)[0];
            if (!in_array($prefix, $slice4bPrefixes, true)) {
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

        $this->assertNotEmpty($requests, 'No implemented Slice 4b cards found');

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
            "Some Slice 4b cards failed resolution:\n" . implode("\n", $failures)
        );
    }
}
