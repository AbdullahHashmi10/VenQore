<?php

$dir = 'e:/AMD POS/AMD POS/Tester/tests/Feature';
$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));

$updated = 0;

foreach ($files as $file) {
    if ($file->isDir() || !str_ends_with($file->getFilename(), '.php')) {
        continue;
    }
    
    $path = $file->getPathname();
    $content = file_get_contents($path);
    
    // Only target Pest test files (files containing test( or it() and using $this->createTenant or similar helpers)
    if ((str_contains($content, 'test(') || str_contains($content, 'it(')) 
        && !str_contains($content, 'uses(')
        && !str_contains($content, 'class ')
        && !str_contains($path, 'Smoke')) {
        
        // Inject uses(\Tests\Feature\VenQoreTestCase::class); right after <?php or namespace declaration
        if (str_contains($content, 'namespace ')) {
            $newContent = preg_replace('/(namespace [^;]+;)/', "$1\n\nuses(\\Tests\\Feature\\VenQoreTestCase::class);", $content, 1);
        } else {
            $newContent = preg_replace('/(<\?php)/', "$1\n\nuses(\\Tests\\Feature\\VenQoreTestCase::class);", $content, 1);
        }
        
        if ($newContent !== $content) {
            file_put_contents($path, $newContent);
            echo "Updated: " . str_replace('e:/AMD POS/AMD POS/Tester/tests/Feature/', '', str_replace('\\', '/', $path)) . "\n";
            $updated++;
        }
    }
}

echo "\nTotal test files updated with VenQoreTestCase wiring: $updated\n";
