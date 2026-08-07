<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$products = \Illuminate\Support\Facades\DB::table('products')->get();
foreach ($products as $p) {
    if (str_contains($p->name, 'Dell') || str_contains($p->name, 'MacBook') || str_contains($p->name, 'ThinkPad') || str_contains($p->name, 'ASUS')) {
        echo "ID: $p->id | Tenant: $p->tenant_id | Name: ".str_pad($p->name, 25)." | Price: $p->price\n";
    }
}
