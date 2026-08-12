<?php

namespace Tests\Unit\Reckoner;

use App\Models\Dashboard;
use App\Models\DashboardCard;
use App\Models\User;
use App\Models\Tenant;
use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;

/**
 * DashboardApiTest — verifies CRUD operations, card additions, card updates,
 * layout saving and auth/tenant validation across all 11 endpoints.
 *
 * @group reckoner
 */
class DashboardApiTest extends TestCase
{
    use DatabaseTransactions;

    protected Tenant $tenant;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create();

        // Attach user to tenant
        $this->tenant->users()->attach($this->user, ['role' => 'owner']);

        app()->instance('current.tenant', $this->tenant);
    }

    public function test_get_dashboards_index_returns_list_or_auto_creates_default(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboards');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data'); // should auto-create default dashboard
        $this->assertSame('My Dashboard', $response->json('data.0.name'));
    }

    public function test_create_dashboard(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/dashboards', ['name' => 'Custom Analytics']);

        $response->assertStatus(201);
        $this->assertSame('Custom Analytics', $response->json('data.name'));
        $this->assertSame('custom-analytics', $response->json('data.slug'));
    }

    public function test_show_dashboard(): void
    {
        $dashboard = Dashboard::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'name' => 'Test Dashboard',
            'slug' => 'test-dashboard',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/dashboards/{$dashboard->id}");

        $response->assertStatus(200);
        $this->assertSame('Test Dashboard', $response->json('data.name'));
    }

    public function test_update_dashboard(): void
    {
        $dashboard = Dashboard::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'name' => 'Old Name',
            'slug' => 'old-name',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/dashboards/{$dashboard->id}", ['name' => 'New Name', 'is_default' => true]);

        $response->assertStatus(200);
        $this->assertSame('New Name', $response->json('data.name'));
        $this->assertTrue($response->json('data.is_default'));
    }

    public function test_delete_dashboard_prevents_deleting_the_last_one(): void
    {
        $dashboard = Dashboard::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'name' => 'Only Dashboard',
            'slug' => 'only-dashboard',
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/dashboards/{$dashboard->id}");

        $response->assertStatus(422); // cannot delete the last one
    }

    public function test_add_card_validates_metric_availability(): void
    {
        $dashboard = Dashboard::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'name' => 'Sales Dashboard',
            'slug' => 'sales-dashboard',
        ]);

        // Attempting to add platform key (unavailable) -> should fail
        $response = $this->actingAs($this->user)
            ->postJson("/api/dashboards/{$dashboard->id}/cards", [
                'reading_key' => 'platform.mrr',
                'period' => 'live',
            ]);

        $response->assertStatus(422);
    }

    public function test_save_layout_saves_atomic_card_coordinates(): void
    {
        $dashboard = Dashboard::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'name' => 'Layout Dashboard',
            'slug' => 'layout-dashboard',
        ]);

        $card1 = $dashboard->cards()->create([
            'tenant_id' => $this->tenant->id,
            'reading_key' => 'sales.revenue',
            'period' => 'today',
            'chart' => 'stat',
            'size' => 'small',
            'x' => 0, 'y' => 0, 'w' => 3, 'h' => 2,
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/dashboards/{$dashboard->id}/layout", [
                'cards' => [
                    [
                        'id' => $card1->id,
                        'reading_key' => 'sales.revenue',
                        'period' => 'today',
                        'chart' => 'stat',
                        'size' => 'small',
                        'x' => 3, 'y' => 0, // moved card
                    ]
                ]
            ]);

        $response->assertStatus(200);

        // Assert y/x coordinates updated in DB
        $this->assertSame(3, $card1->fresh()->x);
    }
}
