<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach(DB::table('tenants')->get() as $t) {
    echo "ID: " . $t->id . ", Name: " . ($t->name ?? '—') . ", Subdomain: " . ($t->subdomain ?? 'NULL') . ", is_demo: " . ($t->is_demo ?? '0') . ", is_golden_master: " . ($t->is_golden_master ?? '0') . PHP_EOL;
}
