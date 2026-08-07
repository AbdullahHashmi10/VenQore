<?php

$dir = new RecursiveDirectoryIterator(__DIR__ . '/app');
$iterator = new RecursiveIteratorIterator($dir);

foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'php') {
        $content = file_get_contents($file->getPathname());
        $original = $content;

        // Replace leftover static alias usage
        $content = str_replace('V3Accounting::', 'app(\\App\\Services\\V3\\AccountingService::class)->', $content);
        $content = str_replace('V3Fifo::', 'app(\\App\\Services\\V3\\FifoService::class)->', $content);
        
        if ($content !== $original) {
            file_put_contents($file->getPathname(), $content);
            echo "Fixed alias usages in: " . $file->getPathname() . "\n";
        }
    }
}
