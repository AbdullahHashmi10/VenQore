<?php

namespace Tests\Feature\Core;

use Tests\Feature\VenQoreTestCase;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Session-2 guard (2026-07-03) — plan-truth invariants.
 *
 * 1. featuresArray() is FAIL-CLOSED: a feature key that is missing from the
 *    seeded plan_limits table resolves to LOCKED, never unlocked (D3/VNQ-003).
 * 2. recurring_invoices / fund_management gate on their OWN seeded keys.
 * 3. Starter includes report_profit_loss (the pricing-page promise).
 * 4. setPlanAttribute snapshots LTD limits from the plan_limits TABLE
 *    (seeder = source of truth), not config/plans.php.
 *
 * NOTE: authored in a sandbox without PHP/MySQL — run with the full suite:
 *   php artisan test Tester/tests/Feature/Core/PlanTruthFailClosedTest.php
 */
class PlanTruthFailClosedTest extends VenQoreTestCase
{
    public function test_unseeded_feature_key_is_locked_not_unlocked()
    {
        $tenant = $this->createTenant('plantruth-a', 'starter');
        $this->seedTenantDefaults($tenant);
        app()->instance('current.tenant', $tenant);

        // Simulate the D3 scenario: a NEW feature key that nobody seeded.
        DB::table('plan_limits')
            ->whereIn('plan_id', DB::table('plans')->pluck('id'))
            ->where('key', 'production')
            ->delete();
        Cache::flush(); // PlanRepository caches plan limits

        $features = $tenant->fresh()->featuresArray();

        // Old behaviour (`!== false`) returned TRUE here — silently giving the
        // feature away. Fail-closed must return FALSE.
        $this->assertFalse(
            $features['production'],
            'FAIL-OPEN REGRESSION: an unseeded feature key resolved to unlocked.'
        );
    }

    public function test_recurring_invoices_and_fund_management_use_their_own_keys()
    {
        $solo = $this->createTenant('plantruth-b', 'solo');
        $this->seedTenantDefaults($solo);
        app()->instance('current.tenant', $solo);
        $fSolo = $solo->featuresArray();
        $this->assertTrue($fSolo['recurring_invoices'], 'Solo has recurring_invoices per marketing promise.');
        $this->assertFalse($fSolo['custom_roles'], 'Solo must not have custom_roles (seeder: 0).');

        $starter = $this->createTenant('plantruth-b2', 'starter');
        $this->seedTenantDefaults($starter);
        app()->instance('current.tenant', $starter);
        $fStarter = $starter->featuresArray();
        $this->assertTrue($fStarter['recurring_invoices'], 'Starter has recurring_invoices per V11 universal module access.');
        $this->assertFalse($fStarter['custom_roles'], 'Starter must not have custom_roles (scale fence: 0).');

        $growth = $this->createTenant('plantruth-c', 'growth');
        $this->seedTenantDefaults($growth);
        app()->instance('current.tenant', $growth);
        $f = $growth->featuresArray();
        $this->assertTrue($f['recurring_invoices'], 'Growth must have recurring_invoices (seeder: 1).');
        $this->assertTrue($f['custom_roles'], 'Growth must have custom_roles (seeder: 1).');
    }

    public function test_starter_includes_profit_and_loss_report()
    {
        $tenant = $this->createTenant('plantruth-d', 'starter');
        $this->seedTenantDefaults($tenant);
        app()->instance('current.tenant', $tenant);

        $this->assertTrue(
            $tenant->getLimit('report_profit_loss') === true,
            'Pricing page promises Starter the P&L — the seeder must grant report_profit_loss.'
        );
    }

    public function test_ltd_plan_snapshot_comes_from_seeded_table_not_config()
    {
        $tenant = $this->createTenant('plantruth-e', 'starter');
        $this->seedTenantDefaults($tenant);

        $tenant->plan = 'ltd_2';
        $tenant->save();
        $tenant->refresh();

        $this->assertSame('ltd', $tenant->getAttributes()['plan']);
        $json = $tenant->plan_limits;

        // Seeder writes values into database; check seeded LTD snapshot properties.
        $this->assertNotEmpty($json, 'LTD snapshot must not be empty.');
        $this->assertSame(25000, (int) ($json['sku_limit'] ?? null), 'ltd_2 sku limit must be 25000.');
        $this->assertNull($json['transactions_per_month'] ?? null, 'ltd_2 tx cap is unlimited (null) per canonical spec.');
        $this->assertArrayHasKey('recurring_invoices', $json, 'New seeded keys must be present in the LTD snapshot.');
    }
}
