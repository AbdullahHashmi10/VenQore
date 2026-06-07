<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$attendance = App\Models\StaffAttendance::withoutGlobalScopes()->where('user_id', 5)->latest('id')->first();
echo "Carbon Timezone: " . $attendance->check_in->timezoneName . PHP_EOL;
echo "Carbon String: " . $attendance->check_in->toIso8601String() . PHP_EOL;
echo "Global Timezone: " . config('app.timezone') . PHP_EOL;
