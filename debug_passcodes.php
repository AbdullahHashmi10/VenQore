<?php

use App\Models\User;

$users = User::all();

foreach ($users as $user) {
    echo "User: " . $user->name . " | Email: " . $user->email . " | Passcode: " . ($user->passcode ?? 'NULL') . "\n";
}
