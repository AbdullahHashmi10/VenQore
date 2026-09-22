<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\User;
use App\Models\TenantUser;
use App\Reckoner\CardRegistry;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\DashboardSanitizer;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use ReflectionClass;

class AuditRoleCardsCommand extends Command
{
    protected $signature = 'audit:role-cards';
    protected $description = 'Generate deterministic role-card audit evidence JSON artifact';

    public function handle(): int
    {
        // 1. Strict environment and database safety assertions
        $env = app()->environment();
        if ($env !== 'testing' || config('app.env') !== 'testing') {
            $this->error("Safety violation: APP_ENV is '{$env}', must be 'testing'.");
            return 1;
        }

        $activeDb = DB::connection()->getDatabaseName();
        if ($activeDb !== 'amd_pos_test') {
            $this->error("Safety violation: Active database is '{$activeDb}', must be 'amd_pos_test'.");
            return 1;
        }

        $defaultConn = config('database.default', 'mariadb');
        $configuredDb = config("database.connections.{$defaultConn}.database");
        if ($configuredDb !== 'amd_pos_test') {
            $this->error("Safety violation: Configured database for default connection '{$defaultConn}' is '{$configuredDb}', must be 'amd_pos_test'.");
            return 1;
        }

        $this->info('Environment safety checks passed: active database is strictly amd_pos_test under testing environment.');
        $this->info('Generating role-card audit evidence artifact...');

        $reckoner = app(Reckoner::class);
        $allRegistryKeys = array_keys(ReckonerRegistry::all());
        $allCardsJson = json_decode(file_get_contents(resource_path('data/reckoner/cards.json')), true) ?: [];
        $rolesPool = config('dashboard_pool.roles', []);
        $businessDefaultPool = config('dashboard_pool.business.default', []);

        $expectedRoles = [
            'owner'              => ['route' => '/dashboard', 'legacy' => false, 'expected_component' => 'NewDashboard'],
            'admin'              => ['route' => '/dashboard', 'legacy' => false, 'expected_component' => 'NewDashboard'],
            'manager'            => ['route' => '/dashboard', 'legacy' => false, 'expected_component' => 'NewDashboard'],
            'accountant'         => ['route' => '/dashboard', 'legacy' => true,  'expected_component' => 'Dashboards/AccountantDashboard'],
            'purchasing_officer' => ['route' => '/dashboard', 'legacy' => true,  'expected_component' => 'Dashboards/PurchasingDashboard'],
            'viewer'             => ['route' => '/dashboard', 'legacy' => true,  'expected_component' => 'Dashboards/ViewerDashboard'],
            'cashier'            => ['route' => '/dashboard', 'legacy' => true,  'expected_component' => 'Dashboards/CashierDashboard'],
        ];

        $auditResults = [
            'environment'         => 'testing',
            'database'            => 'amd_pos_test',
            'total_registry_keys' => count($allRegistryKeys),
            'total_card_defs'     => count($allCardsJson),
            'roles'               => [],
        ];

        DB::beginTransaction();
        try {
            foreach ($expectedRoles as $roleName => $meta) {
                // Determine configured preset keys from config/dashboard_pool.php
                $configuredPool = $rolesPool[$roleName] ?? $businessDefaultPool;
                $configuredPresetKeys = array_values(array_map(
                    fn($item) => is_array($item) ? ($item['key'] ?? '') : (string) $item,
                    $configuredPool
                ));

                // Identify unknown keys filtered out by registry check
                $unknownSanitizedKeys = array_values(array_filter(
                    $configuredPresetKeys,
                    fn($k) => !ReckonerRegistry::exists($k)
                ));

                // Valid recognized preset keys
                $runtimeResolvedPresetKeys = array_values(array_filter(
                    $configuredPresetKeys,
                    fn($k) => ReckonerRegistry::exists($k)
                ));

                // Create isolated tenant and user inside transaction
                $tenant = Tenant::create([
                    'name'            => "Audit Store {$roleName}",
                    'slug'            => "audit-store-{$roleName}-" . uniqid(),
                    'plan'            => 'ltd_3',
                    'timezone'        => 'UTC',
                    'setup_completed' => true,
                ]);

                \Database\Seeders\TenantDefaultSeeder::seedFor($tenant);

                Cache::put("tenant_modules:{$tenant->id}", [
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

                $user = User::create([
                    'name'      => "Audit User {$roleName}",
                    'email'     => "audit_{$roleName}_" . uniqid() . '@example.com',
                    'password'  => bcrypt('password'),
                    'tenant_id' => $tenant->id,
                ]);

                $membership = TenantUser::create([
                    'tenant_id' => $tenant->id,
                    'user_id'   => $user->id,
                    'role'      => $roleName,
                    'status'    => 'active',
                ]);

                auth()->login($user);
                app()->instance('current.tenant', $tenant);
                app()->instance('current.membership', $membership);

                // Execute real /dashboard controller to dynamically obtain Inertia component and legacy props
                $controller = app(DashboardController::class);
                $inertiaResponse = $controller->index();

                $reflection = new ReflectionClass($inertiaResponse);
                $compProp = $reflection->getProperty('component');
                $compProp->setAccessible(true);
                $actualComponent = $compProp->getValue($inertiaResponse);

                $propsProp = $reflection->getProperty('props');
                $propsProp->setAccessible(true);
                $rawProps = $propsProp->getValue($inertiaResponse);
                $actualLegacyProps = array_values(array_keys($rawProps));

                // Fail audit immediately if actual returned component diverges from expected
                if ($actualComponent !== $meta['expected_component']) {
                    throw new \RuntimeException("Dashboard component mismatch for role '{$roleName}': expected '{$meta['expected_component']}', received '{$actualComponent}'.");
                }

                // Filter configured preset keys through permission and availability checks
                $permissionRejectedKeys = [];
                $availabilityRejectedKeys = [];
                $finalV6EligibleKeys = [];

                foreach ($runtimeResolvedPresetKeys as $key) {
                    $definition = ReckonerRegistry::find($key);
                    if (!$definition) {
                        continue;
                    }

                    $perms = $definition['permissions'] ?? [];
                    $passesPerm = empty($perms);
                    foreach ($perms as $perm) {
                        if ($user->hasPermission($perm)) {
                            $passesPerm = true;
                            break;
                        }
                    }

                    if (!$passesPerm) {
                        $permissionRejectedKeys[] = $key;
                        continue;
                    }

                    // Check availability for recognized, permission-approved preset key
                    $avail = $reckoner->checkAvailability([$key], $user, $tenant);
                    if (($avail[$key] ?? false) === true) {
                        $finalV6EligibleKeys[] = $key;
                    } else {
                        $availabilityRejectedKeys[] = $key;
                    }
                }

                $auditResults['roles'][$roleName] = [
                    'role'                             => $roleName,
                    'actual_dashboard_component'       => $actualComponent,
                    'route'                            => $meta['route'],
                    'is_legacy_view'                   => $meta['legacy'],
                    'configured_preset_keys'           => $configuredPresetKeys,
                    'configured_preset_keys_count'     => count($configuredPresetKeys),
                    'runtime_resolved_keys'            => $runtimeResolvedPresetKeys,
                    'runtime_resolved_keys_count'      => count($runtimeResolvedPresetKeys),
                    'unknown_sanitized_keys'           => $unknownSanitizedKeys,
                    'unknown_sanitized_keys_count'     => count($unknownSanitizedKeys),
                    'permission_rejected_keys'         => $permissionRejectedKeys,
                    'permission_rejected_keys_count'   => count($permissionRejectedKeys),
                    'availability_rejected_keys'       => $availabilityRejectedKeys,
                    'availability_rejected_keys_count' => count($availabilityRejectedKeys),
                    'final_v6_eligible_keys'           => $finalV6EligibleKeys,
                    'final_v6_eligible_keys_count'     => count($finalV6EligibleKeys),
                    'actual_legacy_props'              => $actualLegacyProps,
                    'actual_legacy_props_count'        => count($actualLegacyProps),
                ];
            }
        } finally {
            DB::rollBack();
        }

        // Only write JSON artifact after calculations and dynamic assertions succeed
        $evidenceDir = base_path('docs/approval-dashboard-audit-2026-09-22/evidence');
        if (!is_dir($evidenceDir)) {
            mkdir($evidenceDir, 0755, true);
        }

        file_put_contents(
            $evidenceDir . '/role-card-audit.json',
            json_encode($auditResults, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        $this->info("Audit JSON successfully written to: {$evidenceDir}/role-card-audit.json");
        return 0;
    }
}
