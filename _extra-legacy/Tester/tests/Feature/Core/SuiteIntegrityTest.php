<?php

namespace Tests\Feature\Core;

use DOMDocument;
use Tests\TestCase;

/**
 * SuiteIntegrityTest — the meta-test that makes the "dead divergent copy" and
 * "duplicate base class" failure modes (audit F-01 / F-02 / FC-10) structurally
 * impossible going forward.
 *
 * It does NOT touch the database (extends Tests\TestCase, no RefreshDatabase) so
 * it runs fast and early. It asserts, purely from the filesystem + phpunit.xml:
 *
 *   1. Every *Test.php on the live test path maps to >=1 PHPUnit testsuite.
 *   2. No two PHP classes on the live test path share a fully-qualified name
 *      (the exact collision that let a dead VenQoreTestCase shadow the real one).
 *   3. No *Test.php files live outside the live test tree — archived / dead code
 *      must be under _archive/ (or the baseline), never discoverable by PHPUnit.
 *   4. phpunit.xml still references a real bootstrap and the Run Ledger extension,
 *      so "it passes" always produces an evidence artifact.
 *
 * Phase B extends this to also reconcile against VerificationCenter/registry/suites.yaml.
 */
class SuiteIntegrityTest extends TestCase
{
    private function testerRoot(): string
    {
        // Tester/ directory (this file is Tester/tests/Feature/Core/…).
        return dirname(__DIR__, 3);
    }

    /**
     * The project root, resolved identically from EITHER tree.
     *
     * This file lives at <root>/Tester/tests/Feature/Core/ during a Tester run
     * and at <root>/FinalTester/tests/Feature/Core/ during a FinalTester run
     * (FinalTester/tests is a synced copy — see FinalTester/Scripts/sync.php),
     * so dirname(__DIR__, 4) lands on <root> in both cases while
     * testerRoot() deliberately does not.
     *
     * Anything that refers to a location OUTSIDE the current tree must resolve
     * from here. Resolving it from testerRoot() is what made the archive guard
     * below look for FinalTester/Golden/tests — a path that has never existed —
     * and fail for a reason that had nothing to do with what it guards.
     */
    private function projectRoot(): string
    {
        return dirname(__DIR__, 4);
    }

    /** Recursively collect files matching a glob under a directory. */
    private function rglob(string $pattern, int $flags = 0): array
    {
        $files = glob($pattern, $flags) ?: [];
        foreach (glob(dirname($pattern) . '/*', GLOB_ONLYDIR | GLOB_NOSORT) ?: [] as $dir) {
            $files = array_merge($files, $this->rglob($dir . '/' . basename($pattern), $flags));
        }
        return $files;
    }

    /** All *Test.php files on the LIVE test path (Tester/tests), excluding _archive. */
    private function liveTestFiles(): array
    {
        $root = $this->testerRoot() . '/tests';
        $all = $this->rglob($root . '/*Test.php');
        return array_values(array_filter($all, function ($f) {
            $n = str_replace('\\', '/', $f);
            return strpos($n, '/_archive/') === false;
        }));
    }

    public function test_every_test_file_maps_to_a_registered_suite(): void
    {
        $xmlPath = $this->testerRoot() . '/phpunit.xml';
        $this->assertFileExists($xmlPath, 'Tester/phpunit.xml must exist.');

        $dom = new DOMDocument();
        $this->assertTrue($dom->load($xmlPath), 'phpunit.xml must be well-formed XML.');

        // Collect every <directory> and <file> registered across all <testsuite>s,
        // resolved to absolute paths relative to the Tester/ dir.
        $registeredDirs = [];
        $registeredFiles = [];
        foreach ($dom->getElementsByTagName('directory') as $node) {
            $val = trim($node->textContent);
            if ($val === '' || strpos($val, '..') === 0) {
                continue; // skip coverage <source> like ../app
            }
            $registeredDirs[] = $this->normalize($this->testerRoot() . '/' . $val);
        }
        foreach ($dom->getElementsByTagName('file') as $node) {
            $registeredFiles[] = $this->normalize($this->testerRoot() . '/' . trim($node->textContent));
        }

        $this->assertNotEmpty($registeredDirs, 'phpunit.xml declares no testsuite directories.');

        $unregistered = [];
        foreach ($this->liveTestFiles() as $file) {
            $norm = $this->normalize($file);
            $covered = in_array($norm, $registeredFiles, true);
            if (! $covered) {
                foreach ($registeredDirs as $dir) {
                    if (strpos($norm, rtrim($dir, '/') . '/') === 0) {
                        $covered = true;
                        break;
                    }
                }
            }
            if (! $covered) {
                $unregistered[] = $norm;
            }
        }

        $this->assertSame(
            [],
            $unregistered,
            "These *Test.php files are NOT covered by any phpunit.xml testsuite (they would never run):\n"
                . implode("\n", $unregistered)
        );
    }

    public function test_no_duplicate_fully_qualified_class_names_on_test_path(): void
    {
        $byFqcn = [];
        foreach ($this->liveTestFiles() as $file) {
            $src = file_get_contents($file);
            $ns = '';
            if (preg_match('/^\s*namespace\s+([^;]+);/m', $src, $m)) {
                $ns = trim($m[1]);
            }
            // Match class/abstract class/final class declarations.
            if (preg_match_all('/^\s*(?:abstract\s+|final\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/m', $src, $cm)) {
                foreach ($cm[1] as $class) {
                    $fqcn = ($ns !== '' ? $ns . '\\' : '') . $class;
                    $byFqcn[$fqcn][] = str_replace('\\', '/', $file);
                }
            }
        }

        $dupes = array_filter($byFqcn, fn ($paths) => count($paths) > 1);
        $lines = [];
        foreach ($dupes as $fqcn => $paths) {
            $lines[] = $fqcn . ' declared in: ' . implode(' AND ', $paths);
        }

        $this->assertSame(
            [],
            $lines,
            "Duplicate fully-qualified class names on the test path (fatal 'Cannot redeclare class' risk):\n"
                . implode("\n", $lines)
        );
    }

    /**
     * No test file may sit outside the live tree where PHPUnit cannot see it.
     *
     * RESTORED 2026-08-03. This guard was deleted in the previous pass because
     * it asserted on FinalTester/Golden/tests, which does not exist — but the
     * path was simply mis-resolved (see projectRoot() above), not the guard's
     * premise. Deleting it removed the one check that notices a test file
     * parked somewhere PHPUnit never loads, which is exactly how six marketing
     * test files sat on disk uncounted. Fix the path, keep the guard.
     */
    public function test_no_test_files_hide_outside_the_live_tree(): void
    {
        $archive = $this->projectRoot() . '/Tester/Golden/tests';

        $this->assertDirectoryExists(
            $archive,
            'Expected ' . $archive . ' to exist as the archived dead-copy location this guard '
                . 'watches. If it was intentionally removed, delete this test rather than letting '
                . 'it silently assert nothing.'
        );

        // Nothing executable may live in the archive. A *Test.php here is
        // invisible to every phpunit.xml yet looks like real coverage to a human
        // reading the directory.
        $stranded = $this->rglob($archive . '/*Test.php');

        $this->assertSame(
            [],
            array_map(fn ($f) => str_replace('\\', '/', $f), $stranded),
            "Test files are parked in the archived tree where no suite can load them.\n"
                . "Move them into Tester/tests/ (the source suite) or delete them outright."
        );

        // And the two trees must agree. FinalTester/tests is a materialised view
        // of Tester/tests; if it has drifted, the dashboard is reporting on code
        // that is not the code under source control.
        $source = $this->projectRoot() . '/Tester/tests';
        $mirror = $this->projectRoot() . '/FinalTester/tests';

        if (is_dir($mirror)) {
            $rel = function (array $files, string $base): array {
                $out = [];
                foreach ($files as $f) {
                    $out[] = ltrim(str_replace('\\', '/', substr($f, strlen($base))), '/');
                }
                sort($out);
                return $out;
            };

            // Deliberately one-directional: source MINUS mirror. FinalTester may
            // legitimately hold extra files it owns outright (see
            // $finalTesterOwned in sync.php); what must never happen is a source
            // test the canonical suite cannot see.
            $missing = array_values(array_diff(
                $rel($this->rglob($source . '/*Test.php'), $source),
                $rel($this->rglob($mirror . '/*Test.php'), $mirror)
            ));

            $this->assertSame(
                [],
                $missing,
                "These test files exist in Tester/tests but NOT in FinalTester/tests, so the "
                    . "canonical suite never runs them:\n  " . implode("\n  ", $missing)
                    . "\n\nRun: php FinalTester/Scripts/sync.php"
            );
        }
    }

    public function test_phpunit_wires_bootstrap_and_run_ledger(): void
    {
        $xml = file_get_contents($this->testerRoot() . '/phpunit.xml');
        $this->assertStringContainsString(
            'bootstrap="bootstrap.php"',
            $xml,
            'phpunit.xml must wire Tester/bootstrap.php (audit F-03).'
        );
        $this->assertStringContainsString(
            'RunLedger\\RunLedgerExtension',
            $xml,
            'phpunit.xml must register the Run Ledger extension so every run leaves an evidence artifact (FC-5).'
        );
    }

    private function normalize(string $path): string
    {
        $path = str_replace('\\', '/', $path);
        $parts = [];
        foreach (explode('/', $path) as $seg) {
            if ($seg === '' || $seg === '.') {
                continue;
            }
            if ($seg === '..') {
                array_pop($parts);
                continue;
            }
            $parts[] = $seg;
        }
        $prefix = ($path[0] ?? '') === '/' ? '/' : '';
        return $prefix . implode('/', $parts);
    }
}
