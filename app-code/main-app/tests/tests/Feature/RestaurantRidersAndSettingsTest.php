<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestaurantRidersAndSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_restaurant_riders_crud_and_settings(): void
    {
        $tenant = Tenant::factory()->create(['plan' => 'growth']);
        app()->instance('current.tenant', $tenant);

        $user = User::factory()->create(['is_platform_admin' => true]);
        $this->actingAs($user);

        // 1. Visit Riders Index Page
        $res = $this->get('/s/' . $tenant->slug . '/restaurant/riders');
        $res->assertStatus(200);

        // 2. Add a new delivery rider
        $storeResp = $this->postJson('/s/' . $tenant->slug . '/restaurant/riders', [
            'name'            => 'Alex Swift',
            'phone'           => '+1 555-4321',
            'commission_rate' => 2.50,
            'notes'           => 'Yamaha 125cc',
        ]);

        $storeResp->assertStatus(200);
        $storeResp->assertJsonPath('success', true);
        $storeResp->assertJsonPath('rider.name', 'Alex Swift');
        $storeResp->assertJsonPath('rider.commission_rate', 2.50);

        $this->assertDatabaseHas('employees', [
            'tenant_id' => $tenant->id,
            'name'      => 'Alex Swift',
            'is_rider'  => true,
            'status'    => 'active',
        ]);

        $riderId = $storeResp->json('rider.id');

        // 3. Update the rider
        $updateResp = $this->putJson('/s/' . $tenant->slug . '/restaurant/riders/' . $riderId, [
            'name'            => 'Alex Fast',
            'phone'           => '+1 555-9999',
            'commission_rate' => 3.00,
            'status'          => 'active',
            'notes'           => 'Electric Scooter',
        ]);

        $updateResp->assertStatus(200);
        $updateResp->assertJsonPath('rider.name', 'Alex Fast');
        $updateResp->assertJsonPath('rider.commission_rate', 3);

        // 4. Update Restaurant Settings
        $settingsResp = $this->postJson('/s/' . $tenant->slug . '/restaurant/settings', [
            'prepares_orders' => '1',
            'lane_delivery'   => '1',
            'service_mode'    => 'both',
        ]);

        $settingsResp->assertStatus(200);
        $settingsResp->assertJsonPath('success', true);

        $this->assertDatabaseHas('settings', [
            'tenant_id' => $tenant->id,
            'key'       => 'prepares_orders',
            'value'     => '1',
        ]);
        $this->assertDatabaseHas('settings', [
            'tenant_id' => $tenant->id,
            'key'       => 'lane_delivery',
            'value'     => '1',
        ]);

        // 5. Deactivate rider
        $delResp = $this->deleteJson('/s/' . $tenant->slug . '/restaurant/riders/' . $riderId);
        $delResp->assertStatus(200);
        $delResp->assertJsonPath('success', true);

        $this->assertDatabaseHas('employees', [
            'id'       => $riderId,
            'is_rider' => false,
            'status'   => 'terminated',
        ]);
    }
}
