<?php

/**
 * FinalTester/bootstrap.php — PHPUnit/Pest bootstrap for the unified VenQore
 * testing command center.
 *
 * WHAT THIS FILE DOES (and deliberately does not do)
 * --------------------------------------------------
 * 1. Registers the Composer autoloader.
 * 2. PREPENDS a PSR-4 mapping  Tests\  ->  FinalTester/tests/  so that when a
 *    run is launched from FinalTester, the FinalTester copies of the test
 *    classes are the ones that resolve. composer.json is NOT modified; the
 *    mapping is added at runtime only. The original
 *    Tests\ -> Tester/tests/ mapping stays exactly where it is, so running
 *    the legacy Tester/phpunit.xml continues to behave identically.
 * 3. Refuses to run against the production database.
 *
 * It does NOT boot Laravel and does NOT seed. That is intentional and matches
 * Tester/bootstrap.php: booting a second application instance here leaks state
 * into the per-test lifecycle. Golden seeding is owned by
 * Tests\Support\GoldenSeedManager, invoked from VenQoreTestCase.
 */

$autoload = require __DIR__ . '/../vendor/autoload.php';

// ---------------------------------------------------------------------------
// Runtime PSR-4 prepend.
//
// Composer maps  Tests\ -> Tester/tests/  (see composer.json autoload.psr-4).
// We prepend FinalTester/tests/ so it is searched FIRST during a FinalTester
// run. Because FinalTester/tests is a byte-for-byte synced copy of the source
// suites, resolution order is behaviourally irrelevant — but being explicit
// prevents a stale Tester/ copy from shadowing a freshly synced FinalTester
// copy if the two ever diverge mid-run.
// ---------------------------------------------------------------------------
if ($autoload instanceof \Composer\Autoload\ClassLoader) {
    $autoload->addPsr4('Tests\\', __DIR__ . '/tests/', /* prepend */ true);
}

// ---------------------------------------------------------------------------
// Production database guard.
//
// FinalTester/phpunit.xml pins DB_DATABASE=amd_pos_test. The suite uses
// migrate:fresh, which would destroy production data. If anything (a stray
// .env, a shell export, a CI variable) points us at venqore_pos, abort before
// a single test runs.
// ---------------------------------------------------------------------------
$db = getenv('DB_DATABASE') ?: ($_ENV['DB_DATABASE'] ?? null);

if ($db === 'venqore_pos') {
    fwrite(STDERR, str_repeat('=', 74) . PHP_EOL);
    fwrite(STDERR, "FATAL: DB_DATABASE is set to 'venqore_pos' — the PRODUCTION database." . PHP_EOL);
    fwrite(STDERR, "The suite runs migrate:fresh and would destroy production data." . PHP_EOL);
    fwrite(STDERR, "Aborting before any test executes." . PHP_EOL);
    fwrite(STDERR, str_repeat('=', 74) . PHP_EOL);
    exit(1);
}

// ---------------------------------------------------------------------------
// MySQL-only guard.
//
// Project policy (CLAUDE.md): the entire system is built strictly on MySQL.
// SQLite is not supported anywhere, including tests. Fail loudly rather than
// silently producing green results against a database engine that behaves
// differently (no FK trigger semantics, different transaction isolation,
// different decimal handling — all of which this suite asserts on).
// ---------------------------------------------------------------------------
$connection = getenv('DB_CONNECTION') ?: ($_ENV['DB_CONNECTION'] ?? 'mysql');

if ($connection !== 'mysql' && $connection !== 'mariadb') {
    fwrite(STDERR, str_repeat('=', 74) . PHP_EOL);
    fwrite(STDERR, "FATAL: DB_CONNECTION is '{$connection}' — this suite requires 'mysql' or 'mariadb'." . PHP_EOL);
    fwrite(STDERR, "VenQore asserts on MySQL/MariaDB trigger, decimal and isolation semantics." . PHP_EOL);
    fwrite(STDERR, "Results from any other engine are not trustworthy. Aborting." . PHP_EOL);
    fwrite(STDERR, str_repeat('=', 74) . PHP_EOL);
    exit(1);
}
