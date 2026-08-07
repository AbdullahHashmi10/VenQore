<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$p = \App\Models\Product::where('name', 'Dell XPS 15')->first();
if ($p) {
    echo "Name: " . $p->name . "\n";
    echo "Image Path: BINARY: " . bin2hex($p->image_path) . "\n";
    echo "Image Path: STRING: " . $p->image_path . "\n";
} else {
    echo "Product not found\n";
}
