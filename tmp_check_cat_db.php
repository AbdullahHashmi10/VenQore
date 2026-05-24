<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$p = \Illuminate\Support\Facades\DB::table('products')->where('name', 'like', '%Dell XPS 15%')->first();
if ($p) {
    echo "ID: $p->id\n";
    echo "Category ID: $p->category_id\n";
    $cat = \Illuminate\Support\Facades\DB::table('categories')->where('id', $p->category_id)->first();
    echo "Category Name: " . ($cat ? $cat->name : 'None') . "\n";
    echo "Tenant ID: " . $p->tenant_id . "\n";
} else {
    echo "Not found with LIKE\n";
}
