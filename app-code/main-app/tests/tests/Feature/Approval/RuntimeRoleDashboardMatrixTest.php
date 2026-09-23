<?php

namespace Tests\Feature\Approval;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use App\Reckoner\DashboardSanitizer;
use App\Services\Dashboard\FrameFiller;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * RuntimeRoleDashboardMatrixTest
 *
 * Enforces Gate 2: Proves that live role presets in config/dashboard_pool.php
 * resolve through the actual FrameFiller / DashboardSanitizer pipeline,
 * that every role can access their authorized dashboard HTTP view without 500s,
 * and that forbidden financial metrics are strictly denied to unauthorized roles.
 */
class RuntimeRoleDashboardMatrixTest extends VenQoreTestCase
{
    public function test_all_role_presets_resolve_through_live_sanitizer_pipeline(): void
    {
        $tenant = $this->createTenant('dash-matrix-store', 'ltd_3');
        $allCards = CardRegistry::all();
        $allCardKeys = array_keys($allCards);

        $rolesPool = config('dashboard_pool.roles', []);
        $this->assertNotEmpty($rolesPool, "Role pools must be defined in config/dashboard_pool.php");

        $expectedRoles = [
            'owner', 'admin', 'manager', 'cashier', 'accountant',
            'purchasing_officer', 'inventory_controller', 'sales_executive',
            'shift_supervisor', 'viewer'
        ];

        foreach ($expectedRoles as $role) {
            $this->assertArrayHasKey($role, $rolesPool, "Role '{$role}' missing in config/dashboard_pool.roles");
            $presetKeys = $rolesPool[$role];
            $this->assertIsArray($presetKeys);
            $this->assertNotEmpty($presetKeys, "Preset for '{$role}' cannot be empty");

            // Convert string keys to card structures for sanitizer
            $cardInputs = array_map(fn($k) => ['reading_key' => $k, 'period' => 'today', 'chart' => 'stat'], $presetKeys);
            $sanitized = DashboardSanitizer::sanitize($cardInputs, $allCardKeys);

            $this->assertNotEmpty($sanitized, "Sanitizer produced empty card set for role '{$role}'");
            $this->assertLessThanOrEqual(40, count($sanitized), "Sanitizer must clamp to max 40 cards");

            // Assert every sanitized card is legally in the catalogue
            foreach ($sanitized as $card) {
                $this->assertContains($card['reading_key'], $allCardKeys, "Sanitized key '{$card['reading_key']}' not in catalogue for role '{$role}'");
            }
        }
    }

    public function test_real_dashboard_http_route_renders_for_all_roles(): void
    {
        $rolesToTest = [
            'owner',
            'admin',
            'manager',
            'cashier',
            'accountant',
            'purchasing_officer',
            'inventory_controller',
            'sales_executive',
            'shift_supervisor',
            'viewer'
        ];

        foreach ($rolesToTest as $role) {
            $tenant = $this->createTenant("dash-{$role}-" . uniqid(), 'ltd_3');
            $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
            $this->seedTenantDefaults($tenant);

            $user = $this->createTenantUser($tenant, $role);
            $this->actingAsTenantUserModel($user, $tenant);

            $response = $this->get($this->storeUrl($tenant, '/dashboard'));
            $response->assertStatus(200);
            $response->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) =>
                $page->component('NewDashboard')
                    ->has('readings')
                    ->has('layoutLaw')
            );
        }
    }

    public function test_legacy_dashboard_v1_route_renders_expected_components(): void
    {
        $legacyMap = [
            'cashier'            => 'Dashboards/CashierDashboard',
            'accountant'         => 'Dashboards/AccountantDashboard',
            'purchasing_officer' => 'Dashboards/PurchasingDashboard',
            'viewer'             => 'Dashboards/ViewerDashboard',
            'owner'              => 'Dashboard',
        ];

        foreach ($legacyMap as $role => $expectedComponent) {
            $tenant = $this->createTenant("dash-leg-{$role}-" . uniqid(), 'ltd_3');
            $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
            $this->seedTenantDefaults($tenant);

            $user = $this->createTenantUser($tenant, $role);
            $this->actingAsTenantUserModel($user, $tenant);

            $response = $this->get($this->storeUrl($tenant, '/dashboard-v1'));
            $response->assertStatus(200);
            $response->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) =>
                $page->component($expectedComponent)
            );
        }
    }

    public function test_forbidden_financial_cards_are_rejected_for_unauthorized_roles(): void
    {
        $tenant = $this->createTenant('dash-sec-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        // Cashier role should NOT have permission for financial cards
        $cashierUser = $this->createTenantUser($tenant, 'cashier');
        $this->actingAsTenantUserModel($cashierUser, $tenant);

        // 1. Check catalogue endpoint: net_profit must be omitted
        $catResponse = $this->getJson('/api/reckoner/catalogue');
        $catResponse->assertStatus(200);
        $keys = array_column($catResponse->json('data'), 'key');
        $this->assertNotContains('core.net_profit', $keys, 'Cashier must not see core.net_profit in catalogue');

        // 2. Check batch read endpoint: net_profit must return forbidden error
        $readResponse = $this->postJson('/api/reckoner/read', [
            'requests' => [
                ['key' => 'core.net_profit', 'period' => 'today'],
            ],
        ]);
        $readResponse->assertStatus(200);
        $item = $readResponse->json('data.0');
        $this->assertEquals('forbidden', $item['error']['code'] ?? ($item['error_code'] ?? null), 'Cashier reading of core.net_profit must fail with forbidden');
    }
}
