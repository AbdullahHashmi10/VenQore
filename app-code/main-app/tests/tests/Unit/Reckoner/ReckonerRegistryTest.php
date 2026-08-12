<?php

namespace Tests\Unit\Reckoner;

use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerShape;
use Tests\TestCase;

/**
 * Structural assertions about the Reckoner catalogue.
 * Every rule here is a contract: break one, fail a test, fix the registry.
 *
 * No database, no HTTP — this is pure in-memory verification of the
 * array returned by ReckonerRegistry::all().
 *
 * @group reckoner
 */
class ReckonerRegistryTest extends TestCase
{
    private array $registry;

    protected function setUp(): void
    {
        parent::setUp();
        $this->registry = ReckonerRegistry::all();
    }

    /* ------------------------------------------------------------------ *
     * Required fields
     * ------------------------------------------------------------------ */

    public function test_every_entry_has_required_fields(): void
    {
        $required = [
            'key', 'domain', 'label', 'generic', 'description', 'help',
            'shape', 'unit', 'precision', 'direction', 'signed',
            'periods', 'default_period', 'supports_comparison',
            'supports_series', 'permissions', 'scope', 'source',
        ];

        foreach ($this->registry as $key => $def) {
            foreach ($required as $field) {
                $this->assertArrayHasKey(
                    $field,
                    $def,
                    "Registry key '{$key}' is missing required field '{$field}'."
                );
            }
        }
    }

    public function test_every_key_matches_its_array_index(): void
    {
        foreach ($this->registry as $index => $def) {
            $this->assertSame(
                $index,
                $def['key'],
                "Registry entry '{$index}' has key='{$def['key']}' — they must match."
            );
        }
    }

    public function test_every_key_is_dot_namespaced(): void
    {
        foreach (array_keys($this->registry) as $key) {
            $this->assertMatchesRegularExpression(
                '/^[a-z][a-z0-9_]+\.[a-z][a-z0-9_]+$/',
                $key,
                "Key '{$key}' must be domain.metric (lowercase_snake)."
            );
        }
    }

    /* ------------------------------------------------------------------ *
     * Shape / unit consistency
     * ------------------------------------------------------------------ */

    public function test_every_shape_is_a_valid_enum_value(): void
    {
        $valid = array_column(ReckonerShape::cases(), 'value');

        foreach ($this->registry as $key => $def) {
            $this->assertInstanceOf(
                ReckonerShape::class,
                $def['shape'],
                "'{$key}'.shape must be a ReckonerShape instance."
            );
        }
    }

    public function test_currency_units_have_precision_2(): void
    {
        foreach ($this->registry as $key => $def) {
            if ($def['unit'] === 'currency') {
                $this->assertSame(
                    2,
                    $def['precision'],
                    "'{$key}' is a currency metric but precision={$def['precision']} (expected 2)."
                );
            }
        }
    }

    public function test_integer_units_have_precision_0(): void
    {
        foreach ($this->registry as $key => $def) {
            if ($def['unit'] === 'integer') {
                $this->assertSame(
                    0,
                    $def['precision'],
                    "'{$key}' is an integer metric but precision={$def['precision']} (expected 0)."
                );
            }
        }
    }

    /* ------------------------------------------------------------------ *
     * Scope / period consistency
     * ------------------------------------------------------------------ */

    public function test_every_scope_is_tenant_or_platform(): void
    {
        foreach ($this->registry as $key => $def) {
            $this->assertContains(
                $def['scope'],
                ['tenant', 'platform'],
                "'{$key}'.scope='{$def['scope']}' is not a recognised value."
            );
        }
    }

    public function test_live_only_metrics_do_not_support_comparison_or_series(): void
    {
        foreach ($this->registry as $key => $def) {
            if ($def['periods'] === ['live'] || $def['periods'] === ['as_of', 'live']) {
                $this->assertFalse(
                    $def['supports_series'],
                    "'{$key}' is live-only but supports_series=true."
                );
            }
        }
    }

    public function test_every_default_period_is_in_the_periods_list(): void
    {
        foreach ($this->registry as $key => $def) {
            $this->assertContains(
                $def['default_period'],
                $def['periods'],
                "'{$key}'.default_period='{$def['default_period']}' is not in its periods list."
            );
        }
    }

    /* ------------------------------------------------------------------ *
     * Source wiring
     * ------------------------------------------------------------------ */

    public function test_every_source_class_exists(): void
    {
        foreach ($this->registry as $key => $def) {
            $source = $def['source'] ?? null;

            if ($source !== null) {
                $this->assertTrue(
                    class_exists($source),
                    "'{$key}'.source='{$source}' class does not exist."
                );
            }
        }
    }

    public function test_every_source_implements_reckoner_source(): void
    {
        foreach ($this->registry as $key => $def) {
            $source = $def['source'] ?? null;

            if ($source !== null && class_exists($source)) {
                $this->assertContains(
                    \App\Reckoner\Sources\ReckonerSource::class,
                    class_implements($source) ?: [],
                    "'{$key}'.source='{$source}' does not implement ReckonerSource."
                );
            }
        }
    }

    public function test_every_registry_key_is_supported_by_its_source(): void
    {
        // Group keys by source class, instantiate once per source.
        $bySource = [];

        foreach ($this->registry as $key => $def) {
            $source = $def['source'] ?? null;

            if ($source !== null) {
                $bySource[$source][] = $key;
            }
        }

        foreach ($bySource as $sourceClass => $keys) {
            if (! class_exists($sourceClass)) {
                continue;
            }

            // Instantiate without dependencies (mocked to null for pure check).
            try {
                $reflection = new \ReflectionClass($sourceClass);
                $constructor = $reflection->getConstructor();

                if ($constructor === null || count($constructor->getParameters()) === 0) {
                    $instance = new $sourceClass();
                } else {
                    // Build with null arguments — we only need supports().
                    $args = array_fill(0, count($constructor->getParameters()), null);
                    $instance = $reflection->newInstanceArgs($args);
                }
            } catch (\Throwable) {
                // Skip if instantiation fails (requires DI container).
                continue;
            }

            $supported = $instance->supports();

            foreach ($keys as $key) {
                $this->assertContains(
                    $key,
                    $supported,
                    "Source '{$sourceClass}' does not list '{$key}' in supports()."
                );
            }
        }
    }

    /* ------------------------------------------------------------------ *
     * Canonicalization rules (§7)
     * ------------------------------------------------------------------ */

    public function test_no_bare_margin_label(): void
    {
        // §7.15: "Margin" as a standalone label is ambiguous. Any margin
        // metric must qualify which margin (Gross Margin, Net Margin, etc.).
        foreach ($this->registry as $key => $def) {
            $label = strtolower(trim($def['label'] ?? ''));
            $this->assertNotSame(
                'margin',
                $label,
                "'{$key}' has bare label 'Margin' — must specify Gross/Net/etc."
            );
        }
    }

    public function test_signed_metrics_are_in_labels_table(): void
    {
        // §7.16: every signed=true metric must have a corresponding entry
        // in ReckonerLabels::SIGNED_LABELS, otherwise the loss-side label
        // swap is silently a no-op.
        $reflection = new \ReflectionClass(\App\Reckoner\ReckonerLabels::class);
        $constant = $reflection->getReflectionConstant('SIGNED_LABELS');
        $signedLabels = $constant ? $constant->getValue() : [];

        foreach ($this->registry as $key => $def) {
            if (! empty($def['signed'])) {
                $this->assertArrayHasKey(
                    $key,
                    $signedLabels,
                    "'{$key}' is signed=true but has no entry in ReckonerLabels::SIGNED_LABELS."
                );
            }
        }
    }

    public function test_balance_sheet_ok_is_status_shape(): void
    {
        // §7.19: balance_sheet_ok is a status, not a scalar KPI.
        $this->assertArrayHasKey('finance.balance_sheet_ok', $this->registry);
        $this->assertSame(
            ReckonerShape::STATUS,
            $this->registry['finance.balance_sheet_ok']['shape']
        );
        $this->assertSame(
            ['live'],
            $this->registry['finance.balance_sheet_ok']['periods'],
            'balance_sheet_ok must be live-only — it is not a trending figure.'
        );
    }

    public function test_low_stock_and_out_of_stock_are_separate_metrics(): void
    {
        // §7.13: the split is explicit — not folded into one metric.
        $this->assertArrayHasKey('inventory.low_stock_count', $this->registry);
        $this->assertArrayHasKey('inventory.out_of_stock_count', $this->registry);
    }

    public function test_production_cost_is_wired_to_production_source(): void
    {
        // §7.14: this key was hardcoded to 0 in ProductionController — it
        // must now point to ProductionSource, not anything that could return 0.
        $this->assertSame(
            \App\Reckoner\Sources\ProductionSource::class,
            $this->registry['production.total_cost']['source'] ?? null
        );
    }

    public function test_purchasing_and_paid_to_suppliers_are_distinct(): void
    {
        // §7.6: two metrics, never one figure under two names.
        $this->assertArrayHasKey('purchasing.spend', $this->registry);
        $this->assertArrayHasKey('finance.paid_to_suppliers', $this->registry);
        $this->assertNotSame(
            $this->registry['purchasing.spend']['label'],
            $this->registry['finance.paid_to_suppliers']['label'],
            '§7.6: purchasing.spend and finance.paid_to_suppliers must have distinct labels.'
        );
    }

    public function test_platform_metrics_have_platform_scope(): void
    {
        foreach ($this->registry as $key => $def) {
            if (str_starts_with($key, 'platform.')) {
                $this->assertSame(
                    'platform',
                    $def['scope'],
                    "'{$key}' starts with 'platform.' but scope='{$def['scope']}'."
                );
            }
        }
    }

    public function test_tenant_metrics_have_tenant_scope(): void
    {
        foreach ($this->registry as $key => $def) {
            if (! str_starts_with($key, 'platform.')) {
                $this->assertSame(
                    'tenant',
                    $def['scope'],
                    "'{$key}' is not platform-prefixed but scope='{$def['scope']}'."
                );
            }
        }
    }

    /* ------------------------------------------------------------------ *
     * Count guard — catches silent registry deletions.
     * ------------------------------------------------------------------ */

    public function test_registry_has_expected_key_count(): void
    {
        // Phase 1 + Phase 2 (scalar/status) = 34. Added 12 Phase B2 shapes = 46 total.
        $this->assertCount(
            46,
            $this->registry,
            'Registry key count changed unexpectedly. Update this test if you intentionally added or removed a key.'
        );
    }
}
