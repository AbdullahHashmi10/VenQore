<?php

namespace Tests\Feature\Hardening;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * The online store, QR catalogue, Front-of-House setup and AI keys each have their
 * own permission. These laws iterate everything, so a new route or key needs no new
 * test code — it just has to follow the pattern or this fails.
 */
class OnlineFohAiPermissionsTest extends TestCase
{
    private function grants(): array
    {
        return json_decode(file_get_contents(base_path('resources/js/Data/permission_inherits.json')), true)['grants'];
    }

    private function permissionKeysOf(string $routeName): array
    {
        $route = Route::getRoutes()->getByName($routeName);
        $this->assertNotNull($route, "route {$routeName} must exist");
        foreach ($route->gatherMiddleware() as $m) {
            if (is_string($m) && str_starts_with($m, 'permission:')) {
                return explode(',', substr($m, 11));
            }
        }

        return [];
    }

    public function test_every_new_key_is_in_the_owner_vocabulary_and_the_owner_preset(): void
    {
        $owner = config('permissions.owner');
        $preset = collect(json_decode(file_get_contents(resource_path('js/Data/staff_presets.json')), true))->firstWhere('id', 'owner');

        foreach (array_keys($this->grants()) as $key) {
            $this->assertContains($key, $owner, "{$key} missing from the owner role");
            $this->assertContains($key, $preset['permissions'], "{$key} missing from the owner preset");
        }
    }

    public function test_roles_inherit_new_keys_only_from_the_keys_they_already_held(): void
    {
        $this->assertContains('online.store_manage', config('permissions.admin'));
        $this->assertContains('online.orders_view', config('permissions.viewer'));

        // A cashier and a manager never held general-settings edit, so they must not get store setup.
        foreach (['cashier', 'manager', 'viewer', 'accountant'] as $role) {
            foreach (['online.store_manage', 'online.catalogue_manage', 'online.products_manage', 'online.promotions_manage', 'foh.manage', 'ai.manage'] as $key) {
                $this->assertNotContains($key, config("permissions.{$role}"), "{$role} must not get {$key}");
            }
        }

        // Vena stays available to every working role.
        foreach (['cashier', 'manager', 'accountant', 'viewer'] as $role) {
            $this->assertContains('ai.use', config("permissions.{$role}"));
        }
        $this->assertSame([], config('permissions.custom'));
    }

    public function test_every_merchant_commerce_route_uses_only_online_keys(): void
    {
        $checked = 0;
        foreach (Route::getRoutes() as $route) {
            $name = (string) $route->getName();
            if (!str_starts_with($name, 'store.commerce.')) {
                continue;
            }
            $keys = $this->permissionKeysOf($name);
            $this->assertNotEmpty($keys, "{$name} has no permission middleware");
            foreach ($keys as $k) {
                $this->assertStringStartsWith('online.', $k, "{$name} still uses {$k}");
            }
            $checked++;
        }
        $this->assertGreaterThan(25, $checked);
    }

    public function test_money_and_destructive_order_actions_have_their_own_keys(): void
    {
        $this->assertSame(['online.orders_collect'], $this->permissionKeysOf('store.commerce.orders.collect'));
        $this->assertSame(['online.orders_cancel'], $this->permissionKeysOf('store.commerce.orders.cancel'));
        $this->assertSame(['online.store_manage'], $this->permissionKeysOf('store.commerce.publish'));
        $this->assertSame(['online.promotions_manage'], $this->permissionKeysOf('store.commerce.promotions.save'));
    }

    public function test_foh_setup_and_ai_key_routes_are_not_open_to_general_settings_editors_by_accident(): void
    {
        foreach (['store.foh.settings.save', 'store.restaurant.settings.update', 'store.restaurant.riders.store', 'store.restaurant.riders.update', 'store.restaurant.riders.destroy'] as $n) {
            $this->assertSame(['foh.manage'], $this->permissionKeysOf($n), $n);
        }
        foreach (['store.ai.test', 'store.smart-capture.settings.save', 'store.smart-capture.settings.test', 'store.smart-capture.settings.models'] as $n) {
            $this->assertSame(['ai.manage'], $this->permissionKeysOf($n), $n);
        }
        $this->assertSame(['ai.use'], $this->permissionKeysOf('store.ai.query'));
        $this->assertNotContains('sales.view', $this->permissionKeysOf('store.ai.cash-flow-forecast'));
        $this->assertNotEmpty($this->permissionKeysOf('store.ai.cash-flow-forecast'));
    }

    public function test_online_presets_do_not_leak_setup_or_money(): void
    {
        $presets = collect(json_decode(file_get_contents(resource_path('js/Data/staff_presets.json')), true))->keyBy('id');

        $clerk = $presets['online_orders_clerk']['permissions'];
        foreach (['online.store_manage', 'online.promotions_manage', 'online.catalogue_manage', 'online.products_manage', 'online.orders_collect', 'online.orders_cancel', 'admin.settings_manage'] as $k) {
            $this->assertNotContains($k, $clerk);
        }
        $this->assertContains('online.orders_manage', $clerk);

        $mgr = $presets['online_store_manager']['permissions'];
        $this->assertNotContains('online.orders_collect', $mgr);
        $this->assertNotContains('admin.staff_manage', $mgr);
    }

    public function test_the_online_store_is_reachable_from_the_nav_only_with_an_online_key(): void
    {
        foreach (['online_store', 'onsite_catalogue'] as $module) {
            foreach (config("modules.{$module}.permissions") as $k) {
                $this->assertStringStartsWith('online.', $k);
            }
        }
    }
}
