<?php
$sql = "
SELECT k.TABLE_NAME, k.COLUMN_NAME, c.DELETE_RULE
FROM information_schema.KEY_COLUMN_USAGE k
JOIN information_schema.REFERENTIAL_CONSTRAINTS c ON k.CONSTRAINT_NAME = c.CONSTRAINT_NAME AND k.CONSTRAINT_SCHEMA = c.CONSTRAINT_SCHEMA
WHERE c.CONSTRAINT_SCHEMA = DATABASE()
AND (
    (k.TABLE_NAME = 'journal_items' AND k.COLUMN_NAME = 'account_id') OR
    (k.TABLE_NAME = 'journal_entries' AND k.COLUMN_NAME = 'party_id')
);
";
$results = DB::select($sql);
print_r($results);
