<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

Illuminate\Support\Facades\DB::statement("ALTER TABLE positions MODIFY status VARCHAR(32) NOT NULL DEFAULT 'active'");
echo "DONE\n";
