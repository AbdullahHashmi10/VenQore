<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$tenant = App\Models\Tenant::find(3);
echo "DB TZ: " . $tenant->timezone . PHP_EOL;
