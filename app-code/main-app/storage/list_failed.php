<?php
$xml = simplexml_load_file(__DIR__ . '/../storage/test-results/junit_final_parallel.xml');
if (!$xml) {
    echo "Could not load XML\n";
    exit(1);
}
$count = 0;
foreach ($xml->xpath('//testcase') as $case) {
    if (isset($case->failure) || isset($case->error)) {
        $count++;
        echo "#{$count}: " . (string)$case['file'] . " -> " . (string)$case['name'] . "\n";
        echo substr(trim((string)($case->failure ?? $case->error)), 0, 300) . "\n\n";
    }
}
echo "Total failed: {$count}\n";
