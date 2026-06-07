<?php
function searchDir($dir) {
    $it = new RecursiveDirectoryIterator($dir);
    foreach (new RecursiveIteratorIterator($it) as $file) {
        if ($file->isDir()) continue;
        if (str_ends_with($file->getFilename(), '.php') || str_ends_with($file->getFilename(), '.jsx')) {
            $content = file_get_contents($file->getPathname());
            if (str_contains($content, 'ðŸ“¦')) {
                echo "Found in: " . $file->getPathname() . "\n";
            }
        }
    }
}

echo "Searching app/...\n";
searchDir('app');
echo "Searching resources/...\n";
searchDir('resources');
echo "Done\n";
