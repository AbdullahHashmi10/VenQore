<?php

/**
 * FinalTester/Scripts/expected.php — authoritative EXPECTED test count.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every previous version of the dashboard guessed the denominator. One of them
 * divided by the length of a hand-maintained array of "module keys", which is
 * why the progress bar opened at 2% and could sail past 100%: the numerator and
 * denominator were counting different things.
 *
 * There is exactly one trustworthy source for "how many tests are there":
 * PHPUnit's own collector. This script asks it, via
 *
 *     pest --list-tests-xml <file>
 *
 * which performs full test discovery — including Pest's it()/test() closures
 * and every data-provider row — WITHOUT executing anything. The number it
 * returns is the same number the runner will execute, because it is produced
 * by the same collector.
 *
 * Output: FinalTester/reports/expected.json, plus the count on stdout.
 *
 * USAGE
 * -----
 *   php FinalTester/Scripts/expected.php
 *   php FinalTester/Scripts/expected.php --config=FinalTester/config/phpunit.categories.xml --testsuite=Security
 */

declare(strict_types=1);

$root       = dirname(__DIR__, 2);
$finalRoot  = dirname(__DIR__);
$reportsDir = $finalRoot . DIRECTORY_SEPARATOR . 'reports';

if (! is_dir($reportsDir)) {
    mkdir($reportsDir, 0775, true);
}

// ---- arguments ------------------------------------------------------------
$config    = 'tests/phpunit.xml';
$testsuite = null;

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--config=')) {
        $config = str_replace('FinalTester', 'tests', substr($arg, 9));
    }

    if (str_starts_with($arg, '--testsuite=')) {
        $testsuite = substr($arg, 12);
    }
}

$xmlOut = $reportsDir . DIRECTORY_SEPARATOR . 'discovered-tests.xml';

// ---- build the discovery command ------------------------------------------
$pest = $root . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'bin'
      . DIRECTORY_SEPARATOR . 'pest';

if (! is_file($pest)) {
    fwrite(STDERR, "FATAL: vendor/bin/pest not found. Run: composer install\n");
    exit(1);
}

// --test-directory must match the runner exactly, or discovery and execution
// disagree. Pest defaults it to "tests" (the legacy folder) regardless of
// --configuration, so it has to be stated explicitly.
$cmd = escapeshellarg(PHP_BINARY)
     . ' -d memory_limit=-1 '
     . escapeshellarg($pest)
     . ' --configuration ' . escapeshellarg($config)
     . ' --test-directory=tests/tests'
     . ($testsuite !== null ? ' --testsuite ' . escapeshellarg($testsuite) : '')
     . ' --list-tests-xml ' . escapeshellarg($xmlOut);

$output   = [];
$exitCode = 0;

exec($cmd . ' 2>&1', $output, $exitCode);

if (! is_file($xmlOut)) {
    fwrite(STDERR, "FATAL: discovery produced no XML. PHPUnit said:\n\n");
    fwrite(STDERR, implode("\n", $output) . "\n");
    exit(1);
}

// ---- parse ----------------------------------------------------------------
$xml = @simplexml_load_file($xmlOut);

if ($xml === false) {
    fwrite(STDERR, "FATAL: could not parse {$xmlOut}\n");
    exit(1);
}

$byClass = [];
$byArea  = [];
$total   = 0;

foreach ($xml->tests->testClass ?? [] as $class) {
    $className = (string) $class['name'];
    $file      = (string) $class['file'];
    $count     = count($class->testMethod);

    $byClass[$className] = [
        'file'  => str_replace($root . DIRECTORY_SEPARATOR, '', $file),
        'tests' => $count,
    ];

    $byArea[areaFor($className)] = ($byArea[areaFor($className)] ?? 0) + $count;

    $total += $count;
}

// .phpt files, if any are ever added.
$phpt = count($xml->tests->phpt ?? []);
$total += $phpt;

ksort($byClass);
ksort($byArea);

$report = [
    'generated_at' => date('c'),
    'config'       => $config,
    'testsuite'    => $testsuite,
    'expected'     => $total,
    'classes'      => count($byClass),
    'phpt'         => $phpt,
    'by_area'      => $byArea,
    'by_class'     => $byClass,
];

file_put_contents(
    $reportsDir . DIRECTORY_SEPARATOR . 'expected.json',
    json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
);

// A bare number on the last line so a BAT file can capture it with a
// for /f loop without any parsing gymnastics.
echo 'Discovered ' . count($byClass) . ' test classes.' . PHP_EOL;
echo $total . PHP_EOL;

exit(0);

/**
 * Map a test class to the dashboard area it belongs to.
 *
 * MUST stay in lockstep with areaFor() / AREA_RULES in dashboard/server.js.
 * If the two disagree, a section's "expected" and "executed" come from
 * different buckets and the per-area counts stop adding up.
 *
 * Presentation grouping only — never affects the totals.
 */
function areaFor(string $class): string
{
    $suite = normalizeSuite($class);

    // Matched against the normalised suite path. First hit wins.
    $rules = [
        '/^Feature\\\\(Money|Golden|Heart|Module05)\\\\/' => 'Financial Engine',
        '/^Feature\\\\Module20\\\\/'                      => 'SuperAdmin',
        '/^Feature\\\\(V3|Module15)\\\\/'                 => 'Accounting',
        '/^Feature\\\\Module03\\\\/'                      => 'POS',
        '/^Feature\\\\Module04\\\\/'                      => 'Payments',
        '/^Feature\\\\Module06\\\\/'                      => 'Sales',
        '/^Feature\\\\Module07\\\\/'                      => 'Purchasing',
        '/^Feature\\\\(Module08|Module09)\\\\/'           => 'Inventory',
        '/^Feature\\\\(Module12|Module13|Reports)\\\\/'   => 'Reports',
        '/^Feature\\\\(Module10|Module21)\\\\/'           => 'Integrations',
        '/^Feature\\\\Module11\\\\/'                      => 'Billing',
        '/^Feature\\\\Module16\\\\/'                      => 'Staff',
        '/^Feature\\\\Module17\\\\/'                      => 'Settings',
        '/^Feature\\\\Module18\\\\/'                      => 'Offline Sync',
        '/^Feature\\\\Module19\\\\/'                      => 'VenSynQ',
        '/^Feature\\\\Module01\\\\/'                      => 'Tenant Isolation',
        '/^Feature\\\\Module02\\\\/'                      => 'Provisioning',
        '/^Feature\\\\(Module14|Chat)\\\\/'               => 'AI',
        '/^Feature\\\\(Guardrails|Core)\\\\/'             => 'Guardrails',
        '/^Feature\\\\Production\\\\/'                    => 'Regression',
        '/^Feature\\\\(Smoke|DemoStore)\\\\/'             => 'Smoke',
        '/^Feature\\\\Tools\\\\/'                         => 'Tools',
        '/^Feature\\\\Auth\\\\/'                          => 'Security',
        '/^Feature\\\\(Billing|AppSumo)\\\\/'             => 'Billing',
        '/^Routes\\\\/'                                   => 'Routes',
        '/^Performance\\\\/'                              => 'Performance',
        '/^Unit\\\\/'                                     => 'Unit',
    ];

    foreach ($rules as $pattern => $area) {
        if (preg_match($pattern, $suite) === 1) {
            return $area;
        }
    }

    // Root-level Feature/*.php files, bucketed by filename.
    $parts = explode('\\', $suite);
    $leaf  = end($parts) ?: $suite;

    $nameRules = [
        '/Route|Ziggy|Pulse/'                                              => 'Routes',
        '/Regression|RecentFixes/'                                         => 'Regression',
        '/Ledger|Accounting|PaymentAllocation|DebitNote|OpeningBalances/'   => 'Accounting',
        '/Plan|Billing|AppSumo/'                                           => 'Billing',
        '/Pos|Terminal/'                                                   => 'POS',
        '/Golden|Audit/'                                                   => 'Financial Engine',
        '/Marketing|Sitemap|Blog|Partners|Pricing|Solutions|Compare|Roadmap|Documentation|Crawl/' => 'Marketing',
        '/Migration|SystemReset|ProductDeletion|Import/'                   => 'Database',
        '/Profile|Auth|Passcode|Permission/'                               => 'Security',
        '/Smart|Chat/'                                                     => 'AI',
        '/Inventory|Fulfillment|Stock/'                                    => 'Inventory',
    ];

    foreach ($nameRules as $pattern => $area) {
        if (preg_match($pattern, $leaf) === 1) {
            return $area;
        }
    }

    return 'Feature (general)';
}

/**
 * Reduce any of Pest's three class-name forms to a common suite path.
 *
 *   Tests\Feature\Money\GatingTest                    -> Feature\Money\GatingTest
 *   FinalTester\tests\Feature\Billing\GeoPricingTest  -> Feature\Billing\GeoPricingTest
 *   P\FinalTester\tests\Feature\Module12\ReportsTest  -> Feature\Module12\ReportsTest
 *
 * Pest synthesises a class name from the FILE PATH for closure-style tests, so
 * a `Tests\` prefix match silently misses every one of them.
 */
function normalizeSuite(string $class): string
{
    $class = str_replace('/', '\\', $class);

    if (preg_match('/(?:^|\\\\)(Feature|Unit|Routes|Performance)\\\\(.*)$/', $class, $m) === 1) {
        return $m[1] . '\\' . $m[2];
    }

    return $class;
}
