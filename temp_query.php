<?php

$query1 = "SELECT 
    p.name,
    p.sku,
    SUM(ib.remaining_qty) as total_qty,
    ib.unit_cost,
    SUM(ib.remaining_qty * ib.unit_cost) as value
FROM inventory_batches ib
JOIN products p ON ib.product_id = p.id
WHERE ib.remaining_qty > 0
AND ib.deleted_at IS NULL
GROUP BY p.name, p.sku, ib.unit_cost
ORDER BY p.name;";

$results1 = DB::select($query1);
echo "Query 1 (Individual Batches):\n";
echo str_pad("Name", 35) . " | " . str_pad("SKU", 15) . " | " . str_pad("Total QTY", 10) . " | " . str_pad("Unit Cost", 10) . " | " . str_pad("Value", 15) . "\n";
echo str_repeat("-", 95) . "\n";
foreach ($results1 as $row) {
    echo str_pad($row->name, 35) . " | " . str_pad($row->sku, 15) . " | " . str_pad($row->total_qty, 10) . " | " . str_pad($row->unit_cost, 10) . " | " . str_pad($row->value, 15) . "\n";
}

echo "\n\n";

$query2 = "SELECT SUM(remaining_qty * unit_cost) as total_value
FROM inventory_batches
WHERE remaining_qty > 0
AND deleted_at IS NULL;";

$results2 = DB::select($query2);

echo "Query 2 (Total Value):\n";
echo "Total Value: " . $results2[0]->total_value . "\n";
