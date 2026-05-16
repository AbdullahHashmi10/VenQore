<?php
$counts = [
    'sales' => DB::table('sales')->count(),
    'sale_items' => DB::table('sale_items')->count(),
    'journal_entries' => DB::table('journal_entries')->count(),
    'journal_items' => DB::table('journal_items')->count(),
    'purchase_items' => DB::table('purchase_items')->count(),
    'stock_movements' => DB::table('stock_movements')->count(),
    'inventory_batches' => DB::table('inventory_batches')->count(),
];
print_r($counts);
