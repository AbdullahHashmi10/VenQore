<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$products = \Illuminate\Support\Facades\DB::table('products')->limit(10)->get();
foreach ($products as $p) {
    echo "ID: $p->id | Name: $p->name | Price: $p->price | Img: " . bin2hex($p->image_path) . " ($p->image_path)\n";
}
