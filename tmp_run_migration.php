<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;

$migration = require 'database/migrations/2026_04_13_100000_create_appsumo_codes_table.php';
$migration->up();
echo "Migration ran successfully.\n";
