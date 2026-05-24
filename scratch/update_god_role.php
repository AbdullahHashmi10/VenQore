<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'god@venqore.com')->first();
if ($user) {
    $user->update(['platform_role' => 'platform_owner']);
    echo "Platform Owner role updated to: " . $user->platform_role . "\n";
} else {
    echo "Platform Owner not found\n";
}
