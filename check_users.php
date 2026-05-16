<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = DB::table('users')->orderBy('created_at', 'desc')->get();
foreach($users as $u) {
    echo "Email: " . $u->email . ", ID: " . $u->id . ", Created: " . $u->created_at . "\n";
}
