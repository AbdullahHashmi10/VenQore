<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$names = [
    'Anker 735 Charger',
    'Apple AirPods Pro',
    'Apple iPhone 15 Pro',
    'Apple MacBook Air M3',
    'ASUS ROG Zephyrus G14',
    'Belkin BoostCharge Pro'
];

foreach ($names as $name) {
    $products = \Illuminate\Support\Facades\DB::table('products')->where('name', 'like', "%$name%")->get();
    foreach ($products as $p) {
        echo "ID: $p->id | Tenant: $p->tenant_id | Name: $p->name | Price: $p->price | Img: '$p->image_path'\n";
    }
}
