<?php

namespace Tests\Feature\Reckoner;

use App\Reckoner\ReckonerRegistry;
use Tests\Feature\VenQoreTestCase;

/**
 * CI Truth Gate: Guarantees V6 catalog is 100% sourced from ReckonerRegistry.
 *
 * No uncomputed readings, mock cards, or backlog items can ever leak into
 * tenant dashboards without a verified Reckoner implementation.
 */
class TruthGateTest extends VenQoreTestCase
{
    public function test_reckoner_catalog_json_keys_all_exist_in_reckoner_registry(): void
    {
        $catalogPath = resource_path('js/Pages/ReckonerCatalog.json');
        $this->assertFileExists($catalogPath, 'ReckonerCatalog.json must exist.');

        $catalog = json_decode(file_get_contents($catalogPath), true);
        $this->assertIsArray($catalog);
        $this->assertNotEmpty($catalog);

        foreach ($catalog as $item) {
            $this->assertArrayHasKey('key', $item);
            $this->assertTrue(
                ReckonerRegistry::exists($item['key']),
                "Catalog item '{$item['key']}' does not exist in ReckonerRegistry."
            );
            $this->assertSame(
                'tenant',
                ReckonerRegistry::scopeOf($item['key']),
                "Catalog item '{$item['key']}' must be tenant-scoped."
            );
        }
    }

    public function test_v6_catalog_contains_only_verified_tenant_scoped_readings(): void
    {
        $v6Catalog = ReckonerRegistry::v6Catalog();
        $catalogKeys = array_column($v6Catalog, 'key');

        // Currently 46 verified tenant-scoped readings
        $this->assertCount(46, $v6Catalog);

        // Platform-scoped readings must never be in V6 tenant dashboard catalog
        $this->assertNotContains('platform.active_tenant_count', $catalogKeys);
        $this->assertNotContains('platform.mrr', $catalogKeys);

        foreach ($catalogKeys as $key) {
            $this->assertTrue(ReckonerRegistry::exists($key));
            $this->assertSame('tenant', ReckonerRegistry::scopeOf($key));
        }
    }

    public function test_none_of_the_uncomputed_backlog_keys_are_in_v6_catalog(): void
    {
        $backlog = config('reckoner_backlog');
        $this->assertIsArray($backlog, 'config/reckoner_backlog.php must exist and be an array.');
        $this->assertNotEmpty($backlog);

        $v6Catalog = ReckonerRegistry::v6Catalog();
        $catalogKeys = array_column($v6Catalog, 'key');

        foreach ($backlog as $backlogItem) {
            $this->assertNotContains(
                $backlogItem['key'],
                $catalogKeys,
                "Uncomputed backlog reading '{$backlogItem['key']}' leaked into V6 catalog!"
            );
        }
    }

    public function test_tenant_new_dashboard_receives_verified_readings_catalog(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        $response = $this->actingAs($user)->get("/s/{$tenant->slug}/new-dashboard");
        $response->assertOk();

        $pageProps = $response->viewData('page')['props'] ?? [];
        $this->assertArrayHasKey('readings', $pageProps);
        $this->assertCount(46, $pageProps['readings']);
    }
}
