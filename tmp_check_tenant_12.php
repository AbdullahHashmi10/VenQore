<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$products = \Illuminate\Support\Facades\DB::table('products')->where('tenant_id', 12)->get();
foreach ($products as $p) {
    echo "ID: $p->id | Name: ".str_pad($p->name, 25)." | Price: $p->price\n";
}
