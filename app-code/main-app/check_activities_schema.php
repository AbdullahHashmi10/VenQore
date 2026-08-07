<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$results = DB::select('DESCRIBE activities');
foreach ($results as $r) {
    echo "{$r->Field} ({$r->Type})\n";
}
