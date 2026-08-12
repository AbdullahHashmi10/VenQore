<?php

namespace Tests\Unit\Reckoner;

use App\Models\Dashboard;
use App\Models\DashboardCard;
use App\Models\User;
use App\Models\Tenant;
use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;

/**
 * DashboardLockTest — verifies layout locking, publishing, role default overrides
 * and ensures that gating checks still outrank manager-locked templates.
 *
 * @group reckoner
 */
class DashboardLockTest extends TestCase
{
    use DatabaseTransactions;

    protected Tenant $tenant;
    protected User $owner;
    protected User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();

        // Create owner (has permissions to manage settings/lock layout)
        $this->owner = User::factory()->create();
        $this->tenant->users()->attach($this->owner, ['role' => 'owner']);

        // Create staff (normal employee, lacks settings_manage)
        $this->staff = User::factory()->create();
        $this->tenant->users()->attach($this->staff, ['role' => 'cashier']);

        app()->instance('current.tenant', $this->tenant);
    }

    public function test_non_managers_cannot_publish_or_lock_layouts(): void
    {
        $dashboard = Dashboard::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->staff->id,
            'name' => 'Staff Dashboard',
            'slug' => 'staff-dashboard',
        ]);

        // Cashier attempts to publish -> 403
        $response = $this->actingAs($this->staff)
            ->postJson("/api/dashboards/{$dashboard->id}/publish", [
                'for_role' => 'cashier',
                'is_locked' => true,
            ]);

        $response->assertStatus(403);
    }

    public function test_managers_can_publish_and_lock_layouts(): void
    {
        $dashboard = Dashboard::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->owner->id,
            'name' => 'Standard cashier template',
            'slug' => 'standard-cashier-template',
        ]);

        $dashboard->cards()->create([
            'tenant_id' => $this->tenant->id,
            'reading_key' => 'sales.revenue',
            'period' => 'today',
            'chart' => 'stat',
            'size' => 'small',
        ]);

        // Owner publishes & locks for cashiers
        $response = $this->actingAs($this->owner)
            ->postJson("/api/dashboards/{$dashboard->id}/publish", [
                'for_role' => 'cashier',
                'is_locked' => true,
            ]);

        $response->assertStatus(200);

        // Verify a template dashboard is created in database
        $template = Dashboard::query()
            ->where('tenant_id', $this->tenant->id)
            ->whereNull('user_id')
            ->where('for_role', 'cashier')
            ->first();

        $this->assertNotNull($template);
        $this->assertTrue($template->is_locked);
        $this->assertCount(1, $template->cards);
    }

    public function test_locked_dashboard_blocks_user_modifications(): void
    {
        // Create a locked dashboard assigned to cashier role
        $dashboard = Dashboard::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->staff->id,
            'name' => 'Locked cashier view',
            'slug' => 'locked-cashier-view',
            'is_locked' => true, // locked
        ]);

        // Cashier attempts to add card -> 403
        $response = $this->actingAs($this->staff)
            ->postJson("/api/dashboards/{$dashboard->id}/cards", [
                'reading_key' => 'sales.revenue',
            ]);

        $response->assertStatus(403);

        // Cashier attempts to save layout -> 403
        $response = $this->actingAs($this->staff)
            ->putJson("/api/dashboards/{$dashboard->id}/layout", ['cards' => []]);

        $response->assertStatus(403);
    }

    public function test_gating_checks_outrank_manager_locked_dashboard(): void
    {
        // Create template dashboard with a finance.net_profit card
        $dashboard = Dashboard::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->staff->id,
            'name' => 'Cashier view',
            'slug' => 'cashier-view',
            'is_locked' => true,
        ]);

        // Card is finance.net_profit
        $dashboard->cards()->create([
            'tenant_id' => $this->tenant->id,
            'reading_key' => 'finance.net_profit',
            'period' => 'this_month',
            'chart' => 'stat',
            'size' => 'small',
        ]);

        // Cashier has no permission for finance.net_profit (requires finance.balances / reports.financial)
        // When showing dashboard, the net_profit card must be filtered out!
        $response = $this->actingAs($this->staff)
            ->getJson("/api/dashboards/{$dashboard->id}");

        $response->assertStatus(200);
        $this->assertEmpty($response->json('data.cards')); // filtered out!
    }
}
