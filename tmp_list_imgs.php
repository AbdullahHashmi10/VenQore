<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$products = \Illuminate\Support\Facades\DB::table('products')->whereNotNull('image_path')->get(['id', 'name', 'image_path']);
foreach ($products as $p) {
    echo "ID: $p->id | Name: ".str_pad($p->name, 20)." | Img: '" . $p->image_path . "' | Hex: " . bin2hex($p->image_path) . "\n";
}
