<?php

namespace Tests\Feature\Reckoner;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use App\Reckoner\Engine\MeasureEngine;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerRequest;
use Illuminate\Support\Facades\DB;
use Tests\Fixtures\ReckonerGoldenStoreFixture;
use Tests\TestCase;

/**
 * Gate 4a: Money cards (84 cards) validation test per §4, §8.1 of RECKONER_TRUTH_REBUILD_PLAN.md.
 */
class Slice4aMoneyGateTest extends TestCase
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
            $this->user = $built['user'];
        } else {
            $this->user = User::where('email', 'golden-owner@venqore.com')->first();
        }
    }

    /**
     * 1. Assert all 42 verified cards in Slice 4a match hand-computed expected values.
     */
    public function test_slice4a_verified_cards_match_hand_computed_expected_values(): void
    {
        $engine = app(MeasureEngine::class);
        $period = ReckonerPeriod::resolve('custom', ['from' => '2026-08-01', 'to' => '2026-08-31'], $this->tenant);
        $cards = CardRegistry::all();
        $expected = ReckonerGoldenStoreFixture::EXPECTED_VALUES;

        $prefixes = ['core', 'accounting', 'khata', 'tax', 'bank', 'payments', 'expenses'];
        $requests = [];

        foreach ($cards as $key => $card) {
            $p = explode('.', $key)[0];
            if (in_array($p, $prefixes, true) && ($card['contract_state'] ?? '') === 'verified') {
                $requests[] = new ReckonerRequest(
                    key: $key,
                    period: 'custom',
                    custom: ['from' => '2026-08-01', 'to' => '2026-08-31']
                );
            }
        }

        $this->assertGreaterThanOrEqual(40, count($requests), 'Expected at least 40 verified cards in Slice 4a.');

        $ctx = new ReckonerContext($this->tenant, $this->user);
        $results = $engine->resolve($requests, $ctx);

        foreach ($requests as $req) {
            $key = $req->key;
            $id = $req->getCompositeId();
            $this->assertArrayHasKey($id, $results, "No result returned for card {$key}");

            $res = $results[$id];
            $this->assertTrue($res->ok, "Card {$key} failed with: {$res->errorMessage}");
            $this->assertSame('ok', $res->status, "Card {$key} returned status '{$res->status}' instead of 'ok'");

            $actual = (float) $res->primaryValue();
            $this->assertArrayHasKey($key, $expected, "Card {$key} has no expected value in fixture.");
            $exp = (float) $expected[$key];

            $this->assertEqualsWithDelta(
                $exp,
                $actual,
                0.01,
                "Card {$key} mismatch: actual {$actual} vs expected {$exp}"
            );
        }
    }

    /**
     * 2. Assert all mathematical accounting invariants hold across Slice 4a readings.
     */
    public function test_slice4a_accounting_invariants(): void
    {
        $engine = app(MeasureEngine::class);
        $ctx = new ReckonerContext($this->tenant, $this->user);

        $keys = [
            'core.revenue', 'core.cogs', 'core.gross_profit', 'core.expenses_total', 'core.net_profit',
            'core.receivables', 'khata.receivable_total',
            'core.payables', 'khata.payable_total',
            'core.total_liquidity', 'bank.balances_total',
            'accounting.assets_total', 'accounting.liabilities_total', 'accounting.equity_total',
            'tax.collected', 'tax.paid', 'tax.net_liability',
            'payments.received', 'payments.paid', 'payments.net_flow',
        ];

        $requests = array_map(
            fn ($k) => new ReckonerRequest($k, 'custom', ['from' => '2026-08-01', 'to' => '2026-08-31']),
            $keys
        );

        $results = $engine->resolve($requests, $ctx);
        $v = [];
        foreach ($requests as $req) {
            $v[$req->key] = (float) $results[$req->getCompositeId()]->primaryValue();
        }

        // Invariant 1: Gross Profit Identity (Revenue - COGS == Gross Profit)
        $this->assertEqualsWithDelta(
            $v['core.gross_profit'],
            $v['core.revenue'] - $v['core.cogs'],
            0.01,
            'Invariant failed: Gross profit != Revenue - COGS'
        );

        // Invariant 2: Net Profit Identity (Gross Profit - Expenses == Net Profit)
        $this->assertEqualsWithDelta(
            $v['core.net_profit'],
            $v['core.gross_profit'] - $v['core.expenses_total'],
            0.01,
            'Invariant failed: Net profit != Gross profit - Expenses'
        );

        // Invariant 3: Accounting Equation (Assets == Liabilities + Equity)
        $this->assertEqualsWithDelta(
            $v['accounting.assets_total'],
            $v['accounting.liabilities_total'] + $v['accounting.equity_total'],
            0.01,
            'Invariant failed: Assets != Liabilities + Equity'
        );

        // Invariant 4: AR Control (Core Receivables == Khata Receivable Total)
        $this->assertEqualsWithDelta(
            $v['core.receivables'],
            $v['khata.receivable_total'],
            0.01,
            'Invariant failed: Core receivables != Khata receivable total'
        );

        // Invariant 5: AP Control (Core Payables == Khata Payable Total)
        $this->assertEqualsWithDelta(
            $v['core.payables'],
            $v['khata.payable_total'],
            0.01,
            'Invariant failed: Core payables != Khata payable total'
        );

        // Invariant 6: Tax Control (Net Liability == Collected - Paid)
        $this->assertEqualsWithDelta(
            $v['tax.net_liability'],
            $v['tax.collected'] - $v['tax.paid'],
            0.01,
            'Invariant failed: Tax net liability != Collected - Paid'
        );

        // Invariant 7: Payments Net Flow (Net Flow == Received - Paid)
        $this->assertEqualsWithDelta(
            $v['payments.net_flow'],
            $v['payments.received'] - $v['payments.paid'],
            0.01,
            'Invariant failed: Payments net flow != Received - Paid'
        );
    }

    /**
     * 3. Tenant isolation: verify reading Tenant A does not bleed data into or from Tenant B.
     */
    public function test_tenant_isolation_no_cross_tenant_bleed(): void
    {
        $tenantB = Tenant::firstOrCreate(
            ['slug' => 'test-isolated-tenant-b'],
            [
                'name' => 'Tenant B Isolation Test',
                'status' => 'active',
                'plan' => 'scale',
                'timezone' => 'Asia/Karachi',
            ]
        );

        $userB = User::firstOrCreate(
            ['email' => 'tenant-b-owner@venqore.com'],
            ['name' => 'Owner B', 'password' => bcrypt('secret')]
        );

        $engine = app(MeasureEngine::class);

        $reqA = new ReckonerRequest('core.revenue', 'custom', ['from' => '2026-08-01', 'to' => '2026-08-31']);
        $ctxA = new ReckonerContext($this->tenant, $this->user);
        $resA = $engine->resolve([$reqA], $ctxA);
        $valA = (float) $resA[$reqA->getCompositeId()]->primaryValue();

        $reqB = new ReckonerRequest('core.revenue', 'custom', ['from' => '2026-08-01', 'to' => '2026-08-31']);
        $ctxB = new ReckonerContext($tenantB, $userB);
        $resB = $engine->resolve([$reqB], $ctxB);
        $valB = (float) $resB[$reqB->getCompositeId()]->primaryValue();

        // Tenant A has 7700.0 revenue; Tenant B has 0.0
        $this->assertEqualsWithDelta(7700.0, $valA, 0.01);
        $this->assertEqualsWithDelta(0.0, $valB, 0.01);
    }

    /**
     * 4. Query inspection: verify all queries executed during card resolutions carry tenant_id.
     */
    public function test_all_queries_carry_tenant_id_predicate(): void
    {
        DB::flushQueryLog();
        DB::enableQueryLog();

        $engine = app(MeasureEngine::class);
        $ctx = new ReckonerContext($this->tenant, $this->user);

        $cards = ['core.revenue', 'accounting.assets_total', 'bank.balances_total', 'khata.receivable_total'];
        $requests = array_map(fn ($k) => new ReckonerRequest($k, 'custom', ['from' => '2026-08-01', 'to' => '2026-08-31']), $cards);

        $engine->resolve($requests, $ctx);
        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $this->assertNotEmpty($queries, 'Expected queries to be executed during resolution.');

        foreach ($queries as $q) {
            $sql = strtolower($q['query']);
            // If query touches tenant tables, it MUST include tenant_id
            if (
                str_contains($sql, 'journal_items') ||
                str_contains($sql, 'journal_entries') ||
                str_contains($sql, 'accounts') ||
                str_contains($sql, 'sales') ||
                str_contains($sql, 'payments') ||
                str_contains($sql, 'bank_accounts')
            ) {
                $this->assertStringContainsString(
                    'tenant_id',
                    $sql,
                    "Query violates tenant isolation by missing tenant_id: {$q['query']}"
                );
            }
        }
    }
}
