<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$restaurantModules = \App\Support\BusinessTypes::modulesFor('restaurant');
echo "Restaurant modules according to BusinessTypes:\n";
print_r($restaurantModules);

$presetModules = config('ai_builder.presets.restaurant.modules', []);
echo "\nPreset modules for restaurant:\n";
print_r($presetModules);

$allModules = array_keys(config('modules', []));
echo "\nAll system modules in config/modules.php:\n";
print_r($allModules);
