<?php
$sql = "
    SELECT 'sales'              AS table_name, COUNT(*) AS orphaned_rows FROM sales              WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'sale_items',                        COUNT(*)                   FROM sale_items         WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'journal_entries',                   COUNT(*)                   FROM journal_entries    WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'journal_items',                     COUNT(*)                   FROM journal_items      WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'purchase_items',                    COUNT(*)                   FROM purchase_items     WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'stock_movements',                   COUNT(*)                   FROM stock_movements    WHERE tenant_id IS NULL
    UNION ALL
    SELECT 'inventory_batches',                 COUNT(*)                   FROM inventory_batches  WHERE tenant_id IS NULL
";
$results = DB::select($sql);
print_r($results);
