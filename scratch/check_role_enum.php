<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$res = \DB::select("SHOW COLUMNS FROM tenant_users LIKE 'role'");
echo $res[0]->Type;
