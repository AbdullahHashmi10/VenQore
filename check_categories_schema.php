<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $results = DB::select('DESCRIBE categories');
    foreach ($results as $r) {
        echo "{$r->Field} ({$r->Type})\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
