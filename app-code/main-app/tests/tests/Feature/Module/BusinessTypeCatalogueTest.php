<?php

namespace Tests\Feature\Module;

use App\Console\Commands\ExportBusinessTypes;
use App\Support\BusinessTypes;
use App\Support\Terms;
use Tests\TestCase;

/**
 * config/business_types.php is the one catalogue of the 85 business types.
 * These tests keep it honest: every type lands on a shippable preset, every
 * module it switches on is live and dependency-complete, every word it
 * renames is a real term key, the matcher understands every label, alias and
 * fixture sentence, and the public site's JSON copy has not drifted.
 */
class BusinessTypeCatalogueTest extends TestCase
{
    public function test_catalogue_has_85_types_in_5_sectors(): void
    {
        $this->assertCount(5, BusinessTypes::sectors());
        $this->assertCount(85, BusinessTypes::all());

        foreach (BusinessTypes::all() as $key => $type) {
            $this->assertArrayHasKey($type['sector'], BusinessTypes::sectors(), "{$key}: unknown sector");
            $this->assertNotEmpty($type['aliases'] ?? [], "{$key}: no aliases — the matcher cannot find it");
        }
    }

    public function test_every_type_builds_on_a_shippable_preset(): void
    {
        foreach (BusinessTypes::all() as $key => $type) {
            $preset = config("ai_builder.presets.{$type['preset']}");
            $this->assertNotNull($preset, "{$key}: preset '{$type['preset']}' does not exist");
            $this->assertEmpty($preset['blocked_by'] ?? [], "{$key}: preset '{$type['preset']}' is blocked");
        }
    }

    public function test_every_type_switches_on_live_dependency_complete_modules(): void
    {
        $registry = config('modules');

        foreach (array_keys(BusinessTypes::all()) as $key) {
            $modules = BusinessTypes::modulesFor($key);
            $this->assertNotEmpty($modules, "{$key}: no modules");

            foreach ($modules as $m) {
                $this->assertSame('live', $registry[$m]['status'] ?? null, "{$key}: module '{$m}' is not live");
                foreach ($registry[$m]['requires'] ?? [] as $dep) {
                    $this->assertContains($dep, $modules, "{$key}: '{$m}' needs '{$dep}'");
                }
            }
        }
    }

    public function test_every_renamed_word_is_a_real_term_key(): void
    {
        $valid = array_keys(Terms::fallbacks());

        foreach (array_keys(BusinessTypes::all()) as $key) {
            foreach (BusinessTypes::termsFor($key) as $term => $words) {
                $this->assertContains($term, $valid, "{$key}: '{$term}' is not a Terms key");
                $this->assertNotEmpty($words['singular'], "{$key}: '{$term}' has no singular");
                $this->assertNotEmpty($words['plural'], "{$key}: '{$term}' has no plural");
            }
        }
    }

    public function test_matcher_understands_every_label_and_alias(): void
    {
        foreach (BusinessTypes::all() as $key => $type) {
            foreach (array_merge([$type['label']], $type['aliases']) as $phrase) {
                $match = BusinessTypes::match($phrase);
                $this->assertNotNull($match['key'], "'{$phrase}' ({$key}) matched nothing");
                $this->assertSame(
                    $type['preset'],
                    BusinessTypes::presetFor($match['key']),
                    "'{$phrase}' should build a {$key} ({$type['preset']}) setup, got {$match['key']}"
                );
            }
        }
    }

    public function test_matcher_passes_every_fixture_sentence(): void
    {
        foreach (config('ai_builder.fixtures') as $fixture) {
            $match = BusinessTypes::match($fixture['text']);
            $this->assertSame($fixture['expect_type'], $match['key'], "'{$fixture['text']}'");
            $this->assertTrue($match['confident'], "'{$fixture['text']}' matched but not confidently");
        }
    }

    public function test_a_sentence_naming_no_trade_is_not_forced_into_a_type(): void
    {
        $this->assertNull(BusinessTypes::match('I sell stuff')['key']);
        $this->assertNull(BusinessTypes::match('')['key']);
    }

    public function test_site_json_is_in_sync_with_the_config(): void
    {
        $this->assertSame(
            ExportBusinessTypes::json(),
            file_get_contents(base_path(ExportBusinessTypes::PATH)),
            'resources/js/Data/businessTypes.json is stale — run `php artisan vq:business-types:export`.'
        );
    }
}
