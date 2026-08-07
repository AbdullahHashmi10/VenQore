<?php

/**
 * FinalTester/Scripts/preflight.php — environment sanity check.
 *
 * WHY THIS EXISTS
 * ---------------
 * The run ledger for 2026-08-02 records 1322 tests with 159 failures and 173
 * errors. Reading the error messages shows what actually happened:
 *
 *     87 x "Table 'amd_pos_test.plans' doesn't exist"
 *     27 x "Table 'amd_pos_test.tenants' doesn't exist"
 *     33 x "Unknown column ... in 'field list'"
 *
 * The test database was not migrated. Roughly half of that red was the
 * environment, not the product — but nothing in the output said so, so the run
 * looked like 332 product defects. Hours can disappear into chasing bugs that
 * do not exist.
 *
 * This script runs before every suite and fails fast with a specific
 * instruction when the environment is not fit to produce a trustworthy result.
 * A red build should mean "the product is broken", never "the database was
 * stale".
 *
 * USAGE
 *   php FinalTester/Scripts/preflight.php          exit 0 = safe to run
 *   php FinalTester/Scripts/preflight.php --warn   never fails the build
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$warnOnly = in_array('--warn', $argv, true);

$problems = [];
$notes    = [];

$line = str_repeat('-', 64);
echo "\n  Preflight\n  {$line}\n";

// ---------------------------------------------------------------------------
// 1. Composer autoloader
// ---------------------------------------------------------------------------
if (! is_file($root . '/vendor/autoload.php')) {
    $problems[] = [
        'Composer dependencies are not installed.',
        'Fix:  composer install',
    ];
} else {
    echo "  [ok]   composer autoloader present\n";
}

if (! is_file($root . '/vendor/bin/pest')) {
    $problems[] = [
        'vendor/bin/pest is missing.',
        'Fix:  composer install',
    ];
}

// ---------------------------------------------------------------------------
// 2. MySQL reachable, and it really is MySQL
// ---------------------------------------------------------------------------
$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$db   = getenv('DB_DATABASE') ?: 'amd_pos_test';
$user = getenv('DB_USERNAME') ?: 'root';
$pass = getenv('DB_PASSWORD') ?: '';

if ($db === 'venqore_pos') {
    echo "\n  ABORT: DB_DATABASE is the production database.\n\n";
    exit(1);
}

$pdo = null;

try {
    $pdo = new PDO("mysql:host={$host};port={$port}", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]);
    echo "  [ok]   MySQL reachable at {$host}:{$port}\n";
} catch (PDOException $e) {
    $problems[] = [
        "Cannot connect to MySQL at {$host}:{$port} — " . $e->getMessage(),
        'Fix:  start MySQL (XAMPP / Local / service), then try again.',
    ];
}

// ---------------------------------------------------------------------------
// 3. The test database exists and is populated
// ---------------------------------------------------------------------------
if ($pdo !== null) {
    $exists = $pdo->query(
        "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = " . $pdo->quote($db)
    )->fetchColumn();

    if (! $exists) {
        $problems[] = [
            "The test database '{$db}' does not exist.",
            "Fix:  mysql -u {$user} -e \"CREATE DATABASE {$db};\"\n"
            . "       then:  php artisan migrate --database=mysql --env=testing",
        ];
    } else {
        echo "  [ok]   database '{$db}' exists\n";

        // Tables the failing 2026-08-02 run was missing. If these are absent,
        // the whole suite will drown in SQLSTATE[42S02] and tell you nothing
        // about the product.
        $required = ['migrations', 'tenants', 'plans', 'users', 'products', 'transactions', 'journal_entries'];
        $missing  = [];

        foreach ($required as $table) {
            $found = $pdo->query(
                "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = " . $pdo->quote($db)
                . " AND TABLE_NAME = " . $pdo->quote($table)
            )->fetchColumn();

            if (! $found) {
                $missing[] = $table;
            }
        }

        if ($missing !== []) {
            $problems[] = [
                "'{$db}' is missing core tables: " . implode(', ', $missing),
                "This is EXACTLY the condition that produced 133 bogus errors in\n"
                . "       the 2026-08-02 run. Do not read those results as product bugs.\n"
                . "       Fix:  php artisan migrate:fresh --env=testing",
            ];
        } else {
            echo "  [ok]   core tables present\n";

            // Migration drift: files on disk vs rows in the migrations table.
            $ran = (int) $pdo->query("SELECT COUNT(*) FROM `{$db}`.migrations")->fetchColumn();
            $onDisk = count(glob($root . '/database/migrations/*.php') ?: []);

            if ($onDisk > $ran) {
                $problems[] = [
                    "Migration drift: {$onDisk} migration files on disk, only {$ran} recorded as run.",
                    "Missing migrations cause \"Unknown column\" errors that look like\n"
                    . "       product bugs. Fix:  php artisan migrate --env=testing",
                ];
            } else {
                echo "  [ok]   migrations current ({$ran} applied)\n";
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 4. Ziggy freshness — advisory only
// ---------------------------------------------------------------------------
$ziggy = $root . '/resources/js/ziggy.js';
$web   = $root . '/routes/web.php';

if (is_file($ziggy) && is_file($web) && filemtime($web) > filemtime($ziggy)) {
    $notes[] = "routes/web.php is newer than resources/js/ziggy.js.\n"
             . "         The route sweep will flag this. Fix:  php artisan ziggy:generate";
} elseif (is_file($ziggy)) {
    echo "  [ok]   ziggy.js is newer than routes/web.php\n";
}

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------
echo "  {$line}\n";

foreach ($notes as $n) {
    echo "  [note] {$n}\n";
}

if ($problems === []) {
    echo "  Environment is fit to produce trustworthy results.\n\n";
    exit(0);
}

echo "\n";
echo "  " . str_repeat('=', 62) . "\n";
echo "  PREFLIGHT FAILED — " . count($problems) . " problem(s)\n";
echo "  " . str_repeat('=', 62) . "\n\n";

foreach ($problems as $i => [$what, $how]) {
    echo '  ' . ($i + 1) . ". {$what}\n";
    echo "     {$how}\n\n";
}

echo "  Running the suite now would produce red results that say nothing\n";
echo "  about whether the product works.\n\n";

exit($warnOnly ? 0 : 1);
