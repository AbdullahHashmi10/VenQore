<?php
// docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/run_current.php

$evidenceDir = 'E:/AMD POS/AMD POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0';
$junitFile = $evidenceDir . '/current_junit.xml';
$logFile = $evidenceDir . '/current_console.log';
$metaFile = $evidenceDir . '/current_meta.json';

// Pre-flight check: confirm tracked files match 0d33d5b0
$preStatus = shell_exec('git status --short');
$headSha = trim(shell_exec('git rev-parse HEAD'));

$start = microtime(true);
$startTime = date('c');

echo "=== STARTING CURRENT TEST SUITE (Commit {$headSha}) ===\n";
echo "Start Time: {$startTime}\n";
echo "Database: amd_pos_test_current_0d33d5b0\n";
echo "Git status pre-flight clean: " . (empty(trim($preStatus)) ? 'YES' : 'NO') . "\n";

$cmd = '"E:\\Software\\Xampp\\php\\php.exe" vendor/bin/pest --log-junit "' . str_replace('/', '\\', $junitFile) . '"';

$descriptor = [
    0 => ["pipe", "r"],
    1 => ["pipe", "w"],
    2 => ["pipe", "w"],
];

$env = array_merge($_ENV, getenv(), [
    'APP_ENV' => 'testing',
    'DB_DATABASE' => 'amd_pos_test_current_0d33d5b0',
    'CACHE_PREFIX' => 'current_test_',
]);

$process = proc_open($cmd, $descriptor, $pipes, 'E:/AMD POS/AMD POS/app-code/main-app', $env);

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

$postStatus = shell_exec('git status --short');

$meta = [
    'suite' => 'current',
    'commit' => $headSha,
    'database' => 'amd_pos_test_current_0d33d5b0',
    'start_time' => $startTime,
    'end_time' => $endTime,
    'duration_seconds' => $duration,
    'exit_code' => $exitCode,
    'junit_file' => 'current_junit.xml',
    'console_log' => 'current_console.log',
    'pre_run_git_status' => trim($preStatus),
    'post_run_git_status' => trim($postStatus),
];

file_put_contents($metaFile, json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "\n=== CURRENT RUN COMPLETED in {$duration}s with exit code {$exitCode} ===\n";
