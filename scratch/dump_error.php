<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$logs = \App\Models\ErrorLog::latest()->take(5)->get();
foreach ($logs as $i => $log) {
    echo "--- LOG #{$i} ---\n";
    echo "Message: {$log->message}\n";
    echo "File: {$log->file}:{$log->line}\n";
    echo "URL: {$log->url} ({$log->method})\n";
    echo "Created At: {$log->created_at}\n\n";
}
