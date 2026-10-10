<?php

namespace Tests\Feature\Hardening;

use App\Support\ModuleRouteMap;
use Tests\TestCase;

/**
 * The online store and the QR menu / offline catalogue are two modules.
 * Config-only checks: no database needed.
 */
class OnlineStoreCatalogueSplitTest extends TestCase
{
    /** @test */
    public function the_catalogue_page_belongs_to_its_own_module_not_the_online_store(): void
    {
        $owners = ModuleRouteMap::ownersOf('store.commerce.catalogue');
        $this->assertContains('onsite_catalogue', $owners);
        $this->assertNotContains('online_store', $owners);
    }

    /** @test */
    public function the_shop_pages_belong_to_the_online_store_only(): void
    {
        $owners = ModuleRouteMap::ownersOf('store.commerce.promotions');
        $this->assertContains('online_store', $owners);
        $this->assertNotContains('onsite_catalogue', $owners);

        $productOwners = ModuleRouteMap::ownersOf('store.commerce.products');
        $this->assertContains('online_store', $productOwners);
        $this->assertContains('onsite_catalogue', $productOwners);
    }

    /** @test */
    public function every_module_key_named_by_the_builder_exists_in_the_registry(): void
    {
        $registry = array_keys(config('modules', []));
        $this->assertNotEmpty($registry);

        $named = [];
        foreach (config('ai_builder.presets', []) as $preset) {
            foreach (['modules', 'core'] as $k) {
                foreach ($preset[$k] ?? [] as $m) {
                    $named[$m] = true;
                }
            }
        }
        foreach (config('ai_builder.discovery', []) as $q) {
            foreach ($q['implies'] ?? [] as $mods) {
                foreach ($mods as $m) {
                    $named[$m] = true;
                }
            }
        }

        $unknown = array_diff(array_keys($named), $registry);
        $this->assertSame([], array_values($unknown), 'Builder names modules that do not exist.');
    }
}
