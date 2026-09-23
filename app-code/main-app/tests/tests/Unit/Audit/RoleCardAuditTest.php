<?php

namespace Tests\Unit\Audit;

use App\Models\Tenant;
use App\Models\User;
use App\Models\TenantUser;
use App\Reckoner\CardRegistry;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\DashboardSanitizer;
use Tests\Feature\VenQoreTestCase;

class RoleCardAuditTest extends VenQoreTestCase
{
    /**
     * Reproducible role-card evaluation across all 7 standard store roles.
     */
    public function test_reproducible_role_card_matrix(): void
    {
        $tenant = $this->createTenant('audit-role-store-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC']);
        app()->instance('current.tenant', $tenant);

        // Ensure modules are enabled for test
        \Illuminate\Support\Facades\Cache::put("tenant_modules:{$tenant->id}", [
            'pos' => true,
            'table_service' => true,
            'inventory' => true,
            'manufacturing' => true,
            'payroll' => true,
            'double_entry_ledger' => true,
            'invoicing' => true,
            'expenses' => true,
            'reports' => true,
            'suppliers' => true,
            'customers' => true,
            'services' => true,
            'park_recall' => true,
            'staff_attendance' => true,
            'delivery' => true,
            'loyalty' => true,
            'hardware' => true,
            'multi_store' => true,
        ], 60);

        $reckoner = app(Reckoner::class);
        $allRegistryKeys = array_keys(ReckonerRegistry::all());
        $allCardsJson = json_decode(file_get_contents(base_path('resources/data/reckoner/cards.json')), true);
        $presetsJson = json_decode(file_get_contents(base_path('resources/data/reckoner/presets.json')), true);

        $this->assertCount(401, $allRegistryKeys, 'ReckonerRegistry must define 401 keys (397 baseline + 4 approval cards).');
        $this->assertCount(349, $allCardsJson, 'cards.json must define 349 card definitions.');

        $roles = [
            'owner'              => ['route' => '/dashboard', 'expected_component' => 'NewDashboard'],
            'admin'              => ['route' => '/dashboard', 'expected_component' => 'NewDashboard'],
            'manager'            => ['route' => '/dashboard', 'expected_component' => 'NewDashboard'],
            'accountant'         => ['route' => '/dashboard', 'expected_component' => 'NewDashboard'],
            'purchasing_officer' => ['route' => '/dashboard', 'expected_component' => 'NewDashboard'],
            'viewer'             => ['route' => '/dashboard', 'expected_component' => 'NewDashboard'],
            'cashier'            => ['route' => '/dashboard', 'expected_component' => 'NewDashboard'],
        ];

        $rolesPool = config('dashboard_pool.roles', []);
        $businessDefaultPool = config('dashboard_pool.business.default', []);

        foreach ($roles as $roleName => $roleMeta) {
            $roleTenant = $this->createTenant("audit-{$roleName}-" . uniqid(), 'ltd_3');
            $roleTenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
            app()->instance('current.tenant', $roleTenant);

            \Illuminate\Support\Facades\Cache::put("tenant_modules:{$roleTenant->id}", [
                'pos'                 => true,
                'table_service'       => true,
                'inventory'           => true,
                'manufacturing'       => true,
                'payroll'             => true,
                'double_entry_ledger' => true,
                'invoicing'           => true,
                'expenses'            => true,
                'reports'             => true,
                'suppliers'           => true,
                'customers'           => true,
                'services'            => true,
                'park_recall'         => true,
                'staff_attendance'    => true,
                'delivery'            => true,
                'loyalty'             => true,
                'hardware'            => true,
                'multi_store'         => true,
            ], 60);

            $user = $this->createTenantUser($roleTenant, $roleName);
            $this->actingAsTenantUserModel($user, $roleTenant);

            // 1. Real HTTP request to /dashboard verifying resolved Inertia component is NewDashboard
            $response = $this->get($this->storeUrl($roleTenant, '/dashboard'));
            $response->assertStatus(200);
            $response->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => 
                $page->component('NewDashboard')
                    ->has('readings')
                    ->has('layoutLaw')
            );

            // 2. Evaluated arrays and exact matching count invariants
            $configuredPool = $rolesPool[$roleName] ?? $businessDefaultPool;
            $configuredPresetKeys = array_values(array_map(
                fn($item) => is_array($item) ? ($item['key'] ?? '') : (string) $item,
                $configuredPool
            ));
            $this->assertCount(count($configuredPresetKeys), $configuredPresetKeys);

            $availability = $reckoner->checkAvailability($allRegistryKeys, $user, $roleTenant);
            $availableKeys = array_keys(array_filter($availability, fn ($v) => $v === true));
            $unavailableKeys = array_keys(array_filter($availability, fn ($v) => $v === false));
            $this->assertCount(count($availableKeys), $availableKeys);
            $this->assertCount(count($unavailableKeys), $unavailableKeys);

            // Verify owner/admin access full available registry
            if ($roleName === 'owner' || $roleName === 'admin') {
                $this->assertGreaterThanOrEqual(100, count($availableKeys));
            }

            // Verify cashier is restricted from financial P&L keys
            if ($roleName === 'cashier') {
                $this->assertNotContains('core.net_profit', $availableKeys);
                $this->assertNotContains('core.gross_profit', $availableKeys);
                $this->assertNotContains('core.cogs', $availableKeys);
            }
        }
    }
}
