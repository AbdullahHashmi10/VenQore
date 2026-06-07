<?php

$dir = new RecursiveDirectoryIterator(__DIR__ . '/app');
$iterator = new RecursiveIteratorIterator($dir);

foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'php') {
        $content = file_get_contents($file->getPathname());
        $original = $content;

        // Replace AccountingService
        $content = preg_replace(
            '/use App\\\\Services\\\\AccountingService;/', 
            'use App\Services\V3\AccountingService;', 
            $content
        );

        // Replace FifoService
        $content = preg_replace(
            '/use App\\\\Services\\\\FifoService;/', 
            'use App\Services\V3\FifoService;', 
            $content
        );

        // Remove aliases if they were added (e.g. use ... as V3Accounting) to avoid conflicts
        $content = preg_replace(
            '/use App\\\\Services\\\\V3\\\\AccountingService as V3Accounting;\\r?\\n?/', 
            '', 
            $content
        );

        $content = preg_replace(
            '/use App\\\\Services\\\\V3\\\\FifoService as V3Fifo;\\r?\\n?/', 
            '', 
            $content
        );

        // Replace type hints in constructors/methods if they used aliases
        $content = str_replace('V3Accounting ', 'AccountingService ', $content);
        $content = str_replace('V3Fifo ', 'FifoService ', $content);
        
        // Also fix up $this->accounting->createEntry() vs V3Accounting::createEntry() if there are static calls left
        // V3 in this codebase has both static and dynamic methods, but we'll leave that alone for now.

        if ($content !== $original) {
            file_put_contents($file->getPathname(), $content);
            echo "Updated: " . $file->getPathname() . "\n";
        }
    }
}
