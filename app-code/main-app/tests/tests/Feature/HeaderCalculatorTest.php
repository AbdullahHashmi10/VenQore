<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\TenantUser;
use App\Helpers\SettingsHelper;
use Tests\Feature\VenQoreTestCase;

class HeaderCalculatorTest extends VenQoreTestCase
{
    public function test_authorized_admin_can_enable_and_disable_header_calculator_setting(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');

        $this->actingAs($admin);
        $this->bindTenantContext($tenant, $admin);

        // Enable calculator setting
        $response = $this->post(route('store.settings.update', ['store_slug' => $tenant->slug]), [
            'header_calculator_enabled' => '1',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('settings', [
            'tenant_id' => $tenant->id,
            'key' => 'header_calculator_enabled',
            'value' => '1',
        ]);

        // Disable calculator setting
        $response = $this->post(route('store.settings.update', ['store_slug' => $tenant->slug]), [
            'header_calculator_enabled' => '0',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('settings', [
            'tenant_id' => $tenant->id,
            'key' => 'header_calculator_enabled',
            'value' => '0',
        ]);
    }

    public function test_nested_settings_form_payload_submits_successfully(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');

        $this->actingAs($owner);
        $this->bindTenantContext($tenant, $owner);

        // Actual Inertia/Admin settings form sends nested ['settings' => [...]] payload
        $response = $this->post(route('store.settings.update', ['store_slug' => $tenant->slug]), [
            'settings' => [
                'header_calculator_enabled' => '1',
                'language' => 'en',
                'date_format' => 'DD/MM/YYYY',
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('settings', [
            'tenant_id' => $tenant->id,
            'key' => 'header_calculator_enabled',
            'value' => '1',
        ]);
    }

    public function test_submitting_settings_form_without_touching_calculator_key_works(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');

        $this->actingAs($owner);
        $this->bindTenantContext($tenant, $owner);

        $response = $this->post(route('store.settings.update', ['store_slug' => $tenant->slug]), [
            'language' => 'en',
            'date_format' => 'DD/MM/YYYY',
        ]);

        $response->assertSessionHasNoErrors();
    }

    public function test_invalid_setting_values_are_rejected(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');

        $this->actingAs($owner);
        $this->bindTenantContext($tenant, $owner);

        // Post invalid value '2'
        $response = $this->post(route('store.settings.update', ['store_slug' => $tenant->slug]), [
            'header_calculator_enabled' => '2',
        ]);

        $response->assertSessionHasErrors(['header_calculator_enabled']);

        // Post invalid string value 'invalid'
        $response = $this->post(route('store.settings.update', ['store_slug' => $tenant->slug]), [
            'header_calculator_enabled' => 'invalid',
        ]);

        $response->assertSessionHasErrors(['header_calculator_enabled']);

        // Nested invalid payload
        $responseNested = $this->post(route('store.settings.update', ['store_slug' => $tenant->slug]), [
            'settings' => [
                'header_calculator_enabled' => 'invalid',
            ],
        ]);

        $responseNested->assertSessionHasErrors(['settings.header_calculator_enabled']);
    }

    public function test_user_without_settings_manage_permission_cannot_change_setting(): void
    {
        $tenant = $this->createTenant();
        $cashier = $this->createTenantUser($tenant, 'cashier');

        $this->actingAs($cashier);
        $this->bindTenantContext($tenant, $cashier);

        // Cashier attempts to update store settings
        $response = $this->post(route('store.settings.update', ['store_slug' => $tenant->slug]), [
            'header_calculator_enabled' => '1',
        ]);

        // Gated by permission:admin.settings_manage middleware (403 forbidden)
        $response->assertStatus(403);
    }

    public function test_same_user_store_switch_preserves_tenant_isolation_and_inertia_shared_setting(): void
    {
        // Business A and Business B
        $tenantA = $this->createTenant('business-a');
        $tenantB = $this->createTenant('business-b');

        // Same user is owner in Business A and Business B
        $user = $this->createTenantUser($tenantA, 'owner');
        TenantUser::create([
            'tenant_id'    => $tenantB->id,
            'user_id'      => $user->id,
            'role'         => 'owner',
            'status'       => 'active',
            'display_name' => $user->name,
            'joined_at'    => now(),
        ]);

        // 1. Enable header_calculator_enabled = '1' for Business A
        $this->actingAs($user);
        $this->bindTenantContext($tenantA, $user);
        $this->post(route('store.settings.update', ['store_slug' => $tenantA->slug]), [
            'header_calculator_enabled' => '1',
        ]);

        // Verify Business A has database row with tenant_id = tenantA->id and value = '1'
        $this->assertDatabaseHas('settings', [
            'tenant_id' => $tenantA->id,
            'key' => 'header_calculator_enabled',
            'value' => '1',
        ]);

        // 2. Request Business A settings page and verify shared Inertia settings.header_calculator_enabled is '1'
        $responseA = $this->actingAs($user)->get(route('store.settings', ['store_slug' => $tenantA->slug]));
        $responseA->assertStatus(200);
        $pagePropsA = $responseA->original->getData()['page']['props'];
        $this->assertEquals('1', $pagePropsA['settings']['header_calculator_enabled'] ?? null);

        // 3. Switch context to Business B (where calculator setting is '0' or absent)
        $responseB = $this->actingAs($user)->get(route('store.settings', ['store_slug' => $tenantB->slug]));
        $responseB->assertStatus(200);
        $pagePropsB = $responseB->original->getData()['page']['props'];
        $this->assertNotEquals('1', $pagePropsB['settings']['header_calculator_enabled'] ?? null);

        // 4. Switch back to Business A and verify shared Inertia setting remains '1'
        $responseA2 = $this->actingAs($user)->get(route('store.settings', ['store_slug' => $tenantA->slug]));
        $responseA2->assertStatus(200);
        $pagePropsA2 = $responseA2->original->getData()['page']['props'];
        $this->assertEquals('1', $pagePropsA2['settings']['header_calculator_enabled'] ?? null);

        // 5. Update Business B settings to '0' and prove Business A row remains unchanged ('1')
        $this->actingAs($user);
        $this->bindTenantContext($tenantB, $user);
        $this->post(route('store.settings.update', ['store_slug' => $tenantB->slug]), [
            'header_calculator_enabled' => '0',
        ]);

        $this->assertDatabaseHas('settings', [
            'tenant_id' => $tenantA->id,
            'key' => 'header_calculator_enabled',
            'value' => '1',
        ]);

        $this->assertDatabaseHas('settings', [
            'tenant_id' => $tenantB->id,
            'key' => 'header_calculator_enabled',
            'value' => '0',
        ]);

        // 6. Confirm per-tenant cache partitioning
        $this->bindTenantContext($tenantA, $user);
        SettingsHelper::clearCache();
        $this->assertEquals('1', SettingsHelper::get('header_calculator_enabled', '0'));

        $this->bindTenantContext($tenantB, $user);
        SettingsHelper::clearCache();
        $this->assertEquals('0', SettingsHelper::get('header_calculator_enabled', '0'));
    }
}
