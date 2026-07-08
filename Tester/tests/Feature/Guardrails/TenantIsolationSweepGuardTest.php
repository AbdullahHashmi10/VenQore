<?php

namespace Tester\Tests\Feature\Guardrails;

use App\Models\Account;
use App\Models\Party;
use App\Models\Product;
use App\Models\Warehouse;
use Tests\Feature\VenQoreTestCase;

/**
 * TenantIsolationSweepGuardTest — cross-tenant leak sweep over core models.
 *
 * Global tenant scoping (App\Traits\HasTenant) is the wall that keeps one
 * store's data invisible to another. A single model missing the trait, or a
 * query using withoutGlobalScope() carelessly, punches a hole in that wall
 * that no happy-path test would ever notice.
 *
 * This provisions TWO real tenants via the same code path store creation uses
 * (seedTenantDefaults), plus a customer and a product each, then asserts — for
 * every core tenant-scoped model — that Tenant A's rows are completely
 * invisible while Tenant B's context is bound. Uses the existing
 * assertNoCrossTenantLeak helper.
 */
class TenantIsolationSweepGuardTest extends VenQoreTestCase
{
    public function test_core_models_do_not_leak_across_tenants(): void
    {
        // Tenant A — fully provisioned + a customer and a product.
        $tenantA = $this->createTenant('iso-a', 'ltd_3', 'active');
        $this->seedTenantDefaults($tenantA);
        app()->instance('current.tenant', $tenantA);
        Party::create(['name' => 'A Customer', 'type' => 'customer', 'tenant_id' => $tenantA->id]);
        Product::factory()->create(['tenant_id' => $tenantA->id, 'name' => 'A Widget', 'sku' => 'A-1']);

        // Tenant B — fully provisioned + its own customer and product.
        $tenantB = $this->createTenant('iso-b', 'ltd_3', 'active');
        $this->seedTenantDefaults($tenantB);
        app()->instance('current.tenant', $tenantB);
        Party::create(['name' => 'B Customer', 'type' => 'customer', 'tenant_id' => $tenantB->id]);
        Product::factory()->create(['tenant_id' => $tenantB->id, 'name' => 'B Widget', 'sku' => 'B-1']);

        // Restore A as the active context for the assertions' baseline.
        app()->instance('current.tenant', $tenantA);

        $models = [
            Account::class,
            Warehouse::class,
            Party::class,
            Product::class,
        ];

        foreach ($models as $model) {
            // A's rows must be invisible from B's context, and vice-versa.
            $this->assertNoCrossTenantLeak($model, $tenantA, $tenantB);
            $this->assertNoCrossTenantLeak($model, $tenantB, $tenantA);
        }
    }
}
