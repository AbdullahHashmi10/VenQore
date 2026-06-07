<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$u = App\Models\User::where('name', 'Admin AMD')->first();
echo $u->id . ' - ' . $u->email . PHP_EOL;
