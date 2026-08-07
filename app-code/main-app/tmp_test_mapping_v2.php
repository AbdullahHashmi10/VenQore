<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$product = \App\Models\Product::withoutGlobalScopes()->where('name', 'like', '%Anker 735%')->first();
if ($product) {
    echo "Price in model: " . $product->price . " (Type: " . gettype($product->price) . ")\n";
    $mappedPrice = $product->price ?? $product->selling_price ?? 0;
    echo "Mapped Price: " . $mappedPrice . "\n";
} else {
    echo "Product not found even without global scopes\n";
}
