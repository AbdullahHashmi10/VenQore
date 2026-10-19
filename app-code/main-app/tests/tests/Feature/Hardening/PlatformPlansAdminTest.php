<?php

namespace Tests\Feature\Hardening;

use App\Models\Plan;
use App\Models\Tenant;
use App\Services\Platform\PlanRestorer;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * Hashmi Dashboard plans (2026-10-11): a deleted core plan can be restored
 * without touching other plans; core plans cannot be deleted; a new plan gets
 * a complete limit set; Assigned Plan never writes a legacy slug; and billing
 * cannot pull a store below the plan the platform assigned.
 */
class PlatformPlansAdminTest extends VenQoreTestCase
{
    private function limitCount(string $slug): int
    {
        $id = Plan::where('slug', $slug)->value('id');
        return $id ? DB::table('plan_limits')->where('plan_id', $id)->count() : 0;
    }

    #[Test]
    public function a_deleted_solo_plan_is_restored_with_full_limits_and_other_plans_are_untouched(): void
    {
        $starterId = Plan::where('slug', 'starter')->value('id');
        DB::table('plan_limits')->updateOrInsert(['plan_id' => $starterId, 'key' => 'sku_limit'], ['value' => '7777']);

        Plan::where('slug', 'solo')->delete();
        $this->assertContains('solo', app(PlanRestorer::class)->missingCore());

        $created = app(PlanRestorer::class)->restoreMissing();

        $this->assertContains('solo', $created);
        $this->assertGreaterThanOrEqual($this->limitCount('starter') - 5, $this->limitCount('solo'));
        $soloId = Plan::where('slug', 'solo')->value('id');
        $this->assertSame('500', DB::table('plan_limits')->where('plan_id', $soloId)->where('key', 'sku_limit')->value('value'));
        $this->assertSame('7777', DB::table('plan_limits')->where('plan_id', $starterId)->where('key', 'sku_limit')->value('value'));
        $this->assertSame([], app(PlanRestorer::class)->restoreMissing());
    }

    #[Test]
    public function core_plans_cannot_be_deleted(): void
    {
        $solo = Plan::where('slug', 'solo')->firstOrFail();

        $this->actingAsSuperAdmin()->delete("/VenQore/plans/{$solo->id}")->assertSessionHasErrors('plan');

        $this->assertTrue(Plan::where('slug', 'solo')->exists());
    }

    #[Test]
    public function a_new_plan_gets_every_feature_key_and_blank_limits_inherit(): void
    {
        $starter = Plan::where('slug', 'starter')->firstOrFail();

        $this->actingAsSuperAdmin()->post('/VenQore/plans', [
            'platform_id'       => $starter->platform_id,
            'name'              => 'Solo Plus',
            'slug'              => 'solo_plus',
            'type'              => 'subscription',
            'copy_from_plan_id' => $starter->id,
            'sort_order'        => 9,
            'limits'            => [
                ['key' => 'sku_limit', 'value' => '1200', 'reset_period' => 'never'],
                ['key' => 'staff_limit', 'value' => '', 'reset_period' => 'never'],
            ],
        ])->assertRedirect();

        $plan = Plan::where('slug', 'solo_plus')->firstOrFail();
        $this->assertSame($this->limitCount('starter'), $this->limitCount('solo_plus'));
        $this->assertSame('1200', DB::table('plan_limits')->where('plan_id', $plan->id)->where('key', 'sku_limit')->value('value'));
        $this->assertSame(
            DB::table('plan_limits')->where('plan_id', $starter->id)->where('key', 'staff_limit')->value('value'),
            DB::table('plan_limits')->where('plan_id', $plan->id)->where('key', 'staff_limit')->value('value')
        );
    }

    #[Test]
    public function legacy_alias_slugs_cannot_be_used_for_a_new_plan(): void
    {
        $this->actingAsSuperAdmin()->post('/VenQore/plans', [
            'platform_id' => Plan::value('platform_id'),
            'name'        => 'Growth',
            'slug'        => 'ltd',
            'type'        => 'subscription',
        ])->assertSessionHasErrors('slug');
    }

    #[Test]
    public function assigning_a_plan_writes_the_canonical_slug_and_records_the_assignment(): void
    {
        $tenant = $this->createTenant(plan: 'starter', status: 'active');

        $this->actingAsSuperAdmin()
            ->patch(route('platform.tenants.overrides.update', ['tenant' => $tenant->id]), ['plan' => 'business'])
            ->assertRedirect();

        $tenant->refresh();
        $this->assertSame('scale', $tenant->plan);
        $this->assertSame('scale', $tenant->plan_limits['platform_assigned_plan'] ?? null);
    }

    #[Test]
    public function billing_cannot_downgrade_below_a_platform_assigned_plan_but_can_upgrade(): void
    {
        $tenant = $this->createTenant(plan: 'core', status: 'active');
        $tenant->plan_limits = ['platform_assigned_plan' => 'core'];
        $tenant->save();

        $this->assertSame('core', $tenant->planFromBilling('starter'));
        $this->assertSame('scale', $tenant->planFromBilling('scale'));
    }
}
