<?php

namespace Tests\Feature\Core;

use Symfony\Component\Yaml\Yaml;
use Tests\TestCase;

/**
 * RegistryDriftTest — keeps Tester/VerificationCenter/registry/suites.yaml honest.
 *
 * The registry is the One Dashboard's source of truth. The blueprint's explicit
 * anti-pattern (§10, "registry becomes stale — the new second-copy problem") is
 * defeated by validating the registry WITH TESTS, not discipline. This test fails
 * if the registry drifts from the filesystem or phpunit.xml:
 *
 *   1. Every suite path in the registry exists on disk.
 *   2. Every live *Test.php file belongs to a registered suite member.
 *   3. The registry's phpunit_test_methods_total matches the live count.
 *   4. Every registry member declares a valid oracle_tier (T1|T2|T3).
 *   5. Every verification_source declares a command + oracle_tier.
 *
 * No DB needed (extends Tests\TestCase).
 */
class RegistryDriftTest extends TestCase
{
    private function testerRoot(): string
    {
        return dirname(__DIR__, 3);
    }

    private function registry(): array
    {
        $path = $this->testerRoot() . '/VerificationCenter/registry/suites.yaml';
        $this->assertFileExists($path, 'suites.yaml registry must exist (Phase B).');
        return Yaml::parseFile($path);
    }

    private function rglob(string $pattern): array
    {
        $files = glob($pattern) ?: [];
        foreach (glob(dirname($pattern) . '/*', GLOB_ONLYDIR | GLOB_NOSORT) ?: [] as $dir) {
            $files = array_merge($files, $this->rglob($dir . '/' . basename($pattern)));
        }
        return $files;
    }

    private function liveTestFiles(): array
    {
        $root = $this->testerRoot() . '/tests';
        $all = $this->rglob($root . '/*Test.php');
        return array_values(array_filter($all, fn ($f) => strpos(str_replace('\\', '/', $f), '/_archive/') === false));
    }

    /**
     * Count test methods across ALL declaration styles the suite uses:
     * testFoo() naming, the /** @test *​/ annotation, the #[Test] attribute,
     * and Pest it()/test() calls. Must stay identical to the suites.yaml
     * generator or this test drifts against its own registry.
     */
    private function countTestMethods(string $file): int
    {
        $s = (string) file_get_contents($file);
        $n  = preg_match_all('/function\s+test[A-Za-z0-9_]*\s*\(/', $s);
        $n += preg_match_all('/\/\*\*[^*]*@test\b/', $s);
        $n += preg_match_all('/#\[Test\]/', $s);
        $n += preg_match_all('/^\s*(?:it|test)\(/m', $s);
        return (int) $n;
    }

    public function test_registry_suite_paths_exist(): void
    {
        $reg = $this->registry();
        $missing = [];
        foreach ($reg['suites'] ?? [] as $suite) {
            $p = $this->testerRoot() . '/' . ($suite['path'] ?? '');
            if (! file_exists($p)) {
                $missing[] = $suite['path'] ?? '(no path)';
            }
        }
        $this->assertSame([], $missing, "Registry references nonexistent paths:\n" . implode("\n", $missing));
    }

    public function test_every_live_test_file_is_registered(): void
    {
        $reg = $this->registry();
        $registeredFiles = [];
        foreach ($reg['suites'] ?? [] as $suite) {
            foreach ($suite['members'] ?? [] as $m) {
                $registeredFiles[] = str_replace('\\', '/', $m['file']);
            }
        }

        $unregistered = [];
        foreach ($this->liveTestFiles() as $file) {
            $rel = 'tests/' . str_replace('\\', '/', substr($file, strpos($file, '/tests/') + 7));
            if (! in_array($rel, $registeredFiles, true)) {
                $unregistered[] = $rel;
            }
        }

        $this->assertSame(
            [],
            $unregistered,
            "Live test files not present in suites.yaml (registry drift):\n" . implode("\n", $unregistered)
        );
    }

    public function test_phpunit_method_total_matches_filesystem(): void
    {
        $reg = $this->registry();
        $declared = (int) ($reg['meta']['phpunit_test_methods_total'] ?? -1);

        $actual = 0;
        foreach ($this->liveTestFiles() as $f) {
            $actual += $this->countTestMethods($f);
        }

        $this->assertSame(
            $declared,
            $actual,
            "Registry declares {$declared} phpunit test methods but the filesystem has {$actual}. "
                . 'Regenerate suites.yaml (Phase B generator) after adding/removing tests.'
        );
    }

    public function test_every_member_has_a_valid_oracle_tier(): void
    {
        $reg = $this->registry();
        $bad = [];
        foreach ($reg['suites'] ?? [] as $suite) {
            foreach ($suite['members'] ?? [] as $m) {
                if (! in_array($m['oracle_tier'] ?? null, ['T1', 'T2', 'T3'], true)) {
                    $bad[] = ($m['file'] ?? '?') . ' => ' . var_export($m['oracle_tier'] ?? null, true);
                }
            }
        }
        $this->assertSame([], $bad, "Members with invalid oracle_tier:\n" . implode("\n", $bad));
    }

    public function test_every_verification_source_is_well_formed(): void
    {
        $reg = $this->registry();
        $bad = [];
        foreach ($reg['verification_sources'] ?? [] as $src) {
            if (empty($src['command']) || ! in_array($src['oracle_tier'] ?? null, ['T1', 'T2', 'T3'], true)) {
                $bad[] = ($src['id'] ?? '?');
            }
        }
        $this->assertSame([], $bad, "Malformed verification_sources (need command + valid oracle_tier): " . implode(', ', $bad));
    }
}
