<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$products = \Illuminate\Support\Facades\DB::table('products')->where('name', 'like', '%Dell XPS 15%')->get();
foreach ($products as $p) {
    echo "ID: $p->id | Tenant: $p->tenant_id | Price: $p->price\n";
}
