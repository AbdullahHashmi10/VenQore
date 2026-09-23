<?php
// docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/compare_suites_isolated.php

function loadText(string $filePath): string {
    $bytes = file_get_contents($filePath);
    if (substr($bytes, 0, 2) === "\xFF\xFE") {
        return mb_convert_encoding(substr($bytes, 2), 'UTF-8', 'UTF-16LE');
    }
    if (strpos($bytes, "\x00") !== false) {
        return mb_convert_encoding($bytes, 'UTF-8', 'UTF-16LE');
    }
    return $bytes;
}

function normalizeTestName(string $raw): string {
    $raw = preg_replace('/^[A-Za-z]\\\\.+?app-?code\\\\main-?app\\\\tests\\\\tests\\\\/i', 'Tests\\', $raw);
    $raw = preg_replace('/^[A-Za-z]\\\\.+?app-?code\\\\main-?app\\\\tests\\\\/i', 'Tests\\', $raw);
    $raw = preg_replace('/^Tests\\\\tests\\\\/i', 'Tests\\', $raw);
    $raw = str_replace('/', '\\', $raw);
    $raw = preg_replace('/\\\\+/', '\\', $raw);
    $raw = preg_replace('/\s+(HttpException|ErrorException|QueryException|RouteNotFoundException|UniqueConstraintViolationException)$/', '', $raw);
    $raw = rtrim($raw, " .\t\r\n\0\x0B…");
    return trim($raw);
}

function parsePestText(string $filePath): array {
    $content = loadText($filePath);
    $lines = explode("\n", str_replace("\r", "", $content));
    
    $failedTests = [];
    $currentFailed = null;
    $currentFailureMsg = [];

    $isCapturingFailure = false;
    foreach ($lines as $line) {
        $cleanLine = preg_replace('/\e[[][0-9;]*m/', '', $line);
        $cleanLine = trim($cleanLine);

        if (preg_match('/^FAILED\s+(.+?)\s*>\s*(.+)$/', $cleanLine, $m)) {
            if ($currentFailed) {
                $failedTests[$currentFailed] = implode("\n", $currentFailureMsg);
            }
            $normClass = normalizeTestName(trim($m[1]));
            $normMethod = normalizeTestName(trim($m[2]));
            $currentFailed = $normClass . ' > ' . $normMethod;
            $currentFailureMsg = [];
            $isCapturingFailure = true;
            continue;
        }

        if (preg_match('/^Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed/i', $cleanLine, $m)) {
            if ($currentFailed) {
                $failedTests[$currentFailed] = implode("\n", $currentFailureMsg);
                $currentFailed = null;
            }
            $isCapturingFailure = false;
        }

        if ($isCapturingFailure && $currentFailed) {
            $currentFailureMsg[] = $cleanLine;
        }
    }

    if ($currentFailed) {
        $failedTests[$currentFailed] = implode("\n", $currentFailureMsg);
    }

    $total = 0; $failed = 0; $passed = 0; $assertions = 0; $duration = '';
    if (preg_match('/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed\s+\((\d+)\s+assertions\)/i', $content, $m)) {
        $failed = (int)$m[1];
        $passed = (int)$m[2];
        $assertions = (int)$m[3];
        $total = $failed + $passed;
    }
    if (preg_match('/Duration:\s+([0-9.]+s)/i', $content, $m)) {
        $duration = $m[1];
    }

    return [
        'total' => $total,
        'passed' => $passed,
        'failed' => $failed,
        'assertions' => $assertions,
        'duration' => $duration,
        'failed_tests' => $failedTests,
    ];
}

$evidenceDir = __DIR__;
$bLog = $evidenceDir . '/baseline_console.log';
$cLog = $evidenceDir . '/current_console.log';

$b = parsePestText($bLog);
$c = parsePestText($cLog);

$bFails = $b['failed_tests'];
$cFails = $c['failed_tests'];

function findMatch(string $needle, array $haystack): ?string {
    if (isset($haystack[$needle])) return $needle;
    $needleParts = explode(' > ', $needle);
    $needleClass = $needleParts[0] ?? '';
    $needleMethod = $needleParts[1] ?? '';
    foreach ($haystack as $k => $v) {
        $kParts = explode(' > ', $k);
        $kClass = $kParts[0] ?? '';
        $kMethod = $kParts[1] ?? '';
        if ($kClass === $needleClass) {
            if (str_starts_with($needleMethod, $kMethod) || str_starts_with($kMethod, $needleMethod)) {
                return $k;
            }
        }
    }
    return null;
}

$shared = [];
$bOnly = [];
$cOnly = [];
$matchedBaselineKeys = [];

foreach ($cFails as $cName => $cMsg) {
    $bKey = findMatch($cName, $bFails);
    if ($bKey !== null) {
        $shared[$cName] = [
            'test' => $cName,
            'baseline_key' => $bKey,
            'baseline_excerpt' => substr($bFails[$bKey], 0, 300),
            'current_excerpt' => substr($cMsg, 0, 300),
        ];
        $matchedBaselineKeys[$bKey] = true;
    } else {
        $cOnly[$cName] = [
            'test' => $cName,
            'current_excerpt' => substr($cMsg, 0, 300),
        ];
    }
}

foreach ($bFails as $bName => $bMsg) {
    if (!isset($matchedBaselineKeys[$bName])) {
        $bOnly[$bName] = [
            'test' => $bName,
            'baseline_excerpt' => substr($bMsg, 0, 300),
        ];
    }
}

$outputJson = $evidenceDir . '/full_suite_isolated_comparison.json';
$report = [
    'generated_at' => date('c'),
    'baseline_commit' => '10988c439169faee75fa3d622f98f6d7d6f51954',
    'baseline_database' => 'amd_pos_test_baseline_10988c43',
    'baseline_summary' => [
        'total_tests' => $b['total'],
        'passed' => $b['passed'],
        'failed' => $b['failed'],
        'assertions' => $b['assertions'],
        'duration' => $b['duration'],
    ],
    'current_commit' => '0d33d5b07a56a82aabcc9015a330e8639dd0ad2a',
    'current_database' => 'amd_pos_test_current_0d33d5b0',
    'current_summary' => [
        'total_tests' => $c['total'],
        'passed' => $c['passed'],
        'failed' => $c['failed'],
        'assertions' => $c['assertions'],
        'duration' => $c['duration'],
    ],
    'breakdown' => [
        'shared_failures_count' => count($shared),
        'fixed_failures_count' => count($bOnly),
        'current_only_failures_count' => count($cOnly),
        'fixed_failures' => array_keys($bOnly),
        'shared_failures' => array_keys($shared),
        'current_only_failures' => array_values($cOnly),
    ],
];

$json = json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
if ($json === false) {
    echo "JSON Encode Error: " . json_last_error_msg() . "\n";
} else {
    file_put_contents($outputJson, $json);
    echo "Comparison report saved: {$outputJson}\n";
}
echo "Baseline Total: {$b['total']}, Passed: {$b['passed']}, Failed: {$b['failed']}, Assertions: {$b['assertions']}\n";
echo "Current Total: {$c['total']}, Passed: {$c['passed']}, Failed: {$c['failed']}, Assertions: {$c['assertions']}\n";
echo "Shared pre-existing failures: " . count($shared) . "\n";
echo "Fixed baseline failures: " . count($bOnly) . "\n";
echo "Current-only regressions: " . count($cOnly) . "\n";
