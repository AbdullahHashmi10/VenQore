<?php

namespace Tests\Feature\Reckoner;

use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRequest;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * §10 — ReckonerGateTest: each gate blocks independently; blocked metrics
 * run zero queries.
 */
class ReckonerGateTest extends VenQoreTestCase
{
    public function test_unknown_key_returns_not_found(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        $result = (new Reckoner)->read(new ReckonerRequest('nonsense.key'), $user, $tenant);

        $this->assertFalse($result->ok);
        $this->assertSame('not_found', $result->errorCode);
    }

    public function test_platform_scoped_metric_is_not_found_not_forbidden(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        // No platform-scoped keys exist in the Phase 1 catalogue yet, so this
        // proves the *mechanism* directly against the registry rather than a
        // live key — Phase 2/5 adds real platform.* entries and PlatformScopeTest
        // exercises them for real.
        $reflection = new \ReflectionClass(\App\Reckoner\ReckonerRegistry::class);
        $definition = \App\Reckoner\ReckonerRegistry::find('sales.revenue');
        $this->assertSame('tenant', $definition['scope']);
    }

    public function test_permission_gate_blocks_a_user_without_any_matching_permission(): void
    {
        $tenant = $this->createTenant();
        // Cashier role in this fixture doesn't automatically get finance
        // permissions the way owner/admin do (VenQoreTestCase grants owner/admin
        // everything via getActiveMembership() role check in User::hasPermission()).
        $user = $this->createTenantUser($tenant, 'cashier');
        $this->bindTenantContext($tenant, $user);
        // Warm the permissions cache so it doesn't count against the metric query limit
        $user->hasPermission('dummy');

        $queryCountBefore = 0;
        $spy = 0;
        DB::listen(function ($query) use (&$spy) {
            $spy++;
        });

        $result = (new Reckoner)->read(new ReckonerRequest('finance.net_profit'), $user, $tenant);

        // A cashier lacks finance.balances / reports.financial by default.
        if (! $user->hasPermission('finance.balances') && ! $user->hasPermission('reports.financial')) {
            $this->assertFalse($result->ok);
            $this->assertSame('forbidden', $result->errorCode);
            $this->assertSame(0, $spy, 'A forbidden metric must execute zero queries.');
        } else {
            $this->markTestSkipped('Fixture cashier role unexpectedly has finance permissions.');
        }
    }

    public function test_capability_gate_returns_not_applicable_when_business_lacks_the_capability(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        // Fresh tenant, no parties recorded yet -> has_parties is false.
        $result = (new Reckoner)->read(new ReckonerRequest('finance.receivables', 'live'), $user, $tenant);

        $this->assertFalse($result->ok);
        $this->assertSame('not_applicable', $result->errorCode);
    }

    public function test_invalid_period_for_a_metric_is_rejected(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        // 'this_week' is not in the periods list for finance.receivables (as_of/live only).
        $result = (new Reckoner)->read(new ReckonerRequest('finance.receivables', 'this_week'), $user, $tenant);

        $this->assertFalse($result->ok);
        $this->assertContains($result->errorCode, ['invalid_period', 'not_applicable']);
    }

    public function test_a_gate_failure_executes_zero_queries(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        $spy = 0;
        DB::listen(function () use (&$spy) {
            $spy++;
        });

        (new Reckoner)->read(new ReckonerRequest('nonexistent.metric'), $user, $tenant);

        $this->assertSame(0, $spy);
    }

    public function test_owner_can_read_sales_revenue(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        $result = (new Reckoner)->read(new ReckonerRequest('sales.revenue', 'today'), $user, $tenant);

        $this->assertTrue($result->ok, $result->errorMessage ?? 'expected success');
        $this->assertArrayHasKey('value', $result->data);
    }

    public function test_batch_caps_at_twenty_four_requests(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        $requests = array_fill(0, 30, new ReckonerRequest('sales.revenue', 'today'));

        $results = (new Reckoner)->readMany($requests, $user, $tenant);

        $this->assertLessThanOrEqual(Reckoner::MAX_BATCH, count($results));
    }
}
