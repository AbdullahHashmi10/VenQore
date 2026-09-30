<?php

$startTime = strtotime('2026-09-27T08:59:05+02:00');
$endTime   = strtotime('2026-09-27T09:23:00+02:00');

$paths = ['app', 'config', 'database', 'resources', 'routes', 'tests'];
$changed = [];

foreach ($paths as $p) {
    $dir = __DIR__ . '/../' . $p;
    if (!is_dir($dir)) continue;
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($iterator as $file) {
        if ($file->isDir()) continue;
        $path = str_replace('\\', '/', $file->getRealPath());
        if (
            str_contains($path, '/storage/') ||
            str_contains($path, '/node_modules/') ||
            str_contains($path, '/.git/') ||
            str_contains($path, '/public/build/') ||
            str_contains($path, '/tests/reports/') ||
            str_contains($path, '/tests/logs/')
        ) {
            continue;
        }
        $mtime = $file->getMTime();
        if ($mtime >= $startTime && $mtime <= $endTime) {
            $changed[] = $path;
        }
    }
}

echo "CHANGED_FILES_DURING_SEQUENTIAL_RUN: " . count($changed) . "\n";
if (!empty($changed)) {
    echo "Files:\n" . implode("\n", $changed) . "\n";
}
