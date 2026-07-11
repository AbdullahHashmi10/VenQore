<?php

/**
 * Tester/bootstrap.php — PHPUnit bootstrap for the VenQore verification platform.
 *
 * WIRED into Tester/phpunit.xml (bootstrap="bootstrap.php") as of Phase A.
 * History: the previous version of this file booted Laravel and ran
 * GoldenCompanySeeder here — but it was never referenced by phpunit.xml
 * (audit finding F-03), so Golden seeding happened via in-test
 * DB::commit()/beginTransaction() surgery instead, the most plausible root
 * cause of the 109-error cascade in the last recorded run (FC-5).
 *
 * The new architecture deliberately does NOT boot Laravel or seed here:
 *  - Booting a second app instance in bootstrap leaks state into the
 *    per-test application lifecycle.
 *  - Seeding is owned by Tests\Support\GoldenSeedManager, invoked from
 *    VenQoreTestCase::refreshTestDatabase() AFTER migrate:fresh and BEFORE
 *    the per-test transaction — once per process, checksum-guarded.
 *
 * This file therefore only: (1) registers the composer autoloader,
 * (2) asserts the environment is sane enough to produce trustworthy results.
 */

require __DIR__ . '/../vendor/autoload.php';

// Fail fast on the classic silent-footgun: tests accidentally pointed at a
// non-test database. phpunit.xml sets DB_DATABASE=amd_pos_test; if something
// overrides it to the production database, refuse to run at all.
$db = getenv('DB_DATABASE') ?: ($_ENV['DB_DATABASE'] ?? null);
if ($db === 'venqore_pos') {
    fwrite(STDERR, "FATAL: Test bootstrap detected DB_DATABASE=venqore_pos (the PRODUCTION database).\n");
    fwrite(STDERR, "Tests use migrate:fresh and would destroy production data. Aborting.\n");
    exit(1);
}
