<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
echo "Settings TZ: " . App\Helpers\SettingsHelper::get('timezone') . PHP_EOL;
