<?php

/**
 * FinalTester/Scripts/report.php — turn a JUnit log into the run summary.
 *
 * The BAT launchers run the suite with --log-junit, then call this to print the
 * end-of-run block and write reports/summary.json for the dashboard.
 *
 * JUnit is the FINAL authority on a run. The TeamCity stream the dashboard
 * consumes is for live progress only; if the two ever disagree, this file wins,
 * because it is written by PHPUnit after every test has finished and every
 * result has been reconciled.
 *
 * USAGE
 *   php FinalTester/Scripts/report.php reports/junit.xml [exitCode]
 */

declare(strict_types=1);

$finalRoot = dirname(__DIR__);
$junitPath = $argv[1] ?? ($finalRoot . '/reports/junit.xml');
$exitCode  = isset($argv[2]) ? (int) $argv[2] : 0;

if (! is_file($junitPath)) {
    fwrite(STDERR, "\n  No JUnit log at {$junitPath}.\n");
    fwrite(STDERR, "  The run probably died before PHPUnit could write one —\n");
    fwrite(STDERR, "  scroll up for a fatal error, and check MySQL is running.\n\n");
    exit(1);
}

$xml = @simplexml_load_file($junitPath);

if ($xml === false) {
    fwrite(STDERR, "\n  Could not parse {$junitPath}.\n\n");
    exit(1);
}

$totals = [
    'tests'      => 0,
    'assertions' => 0,
    'failures'   => 0,
    'errors'     => 0,
    'skipped'    => 0,
    'time'       => 0.0,
];

$failures = [];
$byClass  = [];

/**
 * Walk the testsuite tree. Only leaf <testcase> elements are counted, so
 * nested suites cannot double-count.
 */
$walk = static function (SimpleXMLElement $node) use (&$walk, &$totals, &$failures, &$byClass): void {
    foreach ($node->testsuite ?? [] as $suite) {
        $walk($suite);
    }

    foreach ($node->testcase ?? [] as $case) {
        $class = (string) ($case['class'] ?: $node['name']);
        $name  = (string) $case['name'];

        $totals['tests']++;
        $totals['assertions'] += (int) $case['assertions'];
        $totals['time']       += (float) $case['time'];

        $byClass[$class]['total'] = ($byClass[$class]['total'] ?? 0) + 1;

        $state = 'passed';

        if (isset($case->error)) {
            $totals['errors']++;
            $state = 'errored';
            $failures[] = ['class' => $class, 'test' => $name, 'type' => 'error',   'message' => trim((string) $case->error)];
        } elseif (isset($case->failure)) {
            $totals['failures']++;
            $state = 'failed';
            $failures[] = ['class' => $class, 'test' => $name, 'type' => 'failure', 'message' => trim((string) $case->failure)];
        } elseif (isset($case->skipped)) {
            $totals['skipped']++;
            $state = 'skipped';
        }

        $byClass[$class][$state] = ($byClass[$class][$state] ?? 0) + 1;
    }
};

$walk($xml);

$passed = $totals['tests'] - $totals['failures'] - $totals['errors'] - $totals['skipped'];

// ---------------------------------------------------------------------------
// Reconcile against the expected count produced by Scripts/expected.php.
// A gap here is the single most important signal this whole system produces:
// it means tests exist that did not run.
// ---------------------------------------------------------------------------
$expected     = null;
$expectedPath = $finalRoot . '/reports/expected.json';

if (is_file($expectedPath)) {
    $decoded  = json_decode((string) file_get_contents($expectedPath), true);
    $expected = $decoded['expected'] ?? null;
}

$notExecuted = ($expected !== null) ? max(0, $expected - $totals['tests']) : null;

$summary = [
    'generated_at' => date('c'),
    'expected'     => $expected,
    'executed'     => $totals['tests'],
    'not_executed' => $notExecuted,
    'passed'       => $passed,
    'failed'       => $totals['failures'],
    'errored'      => $totals['errors'],
    'skipped'      => $totals['skipped'],
    'assertions'   => $totals['assertions'],
    'time_seconds' => round($totals['time'], 2),
    'exit_code'    => $exitCode,
    'by_class'     => $byClass,
    'failures'     => $failures,
];

file_put_contents(
    $finalRoot . '/reports/summary.json',
    json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
);

// ---------------------------------------------------------------------------
// Console block
// ---------------------------------------------------------------------------
$line = str_repeat('=', 64);
$pct  = ($expected && $expected > 0)
    ? number_format(min(100, $totals['tests'] / $expected * 100), 1)
    : null;

echo "\n{$line}\n";
echo "  RESULTS\n";
echo "{$line}\n";

if ($expected !== null) {
    echo "  Expected tests    : {$expected}\n";
    echo "  Executed tests    : {$totals['tests']}   ({$pct}% of expected)\n";

    if ($notExecuted > 0) {
        echo "  NOT EXECUTED      : {$notExecuted}   <-- investigate, see below\n";
    }
} else {
    echo "  Executed tests    : {$totals['tests']}\n";
    echo "  (no expected.json — run Scripts/expected.php for the reconciliation)\n";
}

echo "\n";
echo "  Passed            : {$passed}\n";
echo "  Failed            : {$totals['failures']}\n";
echo "  Errors            : {$totals['errors']}\n";
echo "  Skipped           : {$totals['skipped']}\n";
echo "  Assertions        : {$totals['assertions']}\n";
echo '  Time              : ' . number_format($totals['time'], 2) . "s\n";
echo '  Peak memory       : ' . number_format(memory_get_peak_usage(true) / 1048576, 1) . " MB (reporter only)\n";
echo "  Exit code         : {$exitCode}\n";
echo "{$line}\n";

if ($notExecuted) {
    echo "\n  WHY WOULD TESTS NOT EXECUTE?\n";
    echo "  - A fatal error killed the process part-way. Scroll up.\n";
    echo "  - A test class could not be loaded (namespace / autoload mismatch).\n";
    echo "  - stopOnFailure or a filter was left switched on.\n";
    echo "  - The run was interrupted.\n";
    echo "  Compare reports/expected.json against reports/junit.xml to see which.\n";
}

if ($failures !== []) {
    echo "\n  FAILURES AND ERRORS (" . count($failures) . ")\n";
    echo "  " . str_repeat('-', 62) . "\n";

    foreach (array_slice($failures, 0, 40) as $i => $f) {
        $n       = $i + 1;
        $short   = strtok($f['message'], "\n");
        $cls     = substr(strrchr($f['class'], '\\') ?: $f['class'], 1) ?: $f['class'];

        echo "  {$n}. [{$f['type']}] {$cls}::{$f['test']}\n";
        echo "     {$short}\n";
    }

    if (count($failures) > 40) {
        echo '  ... and ' . (count($failures) - 40) . " more. See reports/summary.json.\n";
    }

    echo "\n  Full detail: FinalTester/reports/summary.json\n";
}

echo "\n";

exit(0);
