<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Users ---\n";
foreach(DB::table('users')->get() as $u) {
    echo "Email: " . $u->email . ", PlatformAdmin: " . ($u->is_platform_admin ?? '0') . ", ID: " . $u->id . PHP_EOL;
}

echo "\n--- Tenants ---\n";
foreach(DB::table('tenants')->get() as $t) {
    echo "ID: " . $t->id . ", Name: " . $t->name . ", Subdomain: " . ($t->subdomain ?? 'NULL') . PHP_EOL;
}
