<?php

namespace Tests\Feature\Reckoner\Laws;

use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerShape;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * L8 — Registry Contract Law
 *
 * Every reading in the registry must declare complete mandatory metadata,
 * have a valid source+method or derived+compute, and every derived dep key
 * must itself exist in the registry.
 *
 * Zero new test code when adding a reading — it is covered on the next run.
 */
class L8RegistryContractTest extends TestCase
{
    private const REQUIRED_FIELDS = [
        'key', 'domain', 'label', 'generic', 'description',
        'shape', 'unit', 'precision', 'direction', 'signed',
        'periods', 'default_period', 'supports_comparison', 'supports_series',
        'permissions', 'scope', 'cache_ttl',
    ];

    #[DataProvider('registryProvider')]
    public function test_every_reading_has_required_metadata(string $key, array $def): void
    {
        foreach (self::REQUIRED_FIELDS as $field) {
            $this->assertArrayHasKey($field, $def,
                "Reading '{$key}' is missing required field '{$field}'.");
        }
    }

    #[DataProvider('registryProvider')]
    public function test_every_reading_has_valid_source_or_derived(string $key, array $def): void
    {
        $isDerived = isset($def['derived']);
        $hasSource = isset($def['source']) && class_exists($def['source']);
        $this->assertTrue($isDerived || $hasSource,
            "Reading '{$key}' has no usable 'source' class and no 'derived' declaration.");
    }

    #[DataProvider('registryProvider')]
    public function test_source_backed_reading_has_existing_method(string $key, array $def): void
    {
        if (isset($def['derived'])) { $this->markTestSkipped("{$key} is derived."); }
        $src    = $def['source'] ?? null;
        $method = $def['method'] ?? null;
        if (! $src || ! class_exists($src)) { $this->fail("Source class '{$src}' does not exist for '{$key}'."); }
        
        /** @var \App\Reckoner\Sources\ReckonerSource $source */
        $source = app($src);
        $this->assertTrue(
            ($method !== null && method_exists($src, $method)) || $source->supports($key),
            "Reading '{$key}': source {$src} neither implements method '{$method}' nor supports key in resolveBatch()."
        );
    }

    #[DataProvider('registryProvider')]
    public function test_source_supports_reading_key(string $key, array $def): void
    {
        if (isset($def['derived'])) { $this->markTestSkipped("{$key} is derived."); }
        $src = $def['source'] ?? null;
        if (! $src || ! class_exists($src)) { $this->markTestSkipped("Missing source class."); }
        /** @var \App\Reckoner\Sources\ReckonerSource $source */
        $source = app($src);
        $this->assertContains(
            $key,
            $source->supports(),
            "Source ".class_basename($src)." does not declare support for '{$key}' in supports()."
        );
    }

    #[DataProvider('registryProvider')]
    public function test_derived_reading_has_compute_closure_and_deps(string $key, array $def): void
    {
        if (! isset($def['derived'])) { $this->markTestSkipped("{$key} is not derived."); }
        $this->assertIsArray($def['derived'],
            "Derived '{$key}' must have array 'derived' dep list.");
        $this->assertNotEmpty($def['derived'],
            "Derived '{$key}' dep list must not be empty.");
        $this->assertIsCallable($def['compute'] ?? null,
            "Derived '{$key}' must have a callable 'compute' closure.");
    }

    #[DataProvider('registryProvider')]
    public function test_derived_deps_exist_in_registry(string $key, array $def): void
    {
        if (! isset($def['derived'])) { $this->markTestSkipped("{$key} is not derived."); }
        foreach ($def['derived'] as $depKey) {
            $this->assertTrue(ReckonerRegistry::exists($depKey),
                "Derived '{$key}' depends on '{$depKey}', which is not in the registry.");
        }
    }

    #[DataProvider('registryProvider')]
    public function test_shape_is_reckoner_shape_enum(string $key, array $def): void
    {
        $this->assertInstanceOf(ReckonerShape::class, $def['shape'],
            "Reading '{$key}' shape must be a ReckonerShape enum.");
    }

    #[DataProvider('registryProvider')]
    public function test_scope_is_valid(string $key, array $def): void
    {
        $this->assertContains($def['scope'] ?? null, ['tenant', 'platform'],
            "Reading '{$key}' has invalid scope '{$def['scope']}'.");
    }

    #[DataProvider('registryProvider')]
    public function test_direction_is_valid(string $key, array $def): void
    {
        $this->assertContains($def['direction'] ?? null,
            ['higher_is_better', 'lower_is_better', 'neutral'],
            "Reading '{$key}' has invalid direction '{$def['direction']}'.");
    }

    #[DataProvider('registryProvider')]
    public function test_key_field_matches_array_key(string $key, array $def): void
    {
        $this->assertSame($key, $def['key'],
            "Array key '{$key}' does not match 'key' field '{$def['key']}'.");
    }

    #[DataProvider('registryProvider')]
    public function test_tenant_readings_have_permissions(string $key, array $def): void
    {
        if (($def['scope'] ?? 'tenant') === 'platform') {
            $this->markTestSkipped("Platform readings may have empty permissions.");
        }
        $this->assertNotEmpty($def['permissions'] ?? [],
            "Tenant reading '{$key}' must declare at least one permission.");
    }

    #[DataProvider('registryProvider')]
    public function test_cache_ttl_is_non_negative_integer(string $key, array $def): void
    {
        $this->assertIsInt($def['cache_ttl'],
            "Reading '{$key}' cache_ttl must be an integer.");
        $this->assertGreaterThanOrEqual(0, $def['cache_ttl'],
            "Reading '{$key}' cache_ttl must be >= 0.");
    }

    // ── Data Provider ────────────────────────────────────────────────────────

    public static function registryProvider(): iterable
    {
        ReckonerRegistry::clearCache();
        foreach (ReckonerRegistry::all() as $key => $def) {
            yield $key => [$key, $def];
        }
    }
}
