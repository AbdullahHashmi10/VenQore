<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
foreach(App\Models\StaffAttendance::withoutGlobalScopes()->where('user_id', 5)->latest('id')->take(5)->get() as $a) { 
    echo $a->check_in . " | " . $a->created_at . " | UID: " . $a->user_id . PHP_EOL; 
}
