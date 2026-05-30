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
    pest()->extend(VenQoreTestCase::class)->in(realpath($dir) ?: $dir);
}

// Root-level Feature test files (ProfileTest.php, ImportMappingTest.php, etc.)
foreach (glob(__DIR__ . '/Feature/*.php') as $file) {
    if (basename($file) === 'VenQoreTestCase.php') {
        continue; // base class, not a test file
    }
    pest()->extend(VenQoreTestCase::class)->in(realpath($file) ?: $file);
}

// ─── Unit Tests ───────────────────────────────────────────────────────────────
pest()->extend(TestCase::class)->in(realpath(__DIR__ . '/Unit') ?: __DIR__ . '/Unit');

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

