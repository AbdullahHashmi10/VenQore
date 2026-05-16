<?php

DB::statement("UPDATE inventory_batches 
SET unit_cost = 0.00
WHERE product_id = (SELECT id FROM products WHERE sku = 'PRO-10')
AND unit_cost = 0.01;");

echo "Batch updated.\n\n";

$result = DB::select("SELECT name, sku, cost_price, price FROM products WHERE sku = 'PRO-10';");

foreach ($result as $row) {
    echo "Name: {$row->name} | SKU: {$row->sku} | Cost Price: {$row->cost_price} | Price: {$row->price}\n";
}
