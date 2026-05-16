<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'platform@venqore.com')->first();
if ($user) {
    $user->platform_role = 'platform_owner';
    $user->is_platform_admin = true;
    $user->save();
    echo "SUCCESS: User platform@venqore.com is now Platform Owner.\n";
} else {
    echo "ERROR: User not found.\n";
}
