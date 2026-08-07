<?php

$dir = 'e:/AMD POS/AMD POS/Tester/tests/Feature';
$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));

$missing = [];

foreach ($files as $file) {
    if ($file->isDir() || !str_ends_with($file->getFilename(), '.php')) {
        continue;
    }
    
    $path = $file->getPathname();
    $content = file_get_contents($path);
    
    // Check if file contains test/it functions or TestCase class
    if (str_contains($content, 'test(') || str_contains($content, 'it(') || str_contains($content, 'class ')) {
        if (!str_contains($content, 'VenQoreTestCase') && !str_contains($content, 'TestCase')) {
            $missing[] = str_replace('e:/AMD POS/AMD POS/Tester/tests/Feature/', '', str_replace('\\', '/', $path));
        }
    }
}

echo "Files missing VenQoreTestCase / TestCase reference: " . count($missing) . "\n\n";
foreach ($missing as $f) {
    echo " - $f\n";
}
