<?php

require 'vendor/autoload.php';
use Symfony\Component\Yaml\Yaml;

$registryPath = 'Tester/VerificationCenter/registry/suites.yaml';
$data = Yaml::parseFile($registryPath);

function countMethods($file) {
    $s = (string) file_get_contents($file);
    $n  = preg_match_all('/function\s+test[A-Za-z0-9_]*\s*\(/', $s);
    $n += preg_match_all('/\/\*\*[^*]*@test\b/', $s);
    $n += preg_match_all('/#\[Test\]/', $s);
    $n += preg_match_all('/^\s*(?:it|test)\(/m', $s);
    return (int) $n;
}

function rglob($pattern) {
    $files = glob($pattern) ?: [];
    foreach (glob(dirname($pattern) . '/*', GLOB_ONLYDIR | GLOB_NOSORT) ?: [] as $dir) {
        $files = array_merge($files, rglob($dir . '/' . basename($pattern)));
    }
    return $files;
}

$root = 'Tester/tests';
$all = rglob($root . '/*Test.php');
$liveFiles = array_values(array_filter($all, fn ($f) => strpos(str_replace('\\', '/', $f), '/_archive/') === false));

foreach ($liveFiles as $fullPath) {
    $rel = str_replace('\\', '/', substr($fullPath, strlen('Tester/')));
    $methods = countMethods($fullPath);
    
    // Find matching suite by matching suite path
    $targetSuiteIndex = null;
    $longestMatch = -1;
    foreach ($data['suites'] as $idx => $suite) {
        $suitePath = $suite['path'] ?? '';
        if ($suitePath !== '' && str_starts_with($rel, $suitePath) && strlen($suitePath) > $longestMatch) {
            $longestMatch = strlen($suitePath);
            $targetSuiteIndex = $idx;
        }
    }
    
    if ($targetSuiteIndex !== null) {
        $members = &$data['suites'][$targetSuiteIndex]['members'];
        if (!is_array($members)) {
            $members = [];
        }
        $already = false;
        foreach ($members as &$m) {
            if (($m['file'] ?? '') === $rel) {
                $already = true;
                $m['test_methods'] = $methods;
                break;
            }
        }
        if (!$already) {
            $members[] = [
                'file' => $rel,
                'test_methods' => $methods,
                'oracle_tier' => 'T1'
            ];
        }
    }
}

// Recalculate member methods and files count for each suite
$actualTotal = 0;
foreach ($data['suites'] as &$suite) {
    if (!isset($suite['members']) || !is_array($suite['members'])) {
        $suite['members'] = [];
    }
    usort($suite['members'], fn($a, $b) => strcmp($a['file'] ?? '', $b['file'] ?? ''));
    $suiteFiles = count($suite['members']);
    $suiteMethods = 0;
    foreach ($suite['members'] as $m) {
        $suiteMethods += (int) ($m['test_methods'] ?? 0);
    }
    $suite['files'] = $suiteFiles;
    $suite['test_methods'] = $suiteMethods;
    $actualTotal += $suiteMethods;
}

$data['meta']['phpunit_test_methods_total'] = $actualTotal;

$dump = Yaml::dump($data, 10, 2);
file_put_contents($registryPath, $dump);
echo "Successfully updated suites.yaml with rglob total: {$actualTotal}\n";
