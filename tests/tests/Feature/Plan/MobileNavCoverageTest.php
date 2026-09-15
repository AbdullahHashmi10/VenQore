<?php

namespace Tests\Feature\Plan;

use App\Models\User;
use App\Services\ModuleService;
use App\Services\StoreProvisioner;
use App\Support\MobileNav;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

class MobileNavCoverageTest extends VenQoreTestCase
{
    /**
     * Test mobile nav resolution across all business types in the catalogue.
     * Loop config('business_types.types') — do not hand-list.
     */
    #[Test]
    public function test_mobile_nav_resolves_cleanly_for_all_business_types(): void
    {
        $types = config('business_types.types');
        $typeCount = count($types);

        // Report the exact count of types iterated
        $this->assertGreaterThanOrEqual(85, $typeCount, 'Catalogue must have at least 85 business types');

        $user = User::factory()->create();
        $provisioner = app(StoreProvisioner::class);
        $iterated = 0;

        foreach ($types as $typeKey => $typeConfig) {
            $iterated++;

            // 1. Provision a tenant of that type through StoreProvisioner
            $tenant = $provisioner->create($user, [
                'name' => 'Store ' . $typeKey . ' ' . uniqid(),
                'business_type' => $typeKey,
            ]);

            // 2. Resolve the mobile nav for it
            $nav = MobileNav::resolveForTenant($tenant, $user);

            // 3. Assert 3 to 5 items — never 0, never more than 5
            $itemCount = count($nav);
            $this->assertGreaterThanOrEqual(3, $itemCount, "{$typeKey}: item count {$itemCount} is less than 3");
            $this->assertLessThanOrEqual(5, $itemCount, "{$typeKey}: item count {$itemCount} is greater than 5");

            // 4. Assert no duplicate routes
            $routes = array_values(array_filter(array_column($nav, 'route')));
            $this->assertSame(
                count($routes),
                count(array_unique($routes)),
                "{$typeKey}: duplicate routes found: " . implode(', ', $routes)
            );

            // 5. Assert every route is registered in Laravel
            foreach ($routes as $route) {
                $this->assertTrue(
                    Route::has($route),
                    "{$typeKey}: route '{$route}' is not registered in Laravel"
                );
            }

            // 6. Assert every item's module is actually enabled for that tenant
            $enabledModules = ModuleService::allVisible($tenant, $user);
            foreach ($nav as $item) {
                $mod = $item['module'] ?? null;
                if ($mod !== null) {
                    $this->assertContains(
                        $mod,
                        $enabledModules,
                        "{$typeKey}: nav item '{$item['id']}' module '{$mod}' is not enabled for tenant"
                    );
                }
            }

            // 7. Assert sector's primary action is present
            $sector = $typeConfig['sector'] ?? null;
            $preset = $typeConfig['preset'] ?? null;
            $navModules = array_filter(array_column($nav, 'module'));

            // services types include the services entry (except professional_services which uses invoicing/clients)
            if ($sector === 'services' && $preset !== 'professional_services') {
                $this->assertContains(
                    'services',
                    $navModules,
                    "{$typeKey}: services missing from nav (sector: {$sector})"
                );
            }

            // food types with table_service include tables
            if ($sector === 'food' && in_array('table_service', $enabledModules, true)) {
                $this->assertContains(
                    'table_service',
                    $navModules,
                    "{$typeKey}: table_service missing from nav (sector: {$sector})"
                );
            }

            // retail types with pos include POS
            if ($sector === 'retail' && in_array('pos', $enabledModules, true)) {
                $this->assertContains(
                    'pos',
                    $navModules,
                    "{$typeKey}: pos missing from nav (sector: {$sector})"
                );
            }

            // manufacturing types with production include production
            if ($preset === 'light_manufacturing') {
                $hasProduction = in_array('production_runs', $navModules, true) || in_array('production', $navModules, true);
                $this->assertTrue(
                    $hasProduction,
                    "{$typeKey}: production missing from nav (sector: {$sector})"
                );
            }
        }

        $this->assertSame($typeCount, $iterated, "Expected to iterate {$typeCount} types, but iterated {$iterated}");
    }
}
