<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "COLUMNS:\n";
echo implode("\n", Illuminate\Support\Facades\Schema::getColumnListing('products'));

echo "\n\nUSERS:\n";
foreach (\App\Models\User::all() as $u) {
    echo "{$u->email} (Admin: {$u->is_platform_admin}, Demo: " . (str_contains($u->email, '@venqore-demo.internal') ? 'YES' : 'NO') . ")\n";
}
