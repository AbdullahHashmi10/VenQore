<?php
foreach (['APP_ENV'=>'testing','DB_CONNECTION'=>'mariadb','DB_DATABASE'=>'amd_pos_test','CACHE_STORE'=>'array','MAIL_MAILER'=>'array'] as $k=>$v) {
    putenv("$k=$v"); $_ENV[$k]=$v; $_SERVER[$k]=$v;
}
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
echo 'DB: ' . Illuminate\Support\Facades\DB::connection()->getDatabaseName() . PHP_EOL;
echo 'Tables in DB: ' . count(Illuminate\Support\Facades\DB::select('SHOW TABLES')) . PHP_EOL;
