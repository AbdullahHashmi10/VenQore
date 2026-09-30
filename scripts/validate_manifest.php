<?php

$manifestPath = __DIR__ . '/../public/build/manifest.json';
if (!file_exists($manifestPath)) {
    die("Manifest not found: {$manifestPath}\n");
}

$manifest = json_decode(file_get_contents($manifestPath), true);
$missing = [];
$totalEntries = 0;

foreach ($manifest as $key => $entry) {
    $totalEntries++;
    $file = $entry['file'] ?? null;
    if ($file) {
        $path = __DIR__ . '/../public/build/' . $file;
        if (!file_exists($path)) {
            $missing[] = $file;
        }
    }
    foreach ($entry['css'] ?? [] as $css) {
        $path = __DIR__ . '/../public/build/' . $css;
        if (!file_exists($path)) {
            $missing[] = $css;
        }
    }
}

echo "TOTAL_MANIFEST_ENTRIES: {$totalEntries}\n";
echo "MISSING_ASSETS_COUNT: " . count($missing) . "\n";
if (!empty($missing)) {
    echo "Missing assets:\n" . implode("\n", array_slice($missing, 0, 10)) . "\n";
} else {
    echo "MANIFEST_VALIDATION: PASSED (All manifest assets exist on disk)\n";
}
