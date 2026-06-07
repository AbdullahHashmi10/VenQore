<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach(DB::table('tenants')->get() as $t) {
    echo "Subdomain: " . ($t->subdomain ?? 'NULL') . ", ID: " . $t->id . ", Name: " . ($t->name ?? '—') . PHP_EOL;
}
