<?php
$dbPath = 'e:\VYB Restore\extracted_backup\AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp';
try {
    $db = new PDO('sqlite:' . $dbPath);
    $tablesQuery = $db->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    $tables = $tablesQuery->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "$table\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
