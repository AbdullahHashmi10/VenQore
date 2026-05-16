<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'admin@amd.com')->first();
if ($user) {
    $user->role = 'platform_admin';
    $user->save();
    echo "SUCCESS: User admin@amd.com is now platform_admin\n";
} else {
    echo "ERROR: User admin@amd.com not found\n";
}
