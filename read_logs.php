<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$logs = DB::table('error_logs')
    ->where('type', 'backend')
    ->orderBy('id', 'desc')
    ->limit(10)
    ->get();

foreach ($logs as $log) {
    echo "ID: " . $log->id . PHP_EOL;
    echo "Message: " . $log->message . PHP_EOL;
    echo "URL: " . $log->url . PHP_EOL;
    echo "File: " . $log->file . ":" . $log->line . PHP_EOL;
    echo "----------------------------------------" . PHP_EOL;
}

