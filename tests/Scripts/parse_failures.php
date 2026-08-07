<?php

$logFile = 'C:/Users/PC/.gemini/antigravity/brain/3f659ec6-7016-475a-838d-daf21dc7e1a0/.system_generated/tasks/task-3300.log';
$log = file_get_contents($logFile);

preg_match_all('/FAILED\s+([^\s>]+)\s*>\s*([^\n]+)/', $log, $matches, PREG_SET_ORDER);

$byFile = [];
foreach ($matches as $m) {
    $file = trim($m[1]);
    $test = trim($m[2]);
    $byFile[$file][] = $test;
}

ksort($byFile);

echo "Total Failing Files: " . count($byFile) . "\n";
echo "Total Failing Test Cases: " . count($matches) . "\n\n";

foreach ($byFile as $file => $tests) {
    echo "• $file (" . count($tests) . " failures):\n";
    foreach (array_slice($tests, 0, 3) as $t) {
        echo "   - $t\n";
    }
    if (count($tests) > 3) {
        echo "   ... and " . (count($tests) - 3) . " more\n";
    }
    echo "\n";
}
