<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = new \App\Http\Controllers\DashboardController();
$start = \Carbon\Carbon::now()->startOfMonth();
$end = \Carbon\Carbon::now()->endOfMonth();

$stats = (new ReflectionMethod($controller, 'getSalesStats'))->getClosure($controller)($start, $end);
echo "Month Stats:\n";
print_r($stats);

$allTime = (new ReflectionMethod($controller, 'getSalesStats'))->getClosure($controller)(null, null);
echo "\nAll Time Stats:\n";
print_r($allTime);
