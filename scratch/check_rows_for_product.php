<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$productId = '019e750d-2a48-7127-b07a-4f8d0695988f';

$tables = [
    'ai_recommendations' => 'product_id',
    'batches' => 'product_id',
    'debit_note_items' => 'product_id',
    'inventory_batches' => 'product_id',
    'invoice_items' => 'product_id',
    'manufacturing_ingredients' => 'ingredient_product_id',
    'manufacturing_rules' => 'product_id',
    'production_log_ingredients' => 'product_id',
    'production_runs' => 'product_id',
    'product_barcodes' => 'product_id',
    'product_batches' => 'product_id',
    'product_images' => 'product_id',
    'product_serials' => 'product_id',
    'product_units' => 'product_id',
    'product_variants' => 'product_id',
    'proposal_items' => 'product_id',
    'purchase_order_items' => 'product_id',
    'purchase_proposal_items' => 'product_id',
    'recipes' => 'product_id',
    'recipe_ingredients' => 'product_id',
    'sales_order_items' => 'product_id',
    'sale_items' => 'product_id',
    'stocks' => 'product_id',
    'stock_movements' => 'product_id',
    'stock_take_items' => 'product_id',
    'stock_transfer_items' => 'product_id',
];

echo "Checking rows for product ID {$productId}:\n";
foreach ($tables as $table => $col) {
    try {
        $count = DB::table($table)->where($col, $productId)->count();
        if ($count > 0) {
            echo "- Table '{$table}' has {$count} rows referencing this product.\n";
        }
    } catch (\Throwable $e) {
        echo "- Error querying '{$table}': " . $e->getMessage() . "\n";
    }
}
echo "Done.\n";
