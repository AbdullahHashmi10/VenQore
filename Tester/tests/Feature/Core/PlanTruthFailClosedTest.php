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
        $starter = $this->createTenant('plantruth-b', 'starter');
        $this->seedTenantDefaults($starter);
        app()->instance('current.tenant', $starter);
        $f = $starter->featuresArray();
        $this->assertFalse($f['recurring_invoices'], 'Starter must not have recurring_invoices (seeder: 0).');
        $this->assertFalse($f['fund_management'], 'Starter must not have fund_management (seeder: 0).');

        $growth = $this->createTenant('plantruth-c', 'growth');
        $this->seedTenantDefaults($growth);
        app()->instance('current.tenant', $growth);
        $f = $growth->featuresArray();
        $this->assertTrue($f['recurring_invoices'], 'Growth must have recurring_invoices (seeder: 1).');
        $this->assertTrue($f['fund_management'], 'Growth must have fund_management (seeder: 1).');
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

        // Seeder writes string values ('1'/'0'/numeric strings); config used
        // PHP booleans/ints. String-typed values prove the table was the source.
        $this->assertNotEmpty($json, 'LTD snapshot must not be empty.');
        $this->assertSame('2000', (string) ($json['transactions_per_month'] ?? null), 'ltd_2 tx cap must be 2000 (from seeded table).');
        $this->assertArrayHasKey('recurring_invoices', $json, 'New seeded keys must be present in the LTD snapshot.');
    }
}
