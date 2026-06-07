<?php
$content = file_get_contents('route_list.json');

// Check for UTF-16 LE BOM
if (substr($content, 0, 2) === "\xFF\xFE") {
    $content = mb_convert_encoding(substr($content, 2), 'UTF-8', 'UTF-16LE');
}

$start = strpos($content, '[');
if ($start !== false) {
    $content = substr($content, $start);
}
// Strip potential ANSI escape sequences
$content = preg_replace('/\x1b\[[0-9;]*[mG]/', '', $content);
$routes = json_decode($content, true);

if ($routes === null) {
    echo "JSON Error: " . json_last_error_msg() . "\n";
    echo "Start: " . substr($content, 0, 100) . "\n";
    exit(1);
}

$routeNames = array_filter(array_column($routes, 'name'));

$dirs = ['resources/js'];
$issues = [];

function checkJsx($path) {
    global $routeNames, $issues;
    $content = file_get_contents($path);
    preg_match_all("/route\(['\"]([^'\"]+)['\"]/", $content, $matches);
    if (!empty($matches[0])) {
        foreach ($matches[1] as $routeName) {
            if (!in_array($routeName, $routeNames) && $routeName !== 'logout') {
                $issues[] = "$path: Uses broken route '$routeName'";
            }
        }
    }
}

$ritit = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dirs[0]), RecursiveIteratorIterator::CHILD_FIRST);
foreach ($ritit as $splFileInfo) {
    if ($splFileInfo->isFile() && in_array($splFileInfo->getExtension(), ['js', 'jsx'])) {
        checkJsx($splFileInfo->getPathname());
    }
}

echo implode("\n", array_unique($issues));

