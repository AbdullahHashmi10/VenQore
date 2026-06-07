<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$p = \App\Models\Product::where('name', 'Dell XPS 15')->first();
echo "Category ID: " . $p->category_id . "\n";
echo "Category Name: " . ($p->category ? $p->category->name : 'None') . "\n";
