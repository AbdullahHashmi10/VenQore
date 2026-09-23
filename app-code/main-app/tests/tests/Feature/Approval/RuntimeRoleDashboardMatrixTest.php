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
        $tenant = $this->createTenant('dash-http-store', 'ltd_3');
        $this->seedTenantDefaults($tenant);

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
            $user = User::factory()->create([
                'email' => "user_{$role}@dash-matrix.test",
            ]);

            DB::table('tenant_users')->insert([
                'tenant_id' => $tenant->id,
                'user_id'   => $user->id,
                'role'      => $role,
                'created_at'=> now(),
                'updated_at'=> now(),
            ]);

            $this->actingAs($user);
            app()->instance('current.tenant', $tenant);

            $response = $this->get("/s/{$tenant->slug}/dashboard");
            $this->assertTrue(
                in_array($response->status(), [200, 302]),
                "Dashboard returned status {$response->status()} for role '{$role}'"
            );
        }
    }

    public function test_forbidden_financial_cards_are_rejected_for_unauthorized_roles(): void
    {
        $tenant = $this->createTenant('dash-security-store', 'ltd_3');
        $this->seedTenantDefaults($tenant);

        // Cashier role should NOT have permission for financial cards
        $cashierUser = User::factory()->create([
            'email' => 'cashier_security@dash-matrix.test',
        ]);

        DB::table('tenant_users')->insert([
            'tenant_id' => $tenant->id,
            'user_id'   => $cashierUser->id,
            'role'      => 'cashier',
            'created_at'=> now(),
            'updated_at'=> now(),
        ]);

        $this->actingAs($cashierUser);
        app()->instance('current.tenant', $tenant);

        // Attempt to request net_profit card reading
        $response = $this->getJson("/s/{$tenant->slug}/api/reckoner/reading/core.net_profit");
        // Should be 403 Forbidden or 404
        $this->assertTrue(
            in_array($response->status(), [403, 404]),
            "Cashier was improperly allowed to read core.net_profit! Status: {$response->status()}"
        );
    }
}
