<?php
$content = file_get_contents('resources/js/Pages/Pos.jsx');
if (str_contains($content, 'ðŸ“¦')) {
    echo "Found corrupted string in Pos.jsx\n";
    // Find line number
    $lines = explode("\n", $content);
    foreach ($lines as $i => $line) {
        if (str_contains($line, 'ðŸ“¦')) {
            echo "Line " . ($i+1) . ": " . trim($line) . "\n";
        }
    }
} else {
    echo "NO corrupted string in Pos.jsx\n";
}
