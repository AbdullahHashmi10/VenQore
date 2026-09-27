<?php

$paths = ['app', 'config', 'database', 'resources', 'routes', 'tests'];
$allFiles = [];

foreach ($paths as $p) {
    $dir = __DIR__ . '/../' . $p;
    if (!is_dir($dir)) continue;
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($iterator as $file) {
        if ($file->isDir()) continue;
        $filePath = str_replace('\\', '/', $file->getRealPath());
        if (
            str_contains($filePath, '/storage/') ||
            str_contains($filePath, '/node_modules/') ||
            str_contains($filePath, '/.git/') ||
            str_contains($filePath, '/public/build/') ||
            str_contains($filePath, '/tests/reports/') ||
            str_contains($filePath, '/tests/logs/') ||
            str_contains($filePath, '/tests/fixtures/runtime/') ||
            str_ends_with($filePath, '.tmp') ||
            str_ends_with($filePath, '.log') ||
            str_ends_with($filePath, '.cache')
        ) {
            continue;
        }
        $allFiles[] = $filePath;
    }
}

sort($allFiles);

$hashes = [];
foreach ($allFiles as $f) {
    $hashes[] = $f . ':' . hash_file('sha256', $f);
}

$combined = implode("\n", $hashes);
$masterHash = hash('sha256', $combined);

echo "FINGERPRINT_TIMESTAMP: " . date('c') . "\n";
echo "FILE_COUNT: " . count($allFiles) . "\n";
echo "STABLE_SOURCE_SHA256_FINGERPRINT: " . $masterHash . "\n";

file_put_contents(__DIR__ . '/../storage/stable_fingerprint_dump.txt', $combined);
