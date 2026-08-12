<?php

namespace Tests\Feature\Reckoner;

use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerShape;
use App\Reckoner\Sources\ReckonerSource;
use Tests\TestCase;

/**
 * §10 — ReckonerRegistryTest: every definition has every field; every
 * source::method exists (source class implements ReckonerSource and
 * supports() lists the key); no duplicate keys; every metric has a
 * `generic` label and a `help` string.
 */
class ReckonerRegistryTest extends TestCase
{
    private const REQUIRED_FIELDS = [
        'key', 'domain', 'label', 'generic', 'description', 'help', 'shape', 'unit',
        'precision', 'direction', 'signed', 'periods', 'default_period',
        'supports_comparison', 'supports_series', 'series_granularity',
        'permissions', 'feature', 'capability', 'scope', 'source', 'method',
        'cache_ttl', 'drill_route',
    ];

    public function test_registry_is_not_empty(): void
    {
        $this->assertNotEmpty(ReckonerRegistry::all());
    }

    public function test_every_definition_has_every_required_field(): void
    {
        foreach (ReckonerRegistry::all() as $key => $definition) {
            foreach (self::REQUIRED_FIELDS as $field) {
                $this->assertArrayHasKey($field, $definition, "Metric '{$key}' is missing field '{$field}'.");
            }
        }
    }

    public function test_no_duplicate_keys(): void
    {
        $keys = array_keys(ReckonerRegistry::all());
        $this->assertSame($keys, array_unique($keys), 'Duplicate keys found in the registry.');
    }

    public function test_key_field_matches_array_key(): void
    {
        foreach (ReckonerRegistry::all() as $key => $definition) {
            $this->assertSame($key, $definition['key'], "Definition array key '{$key}' does not match its own 'key' field.");
        }
    }

    public function test_every_metric_has_a_generic_label_and_help_text(): void
    {
        foreach (ReckonerRegistry::all() as $key => $definition) {
            $this->assertNotEmpty($definition['generic'], "Metric '{$key}' has no generic label.");
            $this->assertNotEmpty($definition['help'], "Metric '{$key}' has no help text.");
        }
    }

    public function test_every_shape_is_a_valid_reckoner_shape(): void
    {
        foreach (ReckonerRegistry::all() as $key => $definition) {
            $this->assertInstanceOf(ReckonerShape::class, $definition['shape'], "Metric '{$key}' shape is not a ReckonerShape enum.");
        }
    }

    public function test_every_scope_is_tenant_or_platform(): void
    {
        foreach (ReckonerRegistry::all() as $key => $definition) {
            $this->assertContains($definition['scope'], ['tenant', 'platform'], "Metric '{$key}' has an invalid scope.");
        }
    }

    public function test_every_source_class_exists_and_implements_reckoner_source(): void
    {
        foreach (ReckonerRegistry::all() as $key => $definition) {
            $this->assertTrue(class_exists($definition['source']), "Metric '{$key}' references a source class that does not exist: {$definition['source']}.");
            $this->assertTrue(
                is_subclass_of($definition['source'], ReckonerSource::class),
                "Metric '{$key}' source {$definition['source']} does not implement ReckonerSource.",
            );
        }
    }

    public function test_every_source_declares_support_for_the_metrics_that_reference_it(): void
    {
        $bySource = [];
        foreach (ReckonerRegistry::all() as $key => $definition) {
            $bySource[$definition['source']][] = $key;
        }

        foreach ($bySource as $sourceClass => $keys) {
            /** @var ReckonerSource $source */
            $source = app($sourceClass);
            $supported = $source->supports();

            foreach ($keys as $key) {
                $this->assertContains(
                    $key,
                    $supported,
                    "Source {$sourceClass} does not declare support() for '{$key}', which the registry routes to it.",
                );
            }
        }
    }

    public function test_every_period_in_a_metrics_list_is_a_real_period_key(): void
    {
        foreach (ReckonerRegistry::all() as $key => $definition) {
            foreach ($definition['periods'] as $periodKey) {
                $this->assertContains($periodKey, ReckonerPeriod::KEYS, "Metric '{$key}' lists unknown period '{$periodKey}'.");
            }
        }
    }

    public function test_default_period_is_in_the_metrics_own_periods_list(): void
    {
        foreach (ReckonerRegistry::all() as $key => $definition) {
            $this->assertContains(
                $definition['default_period'],
                $definition['periods'],
                "Metric '{$key}' default_period '{$definition['default_period']}' is not in its own periods list.",
            );
        }
    }

    public function test_cache_ttl_is_a_non_negative_integer(): void
    {
        foreach (ReckonerRegistry::all() as $key => $definition) {
            $this->assertIsInt($definition['cache_ttl'], "Metric '{$key}' cache_ttl must be an integer.");
            $this->assertGreaterThanOrEqual(0, $definition['cache_ttl'], "Metric '{$key}' cache_ttl must not be negative.");
        }
    }

    public function test_direction_is_a_known_value(): void
    {
        foreach (ReckonerRegistry::all() as $key => $definition) {
            $this->assertContains(
                $definition['direction'],
                ['higher_is_better', 'lower_is_better', 'neutral'],
                "Metric '{$key}' has an unknown direction '{$definition['direction']}'.",
            );
        }
    }

    public function test_find_returns_null_for_unknown_key(): void
    {
        $this->assertNull(ReckonerRegistry::find('totally.made.up'));
        $this->assertFalse(ReckonerRegistry::exists('totally.made.up'));
    }

    public function test_find_returns_the_definition_for_a_known_key(): void
    {
        $this->assertNotNull(ReckonerRegistry::find('sales.revenue'));
        $this->assertTrue(ReckonerRegistry::exists('sales.revenue'));
    }
}
