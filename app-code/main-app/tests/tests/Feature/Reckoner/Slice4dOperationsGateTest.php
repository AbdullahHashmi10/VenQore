<?php

namespace Tests\Feature\Reckoner;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use App\Reckoner\Engine\MeasureEngine;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerRequest;
use Illuminate\Support\Facades\DB;
use Tests\Fixtures\ReckonerGoldenStoreFixture;
use Tests\TestCase;

/**
 * Gate 4d: Operations & Specialty cards (54 cards) validation test per §4, §8.1 of RECKONER_TRUTH_REBUILD_PLAN.md.
 *
 * Slice 4d covers 9 specialty modules with 54 total cards in the registry:
 * - table_service   (8 cards: tables.*) — 6 implemented_unverified, 2 unimplemented
 * - park_recall     (5 cards: park.*)   — 3 implemented_unverified, 2 unimplemented
 * - pre_sales       (5 cards: presales.*) — all 5 unimplemented
 * - cash_register   (7 cards: register.*) — all 7 unimplemented
 * - bank_reconciliation (5 cards: recon.*) — all 5 unimplemented
 * - fixed_assets    (6 cards: assets.*) — 1 implemented_unverified, 5 unimplemented
 * - loans           (6 cards: loans.*) — 2 implemented_unverified, 4 unimplemented
 * - reports         (6 cards: reports.*) — 3 implemented_unverified, 3 unimplemented
 * - ai_insights     (6 cards: ai.*) — all 6 implemented_unverified
 *
 * Implemented (21): park.open_count, park.open_value, park.oldest,
 *   tables.occupied, tables.occupancy_rate, tables.kitchen_pending, tables.avg_turn_minutes,
 *   tables.revenue_per_table, tables.peak_occupancy,
 *   assets.gross_value, loans.outstanding_total, loans.outstanding_trend,
 *   reports.pnl_shortcut, reports.sales_shortcut, reports.stock_shortcut,
 *   ai.top_insight, ai.alerts_open, ai.anomalies, ai.forecast_revenue, ai.forecast_cash,
 *   ai.reorder_suggestions
 * Unimplemented (33): the remaining 33 cards
 */
class Slice4dOperationsGateTest extends TestCase
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

        if ($this->user && $this->tenant) {
            $this->user->current_tenant_id = $this->tenant->id;
            $this->user->getActiveMembership($this->tenant->id);
            // Prime permissions attribute in memory
            $this->user->getPermissionsAttribute();
        }
    }

    /**
     * 1. Assert all 21 implemented Slice 4d cards resolve cleanly without error.
     *
     * These 21 cards are implemented_unverified per the census-phase6.md census:
     * park (3), tables (6), assets.gross_value, loans (2), reports shortcut (3), ai (6).
     */
    public function test_slice4d_implemented_cards_resolve_without_error(): void
    {
        $engine = app(MeasureEngine::class);

        $implemented21 = [
            'park.open_count', 'park.open_value', 'park.oldest',
            'tables.occupied', 'tables.occupancy_rate', 'tables.kitchen_pending',
            'tables.avg_turn_minutes', 'tables.revenue_per_table', 'tables.peak_occupancy',
            'assets.gross_value',
            'loans.outstanding_total', 'loans.outstanding_trend',
            'reports.pnl_shortcut', 'reports.sales_shortcut', 'reports.stock_shortcut',
            'ai.top_insight', 'ai.alerts_open', 'ai.anomalies',
            'ai.forecast_revenue', 'ai.forecast_cash', 'ai.reorder_suggestions',
        ];

        $requests = [];
        foreach ($implemented21 as $key) {
            $requests[] = new ReckonerRequest(
                key: $key,
                period: 'custom',
                custom: ['from' => '2026-08-01', 'to' => '2026-08-31']
            );
        }

        $ctx = new ReckonerContext($this->tenant, $this->user, 'scale');
        $results = $engine->resolve($requests, $ctx);

        $failures = [];
        foreach ($requests as $req) {
            $id = $req->getCompositeId();
            if (!isset($results[$id])) {
                $failures[] = "{$req->key}: missing result";
                continue;
            }

            $res = $results[$id];
            if (!$res->ok) {
                $failures[] = "{$req->key}: failed with {$res->errorMessage}";
                continue;
            }

            $this->assertNotNull($res->data, "{$req->key}: result data is null");
        }

        $this->assertEmpty($failures, "Slice 4d card resolution failures:\n" . implode("\n", $failures));
    }

    /**
     * 2. Assert all 33 unimplemented Slice 4d cards stay unavailable with documented reason and 0 queries.
     */
    public function test_slice4d_unimplemented_cards_stay_unavailable(): void
    {
        $reckoner = app(Reckoner::class);
        $cards = CardRegistry::all();

        $slice4dModules = [
            'table_service', 'park_recall', 'pre_sales', 'cash_register',
            'bank_reconciliation', 'fixed_assets', 'loans', 'reports', 'ai_insights'
        ];

        $unimplementedCount = 0;
        foreach ($cards as $key => $card) {
            if (!in_array($card['module'] ?? '', $slice4dModules, true)) {
                continue;
            }
            if (($card['contract_state'] ?? '') !== 'unimplemented') {
                continue;
            }

            $unimplementedCount++;
            DB::flushQueryLog();
            DB::enableQueryLog();

            $request = new ReckonerRequest($key, 'today');
            $results = $reckoner->readMany([$request], $this->user, $this->tenant);
            $queryCount = count(DB::getQueryLog());
            DB::disableQueryLog();

            $this->assertSame(0, $queryCount, "Unimplemented card '{$key}' executed {$queryCount} queries!");

            $res = reset($results);
            $this->assertNotNull($res, "No result returned for '{$key}'.");
            $this->assertFalse($res->ok, "Unimplemented card '{$key}' returned ok=true!");
            $this->assertSame('unavailable', $res->status, "Unimplemented card '{$key}' returned status '{$res->status}' instead of 'unavailable'!");
            $this->assertNotEmpty($card['status_reason'], "Unimplemented card '{$key}' missing status_reason!");
        }

        $this->assertSame(33, $unimplementedCount, "Expected exactly 33 unimplemented cards in Slice 4d.");
    }

    /**
     * 3. Invariant: reports.stock_shortcut ties to inventory.stock_value (6,500.00).
     */
    public function test_slice4d_stock_shortcut_ties_to_stock_value(): void
    {
        $engine = app(MeasureEngine::class);
        $ctx = new ReckonerContext($this->tenant, $this->user, 'scale');

        $req = new ReckonerRequest('reports.stock_shortcut', 'custom', ['from' => '2026-08-01', 'to' => '2026-08-31']);
        $results = $engine->resolve([$req], $ctx);

        $res = $results[$req->getCompositeId()] ?? null;
        $this->assertNotNull($res);
        $this->assertTrue($res->ok);

        $totalVal = (float) $res->primaryValue();
        $this->assertEqualsWithDelta(6500.0, $totalVal, 0.01, "reports.stock_shortcut ({$totalVal}) must tie to GL inventory (6,500.00)");
    }

    /**
     * 4. Invariant: reports.pnl_shortcut Net Profit segment ties to core.net_profit (500.00).
     */
    public function test_slice4d_pnl_shortcut_ties_to_net_profit(): void
    {
        $engine = app(MeasureEngine::class);
        $ctx = new ReckonerContext($this->tenant, $this->user, 'scale');

        $req = new ReckonerRequest('reports.pnl_shortcut', 'custom', ['from' => '2026-08-01', 'to' => '2026-08-31']);
        $results = $engine->resolve([$req], $ctx);

        $res = $results[$req->getCompositeId()] ?? null;
        $this->assertNotNull($res);
        $this->assertTrue($res->ok);

        $segments = $res->data['segments'] ?? [];
        $netProfit = null;
        foreach ($segments as $seg) {
            if ($seg['label'] === 'Net Profit') {
                $netProfit = (float) $seg['value'];
                break;
            }
        }

        $this->assertNotNull($netProfit, "Net Profit segment must exist in reports.pnl_shortcut");
        $this->assertEqualsWithDelta(500.0, $netProfit, 0.01, "reports.pnl_shortcut Net Profit ({$netProfit}) must equal core.net_profit (500.00)");
    }

    /**
     * 5. Multi-tenant isolation test.
     */
    public function test_slice4d_tenant_isolation(): void
    {
        $engine = app(MeasureEngine::class);

        $sampleKeys = [
            'reports.stock_shortcut', 'reports.pnl_shortcut', 'ai.forecast_revenue', 'ai.forecast_cash'
        ];

        $requests = [];
        foreach ($sampleKeys as $key) {
            $requests[] = new ReckonerRequest(
                key: $key,
                period: 'custom',
                custom: ['from' => '2026-08-01', 'to' => '2026-08-31']
            );
        }

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

            $stockReq = new ReckonerRequest('reports.stock_shortcut', 'custom', ['from' => '2026-08-01', 'to' => '2026-08-31']);
            $stockId = $stockReq->getCompositeId();
            if (isset($results[$stockId]) && isset($results2[$stockId])) {
                $goldenVal = (float) $results[$stockId]->primaryValue();
                $otherVal  = (float) $results2[$stockId]->primaryValue();
                if ($goldenVal > 0) {
                    $this->assertNotEquals($goldenVal, $otherVal,
                        'reports.stock_shortcut returned same value for different tenants — isolation breach!');
                }
            }
        }
    }
}
