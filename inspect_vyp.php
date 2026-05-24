<?php
$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";
try {
    $pdo = new \PDO("sqlite:" . $vypPath);
    $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

    echo "TABLES:\n";
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    $tables = $stmt->fetchAll(\PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        $count = $pdo->query("SELECT COUNT(*) FROM \"$table\"")->fetchColumn();
        echo "Table: $table, Count: $count\n";
    }

    echo "\nCOLUMNS FOR kb_lineitems:\n";
    if (in_array('kb_lineitems', $tables)) {
         $stmt = $pdo->query("PRAGMA table_info(\"kb_lineitems\")");
         print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
