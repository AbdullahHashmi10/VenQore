<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;

echo "Product Audit (Internal Data):\n";
foreach(Product::withoutGlobalScopes()->get() as $p) {
    echo "- Name: {$p->name}\n";
    echo "  Price: {$p->price}\n";
    echo "  Image Path: " . ($p->image_path ?: 'NULL') . "\n";
    echo "  Binary Dump (First 10 chars of path): " . bin2hex(substr($p->image_path, 0, 10)) . "\n\n";
}
