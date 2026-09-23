<?php
// docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/run_baseline.php

$evidenceDir = 'E:/AMD POS/AMD POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0';
$junitFile = $evidenceDir . '/baseline_junit.xml';
$logFile = $evidenceDir . '/baseline_console.log';
$metaFile = $evidenceDir . '/baseline_meta.json';

$start = microtime(true);
$startTime = date('c');

echo "=== STARTING BASELINE TEST SUITE (Commit 10988c43) ===\n";
echo "Start Time: {$startTime}\n";
echo "Database: amd_pos_test_baseline_10988c43\n";

$cmd = '"E:\\Software\\Xampp\\php\\php.exe" vendor/bin/pest --log-junit "' . str_replace('/', '\\', $junitFile) . '"';

$descriptor = [
    0 => ["pipe", "r"],
    1 => ["pipe", "w"],
    2 => ["pipe", "w"],
];

$env = array_merge($_ENV, getenv(), [
    'APP_ENV' => 'testing',
    'DB_DATABASE' => 'amd_pos_test_baseline_10988c43',
    'CACHE_PREFIX' => 'baseline_test_',
]);

$process = proc_open($cmd, $descriptor, $pipes, 'E:/AMD POS/baseline-10988c43/app-code/main-app', $env);

$output = '';
if (is_resource($process)) {
    fclose($pipes[0]);
    while (!feof($pipes[1])) {
        $chunk = fread($pipes[1], 4096);
        $output .= $chunk;
        echo $chunk;
    }
    fclose($pipes[1]);
    fclose($pipes[2]);
    $exitCode = proc_close($process);
} else {
    $exitCode = 1;
    $output = "Failed to launch process";
}

$end = microtime(true);
$endTime = date('c');
$duration = round($end - $start, 2);

file_put_contents($logFile, $output);

$meta = [
    'suite' => 'baseline',
    'commit' => '10988c439169faee75fa3d622f98f6d7d6f51954',
    'database' => 'amd_pos_test_baseline_10988c43',
    'start_time' => $startTime,
    'end_time' => $endTime,
    'duration_seconds' => $duration,
    'exit_code' => $exitCode,
    'junit_file' => 'baseline_junit.xml',
    'console_log' => 'baseline_console.log',
];

file_put_contents($metaFile, json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "\n=== BASELINE RUN COMPLETED in {$duration}s with exit code {$exitCode} ===\n";
