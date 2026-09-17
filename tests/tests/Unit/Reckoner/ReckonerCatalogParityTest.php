<?php

namespace Tests\Unit\Reckoner;

use App\Reckoner\ReckonerRegistry;
use Tests\TestCase;

/**
 * ReckonerCatalogParityTest — verifies parity between the backend ReckonerRegistry::v6Catalog()
 * authority and the frontend static fallback catalog (ReckonerCatalog.json).
 *
 * Prevents client/server catalog and module-gating drift from silently recurring.
 *
 * @group reckoner
 */
class ReckonerCatalogParityTest extends TestCase
{
    public function test_reckoner_catalog_json_parity_with_backend_v6_catalog(): void
    {
        $jsonFile = resource_path('js/Pages/ReckonerCatalog.json');
        $this->assertFileExists($jsonFile, 'ReckonerCatalog.json must exist');

        $jsonContent = file_get_contents($jsonFile);
        $jsonCatalog = json_decode($jsonContent, true);
        $this->assertIsArray($jsonCatalog, 'ReckonerCatalog.json must decode to a valid JSON array');

        $backendCatalog = ReckonerRegistry::v6Catalog();
        $this->assertNotEmpty($backendCatalog);

        // 1. Assert keys parity
        $jsonKeys = array_column($jsonCatalog, 'key');
        sort($jsonKeys);

        $backendKeys = array_column($backendCatalog, 'key');
        sort($backendKeys);

        $this->assertEquals(
            $backendKeys,
            $jsonKeys,
            'Keys in ReckonerCatalog.json and ReckonerRegistry::v6Catalog() must be identical!'
        );

        // 2. Assert detailed field parity, especially module gating
        $backendByKey = collect($backendCatalog)->keyBy('key');

        foreach ($jsonCatalog as $entry) {
            $key = $entry['key'];
            $this->assertTrue($backendByKey->has($key), "Key {$key} must exist in backend catalog");
            $backendEntry = $backendByKey->get($key);

            // Shape parity
            $this->assertEquals(
                $backendEntry['shape'],
                $entry['shape'],
                "Shape mismatch for reading {$key}"
            );

            // Module gating parity
            $backendModules = $backendEntry['modules'] ?? [];
            $jsonModules = $entry['modules'] ?? [];
            sort($backendModules);
            sort($jsonModules);

            $this->assertEquals(
                $backendModules,
                $jsonModules,
                "Module gating mismatch for reading {$key}"
            );
        }
    }
}
