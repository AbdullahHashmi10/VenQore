<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use Illuminate\Support\Facades\DB;

$id = '019e750d-2a48-7127-b07a-4f8d0695988f';
$product = Product::withoutGlobalScopes()->find($id);

if (!$product) {
    echo "Product not found.\n";
    exit;
}

try {
    DB::beginTransaction();
    echo "Attempting to delete product {$id} ({$product->name})...\n";
    
    // Let's call the controller logic or replicate it
    $stocks = $product->stocks()->withoutGlobalScopes()->get();
    echo "Product has " . count($stocks) . " stocks.\n";
    foreach ($stocks as $stock) {
        echo "- Deleting stock ID: {$stock->id}\n";
        $stock->delete();
    }
    
    echo "Deleting product...\n";
    $product->delete();
    
    DB::commit();
    echo "Deleted successfully!\n";
} catch (\Throwable $e) {
    DB::rollBack();
    echo "ERROR CLASS: " . get_class($e) . "\n";
    echo "ERROR MESSAGE: " . $e->getMessage() . "\n";
    echo "CODE: " . $e->getCode() . "\n";
}
