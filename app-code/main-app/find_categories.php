<?php
$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";
$pdo = new \PDO("sqlite:" . $vypPath);
echo "--- TABLES ---\n";
$stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%cat%'");
$tables = $stmt->fetchAll(\PDO::FETCH_COLUMN);
foreach($tables as $t) {
    echo $t . "\n";
}

echo "\n--- KB_ITEMS COLUMNS ---\n";
$stmt = $pdo->query("PRAGMA table_info(kb_items)");
$cols = $stmt->fetchAll(\PDO::FETCH_ASSOC);
foreach($cols as $c) {
    echo $c['name'] . "\n";
}
