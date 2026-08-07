<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'hashmi@venqore.com')->first();
if ($user) {
    echo "ID: " . $user->id . "\n";
    echo "Email: " . $user->email . "\n";
    echo "Is Platform Admin: " . ($user->is_platform_admin ? 'TRUE' : 'FALSE') . "\n";
    echo "Is Platform Admin (Type): " . gettype($user->is_platform_admin) . "\n";
    echo "Platform Role: " . $user->platform_role . "\n";
} else {
    echo "User not found!\n";
}
