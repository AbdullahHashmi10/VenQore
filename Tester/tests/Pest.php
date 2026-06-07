<?php

/**
 * VenQore Test Suite — Pest Configuration
 *
 * Pest v3 bootstrap file.
 *
 * How ->in() vs uses() works in Pest v3:
 *  - pest()->extend()->in()  applies when Pest DISCOVERS test files by scanning
 *    directories (i.e., full suite run via phpunit.xml).
 *  - uses() declared inside a file applies when that file is run DIRECTLY /
 *    in isolation (e.g., the server's DemoStoreController or SSH commands).
 *  - Both CANNOT cover the same file — it causes a "already uses" conflict.
 *
 * Solution: Smoke & DemoStore are excluded from the global ->in() loop so they
 * can safely declare uses() at the top of their own files. All other Feature
 * subdirectories get VenQoreTestCase via ->in() for full-suite runs.
 */

use Tests\Feature\VenQoreTestCase;
use Tests\TestCase;

// ─── Feature Tests ────────────────────────────────────────────────────────────
// Directories that declare uses() in their own files (run in isolation on server)
$standaloneDirectories = ['Smoke', 'DemoStore'];

// Apply VenQoreTestCase to every Feature subdirectory EXCEPT the standalone ones
foreach (glob(__DIR__ . '/Feature/*', GLOB_ONLYDIR) as $dir) {
    if (in_array(basename($dir), $standaloneDirectories, true)) {
        continue; // these files declare uses() themselves
    }
    $absPath = realpath($dir) ?: $dir;
    $absPathNormalised = str_replace('\\', '/', $absPath);

    // Register all path variants to prevent Windows path normalization mismatches in Pest
    pest()->extend(VenQoreTestCase::class)->in($absPath);
    pest()->extend(VenQoreTestCase::class)->in($absPathNormalised);

    $dirName = basename($dir);

    // Register absolute paths for the corresponding root tests/Feature directory
    $rootDir = realpath(__DIR__ . "/../../tests/Feature/{$dirName}");
    if ($rootDir) {
        $rootDirNormalised = str_replace('\\', '/', $rootDir);
        pest()->extend(VenQoreTestCase::class)->in($rootDir);
        pest()->extend(VenQoreTestCase::class)->in($rootDirNormalised);
    }

    pest()->extend(VenQoreTestCase::class)->in("Tester/tests/Feature/{$dirName}");
    pest()->extend(VenQoreTestCase::class)->in("Tester\\tests\\Feature\\{$dirName}");
    pest()->extend(VenQoreTestCase::class)->in("tests/Feature/{$dirName}");
    pest()->extend(VenQoreTestCase::class)->in("tests\\Feature\\{$dirName}");
}

// Root-level Feature test files (ProfileTest.php, ImportMappingTest.php, etc.)
foreach (glob(__DIR__ . '/Feature/*.php') as $file) {
    if (basename($file) === 'VenQoreTestCase.php') {
        continue; // base class, not a test file
    }
    $absPath = realpath($file) ?: $file;
    $absPathNormalised = str_replace('\\', '/', $absPath);

    pest()->extend(VenQoreTestCase::class)->in($absPath);
    pest()->extend(VenQoreTestCase::class)->in($absPathNormalised);

    $fileName = basename($file);

    // Register absolute paths for the corresponding root tests/Feature file
    $rootFile = realpath(__DIR__ . "/../../tests/Feature/{$fileName}");
    if ($rootFile) {
        $rootFileNormalised = str_replace('\\', '/', $rootFile);
        pest()->extend(VenQoreTestCase::class)->in($rootFile);
        pest()->extend(VenQoreTestCase::class)->in($rootFileNormalised);
    }

    pest()->extend(VenQoreTestCase::class)->in("Tester/tests/Feature/{$fileName}");
    pest()->extend(VenQoreTestCase::class)->in("Tester\\tests\\Feature\\{$fileName}");
    pest()->extend(VenQoreTestCase::class)->in("tests/Feature/{$fileName}");
    pest()->extend(VenQoreTestCase::class)->in("tests\\Feature\\{$fileName}");
}

// ─── Unit Tests ───────────────────────────────────────────────────────────────
$absUnit = realpath(__DIR__ . '/Unit') ?: __DIR__ . '/Unit';
$absUnitNormalised = str_replace('\\', '/', $absUnit);

pest()->extend(TestCase::class)->in($absUnit);
pest()->extend(TestCase::class)->in($absUnitNormalised);
pest()->extend(TestCase::class)->in("Tester/tests/Unit");
pest()->extend(TestCase::class)->in("Tester\\tests\\Unit");
pest()->extend(TestCase::class)->in("tests/Unit");
pest()->extend(TestCase::class)->in("tests\\Unit");

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
*/

