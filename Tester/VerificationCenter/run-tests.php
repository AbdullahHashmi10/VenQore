<?php
// Tester/VerificationCenter/run-tests.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Disable execution time limit for running tests
set_time_limit(0);

$projectRoot = dirname(dirname(__DIR__));
$phpBinary = PHP_BINARY;

$artisan = $projectRoot . DIRECTORY_SEPARATOR . 'artisan';

// 1. Run verify:all to execute all registered tests and sweeps
$cmd1 = escapeshellarg($phpBinary) . ' ' . escapeshellarg($artisan) . ' verify:all 2>&1';
$output1 = [];
$code1 = 0;
exec($cmd1, $output1, $code1);

// 2. Run verify:dashboard-data to compile results into dashboard-data.json
$cmd2 = escapeshellarg($phpBinary) . ' ' . escapeshellarg($artisan) . ' verify:dashboard-data 2>&1';
$output2 = [];
$code2 = 0;
exec($cmd2, $output2, $code2);

echo json_encode([
    'success' => $code1 === 0 && $code2 === 0,
    'verify_all_exit_code' => $code1,
    'verify_all_output' => implode("\n", $output1),
    'verify_dashboard_exit_code' => $code2,
    'verify_dashboard_output' => implode("\n", $output2),
]);
