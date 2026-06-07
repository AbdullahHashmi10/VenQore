<?php
$sql = "
SELECT 'sales — no tenant_id' AS check_name, COUNT(*) AS count FROM sales WHERE tenant_id IS NULL
UNION ALL
SELECT 'sale_items — no tenant_id', COUNT(*) FROM sale_items WHERE tenant_id IS NULL
UNION ALL
SELECT 'journal_entries — no tenant_id', COUNT(*) FROM journal_entries WHERE tenant_id IS NULL
UNION ALL
SELECT 'journal_items — no tenant_id', COUNT(*) FROM journal_items WHERE tenant_id IS NULL
UNION ALL
SELECT 'purchase_items — no tenant_id', COUNT(*) FROM purchase_items WHERE tenant_id IS NULL
UNION ALL
SELECT 'stock_movements — no tenant_id', COUNT(*) FROM stock_movements WHERE tenant_id IS NULL
UNION ALL
SELECT 'ai_recommendations — no tenant_id', COUNT(*) FROM ai_recommendations WHERE tenant_id IS NULL
UNION ALL
SELECT 'products — cascade still active (must be 0)', COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND DELETE_RULE = 'CASCADE'
  AND UNIQUE_CONSTRAINT_NAME IN (
    SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_NAME IN ('sale_items','invoice_items','inventory_batches','journal_items')
  );
";
$results = DB::select($sql);
print_r($results);
