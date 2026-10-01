<?php

namespace Tests\Feature;

class ThermalPrintSettingsTest extends VenQoreTestCase
{
    public function test_sales_history_receives_saved_store_layout_after_route_middleware_binds_the_tenant(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->actingAs($owner);
        $values = [
            'default_print_type' => 'thermal', 'print_theme' => 'bold',
            'thermal_font_size' => '14', 'thermal_page_size' => '3inch',
            'margin_top' => '2', 'margin_left' => '2', 'margin_right' => '2',
            'thermal_show_headers' => '1',
        ];
        foreach ($values as $key => $value) {
            \App\Models\Setting::withoutGlobalScopes()->updateOrCreate(
                ['tenant_id' => $tenant->id, 'key' => $key], ['value' => $value]
            );
        }
        // Do not pre-bind the tenant: real web requests run Inertia's share()
        // before the route's TenantMiddleware, unlike unit-level helpers.
        $version = (new \App\Http\Middleware\HandleInertiaRequests)->version(request());
        \App\Models\Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'admin_passcode'], ['value' => 'private-hash']
        );
        \App\Models\Setting::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'openai_api_key'], ['value' => 'private-test-key']
        );
        foreach (['sales/list', 'purchases', 'payments'] as $path) {
            app()->forgetInstance('current.tenant');
            app()->forgetInstance('current.membership');
            $response = $this->get("/s/{$tenant->slug}/{$path}", [
                'X-Inertia' => 'true', 'X-Inertia-Version' => $version,
            ]);
            $response->assertOk();
            foreach ($values as $key => $value) {
                $response->assertJsonPath("props.settings.{$key}", $value);
            }
            $response->assertJsonMissingPath('props.settings.admin_passcode')
                ->assertJsonMissingPath('props.settings.openai_api_key');
        }
    }

    public function test_layout_designer_saves_the_thermal_default_and_roll_settings(): void
    {
        $tenant = $this->createTenant();
        $admin = $this->createTenantUser($tenant, 'admin');
        $this->actingAs($admin);
        $this->bindTenantContext($tenant, $admin);

        foreach (['document_layouts', 'printer_device'] as $section) {
            $values = [
                'default_print_type' => 'thermal',
                'thermal_page_size' => $section === 'document_layouts' ? '2inch' : '3inch',
                'thermal_copies' => '2',
                'thermal_custom_footer' => 'Thank you',
            ];
            $this->post(route('store.settings.update', ['store_slug' => $tenant->slug]), [
                '_save_section' => $section,
                ...$values,
                'business_name' => 'Must not overwrite another section',
            ])->assertSessionHasNoErrors()->assertRedirect();

            foreach ($values as $key => $value) {
                $this->assertDatabaseHas('settings', [
                    'tenant_id' => $tenant->id, 'key' => $key, 'value' => $value,
                ]);
            }
            $this->assertDatabaseMissing('settings', [
                'tenant_id' => $tenant->id, 'key' => 'business_name',
                'value' => 'Must not overwrite another section',
            ]);
        }
    }
}
