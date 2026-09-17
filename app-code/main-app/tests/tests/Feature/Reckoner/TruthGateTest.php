<?php

namespace Tests\Feature\Reckoner;

use App\Reckoner\CardRegistry;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerRequest;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * CI Truth Gate: Guarantees V6 catalog is 100% sourced from ReckonerRegistry,
 * every card declares a contract_state, and zero unimplemented cards return ok.
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

    public function test_v6_catalog_contains_all_349_cards_with_contract_state(): void
    {
        $v6Catalog = ReckonerRegistry::v6Catalog();
        $catalogKeys = array_column($v6Catalog, 'key');

        // All 349 canonical cards emitted in catalog
        $this->assertCount(349, $v6Catalog);

        // Platform-scoped readings must never be in V6 tenant dashboard catalog
        $this->assertNotContains('platform.active_tenant_count', $catalogKeys);
        $this->assertNotContains('platform.mrr', $catalogKeys);

        foreach ($v6Catalog as $item) {
            $key = $item['key'];
            $this->assertTrue(ReckonerRegistry::exists($key));
            $this->assertSame('tenant', ReckonerRegistry::scopeOf($key));
            $this->assertArrayHasKey('contract_state', $item);
            $this->assertContains($item['contract_state'], ['verified', 'implemented_unverified', 'unimplemented']);
        }
    }

    public function test_no_unimplemented_card_can_return_ok_via_api(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        $reckoner = app(Reckoner::class);
        $allCards = CardRegistry::all();

        $unimplementedCount = 0;
        foreach ($allCards as $key => $card) {
            if (($card['contract_state'] ?? 'unimplemented') !== 'unimplemented') {
                continue;
            }

            $unimplementedCount++;
            DB::flushQueryLog();
            DB::enableQueryLog();

            $request = new ReckonerRequest($key, 'today');
            $results = $reckoner->readMany([$request], $user, $tenant);
            $queryCount = count(DB::getQueryLog());
            DB::disableQueryLog();

            $this->assertSame(0, $queryCount, "Unimplemented card '{$key}' executed {$queryCount} queries!");

            $result = reset($results);
            $this->assertNotNull($result, "No result returned for '{$key}'.");
            $this->assertFalse($result->ok, "Unimplemented card '{$key}' returned ok=true!");
            $this->assertSame('unavailable', $result->status, "Unimplemented card '{$key}' returned status '{$result->status}' instead of 'unavailable'!");
            $this->assertContains($result->errorCode, ['not_built', 'data_not_captured']);
        }

        $this->assertGreaterThan(50, $unimplementedCount, "Expected over 50 unimplemented cards (Slice 4a+4b+4c implemented; remaining in 4d).");
    }

    public function test_tenant_new_dashboard_receives_catalog_with_contract_states(): void
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);

        $response = $this->actingAs($user)->get("/s/{$tenant->slug}/new-dashboard");
        $response->assertOk();

        $pageProps = $response->viewData('page')['props'] ?? [];
        $this->assertArrayHasKey('readings', $pageProps);
        $this->assertCount(349, $pageProps['readings']);
        $this->assertArrayHasKey('contract_state', $pageProps['readings'][0]);
    }
}
