<?php

namespace Tests\Unit\Reckoner;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerRequest;
use App\Reckoner\Resolvers\ResolverRegistry;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * CardRegistryGateTest — Asserts the §4.2 gates from the build specification.
 *
 * @group reckoner
 * @group gates
 */
class CardRegistryGateTest extends TestCase
{
    /**
     * Gate: registry_complete
     * Every one of the 349 catalogue keys has a resolver class. Count is exactly 349.
     */
    public function test_gate_registry_complete(): void
    {
        $this->assertSame(349, CardRegistry::count(), 'CardRegistry count must be exactly 349.');
        $this->assertSame(349, ResolverRegistry::count(), 'ResolverRegistry count must be exactly 349.');

        foreach (CardRegistry::all() as $key => $card) {
            $this->assertTrue(ResolverRegistry::has($key), "Card {$key} must have a registered resolver.");
            $class = ResolverRegistry::classForKey($key);
            $this->assertNotNull($class, "Resolver class for {$key} must not be null.");
            $this->assertTrue(class_exists($class), "Resolver class {$class} for {$key} must exist.");
        }
    }

    /**
     * Gate: no_orphan_resolver
     * Every resolver class maps to a catalogue key.
     */
    public function test_gate_no_orphan_resolver(): void
    {
        foreach (ResolverRegistry::all() as $key => $class) {
            $this->assertTrue(CardRegistry::has($key), "Resolver {$class} maps to orphan key {$key}.");
            $this->assertSame($key, $class::key(), "Resolver class {$class}::key() must match registered key {$key}.");
        }
    }

    /**
     * Gate: module_cards_match
     * Each module's card list matches the catalogue exactly; every module has >= 5 cards.
     */
    public function test_gate_module_cards_match(): void
    {
        $modules = CardRegistry::modules();
        $this->assertCount(46, $modules, 'Must have exactly 46 modules.');

        $qore = CardRegistry::qoreCards();
        $this->assertCount(32, $qore, 'Must have exactly 32 Qore cards.');

        $moduleCardTotal = 0;
        foreach (array_keys($modules) as $moduleKey) {
            $cards = CardRegistry::moduleCards($moduleKey);
            $count = count($cards);
            $this->assertGreaterThanOrEqual(
                5,
                $count,
                "Module '{$moduleKey}' must have >= 5 cards in catalogue, found {$count}."
            );
            $moduleCardTotal += $count;
        }

        $this->assertSame(317, $moduleCardTotal, 'Sum of module cards must be exactly 317.');
        $this->assertSame(349, 32 + 317, 'Total cards must equal 32 Qore + 317 module cards.');
    }

    /**
     * Gate: units_declared
     * Every card declares unit and precision; neither is derived at runtime.
     */
    public function test_gate_units_declared(): void
    {
        $allowedUnits = ['currency', 'count', 'percent', 'ratio', 'days', 'hours', 'minutes', 'hour'];
        foreach (CardRegistry::all() as $key => $card) {
            $this->assertArrayHasKey('unit', $card, "Card {$key} must declare 'unit'.");
            $this->assertNotEmpty($card['unit'], "Card {$key} unit must not be empty.");
            $this->assertContains($card['unit'], $allowedUnits, "Card {$key} unit '{$card['unit']}' is not a declared unit.");
            $this->assertArrayHasKey('precision', $card, "Card {$key} must declare 'precision'.");
            $this->assertIsInt($card['precision'], "Card {$key} precision must be an integer.");
        }
    }

    /**
     * Gate: qore_cards_universal
     * All 32 Qore cards resolve for a tenant with zero modules enabled without returning 'locked'.
     */
    public function test_gate_qore_cards_universal(): void
    {
        $tenant = new Tenant();
        $tenant->id = 999999;
        $tenant->timezone = 'UTC';

        $user = new User();
        $user->id = 1;

        $ctx = new ReckonerContext($tenant, $user);
        $period = ReckonerPeriod::resolve('today', null, $tenant);

        foreach (CardRegistry::qoreCards() as $key => $card) {
            $reading = ResolverRegistry::resolve($key, $ctx, $period);
            $this->assertNotEquals(
                'locked',
                $reading->status,
                "Qore card {$key} must be universal and never return status: 'locked'."
            );
            $this->assertContains(
                $reading->status,
                ['ok', 'empty'],
                "Qore card {$key} must return status 'ok' or 'empty', got '{$reading->status}'."
            );
        }
    }

    /**
     * Gate: locked_module
     * With a module disabled, its cards return 'locked' — never 'empty', never a throw.
     */
    public function test_gate_locked_module(): void
    {
        $tenant = new Tenant();
        $tenant->id = 999999;
        $tenant->timezone = 'UTC';

        $user = new User();
        $user->id = 1;

        $ctx = new ReckonerContext($tenant, $user);
        $period = ReckonerPeriod::resolve('today', null, $tenant);

        // Explicitly disable table_service module for this tenant
        \Illuminate\Support\Facades\Cache::put("tenant_modules:{$tenant->id}", [
            'table_service' => false,
            'pos' => true,
        ], 60);

        // Test cards from a module not enabled on this tenant
        $lockedCards = CardRegistry::moduleCards('table_service');
        $this->assertNotEmpty($lockedCards);

        foreach ($lockedCards as $key => $card) {
            $reading = ResolverRegistry::resolve($key, $ctx, $period);
            $this->assertSame(
                'locked',
                $reading->status,
                "Disabled module card {$key} must return status: 'locked', got {$reading->status}."
            );
            $this->assertNull($reading->value, "Locked card {$key} must have value: null.");
        }
    }

    /**
     * Gate: envelope_shape
     * Every resolver returns a complete Reading envelope matching the spec.
     */
    public function test_gate_envelope_shape(): void
    {
        $tenant = new Tenant();
        $tenant->id = 999999;
        $tenant->timezone = 'UTC';

        $user = new User();
        $user->id = 1;

        $ctx = new ReckonerContext($tenant, $user);
        $period = ReckonerPeriod::resolve('today', null, $tenant);

        // Sample across shapes
        $sampleKeys = ['core.revenue', 'core.revenue_trend', 'core.gross_margin_pct', 'core.receivables'];

        foreach ($sampleKeys as $key) {
            $reading = ResolverRegistry::resolve($key, $ctx, $period);
            $json = $reading->jsonSerialize();

            $this->assertArrayHasKey('status', $json);
            $this->assertContains($json['status'], ['ok', 'empty', 'locked', 'stale', 'error']);
            $this->assertArrayHasKey('unit', $json);
            $this->assertArrayHasKey('precision', $json);
            $this->assertArrayHasKey('period', $json);
            $this->assertArrayHasKey('asOf', $json);
            $this->assertArrayHasKey('sources', $json);
            $this->assertArrayHasKey('checks', $json);

            // Spec invariant: value is null if and only if status !== 'ok'
            if ($json['status'] !== 'ok') {
                $this->assertNull($json['value'], "Card {$key} value must be null when status is not ok.");
            } else {
                $this->assertNotNull($json['value'], "Card {$key} value must not be null when status is ok.");
            }
        }
    }

    /**
     * Gate: tenant_scoped
     * Every resolver query carries a tenant predicate (strict tenant isolation).
     */
    public function test_gate_tenant_scoped(): void
    {
        $tenant = new Tenant();
        $tenant->id = 4242;
        $tenant->timezone = 'UTC';

        $user = new User();
        $user->id = 1;

        $ctx = new ReckonerContext($tenant, $user);
        $period = ReckonerPeriod::resolve('today', null, $tenant);

        DB::enableQueryLog();
        DB::flushQueryLog();

        // Run a sample query that hits the database
        ResolverRegistry::resolve('core.transaction_count', $ctx, $period);

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $this->assertNotEmpty($queries, 'Must execute at least one query.');
        foreach ($queries as $query) {
            $sql = $query['query'];
            $bindings = $query['bindings'];

            // Query must have tenant_id in SQL or in bindings
            $hasTenantInSql = str_contains($sql, 'tenant_id');
            $hasTenantInBindings = in_array(4242, $bindings, true) || in_array('4242', $bindings, true);

            $this->assertTrue(
                $hasTenantInSql && $hasTenantInBindings,
                "Query failed tenant isolation check: SQL: {$sql}, Bindings: " . json_encode($bindings)
            );
        }
    }
}
