<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::where('email', 'test@venqore.com')->first();

if ($user) {
    echo "User found! ID: " . $user->id . ", Name: " . $user->name . ", Role: " . $user->role . "\n";
    
    // Reset password to "password"
    $user->password = Hash::make('password');
    $user->save();
    
    echo "SUCCESS: Password for test@venqore.com has been reset to: password\n";
} else {
    echo "User 'test@venqore.com' was NOT found in the database.\n";
    echo "Creating the user 'test@venqore.com' with password 'password' as a Store Owner so you can test immediately...\n";
    
    // Let's create the user as a store owner so they can test
    try {
        $newUser = User::create([
            'name' => 'Test User',
            'email' => 'test@venqore.com',
            'password' => Hash::make('password'),
            'role' => 'owner',
            'email_verified_at' => now(),
        ]);
        echo "SUCCESS: Created user test@venqore.com with password: password\n";
    } catch(\Exception $e) {
        echo "ERROR: Could not create user: " . $e->getMessage() . "\n";
    }
}
