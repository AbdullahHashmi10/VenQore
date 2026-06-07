<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\SubdomainGenerator;

$testWords = ['admin', 'api', 'www', 'docs'];
foreach($testWords as $word) {
    $result = SubdomainGenerator::generate($word);
    echo "Input: $word, Output: $result\n";
    if ($word === $result) {
        echo "FAIL: Reserved word '$word' was not blocked!\n";
    } else {
        echo "PASS: '$word' was blocked.\n";
    }
}
