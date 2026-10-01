<?php

$files = [
    'Sequential_V2' => __DIR__ . '/../storage/test-results/junit_release_final_sequential_v2.xml',
    'Parallel'      => __DIR__ . '/../storage/test-results/junit_release_final_parallel.xml',
];

$report = [];

foreach ($files as $name => $path) {
    if (!file_exists($path)) {
        $report[$name] = ['error' => "File not found: {$path}"];
        continue;
    }

    $cTime = date('c', filectime($path));
    $mTime = date('c', filemtime($path));
    $size  = filesize($path);

    $xml = simplexml_load_file($path);
    if (!$xml) {
        $report[$name] = ['error' => "Failed to parse XML: {$path}"];
        continue;
    }

    $totalTests = 0;
    $totalAssertions = 0;
    $totalFailures = 0;
    $totalErrors = 0;
    $totalSkipped = 0;
    $totalTime = 0.0;

    foreach ($xml->xpath('//testcase') as $tc) {
        $totalTests++;
        $totalAssertions += (int)($tc['assertions'] ?? 0);
        $totalTime += (float)($tc['time'] ?? 0.0);
        if ($tc->failure) {
            $totalFailures++;
        }
        if ($tc->error) {
            $totalErrors++;
        }
        if ($tc->skipped) {
            $totalSkipped++;
        }
    }

    $report[$name] = [
        'file_path'        => realpath($path),
        'created_at'       => $cTime,
        'modified_at'      => $mTime,
        'file_size_bytes'  => $size,
        'test_count'       => $totalTests,
        'assertion_count'  => $totalAssertions,
        'failure_count'    => $totalFailures,
        'error_count'      => $totalErrors,
        'skipped_count'    => $totalSkipped,
        'total_duration_s' => round($totalTime, 2),
    ];
}

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
