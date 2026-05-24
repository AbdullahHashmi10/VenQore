<?php
$dbPath = 'e:\VYB Restore\extracted_backup\AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp';

try {
    $db = new PDO('sqlite:' . $dbPath);
    $tablesQuery = $db->query("SELECT name FROM sqlite_master WHERE type='table'");
    $tables = $tablesQuery->fetchAll(PDO::FETCH_COLUMN);

    $schema = [];
    foreach ($tables as $table) {
        $columnsQuery = $db->query("PRAGMA table_info($table)");
        $columns = $columnsQuery->fetchAll(PDO::FETCH_ASSOC);
        $schema[$table] = $columns;
    }

    file_put_contents('e:\VYB Restore\schema.json', json_encode($schema, JSON_PRETTY_PRINT));
    echo "Schema saved to schema.json\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
