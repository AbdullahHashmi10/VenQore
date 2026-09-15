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

    #[DataProvider('sourceBackedProvider')]
    public function test_source_backed_reading_has_existing_method(string $key, array $def): void
    {
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

    #[DataProvider('sourceBackedProvider')]
    public function test_source_supports_reading_key(string $key, array $def): void
    {
        $src = $def['source'] ?? null;
        $this->assertTrue($src && class_exists($src), "Source class '{$src}' does not exist for '{$key}'.");
        /** @var \App\Reckoner\Sources\ReckonerSource $source */
        $source = app($src);
        $this->assertContains(
            $key,
            $source->supports(),
            "Source ".class_basename($src)." does not declare support for '{$key}' in supports()."
        );
    }

    #[DataProvider('derivedProvider')]
    public function test_derived_reading_has_compute_closure_and_deps(string $key, array $def): void
    {
        $this->assertIsArray($def['derived'],
            "Derived '{$key}' must have array 'derived' dep list.");
        $this->assertNotEmpty($def['derived'],
            "Derived '{$key}' dep list must not be empty.");
        $this->assertIsCallable($def['compute'] ?? null,
            "Derived '{$key}' must have a callable 'compute' closure.");
    }

    #[DataProvider('derivedProvider')]
    public function test_derived_deps_exist_in_registry(string $key, array $def): void
    {
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

    #[DataProvider('tenantScopedProvider')]
    public function test_tenant_readings_have_permissions(string $key, array $def): void
    {
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

    #[DataProvider('platformScopedProvider')]
    public function test_platform_readings_declare_a_permissions_list(string $key, array $def): void
    {
        // Platform readings may legitimately have no store permission (they are
        // gated by the platform role instead), but the field must still be a list.
        $this->assertIsArray($def['permissions'] ?? null,
            "Platform reading '{$key}' must declare 'permissions' as an array (it may be empty).");
    }

    /**
     * The split providers below replace per-case markTestSkipped() calls
     * (2026-09-10): a check that does not apply to a reading is not run for it,
     * instead of being reported as "skipped". This asserts nothing fell
     * through the split.
     */
    public function test_providers_partition_the_whole_registry(): void
    {
        $all = array_keys(iterator_to_array(self::registryProvider()));
        $bySource = array_keys(iterator_to_array(self::sourceBackedProvider()));
        $byDerived = array_keys(iterator_to_array(self::derivedProvider()));
        $tenant = array_keys(iterator_to_array(self::tenantScopedProvider()));
        $platform = array_keys(iterator_to_array(self::platformScopedProvider()));

        $this->assertNotEmpty($all);
        $this->assertEqualsCanonicalizing($all, array_merge($bySource, $byDerived));
        $this->assertEqualsCanonicalizing($all, array_merge($tenant, $platform));
        $this->assertSame([], array_intersect($bySource, $byDerived));
    }

    // ── Data Providers ───────────────────────────────────────────────────────

    public static function registryProvider(): iterable
    {
        ReckonerRegistry::clearCache();
        foreach (ReckonerRegistry::all() as $key => $def) {
            yield $key => [$key, $def];
        }
    }

    public static function sourceBackedProvider(): iterable
    {
        foreach (self::registryProvider() as $key => [$k, $def]) {
            if (! isset($def['derived'])) {
                yield $key => [$k, $def];
            }
        }
    }

    public static function derivedProvider(): iterable
    {
        foreach (self::registryProvider() as $key => [$k, $def]) {
            if (isset($def['derived'])) {
                yield $key => [$k, $def];
            }
        }
    }

    public static function tenantScopedProvider(): iterable
    {
        foreach (self::registryProvider() as $key => [$k, $def]) {
            if (($def['scope'] ?? 'tenant') !== 'platform') {
                yield $key => [$k, $def];
            }
        }
    }

    public static function platformScopedProvider(): iterable
    {
        foreach (self::registryProvider() as $key => [$k, $def]) {
            if (($def['scope'] ?? 'tenant') === 'platform') {
                yield $key => [$k, $def];
            }
        }
    }
}
