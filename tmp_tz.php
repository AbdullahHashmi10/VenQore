<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$l = App\Models\StaffAttendance::withoutGlobalScopes()->latest('check_in')->first();
echo 'Check in DB: ' . $l->check_in . PHP_EOL;
echo 'Formatted PKT: ' . $l->check_in->tz('Asia/Karachi')->format('h:i A') . PHP_EOL;
