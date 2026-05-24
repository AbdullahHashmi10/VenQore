<?php
$sql = "
SELECT k.TABLE_NAME, k.COLUMN_NAME, k.CONSTRAINT_NAME, k.REFERENCED_TABLE_NAME, c.DELETE_RULE
FROM information_schema.KEY_COLUMN_USAGE k
JOIN information_schema.REFERENTIAL_CONSTRAINTS c ON k.CONSTRAINT_NAME = c.CONSTRAINT_NAME AND k.CONSTRAINT_SCHEMA = c.CONSTRAINT_SCHEMA
WHERE c.CONSTRAINT_SCHEMA = DATABASE()
AND c.DELETE_RULE = 'CASCADE'
ORDER BY k.TABLE_NAME;
";
$results = DB::select($sql);
file_put_contents('scratch/cascades.json', json_encode($results, JSON_PRETTY_PRINT));
echo "DONE. Found " . count($results) . " cascades.\n";
