<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "USER DETAILS:\n";
foreach (\App\Models\User::all() as $u) {
    echo "Email: {$u->email} | Admin: " . var_export($u->is_platform_admin, true) . " | Demo: " . (str_contains($u->email, '@venqore-demo.internal') ? 'YES' : 'NO') . "\n";
}
