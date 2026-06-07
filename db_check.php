<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$request = \Illuminate\Http\Request::create('/s/ali-store/woo/connections/2/setup', 'GET');
try {
    $route = Route::getRoutes()->match($request);
    echo "Route Parameters:\n";
    print_r($route->parameters());
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
